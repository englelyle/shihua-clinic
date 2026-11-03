const SERVICES=new Set(['EECP 體外反搏','ILIB 靜脈雷射','ESWT 體外震波','客製化點滴','健康檢測','體重管理','其他預防醫學服務']);
const SLOTS=new Set(['上午（實際時間待確認）','下午（實際時間待確認）','由診所協助安排']);
const reply=(status,message,ok=false)=>new Response(JSON.stringify({ok,message}),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default async(request)=>{
 if(request.method!=='POST')return reply(405,'僅接受 POST');
 const contentType=request.headers.get('content-type')||'';if(!contentType.includes('application/json'))return reply(415,'資料格式錯誤');
 const origin=request.headers.get('origin');const site=process.env.SITE_URL; if(site&&origin&&origin!==new URL(site).origin)return reply(403,'來源不允許');
 const len=Number(request.headers.get('content-length')||0);if(len>8000)return reply(413,'資料過大');
 let d;try{const raw=await request.text();if(raw.length>8000)return reply(413,'資料過大');d=JSON.parse(raw)}catch{return reply(400,'資料格式錯誤')}
 if(d.website)return reply(200,'已收到',true);
 const name=String(d.name||'').trim(),phone=String(d.phone||'').trim(),note=String(d.note||'').trim(),date=String(d.date||''),slot=String(d.slot||''),service=String(d.service||'');
 if(!SERVICES.has(service)||!SLOTS.has(slot)||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!name||name.length>50||!/^[+\d\s()\-]{8,25}$/.test(phone)||note.length>200||d.consent!==true)return reply(400,'請確認所有必填欄位');
 const parsed=new Date(date+'T00:00:00Z');const now=new Date();const today=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);if(Number.isNaN(parsed.getTime())||parsed.toISOString().slice(0,10)!==date||date<today)return reply(400,'預約日期無效');
 const endpoint=process.env.GAS_WEBAPP_URL,secret=process.env.RESERVATION_SHARED_SECRET;
 if(!endpoint||!secret)return reply(503,'預約服務尚未完成設定');
 try{const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),12000);let response;try{response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({secret,service,date,slot,name,phone,note,consentAt:new Date().toISOString()}),signal:controller.signal,redirect:'follow'})}finally{clearTimeout(timer)}if(!response.ok)return reply(502,'預約系統暫時無法使用');const body=await response.json();if(body.ok!==true)return reply(502,'預約系統暫時無法使用');return reply(200,'預約申請已送出',true)}catch{return reply(502,'連線失敗，請稍後再試')}};
export const config={path:'/.netlify/functions/reservation'};
