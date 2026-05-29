# AirVision

AirVision is a Railway-ready web app for evaluating automotive evaporator coil cleanliness from Before/After images.

The image analysis runs in the browser with a Teachable Machine Image Model stored in `public/my_model/`. It does not use Gemini, webcam capture, or any external AI API key.

## App Flow

1. Customer/car details and Before/After image upload
2. Processing screen that loads the Teachable Machine model only after analysis starts
3. Before/After result screen with customer signature
4. Inspection report screen with PDF download and Apps Script report save

## Railway Structure

- `public/index.html` - full AirVision frontend, upload flow, signature, PDF generation
- `public/my_model/` - Teachable Machine files: `model.json`, `metadata.json`, `model.weights.bin`
- `server.js` - Railway/Node static server, healthcheck, and Apps Script proxy
- `Code.gs` - Apps Script backend for Drive upload and Google Sheet append
- `package.json` - Railway start command via `npm start`

The PDF is generated in the browser. Report data is sent to Apps Script through `google.script.run` when hosted in Apps Script, or through Railway's `/api/reports` proxy when `APPS_SCRIPT_WEB_APP_URL` is configured.

## Google Storage

Apps Script saves files and rows using:

- Google Sheet ID: `19DlfXzGe9FC2C5LW8AhTJZe5CFt5K3VFMREgqJQiHyE`
- Drive Folder ID: `1KaHvZ6dum58OLXSRXmKKhOUUNOUR77tt`
- Sheet tab: `test 1`

Header row:

```text
วันที่ | ชื่อ | เบอร์โทร | ยี่ห้อ | รุ่น | ทะเบียน | ก่อน | หลัง | รายงาน | Before(จากapp) | Afterจากapp) | Before(จากคน) | After(จากคน)
```

`Before(จากคน)` and `After(จากคน)` are always left blank.

## Railway Environment Variables

Deploy `Code.gs` as an Apps Script Web App, then set:

```env
APPS_SCRIPT_WEB_APP_URL=https://script.google.com/macros/s/.../exec
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

For local Railway-style testing, set `APPS_SCRIPT_WEB_APP_URL` before saving a report.
