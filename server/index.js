const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const MAX_ATTACHMENT = 5 * 1024 * 1024;

function validateAttachment(val) {
  if (val === '' || val === null) return null;
  if (!val || typeof val !== 'string') return undefined;
  const match = val.match(/^data:application\/pdf;base64,(.+)$/);
  if (!match) return null;
  const size = Math.ceil(match[1].length * 0.75);
  if (size > MAX_ATTACHMENT) return null;
  return val;
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '6mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/categories', (req, res) => {
  const rows = db.prepare('SELECT id, name, type FROM categories ORDER BY type, name').all();
  res.json(rows);
});

app.post('/api/categories', (req, res) => {
  const { name, type } = req.body;
  if (!name || !type || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Invalid name or type' });
  }
  const stmt = db.prepare('INSERT INTO categories (name, type) VALUES (?, ?)');
  const result = stmt.run(name.trim(), type);
  res.status(201).json({ id: result.lastInsertRowid, name: name.trim(), type });
});

app.put('/api/categories/:id', (req, res) => {
  const { name, type } = req.body;
  if (!name || !type || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Invalid name or type' });
  }
  const stmt = db.prepare('UPDATE categories SET name = ?, type = ? WHERE id = ?');
  const result = stmt.run(name.trim(), type, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ id: Number(req.params.id), name: name.trim(), type });
});

app.delete('/api/categories/:id', (req, res) => {
  const count = db.prepare('SELECT COUNT(*) as n FROM transactions WHERE category_id = ?').get(req.params.id);
  if (count.n > 0) {
    return res.status(400).json({ error: 'Category has transactions. Delete them first.' });
  }
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  const result = stmt.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

app.post('/api/categories/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Invalid ids' });
  const withTxns = db.prepare('SELECT id FROM categories WHERE id IN (' + ids.map(() => '?').join(',') + ') AND id IN (SELECT DISTINCT category_id FROM transactions)').all(...ids.map(Number));
  const toDelete = ids.filter(id => !withTxns.some(c => c.id === Number(id)));
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  toDelete.forEach(id => stmt.run(id));
  res.json({ deleted: toDelete.length, skipped: ids.length - toDelete.length });
});

app.get('/api/months', (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%m', date) as month, strftime('%Y', date) as year, COUNT(*) as count
    FROM transactions
    GROUP BY year, month
    ORDER BY year DESC, month DESC
  `).all();
  res.json(rows);
});

app.get('/api/transactions', (req, res) => {
  const { month, year } = req.query;
  let sql = `
    SELECT t.id, t.date, t.type, t.amount, t.notes, t.due_date, t.pix_key, t.barcode, t.planned_payment_date, t.created_at, t.category_id, c.name as category_name,
      CASE WHEN t.attachment IS NOT NULL THEN 1 ELSE 0 END as has_attachment
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
  `;
  const params = [];
  if (month && year) {
    sql += " WHERE strftime('%m', t.date) = ? AND strftime('%Y', t.date) = ?";
    params.push(month.padStart(2, '0'), year);
  }
  sql += ' ORDER BY t.date DESC, t.id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post('/api/transactions', (req, res) => {
  const { date, type, category_id, amount, notes, due_date, pix_key, barcode, planned_payment_date, attachment } = req.body;
  if (!date || !type || !category_id || amount == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const att = validateAttachment(attachment);
  const stmt = db.prepare(`
    INSERT INTO transactions (date, type, category_id, amount, notes, due_date, pix_key, barcode, planned_payment_date, attachment)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = stmt.run(date, type, Number(category_id), Number(amount), notes || null, due_date || null, pix_key || null, barcode || null, planned_payment_date || null, att);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.put('/api/transactions/:id', (req, res) => {
  const { date, type, category_id, amount, notes, due_date, pix_key, barcode, planned_payment_date, attachment } = req.body;
  if (!date || !type || !category_id || amount == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const attResult = validateAttachment(attachment);
  let att = attResult;
  if (attResult === undefined) {
    const cur = db.prepare('SELECT attachment FROM transactions WHERE id = ?').get(req.params.id);
    att = cur ? cur.attachment : null;
  }
  const stmt = db.prepare(`
    UPDATE transactions SET date = ?, type = ?, category_id = ?, amount = ?, notes = ?, due_date = ?, pix_key = ?, barcode = ?, planned_payment_date = ?, attachment = ?
    WHERE id = ?
  `);
  const result = stmt.run(date, type, Number(category_id), Number(amount), notes || null, due_date || null, pix_key || null, barcode || null, planned_payment_date || null, att, req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ id: Number(req.params.id) });
});

app.get('/api/transactions/:id', (req, res) => {
  const row = db.prepare(`
    SELECT t.id, t.date, t.type, t.amount, t.notes, t.due_date, t.pix_key, t.barcode, t.planned_payment_date, t.attachment, t.category_id, c.name as category_name
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).send();
  res.json(row);
});

app.get('/api/transactions/:id/attachment', (req, res) => {
  const row = db.prepare('SELECT attachment FROM transactions WHERE id = ?').get(req.params.id);
  if (!row || !row.attachment) return res.status(404).send();
  const match = row.attachment.match(/^data:application\/pdf;base64,(.+)$/);
  if (!match) return res.status(404).send();
  const buf = Buffer.from(match[1], 'base64');
  res.set('Content-Type', 'application/pdf');
  res.set('Content-Disposition', 'inline; filename="comprovante.pdf"');
  res.send(buf);
});

app.delete('/api/transactions/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
  const result = stmt.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

app.post('/api/transactions/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'Invalid ids' });
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
  let deleted = 0;
  ids.forEach(id => { if (stmt.run(Number(id)).changes) deleted++; });
  res.json({ deleted });
});

app.get('/api/summary', (req, res) => {
  const { month, year } = req.query;
  let where = '';
  const params = [];
  if (month && year) {
    where = " WHERE strftime('%m', date) = ? AND strftime('%Y', date) = ?";
    params.push(month.padStart(2, '0'), year);
  }
  const typeFilter = where ? `${where} AND type = ?` : ' WHERE type = ?';
  const income = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions ${typeFilter}`
  ).get(...params, 'income');
  const expense = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions ${typeFilter}`
  ).get(...params, 'expense');
  const catWhere = where ? where.replace('date', 't.date') : '';
  const byCategory = db.prepare(`
    SELECT c.name, t.type, SUM(t.amount) as total
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    ${catWhere}
    GROUP BY c.id, t.type
    HAVING total > 0
    ORDER BY total DESC
  `).all(...params);
  res.json({
    income: income.total,
    expense: expense.total,
    balance: income.total - expense.total,
    byCategory
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
