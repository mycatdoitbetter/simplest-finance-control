const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'finance.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

try {
  const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='categories'").get();
  if (!exists) db.exec(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
} catch (_) {}

try {
  const info = db.prepare("PRAGMA table_info(transactions)").all();
  const existing = info.map(c => c.name);
  ['due_date', 'pix_key', 'barcode', 'planned_payment_date', 'attachment'].forEach(c => {
    if (existing.length && !existing.includes(c)) db.exec(`ALTER TABLE transactions ADD COLUMN ${c} TEXT`);
  });
} catch (_) {}

module.exports = db;
