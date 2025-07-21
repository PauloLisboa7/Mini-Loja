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
  },
  registrarVenda: (itens, total, formaPagamento, callback) => {
    // Cria tabela de vendas se não existir
    db.run(`CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      data TEXT NOT NULL,
      total REAL NOT NULL,
      forma_pagamento TEXT NOT NULL
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS itens_venda (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venda_id INTEGER,
      produto_id INTEGER,
      quantidade INTEGER,
      preco_unitario REAL,
      FOREIGN KEY(venda_id) REFERENCES vendas(id),
      FOREIGN KEY(produto_id) REFERENCES produtos(id)
    )`);
    // Insere venda
    db.run('INSERT INTO vendas (data, total, forma_pagamento) VALUES (?, ?, ?)', [new Date().toISOString(), total, formaPagamento], function(err) {
      if (err) return callback(err);
      const vendaId = this.lastID;
      // Insere itens e atualiza estoque
      let erro = null;
      itens.forEach(item => {
        db.run('INSERT INTO itens_venda (venda_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)', [vendaId, item.id, item.quantidade, item.preco]);
        db.run('UPDATE produtos SET estoque = estoque - ? WHERE id = ?', [item.quantidade, item.id], function(err2) {
          if (err2 && !erro) erro = err2;
        });
      });
      callback(erro);
    });
  }
}; 