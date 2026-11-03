# 時華診所網站 — Netlify + Google Sheets

## 檔案內容
- `index.html`, `styles.css`, `app.js`：網站前端（手機/桌面版）
- `netlify/functions/reservation.mjs`：Netlify 伺服器端預約收件端（不公開 Google 密鑰）
- `google-apps-script/Code.gs`：Google 試算表寫入端
- `netlify.toml`：Netlify 部署設定

## 1. 建立 Google 試算表
1. 登入診所管理用 Google 帳號，建立**私人**試算表，例如「時華診所預約申請」。
2. 從網址 `https://docs.google.com/spreadsheets/d/【這一段是ID】/edit` 複製試算表 ID。
3. 開啟 [Google Apps Script](https://script.google.com/) 建立新專案，貼上 `google-apps-script/Code.gs`。
4. 在 Apps Script 的「專案設定 → 指令碼屬性」新增：
   - `SHEET_ID`：上面的試算表 ID。
   - `SHARED_SECRET`：自己產生的**至少 32 位**高強度隨機字串（不得寫在前端、不得提供給訪客）。
5. 部署 → 新增部署 → 類型「網頁應用程式」；執行身分「我」，存取權「任何人」。以診所 Google 帳號完成必要授權，取得以 `/exec` 結尾的網頁應用程式網址。
6. 注意：每次修改 Apps Script 程式後，須更新部署版本，否則舊版本仍可能繼續執行。

## 2. Netlify 上線
**請用 GitHub 儲存庫連接 Netlify 部署**，或使用支援 Netlify Functions 的 CLI 部署；單純拖曳靜態資料夾到 Netlify Drop **不保證**部署 Functions，不能當作預約收件端上線方法。

1. 將整個專案（含 `netlify/functions`）上傳到私人 GitHub 儲存庫。
2. Netlify → Add new project → Import an existing project → GitHub → 選擇儲存庫。
3. Build command 留空；Publish directory 設為 `.`；Functions directory 為 `netlify/functions`（`netlify.toml` 已設定）。
4. Netlify → Project configuration → Environment variables 設定：
   - `GAS_WEBAPP_URL`：Apps Script 網頁應用程式 `/exec` URL。
   - `RESERVATION_SHARED_SECRET`：與 Apps Script `SHARED_SECRET` **完全相同**的密鑰。
   - `SITE_URL`：正式網站 origin，例如 `https://example.netlify.app`（不要加尾端斜線或路徑）。
5. 重新部署網站，使環境變數生效。實際填一筆測試預約，確認 Google 試算表出現新列，並確認姓名、電話、日期、狀態正確。
6. 請在 Google 試算表設定僅限診所授權人員存取，並啟用 Google 帳號兩步驟驗證。

## 3. 正式上線前必做
- 確認醫療廣告及醫療服務說明符合台灣適用法規，經診所與必要法遵人員審核後發布。
- 完成個資告知：蒐集者法定名稱、特定目的、利用期間/地區/對象/方式、當事人權利行使管道、資料保存及刪除規則。現有彈窗是**草案**，不可直接視為最終合規版本。
- 確認正式門診及預約時段；目前選項為「上午／下午／由診所安排」，並非可用名額查詢。
- 在 `app.js` 的 `LINE_URL` 設定官方 LINE 連結。
- 以正式授權 Logo 和照片取代首頁的 CSS 抽象佔位圖。
- 確認停車位可用性、使用條件及完整交通資訊。
- **防濫用**：目前包含前後端驗證、隱藏欄位、密鑰與伺服器端代理，但沒有持久性限流或 CAPTCHA。公開大量投放前應加上 Netlify/邊緣防護、Turnstile 等驗證與流量監控；僅依 Origin header 不是身分驗證。
- **可靠性**：Google Apps Script/Sheets 並非醫療級預約系統，沒有自動排程衝突檢查、通知、備援、重複申請去重或高可用性保證；重要預約須由人工確認。
- 不要在備註欄蒐集病史、症狀、檢驗報告等健康敏感資訊。若日後需要蒐集，必須先重新評估合法性、安全架構及存取控管。

## 4. 功能測試
- 首頁與 7 項服務介紹；服務卡片可直接帶入預約表單。
- 三步驟預約：服務/日期/時段 → 姓名/電話 → 同意告知/確認送出。
- 未設定 Google 串接時，網站仍可預覽，但送出會顯示「預約服務尚未完成設定」，**不會假裝成功**。
- 手機版選單、Google Maps、電話撥號、個資告知彈窗。

## 5. 聯絡與後續修改
診所電話：04-23230203；地址：台中市西區大墩十街98號。
如需改服務項目，同時修改 `app.js` 的 `services`、`netlify/functions/reservation.mjs` 的 `SERVICES`、Apps Script 的 `services` 白名單，保持一致。
