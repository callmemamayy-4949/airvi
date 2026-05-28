# AirVision

AirVision is a Railway-ready web app for evaluating automotive evaporator coil cleanliness from Before/After images.

The image analysis runs in the browser with a Teachable Machine Image Model stored in `public/my_model/`. It does not use Gemini, webcam capture, or any external AI API key.

## App Flow

1. Customer/car details and Before/After image upload
2. Processing screen that loads the Teachable Machine model only after analysis starts
3. Before/After result screen with customer signature
4. Inspection report screen with local PDF download

## Railway Structure

- `public/index.html` - full AirVision frontend, upload flow, signature, PDF generation
- `public/my_model/` - Teachable Machine files: `model.json`, `metadata.json`, `model.weights.bin`
- `server.js` - Railway/Node static server and healthcheck
- `package.json` - Railway start command via `npm start`

The PDF is generated and downloaded in the browser. Google Sheet/Drive saving is intentionally disabled for now and can be added later.

## Future Google Storage

These IDs are reserved for a future Google Sheet/Drive integration:

- Google Sheet ID: `1ZifJc-xHbEPDWbwdiSTnTc0M2Mvn6Exo4U4s8UEdHG4`
- Drive Folder ID: `12EQ4sDdlrApVL3KMQLAfIHCRsXgpksO1`
- Sheet tab: `AirVision Reports`

Header row:

```text
วันที่ | ชื่อ | เบอร์โทร | ยี่ห้อ | รุ่น | ทะเบียน | ก่อน | หลัง | รายงาน | Before | After
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

No Google credentials are required for the current version.
