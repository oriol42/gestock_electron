const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Charge le fichier index.html depuis le dossier html
  mainWindow.loadFile(path.join(__dirname, '../html/index.html')); // Chemin corrigé


}

app.whenReady().then(() => {
  createWindow();

  // Gestion de l'événement "activate" sur macOS
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});