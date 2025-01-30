const { app, BrowserWindow, Menu } = require('electron'); // Ajoutez Menu ici
const path = require('path');
const log = require("electron-log");
const { error } = require('console');

log.transports.file.level='info';
log.transports.file.fileName="app.log";
log.transports.file.maxSize = 5*1024*1024;
log.info("demarrage de l appli");
process.on("uncaughtException",(error) => {
  log.info("erreur non capturée"),error;
});
process.on("unhandledRejection",(reason,promise)=>{
  log.error("rejet non géré");
});

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
    autoHideMenuBar: true, // Masquer la barre de menus (peut être affichée avec Alt)
  });

  // Supprimer complètement la barre de menus
  Menu.setApplicationMenu(null);

  // Charge le fichier login.html depuis le dossier html
  mainWindow.loadFile(path.join(__dirname, '../html/login.html'));
 
  log.info("fenetre principale cree")
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