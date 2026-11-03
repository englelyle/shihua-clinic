/**
 * 時華診所預約收件端。先在 Apps Script「專案設定 > 指令碼屬性」設定：
 * SHEET_ID = Google 試算表 ID
 * SHARED_SECRET = 與 Netlify RESERVATION_SHARED_SECRET 相同的高強度隨機字串
 * 部署為網頁應用程式，執行身分「我」、存取權「任何人」。
 * 任何人只能呼叫端點；沒有正確密鑰無法寫入試算表。
 */
function doPost(e) {
  const out = obj => ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
  try {
    const d=JSON.parse((e.postData||{}).contents||'{}');
    const props=PropertiesService.getScriptProperties();
    const secret=props.getProperty('SHARED_SECRET');
    const id=props.getProperty('SHEET_ID');
    if(!secret||!id||d.secret!==secret)return out({ok:false});
    const services=['EECP 體外反搏','ILIB 靜脈雷射','ESWT 體外震波','客製化點滴','健康檢測','體重管理','其他預防醫學服務'];
    const slots=['上午（實際時間待確認）','下午（實際時間待確認）','由診所協助安排'];
    const name=String(d.name||'').trim(),phone=String(d.phone||'').trim(),note=String(d.note||'').trim();
    if(!services.includes(d.service)||!slots.includes(d.slot)||!/^\d{4}-\d{2}-\d{2}$/.test(d.date)||!name||name.length>50||!/^[+\d\s()\-]{8,25}$/.test(phone)||note.length>200)return out({ok:false});
    const lock=LockService.getScriptLock();lock.waitLock(15000);
    try {
      const book=SpreadsheetApp.openById(id);
      const sheet=book.getSheetByName('預約申請')||book.insertSheet('預約申請');
      if(sheet.getLastRow()===0)sheet.appendRow(['建立時間','服務項目','預約日期','偏好時段','姓名','電話','備註','處理狀態','同意時間']);
      // 避免使用者輸入 = + - @ 等字元造成試算表公式注入
      const safe=s=>{s=String(s||'');return /^[=+\-@\t\r]/.test(s)?"'"+s:s};
      sheet.appendRow([new Date(),safe(d.service),safe(d.date),safe(d.slot),safe(name),safe(phone),safe(note),'待聯繫',safe(d.consentAt)]);
      return out({ok:true});
    }finally{lock.releaseLock()}
  }catch(err){console.error('Reservation error: '+err.message);return out({ok:false})}
}
