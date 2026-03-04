const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'finance.db');
const db = new Database(dbPath);

const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

const categories = [
  ['Salário BG', 'income'],
  ['Entrada Casa', 'expense'],
  ['Financiamento', 'expense'],
  ['Alimentação', 'expense'],
  ['Spotify', 'expense'],
  ['Remédios', 'expense'],
  ['Contabilidade', 'expense'],
  ['Rute', 'expense'],
  ['Transporte', 'expense'],
  ['Emergências', 'expense'],
  ['Reserva', 'expense'],
  ['Paulo Matheus', 'expense'],
  ['Internet', 'expense'],
  ['Água', 'expense'],
  ['Luz', 'expense'],
  ['Acordo CC Caixa', 'expense'],
  ['CC Nubank', 'expense'],
  ['Parc. Empr. Nubank', 'expense'],
  ['Gás', 'expense'],
  ['SIMPLES NACIONAL', 'expense'],
  ['Outros', 'expense']
];

const insert = db.prepare('INSERT INTO categories (name, type) VALUES (?, ?)');
const count = db.prepare('SELECT COUNT(*) as n FROM categories').get();

if (count.n === 0) {
  const insertMany = db.transaction((cats) => {
    for (const c of cats) insert.run(c[0], c[1]);
  });
  insertMany(categories);
  console.log('Seed: categories created');
} else {
  console.log('Seed: categories already exist');
}

db.close();
