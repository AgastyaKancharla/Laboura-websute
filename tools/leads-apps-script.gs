/**
 * Laboura website leads → Google Sheet + email alert to us + thank-you email to the company
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
  jobseeker: { name: 'Job seekers', email: true,
    cols: ['Time', 'Name', 'Phone', 'Job wanted', 'Experience', 'Area', 'Email', 'Page'] },
  staff: { name: 'Staff requests', email: true,
    cols: ['Time', 'Name', 'Business', 'Phone', 'Staff needed', 'How many', 'Area', 'Email', 'Page'] },
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
    if (d.kind === 'enquiry') thanks(d);
    if (d.kind === 'jobseeker' || d.kind === 'staff') thanksShort(d);
    return reply(true);
  } catch (err) {
    console.error(err);
    return reply(false);
  }
}

function rowFor(d, now) {
  switch (d.kind) {
    case 'jobseeker': return [now, d.name, d.phone, d.role, d.experience, d.area, d.email, d.page];
    case 'staff':   return [now, d.name, d.business, d.phone, d.role, d.count, d.area, d.email, d.page];
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
    : d.kind === 'jobseeker' ? `New job seeker: ${clip(d.name, 40)}, ${clip(d.role, 40)}, ${clip(d.area, 40)}`
    : d.kind === 'staff' ? `New staff request: ${d.count || '?'} ${clip(d.role, 40)} for ${clip(d.business, 50)}, ${clip(d.area, 40)}`
    : `Fraud report from +91 ${clip(String(d.phone || '').replace(/^\+91\s*/, ''), 20)}`;
  const body = tab.cols.map((c, i) => `${c}: ${row[i] == null || row[i] === '' ? '-' : row[i]}`).join('\n');
  const opts = { to: ALERT_TO, subject, body, name: 'Laboura website' };
  if (d.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) opts.replyTo = d.email;
  MailApp.sendEmail(opts);
}

// Thank-you email to the company that filled the enquiry form.
function thanks(d) {
  if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return;
  try {
    const name = clip(d.name || '', 60) || 'there';
    const body = `Hi ${name},\n\n`
      + `Thank you for contacting Laboura. We have your enquiry for ${clip(d.company || 'your company', 80)}.\n\n`
      + `What you asked for:\n${clip(d.jobs || '-', 600)}\nTotal people: ${d.total || '-'}\n\n`
      + `Our team will call you on ${clip(d.phone || 'your number', 20)} within 24 hours `
      + `(Monday to Saturday, 9:30 am to 7 pm).\n\n`
      + `To add anything, just reply to this email.\n\n`
      + `Team Laboura\nhello@laboura.com\nhttps://www.laboura.in`;
    MailApp.sendEmail({ to: d.email, subject: 'We have your enquiry - Laboura', body,
                        name: 'Laboura', replyTo: ALERT_TO });
  } catch (err) { console.error(err); }
}

// Thank-you email for the short job / staff form (only when they gave an email).
function thanksShort(d) {
  if (!d.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return;
  try {
    const name = clip(d.name || '', 60) || 'there';
    const what = d.kind === 'staff'
      ? `your request for ${d.count || 1} ${clip(d.role || 'staff', 60)} at ${clip(d.business || 'your business', 80)}`
      : `your details for ${clip(d.role || 'a job', 60)} jobs near ${clip(d.area || 'you', 60)}`;
    const body = `Hi ${name},\n\nThank you for contacting Laboura. We have ${what}.\n\n`
      + `Our team will call you on ${clip(d.phone || 'your number', 20)} within 24 hours `
      + `(Monday to Saturday, 9:30 am to 7 pm).\n\nTeam Laboura\nhello@laboura.com\nhttps://www.laboura.in`;
    MailApp.sendEmail({ to: d.email, subject: 'We have your details - Laboura', body, name: 'Laboura', replyTo: ALERT_TO });
  } catch (err) { console.error(err); }
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
