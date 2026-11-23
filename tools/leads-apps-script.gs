/**
 * Laboura website leads → Google Sheet + email alert
 *
 * Set up (5 minutes, signed in as hello@laboura.com):
 *  1. Create a Google Sheet named "Laboura Leads".
 *  2. Extensions → Apps Script. Delete what is there, paste this whole file, Save.
 *  3. Deploy → New deployment → type "Web app".
 *       Execute as: Me (hello@laboura.com)
 *       Who has access: Anyone
 *     Deploy → allow the permissions → copy the "Web app URL" (ends in /exec).
 *  4. Send that URL to the website developer. It is not a password; it only lets
 *     the website add rows. The Sheet itself stays private to your account.
 *
 * After any change to this script: Deploy → Manage deployments → edit (pencil)
 * → Version: New version → Deploy. The URL stays the same.
 */

const ALERT_TO = 'hello@laboura.com';
const TZ = 'Asia/Kolkata';

// One tab per kind of data. Columns are created automatically the first time.
const TABS = {
  enquiry: { name: 'Company enquiries', email: true,
    cols: ['Time', 'Company', 'Name', 'Phone', 'Email', 'Jobs', 'Total people', 'Page'] },
  fraud: { name: 'Fraud reports', email: true,
    cols: ['Time', 'What happened', 'Their number / UPI / website', 'Money paid', 'Details', 'Reporter phone', 'Page'] },
  click: { name: 'Button taps', email: false,
    cols: ['Time', 'Button', 'Job', 'Ready message', 'Button text', 'Page', 'Device'] }
};

function doGet() {
  return ContentService.createTextOutput('Laboura leads: working');
}

function doPost(e) {
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.website) return reply(true);                 // honeypot: bots fill hidden fields
    const tab = TABS[d.kind];
    if (!tab) return reply(false);
    if (d.kind === 'click' && tooMany()) return reply(true);

    const now = Utilities.formatDate(new Date(), TZ, 'dd MMM yyyy, hh:mm a');
    const row = rowFor(d, now);

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try { sheetFor(tab).appendRow(row.map(safe)); } finally { lock.releaseLock(); }

    if (tab.email) alert(d, tab, row);
    return reply(true);
  } catch (err) {
    console.error(err);
    return reply(false);
  }
}

function rowFor(d, now) {
  switch (d.kind) {
    case 'enquiry': return [now, d.company, d.name, d.phone, d.email, d.jobs, d.total, d.page];
    case 'fraud':   return [now, d.what, d.them, d.paid, d.details, d.phone, d.page];
    default:        return [now, d.button, d.job, d.message, d.label, d.page, d.device];
  }
}

function sheetFor(tab) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(tab.name);
  if (!sh) {
    sh = ss.insertSheet(tab.name);
    sh.appendRow(tab.cols);
    sh.getRange(1, 1, 1, tab.cols.length).setFontWeight('bold').setBackground('#F1F1F4');
    sh.setFrozenRows(1);
  }
  return sh;
}

function alert(d, tab, row) {
  const subject = d.kind === 'enquiry'
    ? `New company enquiry: ${clip(d.company, 60)} (${d.total || '?'} people)`
    : `Fraud report from +91 ${clip(String(d.phone || '').replace(/^\+91\s*/, ''), 20)}`;
  const body = tab.cols.map((c, i) => `${c}: ${row[i] == null || row[i] === '' ? '-' : row[i]}`).join('\n')
    + `\n\nAll leads: ${SpreadsheetApp.getActiveSpreadsheet().getUrl()}`;
  const opts = { to: ALERT_TO, subject, body, name: 'Laboura website' };
  if (d.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) opts.replyTo = d.email;
  MailApp.sendEmail(opts);
}

// Stops a flood of fake button taps from filling the Sheet (max 300 a minute).
function tooMany() {
  const c = CacheService.getScriptCache(), k = 'taps' + Math.floor(Date.now() / 60000);
  const n = Number(c.get(k) || 0) + 1;
  c.put(k, String(n), 120);
  return n > 300;
}

// Keeps cell text short and stops anything that looks like a formula from running.
function safe(v) {
  if (v == null) return '';
  let s = clip(String(v), 2000);
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return s;
}

function clip(s, n) { s = String(s == null ? '' : s); return s.length > n ? s.slice(0, n) + '…' : s; }

function reply(ok) {
  return ContentService.createTextOutput(JSON.stringify({ ok: ok }))
    .setMimeType(ContentService.MimeType.JSON);
}
