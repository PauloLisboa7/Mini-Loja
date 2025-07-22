const ipcRenderer = require('electron').ipcRenderer;
const db = require('./db');

// Alternar abas
const tabProdutos = document.getElementById('tab-produtos');
const tabCarrinho = document.getElementById('tab-carrinho');
const produtosSection = document.getElementById('produtos-section');
const carrinhoSection = document.getElementById('carrinho-section');

tabProdutos.onclick = () => {
  produtosSection.style.display = '';
  carrinhoSection.style.display = 'none';
};
tabCarrinho.onclick = () => {
  produtosSection.style.display = 'none';
  carrinhoSection.style.display = '';
};

// CRUD Produtos
const formProduto = document.getElementById('form-produto');
const tabelaProdutos = document.getElementById('tabela-produtos').querySelector('tbody');
const cancelarEdicao = document.getElementById('cancelar-edicao');

let editando = false;
let produtoEditandoId = null;

function carregarProdutos() {
  db.getProdutos((err, produtos) => {
    if (err) {
      console.error(err);
    } else {
      tabelaProdutos.innerHTML = '';
      produtos.forEach(produto => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${produto.nome}</td>
          <td>R$ ${produto.preco.toFixed(2)}</td>
          <td>${produto.estoque}</td>
          <td>
            <button onclick="editarProduto(${produto.id}, '${produto.nome}', ${produto.preco}, ${produto.estoque})">Editar</button>
            <button onclick="deletarProduto(${produto.id})">Excluir</button>
            <button onclick="adicionarCarrinho(${produto.id}, '${produto.nome}', ${produto.preco})">Adicionar ao Carrinho</button>
          </td>
        `;
        tabelaProdutos.appendChild(tr);
      });
    }
  });
}

window.editarProduto = (id, nome, preco, estoque) => {
  document.getElementById('produto-id').value = id;
  document.getElementById('produto-nome').value = nome;
  document.getElementById('produto-preco').value = preco;
  document.getElementById('produto-estoque').value = estoque;
  cancelarEdicao.style.display = '';
  editando = true;
  produtoEditandoId = id;
};

window.deletarProduto = (id) => {
  db.deleteProduto(id, (err) => {
    if (err) {
      console.error(err);
    } else {
      carregarProdutos();
    }
  });
};

formProduto.onsubmit = (e) => {
  e.preventDefault();
  const nome = document.getElementById('produto-nome').value;
  const preco = parseFloat(document.getElementById('produto-preco').value);
  const estoque = parseInt(document.getElementById('produto-estoque').value);
  if (editando) {
    db.updateProduto({ id: produtoEditandoId, nome, preco, estoque }, (err) => {
      if (err) {
        console.error(err);
      } else {
        editando = false;
        produtoEditandoId = null;
        cancelarEdicao.style.display = 'none';
        formProduto.reset();
        carregarProdutos();
      }
    });
  } else {
    db.addProduto({ nome, preco, estoque }, (err) => {
      if (err) {
        console.error(err);
      } else {
        formProduto.reset();
        carregarProdutos();
      }
    });
  }
};

cancelarEdicao.onclick = () => {
  editando = false;
  produtoEditandoId = null;
  cancelarEdicao.style.display = 'none';
  formProduto.reset();
};

// Carrinho de Compras
let carrinho = [];

window.adicionarCarrinho = (id, nome, preco) => {
  const item = carrinho.find(p => p.id === id);
  if (item) {
    verificarEstoque(item, item.quantidade + 1);
  } else {
    carrinho.push({ id, nome, preco, quantidade: 1 });
    renderizarCarrinho();
  }
};

function verificarEstoque(produto, quantidade) {
  db.getProduto(produto.id, (err, produtoDB) => {
    if (err) {
      console.error(err);
    } else {
      if (produtoDB.estoque < quantidade) {
        alert("Estoque insuficiente!");
      } else {
        atualizarEstoque(produto, quantidade);
        adicionarAoCarrinho(produto, quantidade);
      }
    }
  });
}

function atualizarEstoque(produto, quantidade) {
  db.updateProduto({ id: produto.id, estoque: produto.estoque - quantidade }, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log("Estoque atualizado!");
    }
  });
}

function adicionarAoCarrinho(produto, quantidade) {
  const item = carrinho.find(p => p.id === produto.id);
  if (item) {
    item.quantidade += quantidade;
  } else {
    carrinho.push({ id: produto.id, nome: produto.nome, preco: produto.preco, quantidade: quantidade });
  }
  renderizarCarrinho();
}

function renderizarCarrinho() {
  const tabelaCarrinho = document.getElementById('tabela-carrinho').querySelector('tbody');
  tabelaCarrinho.innerHTML = '';
  let total = 0;
  let totalItens = 0;
  carrinho.forEach(item => {
    const subtotal = item.preco * item.quantidade;
    total += subtotal;
    totalItens += item.quantidade;
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.nome}</td>
      <td>R$ ${item.preco.toFixed(2)}</td>
      <td><input type='number' min='1' value='${item.quantidade}' onchange='alterarQuantidade(${item.id}, this.value)'></td>
      <td>R$ ${subtotal.toFixed(2)}</td>
      <td><button onclick='removerCarrinho(${item.id})'>Remover</button></td>
    `;
    tabelaCarrinho.appendChild(tr);
  });
  document.getElementById('total-geral').textContent = total.toFixed(2);
  document.getElementById('total-itens').textContent = totalItens;
}

window.alterarQuantidade = (id, quantidade) => {
  const item = carrinho.find(p => p.id === id);
  if (item) {
    item.quantidade = quantidade;
    renderizarCarrinho();
  }
};

window.removerCarrinho = (id) => {
  const item = carrinho.find(p => p.id === id);
  if (item) {
    carrinho.splice(carrinho.indexOf(item), 1);
    renderizarCarrinho();
  }
};