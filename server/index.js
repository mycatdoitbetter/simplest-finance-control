const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/categories', (req, res) => {
  const rows = db.prepare('SELECT id, name, type FROM categories ORDER BY type, name').all();
  res.json(rows);
});

app.get('/api/transactions', (req, res) => {
  const { month, year } = req.query;
  let sql = `
    SELECT t.id, t.date, t.type, t.amount, t.notes, t.created_at, c.name as category_name
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
  `;
  const params = [];
  if (month && year) {
    sql += ' WHERE strftime("%m", t.date) = ? AND strftime("%Y", t.date) = ?';
    params.push(month.padStart(2, '0'), year);
  }
  sql += ' ORDER BY t.date DESC, t.id DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

app.post('/api/transactions', (req, res) => {
  const { date, type, category_id, amount, notes } = req.body;
  if (!date || !type || !category_id || amount == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const stmt = db.prepare(`
    INSERT INTO transactions (date, type, category_id, amount, notes)
    VALUES (?, ?, ?, ?, ?)
  `);
  const result = stmt.run(date, type, Number(category_id), Number(amount), notes || null);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.delete('/api/transactions/:id', (req, res) => {
  const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
  const result = stmt.run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.status(204).send();
});

app.get('/api/summary', (req, res) => {
  const { month, year } = req.query;
  let where = '';
  const params = [];
  if (month && year) {
    where = ' WHERE strftime("%m", date) = ? AND strftime("%Y", date) = ?';
    params.push(month.padStart(2, '0'), year);
  }
  const income = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions ${where} AND type = 'income'`
  ).get(...params);
  const expense = db.prepare(
    `SELECT COALESCE(SUM(amount), 0) as total FROM transactions ${where} AND type = 'expense'`
  ).get(...params);
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
