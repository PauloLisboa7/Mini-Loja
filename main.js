const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./db');

function createWindow() {
  const win = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('get-produtos', (event) => {
  return new Promise((resolve, reject) => {
    db.getAllProdutos((err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
});

ipcMain.handle('add-produto', (event, produto) => {
  return new Promise((resolve, reject) => {
    db.addProduto(produto, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

ipcMain.handle('update-produto', (event, produto) => {
  return new Promise((resolve, reject) => {
    db.updateProduto(produto, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

ipcMain.handle('delete-produto', (event, id) => {
  return new Promise((resolve, reject) => {
    db.deleteProduto(id, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
});

ipcMain.handle('finalizar-compra', (event, { itens, total, formaPagamento }) => {
  return new Promise((resolve, reject) => {
    db.registrarVenda(itens, total, formaPagamento, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}); 