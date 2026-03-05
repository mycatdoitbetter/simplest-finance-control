const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'finance.db');

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

try {
  const info = db.prepare("PRAGMA table_info(transactions)").all();
  const existing = info.map(c => c.name);
  ['due_date', 'pix_key', 'barcode', 'planned_payment_date', 'attachment'].forEach(c => {
    if (existing.length && !existing.includes(c)) db.exec(`ALTER TABLE transactions ADD COLUMN ${c} TEXT`);
  });
} catch (_) {}

module.exports = db;
