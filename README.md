# AirVision

AirVision is a Railway-ready web app for evaluating automotive evaporator coil cleanliness from Before/After images.

The image analysis runs in the browser with a Teachable Machine Image Model embedded in `public/index.html`. It does not use Gemini or any external AI API key.

## App Flow

1. Customer/car details and Before/After image upload
2. Processing screen that loads the Teachable Machine model only after analysis starts
3. Before/After result screen with customer signature
4. Inspection report screen with PDF download and report save

## Railway Structure

- `public/index.html` - full AirVision frontend, UI, embedded model, signature, PDF generation
- `server.js` - Railway/Node backend for saving reports
- `package.json` - Railway start command via `npm start`

The frontend keeps the old Apps Script path when available:

```js
google.script.run.saveInspectionReport(payload)
```

On Railway it uses:

```http
POST /api/reports
```

## Google Storage

Defaults are already configured in `server.js`:

- Google Sheet ID: `1ZifJc-xHbEPDWbwdiSTnTc0M2Mvn6Exo4U4s8UEdHG4`
- Drive Folder ID: `12EQ4sDdlrApVL3KMQLAfIHCRsXgpksO1`
- Sheet tab: `AirVision Reports`

If the sheet tab does not exist, the backend creates it. If it exists, new reports are appended.

Header row:

```text
วันที่ | ชื่อ | เบอร์โทร | ยี่ห้อ | รุ่น | ทะเบียน | ก่อน | หลัง | รายงาน | Before | After
```

## Railway Environment Variables

Create a Google Cloud service account, then share both the Google Sheet and the Drive folder with the service account email.

Set one of these credential options in Railway.

Option A:

```env
GOOGLE_SERVICE_ACCOUNT_JSON_BASE64=...
```

Option B:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
```

Optional overrides:

```env
SHEET_ID=1ZifJc-xHbEPDWbwdiSTnTc0M2Mvn6Exo4U4s8UEdHG4
DRIVE_FOLDER_ID=12EQ4sDdlrApVL3KMQLAfIHCRsXgpksO1
SHEET_NAME=AirVision Reports
```

## Local Run

```powershell
cmd /c npm install
node server.js
```

Open:

```text
http://localhost:3000
```

Without Google service account env vars, the page can render and generate the PDF, but saving to Google Sheet/Drive will fail until credentials are configured.
