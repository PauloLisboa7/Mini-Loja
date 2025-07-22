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

// Buscar todos os produtos (alias para compatibilidade)
function getAllProdutos(callback) {
  getProdutos(callback);
}

// Registrar venda
function registrarVenda(itens, total, formaPagamento, callback) {
  // Criar tabela de vendas se não existir
  db.run(`
    CREATE TABLE IF NOT EXISTS vendas (
      id INTEGER PRIMARY KEY,
      total REAL NOT NULL,
      forma_pagamento TEXT NOT NULL,
      data_venda DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, (err) => {
    if (err) {
      callback(err);
      return;
    }
    
    // Inserir venda
    db.run(`
      INSERT INTO vendas (total, forma_pagamento) VALUES (?, ?);
    `, [total, formaPagamento], function(err) {
      if (err) {
        callback(err);
      } else {
        // Atualizar estoque dos produtos vendidos
        let completed = 0;
        let hasError = false;
        
        if (itens.length === 0) {
          callback(null);
          return;
        }
        
        itens.forEach(item => {
          db.run(`
            UPDATE produtos SET estoque = estoque - ? WHERE id = ?;
          `, [item.quantidade, item.id], (err) => {
            completed++;
            if (err && !hasError) {
              hasError = true;
              callback(err);
            } else if (completed === itens.length && !hasError) {
              callback(null);
            }
          });
        });
      }
    });
  });
}

module.exports = {
  getProduto,
  getProdutos,
  getAllProdutos,
  addProduto,
  updateProduto,
  deleteProduto,
  registrarVenda
};
