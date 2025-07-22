const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./database.db');

// Criar tabela de produtos
db.serialize(function () {
  db.run(`
    CREATE TABLE IF NOT EXISTS produtos (
      id INTEGER PRIMARY KEY,
      nome TEXT NOT NULL,
      preco REAL NOT NULL,
      estoque INTEGER NOT NULL
    );
  `);
});

// Buscar produto
function getProduto(id, callback) {
  db.get(`SELECT * FROM produtos WHERE id = ?`, [id], (err, row) => {
    if (err) {
      callback(err);
    } else {
      callback(null, row);
    }
  });
}

// Buscar todos os produtos
function getProdutos(callback) {
  db.all(`SELECT * FROM produtos`, (err, rows) => {
    if (err) {
      callback(err);
    } else {
      callback(null, rows);
    }
  });
}

// Adicionar produto
function addProduto(produto, callback) {
  db.run(`
    INSERT INTO produtos (nome, preco, estoque) VALUES (?, ?, ?);
  `, [produto.nome, produto.preco, produto.estoque], (err) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

// Atualizar produto
function updateProduto(produto, callback) {
  db.run(`
    UPDATE produtos SET nome = ?, preco = ?, estoque = ? WHERE id = ?;
  `, [produto.nome, produto.preco, produto.estoque, produto.id], (err) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

// Deletar produto
function deleteProduto(id, callback) {
  db.run(`DELETE FROM produtos WHERE id = ?;`, [id], (err) => {
    if (err) {
      callback(err);
    } else {
      callback(null);
    }
  });
}

module.exports = {
  getProduto,
  getProdutos,
  addProduto,
  updateProduto,
  deleteProduto
};