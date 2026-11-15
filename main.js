const { app, BrowserWindow, session, globalShortcut, ipcMain, shell } = require('electron');
const path = require('path');

// Clean User-Agent (without the "Electron" token) so WhatsApp Web does not
// show the "unsupported browser" warning.
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
    autoHideMenuBar: true, // hide the menu bar (press Alt to reveal it)
    alwaysOnTop: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      spellcheck: true
    }
  });

  // Always on top, even above fullscreen apps
  win.setAlwaysOnTop(true, 'floating');

  win.webContents.setUserAgent(CHROME_UA);
  win.loadURL('https://web.whatsapp.com/', { userAgent: CHROME_UA });

  // Open external links in the default browser, not inside the mini window
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://web.whatsapp.com')) return { action: 'allow' };
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('closed', () => { win = null; });
}

// --- IPC from the in-page buttons (preload) ---
ipcMain.on('wamini:toggle-top', () => {
  if (!win) return;
  alwaysOnTop = !alwaysOnTop;
  win.setAlwaysOnTop(alwaysOnTop, 'floating');
  win.webContents.send('wamini:top-state', alwaysOnTop);
});
ipcMain.on('wamini:get-top', () => {
  if (!win) return;
  win.webContents.send('wamini:top-state', alwaysOnTop);
});

app.whenReady().then(() => {
  // Required on Windows for notifications to work properly
  app.setAppUserModelId('com.dado.whatsappmini');

  // Allow notifications / microphone / camera (calls and voice notes)
  session.defaultSession.setPermissionRequestHandler((wc, permission, cb) => {
    const allowed = ['notifications', 'media', 'clipboard-read', 'clipboard-sanitized-write'];
    cb(allowed.includes(permission));
  });

  createWindow();

  // Global shortcut: Ctrl+Alt+W shows/hides the window from anywhere
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

// Keep running until explicitly closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
