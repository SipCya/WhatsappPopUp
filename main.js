const { app, BrowserWindow, session, globalShortcut, ipcMain, shell } = require('electron');
const path = require('path');

// User agent "pulito" (senza la stringa Electron) così WhatsApp Web
// non mostra l'avviso "browser non supportato".
const CHROME_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

let win;
let alwaysOnTop = true;

function createWindow() {
  win = new BrowserWindow({
    width: 420,
    height: 660,
    minWidth: 320,
    minHeight: 440,
    title: 'WhatsApp Mini',
    icon: path.join(__dirname, 'build', 'icon.ico'),
    backgroundColor: '#111b21',
    autoHideMenuBar: true, // nasconde la barra dei menu (si vede premendo Alt)
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      spellcheck: true
    }
  });

  // Sempre in primo piano, anche sopra app a schermo intero
  win.setAlwaysOnTop(true, 'floating');

  win.webContents.setUserAgent(CHROME_UA);
  win.loadURL('https://web.whatsapp.com/', { userAgent: CHROME_UA });

  // Apri eventuali link esterni nel browser di default, non nella finestrella
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://web.whatsapp.com')) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// --- IPC dai pulsanti dentro la pagina (preload) ---
ipcMain.on('wamini:toggle-top', () => {
  alwaysOnTop = !alwaysOnTop;
  win.setAlwaysOnTop(alwaysOnTop, 'floating');
  win.webContents.send('wamini:top-state', alwaysOnTop);
});
ipcMain.on('wamini:get-top', () => {
  win.webContents.send('wamini:top-state', alwaysOnTop);
});

app.whenReady().then(() => {
  // Necessario su Windows per far funzionare bene le notifiche
  app.setAppUserModelId('com.dado.whatsappmini');

  // Consenti notifiche / microfono / fotocamera (chiamate e note vocali)
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    const allowed = ['notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write'];
    cb(allowed.includes(permission));
  });

  createWindow();

  // Scorciatoia globale: Ctrl+Alt+W mostra/nasconde la finestrella da ovunque
  globalShortcut.register('CommandOrControl+Alt+W', () => {
    if (!win) return;
    if (win.isVisible() && win.isFocused()) win.hide();
    else { win.show(); win.focus(); }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => globalShortcut.unregisterAll());

// Resta aperta finché non la chiudi esplicitamente
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
