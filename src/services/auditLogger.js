const fs = require('fs/promises');
const path = require('path');

const LOG_DIR = path.resolve(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'audit.log');

async function appendAuditEntry(event, details = {}) {
  await fs.mkdir(LOG_DIR, { recursive: true });
  const entry = { timestamp: new Date().toISOString(), event, ...details };
  await fs.appendFile(LOG_FILE, `${JSON.stringify(entry)}\n`, 'utf8');
}

async function logAudit(event, details) {
  try {
    await appendAuditEntry(event, details);
  } catch (err) {
    console.error(`[audit] could not write ${event}:`, err.message);
  }
}

module.exports = { appendAuditEntry, logAudit, LOG_FILE };
