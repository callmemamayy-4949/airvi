import express from "express";
import { Readable } from "node:stream";

const app = express();
const port = process.env.PORT || 3000;

const SHEET_ID = process.env.SHEET_ID || "1ZifJc-xHbEPDWbwdiSTnTc0M2Mvn6Exo4U4s8UEdHG4";
const DRIVE_FOLDER_ID = process.env.DRIVE_FOLDER_ID || "12EQ4sDdlrApVL3KMQLAfIHCRsXgpksO1";
const SHEET_NAME = process.env.SHEET_NAME || "AirVision Reports";
const MAX_JSON_SIZE = process.env.MAX_JSON_SIZE || "35mb";

app.use(express.json({ limit: MAX_JSON_SIZE }));
app.use(express.static("public", {
  etag: true,
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "airvision" });
});

app.post("/api/reports", async (req, res) => {
  try {
    const result = await saveInspectionReport(req.body);
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    });
  }
});

app.use((_req, res) => {
  res.sendFile("index.html", { root: "public" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`AirVision listening on 0.0.0.0:${port}`);
});

async function saveInspectionReport(data) {
  if (!data) throw new Error("Missing payload");

  const { google } = await import("googleapis");
  const auth = getGoogleAuth();
  const drive = google.drive({ version: "v3", auth });
  const sheets = google.sheets({ version: "v4", auth });

  await ensureSheet(sheets);

  const car = data.carInfo || {};
  const before = data.beforeResult || {};
  const after = data.afterResult || {};
  const stamp = Date.now();
  const plate = sanitizeFileName(car.plate || car.licensePlate || "NoPlate");

  const beforeUrl = data.beforeImage
    ? await uploadDataUri(drive, data.beforeImage, `Before_${plate}_${stamp}.jpg`)
    : "";
  const afterUrl = data.afterImage
    ? await uploadDataUri(drive, data.afterImage, `After_${plate}_${stamp}.jpg`)
    : "";
  const pdfUrl = data.pdfBase64
    ? await uploadDataUri(drive, data.pdfBase64, `Report_${plate}_${stamp}.pdf`)
    : "";

  const row = [
    new Date().toISOString(),
    car.customerName || "-",
    car.phone || "-",
    car.brand || "-",
    car.model || "-",
    car.plate || car.licensePlate || "-",
    beforeUrl,
    afterUrl,
    pdfUrl,
    before.score || "",
    after.score || ""
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: quoteSheetName(SHEET_NAME),
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: { values: [row] }
  });

  return {
    success: true,
    pdfUrl,
    beforeUrl,
    afterUrl,
    sheetName: SHEET_NAME
  };
}

function getGoogleAuth() {
  const credentials = readServiceAccountCredentials();
  return new google.auth.GoogleAuth({
    credentials,
    scopes: [
      "https://www.googleapis.com/auth/drive.file",
      "https://www.googleapis.com/auth/spreadsheets"
    ]
  });
}

function readServiceAccountCredentials() {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
    const json = Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, "base64").toString("utf8");
    return JSON.parse(json);
  }

  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  }

  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!clientEmail || !privateKey) {
    throw new Error("Missing Google service account credentials");
  }

  return {
    type: "service_account",
    client_email: clientEmail,
    private_key: privateKey
  };
}

async function ensureSheet(sheets) {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SHEET_ID,
    fields: "sheets.properties.title"
  });

  const exists = spreadsheet.data.sheets?.some((sheet) => sheet.properties?.title === SHEET_NAME);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: SHEET_NAME } } }]
      }
    });
  }

  const values = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${quoteSheetName(SHEET_NAME)}!A1:K1`
  }).catch((error) => {
    if (error?.code === 400) return { data: { values: [] } };
    throw error;
  });

  if (!values.data.values?.length) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `${quoteSheetName(SHEET_NAME)}!A1:K1`,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [[
          "วันที่",
          "ชื่อ",
          "เบอร์โทร",
          "ยี่ห้อ",
          "รุ่น",
          "ทะเบียน",
          "ก่อน",
          "หลัง",
          "รายงาน",
          "Before",
          "After"
        ]]
      }
    });
  }
}

async function uploadDataUri(drive, dataUri, name) {
  const { contentType, buffer } = parseDataUri(dataUri, name);
  const response = await drive.files.create({
    requestBody: {
      name,
      parents: [DRIVE_FOLDER_ID]
    },
    media: {
      mimeType: contentType,
      body: bufferToStream(buffer)
    },
    fields: "id,webViewLink"
  });

  return response.data.webViewLink || `https://drive.google.com/file/d/${response.data.id}/view`;
}

function parseDataUri(dataUri, name) {
  const match = String(dataUri).match(/^data:([^;]+);base64,(.+)$/);
  if (!match) throw new Error(`Invalid data URI for ${name}`);
  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64")
  };
}

function bufferToStream(buffer) {
  return Readable.from(buffer);
}

function sanitizeFileName(value) {
  return String(value).replace(/[\\/:*?"<>|\s]+/g, "_").replace(/^_+|_+$/g, "") || "NoPlate";
}

function quoteSheetName(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}
