const { ipcRenderer } = require('electron');

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

async function carregarProdutos() {
  try {
    const produtos = await ipcRenderer.invoke('get-produtos');
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
  } catch (err) {
    console.error(err);
  }
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

window.deletarProduto = async (id) => {
  try {
    await ipcRenderer.invoke('delete-produto', id);
    carregarProdutos();
  } catch (err) {
    console.error(err);
  }
};

formProduto.onsubmit = async (e) => {
  e.preventDefault();
  const nome = document.getElementById('produto-nome').value;
  const preco = parseFloat(document.getElementById('produto-preco').value);
  const estoque = parseInt(document.getElementById('produto-estoque').value);
  
  try {
    if (editando) {
      await ipcRenderer.invoke('update-produto', { id: produtoEditandoId, nome, preco, estoque });
      editando = false;
      produtoEditandoId = null;
      cancelarEdicao.style.display = 'none';
    } else {
      await ipcRenderer.invoke('add-produto', { nome, preco, estoque });
    }
    formProduto.reset();
    carregarProdutos();
  } catch (err) {
    console.error(err);
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

window.adicionarCarrinho = async (id, nome, preco) => {
  try {
    // Verificar estoque antes de adicionar
    const produtos = await ipcRenderer.invoke('get-produtos');
    const produto = produtos.find(p => p.id === id);
    
    if (!produto) {
      alert('Produto não encontrado!');
      return;
    }
    
    const item = carrinho.find(p => p.id === id);
    const quantidadeDesejada = item ? item.quantidade + 1 : 1;
    
    if (produto.estoque < quantidadeDesejada) {
      alert(`Estoque insuficiente! Disponível: ${produto.estoque}`);
      return;
    }
    
    if (item) {
      item.quantidade++;
    } else {
      carrinho.push({ id, nome, preco, quantidade: 1 });
    }
    
    renderizarCarrinho();
  } catch (err) {
    console.error(err);
    alert('Erro ao adicionar produto ao carrinho');
  }
};

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

window.alterarQuantidade = async (id, quantidade) => {
  const produtos = await ipcRenderer.invoke('get-produtos');
  const produto = produtos.find(p => p.id === id);
  if (!produto) {
    alert('Produto não encontrado!');
    return;
  }
  if (quantidade > produto.estoque) {
    alert(`Estoque insuficiente! Disponível: ${produto.estoque}`);
    renderizarCarrinho(); // Re-render to reset input value to previous valid quantity
    return;
  }
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

// Finalizar compra
const btnFinalizarCompra = document.getElementById('btn-finalizar-compra');
btnFinalizarCompra.onclick = async () => {
  if (carrinho.length === 0) {
    alert('Carrinho vazio!');
    return;
  }
  
  const formaPagamento = document.getElementById('forma-pagamento').value;
  const total = parseFloat(document.getElementById('total-geral').textContent);
  
  try {
    await ipcRenderer.invoke('finalizar-compra', {
      itens: carrinho,
      total: total,
      formaPagamento: formaPagamento
    });
    
    alert('Compra finalizada com sucesso!');
    carrinho = [];
    renderizarCarrinho();
    carregarProdutos(); // Atualizar lista de produtos
  } catch (err) {
    console.error(err);
    alert('Erro ao finalizar compra');
  }
};

// Carregar produtos quando a página iniciar
document.addEventListener('DOMContentLoaded', () => {
  carregarProdutos();
});
