// Generates the app icon (PNG + ICO) using Electron (no external dependencies).
//   usage:  npm run build:assets   (or: electron tools/build-assets.js)
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const BUILD = path.join(__dirname, '..', 'build');
fs.mkdirSync(BUILD, { recursive: true });

// --- Icon: rounded green square + white speech bubble with a chevron (echoes the UI) ---
const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#1FB364"/>
      <stop offset="1" stop-color="#0B8A6B"/>
    </linearGradient>
  </defs>
  <rect width="256" height="256" rx="58" fill="url(#g)"/>
  <path d="M60 68 h136 a26 26 0 0 1 26 26 v56 a26 26 0 0 1 -26 26 h-66 l-38 30 v-30 h-32 a26 26 0 0 1 -26 -26 v-56 a26 26 0 0 1 26 -26 z" fill="#ffffff"/>
  <path d="M116 98 l30 24 -30 24" fill="none" stroke="#0B8A6B" stroke-width="17" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Wrap a 256x256 PNG into a single-image .ico file.
function pngToIco(png) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(1, 4); // image count
  const dir = Buffer.alloc(16);
  dir.writeUInt8(0, 0);  // width 0 => 256
  dir.writeUInt8(0, 1);  // height 0 => 256
  dir.writeUInt8(0, 2);
  dir.writeUInt8(0, 3);
  dir.writeUInt16LE(1, 4);   // planes
  dir.writeUInt16LE(32, 6);  // bits per pixel
  dir.writeUInt32LE(png.length, 8);
  dir.writeUInt32LE(22, 12); // offset = 6 + 16
  return Buffer.concat([header, dir, png]);
}

async function makeIcon() {
  const win = new BrowserWindow({ width: 256, height: 256, show: false });
  const html = `<!doctype html><meta charset=utf-8>
    <body style="margin:0;background:transparent">
    <canvas id="c" width="256" height="256"></canvas>
    <script>
      const svg = ${JSON.stringify(ICON_SVG)};
      const img = new Image();
      img.onload = () => { document.getElementById('c').getContext('2d').drawImage(img,0,0,256,256); window.__ok = true; };
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    </script>`;
  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
  await win.webContents.executeJavaScript('new Promise(r=>{(function w(){window.__ok?r():setTimeout(w,50)})()})');
  const dataUrl = await win.webContents.executeJavaScript("document.getElementById('c').toDataURL('image/png')");
  const png = Buffer.from(dataUrl.split(',')[1], 'base64');
  fs.writeFileSync(path.join(BUILD, 'icon.png'), png);
  fs.writeFileSync(path.join(BUILD, 'icon.ico'), pngToIco(png));
  win.destroy();
  console.log('icon: build/icon.png + build/icon.ico (' + png.length + ' bytes png)');
}

app.on('window-all-closed', () => {}); // don't quit when we close the window

app.whenReady().then(async () => {
  try { await makeIcon(); }
  catch (e) { console.error('ERROR:', e); }
  app.quit();
});
