/**
 * GEO Audit Tracker - Google Apps Script backend
 *
 * Paste this file into Extensions > Apps Script from the Google Sheet, then
 * deploy it as a Web app. The frontend calls:
 *   GET  ?action=getData
 *   POST { action: "update", id: "genero", sold: 5 }
 */

const SHEET_NAME = 'Data';
const HEADERS = ['id', 'name', 'goal', 'sold', 'lastUpdated'];

const DEFAULT_AGENCIES = [
  { id: 'genero', name: 'Genero', goal: 20, sold: 0 },
  { id: 'gomogroup', name: 'GO MO Group', goal: 12, sold: 0 },
  { id: 'wgp', name: 'WGP', goal: 7, sold: 0 },
  { id: 'innosearch', name: 'Innosearch', goal: 7, sold: 0 },
  { id: 'garfield', name: 'Garfield', goal: 6, sold: 0 },
  { id: 'semway', name: 'Semway', goal: 6, sold: 0 },
  { id: 'densou', name: 'Densou', goal: 0, sold: 0 },
];

function doGet(e) {
  const action = getParam_(e, 'action') || 'getData';

  try {
    if (action === 'getData') {
      return json_({
        success: true,
        data: getData_(),
      });
    }

    if (action === 'init') {
      initializeSheet_();
      return json_({
        success: true,
        message: 'Sheet initialized',
        data: getData_(),
      });
    }

    return json_({
      success: false,
      error: 'Unknown action: ' + action,
    });
  } catch (err) {
    return error_(err);
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const payload = parsePayload_(e);

    if (payload.action !== 'update') {
      return json_({
        success: false,
        error: 'Unknown action: ' + payload.action,
      });
    }

    const updated = updateAgency_(payload.id, payload.sold);
    return json_({
      success: true,
      data: updated,
    });
  } catch (err) {
    return error_(err);
  } finally {
    lock.releaseLock();
  }
}

/**
 * Optional helper: run this manually once from Apps Script if you want the
 * backend to create the Data tab headers and any missing default agency rows.
 */
function setup() {
  initializeSheet_();
}

function getData_() {
  const sheet = getSheet_();
  ensureHeaders_(sheet);
  ensureDefaultRows_(sheet);

  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];

  return values.slice(1)
    .filter(row => String(row[0]).trim())
    .map(row => ({
      id: String(row[0]).trim(),
      name: String(row[1]).trim(),
      goal: toNumber_(row[2], 0),
      sold: toNumber_(row[3], 0),
      lastUpdated: formatTimestamp_(row[4]),
    }));
}

function updateAgency_(id, sold) {
  const cleanId = String(id || '').trim();
  const cleanSold = toNumber_(sold, NaN);

  if (!cleanId) throw new Error('Missing agency id');
  if (!isFinite(cleanSold) || cleanSold < 0) {
    throw new Error('Sold count must be a non-negative number');
  }

  const defaultsById = DEFAULT_AGENCIES.reduce((map, agency) => {
    map[agency.id] = agency;
    return map;
  }, {});

  if (!defaultsById[cleanId]) {
    throw new Error('Unknown agency id: ' + cleanId);
  }

  const sheet = getSheet_();
  ensureHeaders_(sheet);
  ensureDefaultRows_(sheet);

  const data = sheet.getDataRange().getValues();
  const now = new Date();

  for (let index = 1; index < data.length; index += 1) {
    if (String(data[index][0]).trim() === cleanId) {
      const rowNumber = index + 1;
      sheet.getRange(rowNumber, 4).setValue(cleanSold);
      sheet.getRange(rowNumber, 5).setValue(now);

      return {
        id: cleanId,
        name: String(data[index][1]).trim(),
        goal: toNumber_(data[index][2], 0),
        sold: cleanSold,
        lastUpdated: formatTimestamp_(now),
      };
    }
  }

  const agency = defaultsById[cleanId];
  sheet.appendRow([agency.id, agency.name, agency.goal, cleanSold, now]);

  return {
    id: agency.id,
    name: agency.name,
    goal: agency.goal,
    sold: cleanSold,
    lastUpdated: formatTimestamp_(now),
  };
}

function initializeSheet_() {
  const sheet = getSheet_();
  ensureHeaders_(sheet);
  ensureDefaultRows_(sheet);
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
}

function getSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) {
    throw new Error('No active spreadsheet found. Open Apps Script from the Google Sheet.');
  }

  return spreadsheet.getSheetByName(SHEET_NAME) || spreadsheet.insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const hasExpectedHeaders = HEADERS.every((header, index) => existing[index] === header);

  if (!hasExpectedHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }
}

function ensureDefaultRows_(sheet) {
  const lastRow = sheet.getLastRow();
  const existingIds = lastRow <= 1
    ? []
    : sheet.getRange(2, 1, lastRow - 1, 1).getValues()
        .map(row => String(row[0]).trim())
        .filter(Boolean);

  DEFAULT_AGENCIES.forEach(agency => {
    if (existingIds.indexOf(agency.id) === -1) {
      sheet.appendRow([agency.id, agency.name, agency.goal, agency.sold, '']);
    }
  });
}

function parsePayload_(e) {
  if (!e || !e.postData || !e.postData.contents) {
    throw new Error('Missing request body');
  }

  try {
    return JSON.parse(e.postData.contents);
  } catch (err) {
    throw new Error('Request body must be valid JSON');
  }
}

function getParam_(e, name) {
  return e && e.parameter ? e.parameter[name] : '';
}

function toNumber_(value, fallback) {
  const number = Number(value);
  return isFinite(number) ? number : fallback;
}

function formatTimestamp_(value) {
  if (!value) return '';

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) return String(value);

  return Utilities.formatDate(
    date,
    Session.getScriptTimeZone(),
    'yyyy-MM-dd HH:mm:ss'
  );
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function error_(err) {
  return json_({
    success: false,
    error: err && err.message ? err.message : String(err),
  });
}
