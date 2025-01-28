const { app, BrowserWindow, Menu, View } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    // Créer la fenêtre principale
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'Dashboard.js'), 
            contextIsolation: true,
            enableRemoteModule: false,
            nodeIntegration: false, // Sécurité : désactive nodeIntegration
        },
    });

    // Charger le fichier HTML
    mainWindow.loadFile('views/Dashboard.html');

    // Désactiver le menu
    Menu.setApplicationMenu(null)

    // Gérer la fermeture de la fenêtre
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// Quand l'application est prête
app.whenReady().then(createWindow);

// Quitter l'application quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Recréer une fenêtre sur macOS (si l'application est relancée)
app.on('activate', () => {
    if (mainWindow === null) {
        createWindow();
    }
});