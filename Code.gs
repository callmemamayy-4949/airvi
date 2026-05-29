const DRIVE_FOLDER_ID = '1KaHvZ6dum58OLXSRXmKKhOUUNOUR77tt';
const SPREADSHEET_ID = '19DlfXzGe9FC2C5LW8AhTJZe5CFt5K3VFMREgqJQiHyE';
const SHEET_NAME = 'test 1';

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
    const result = saveInspectionReport(data);
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: getErrorMessage_(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function saveInspectionReport(data) {
  try {
    if (!data) throw new Error('Missing payload');
    if (!data.beforeImage) throw new Error('Missing beforeImage');
    if (!data.afterImage) throw new Error('Missing afterImage');
    if (!data.pdfBase64) throw new Error('Missing pdfBase64');

    const folder = getDriveFolder_();
    const sheet = getReportSheet_();
    ensureHeaderRow_(sheet);

    const customerName = data.customerName || data.name || (data.carInfo && data.carInfo.customerName) || '';
    const phone = data.phone || (data.carInfo && data.carInfo.phone) || '';
    const vehicleBrand = data.vehicleBrand || data.brand || (data.carInfo && data.carInfo.brand) || '';
    const vehicleModel = data.vehicleModel || data.model || (data.carInfo && data.carInfo.model) || '';
    const plateNo = data.plateNo || data.plate || (data.carInfo && data.carInfo.plate) || '';
    const beforeLevelFromApp = data.beforeLevel || data.beforeScore || (data.beforeResult && data.beforeResult.score) || '';
    const afterLevelFromApp = data.afterLevel || data.afterScore || (data.afterResult && data.afterResult.score) || '';

    const now = new Date();
    const stamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss');
    const fileBaseName = sanitizeFileName_(plateNo || customerName || stamp);

    const beforeImageUrl = uploadBase64FileToDrive_(
      folder,
      data.beforeImage,
      `${stamp}_${fileBaseName}_before.jpg`,
      'image/jpeg'
    );
    const afterImageUrl = uploadBase64FileToDrive_(
      folder,
      data.afterImage,
      `${stamp}_${fileBaseName}_after.jpg`,
      'image/jpeg'
    );
    const reportPdfUrl = uploadBase64FileToDrive_(
      folder,
      data.pdfBase64,
      `${stamp}_${fileBaseName}_report.pdf`,
      'application/pdf'
    );

    try {
      sheet.appendRow([
        now,
        customerName,
        phone,
        vehicleBrand,
        vehicleModel,
        plateNo,
        beforeImageUrl,
        afterImageUrl,
        reportPdfUrl,
        beforeLevelFromApp,
        afterLevelFromApp,
        '',
        ''
      ]);
    } catch (err) {
      throw new Error('Cannot append row to Sheet: ' + getErrorMessage_(err));
    }

    return {
      success: true,
      beforeUrl: beforeImageUrl,
      afterUrl: afterImageUrl,
      reportUrl: reportPdfUrl
    };
  } catch (err) {
    throw new Error(getErrorMessage_(err));
  }
}

function getDriveFolder_() {
  try {
    return DriveApp.getFolderById(DRIVE_FOLDER_ID);
  } catch (err) {
    throw new Error('Cannot access Drive folder: ' + getErrorMessage_(err));
  }
}

function getReportSheet_() {
  try {
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
  } catch (err) {
    throw new Error('Cannot access Spreadsheet: ' + getErrorMessage_(err));
  }
}

function ensureHeaderRow_(sheet) {
  if (sheet.getLastRow() > 0) return;
  sheet.appendRow([
    'วันที่',
    'ชื่อ',
    'เบอร์โทร',
    'ยี่ห้อ',
    'รุ่น',
    'ทะเบียน',
    'ก่อน',
    'หลัง',
    'รายงาน',
    'Before(จากapp)',
    'Afterจากapp)',
    'Before(จากคน)',
    'After(จากคน)'
  ]);
}

function uploadBase64FileToDrive_(folder, base64OrDataUrl, filename, fallbackMimeType) {
  const blob = dataUrlToBlob_(base64OrDataUrl, filename, fallbackMimeType);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return file.getUrl();
}

function dataUrlToBlob_(base64OrDataUrl, filename, fallbackMimeType) {
  const value = String(base64OrDataUrl || '');
  let mimeType = fallbackMimeType || 'application/octet-stream';
  let base64 = value;

  const match = value.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    mimeType = match[1] || mimeType;
    base64 = match[2];
  }

  try {
    const bytes = Utilities.base64Decode(base64);
    return Utilities.newBlob(bytes, mimeType, filename);
  } catch (err) {
    throw new Error('Invalid base64 file: ' + filename);
  }
}

function sanitizeFileName_(value) {
  return String(value).replace(/[\\/:*?"<>|\s]+/g, '_').replace(/^_+|_+$/g, '') || String(Date.now());
}

function getErrorMessage_(err) {
  return err && err.message ? err.message : String(err);
}
