const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.resolve(__dirname, 'loja.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS produtos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    preco REAL NOT NULL,
    estoque INTEGER NOT NULL
  )`);
});

module.exports = {
  getAllProdutos: (callback) => {
    db.all('SELECT * FROM produtos', [], callback);
  },
  addProduto: (produto, callback) => {
    db.run('INSERT INTO produtos (nome, preco, estoque) VALUES (?, ?, ?)', [produto.nome, produto.preco, produto.estoque], callback);
  },
  updateProduto: (produto, callback) => {
    db.run('UPDATE produtos SET nome = ?, preco = ?, estoque = ? WHERE id = ?', [produto.nome, produto.preco, produto.estoque, produto.id], callback);
  },
  deleteProduto: (id, callback) => {
    db.run('DELETE FROM produtos WHERE id = ?', [id], callback);
  }
}; 