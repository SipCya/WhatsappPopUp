// preload.js — gira in un "mondo isolato" con accesso sia al DOM della pagina
// sia alle API di Electron. Qui iniettiamo CSS + i pulsanti di controllo.

const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'wamini-focus-enabled';
  let focusEnabled = localStorage.getItem(STORAGE_KEY) !== 'false'; // default attivo
  let peeking = false;      // stiamo sbirciando la lista in attesa di aprire una chat
  let onTop = true;         // stato "sempre sopra" (rispecchia il main process)

  /* ----------------------------- CSS ----------------------------- */
  const style = document.createElement('style');
  style.textContent = `
    /* FOCUS — metodo "catena": a ogni antenato di #main mettiamo .wamini-keep,
       poi a ogni livello nascondiamo i fratelli NON marcati. Così sparisce la
       colonna sinistra a qualunque profondità sia annidata #main. */
    body.wamini-focus .wamini-keep:not(#main) > *:not(.wamini-keep) { display: none !important; }
    body.wamini-focus .wamini-keep:not(#main) {
      display: block !important;
      width: 100% !important; height: 100% !important;
      max-width: none !important; min-width: 0 !important;
      flex: 1 1 auto !important; margin: 0 !important; transform: none !important;
    }
    body.wamini-focus #main {
      width: 100% !important; height: 100% !important; flex: 1 1 auto !important;
      box-sizing: border-box !important;
      padding-left: 44px !important; /* spazio per la sidebar, niente sovrapposizione */
    }

    /* Sidebar sinistra: visibile SOLO in modalità "solo chat" (non sulla lista) */
    #wamini-rail { display: none; }
    body.wamini-focus #wamini-rail {
      position: fixed; left: 0; top: 0; bottom: 0; width: 44px; z-index: 2147483647;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: #202c33; border-right: 1px solid #2a3942;
    }
    .wr-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 32px; border-radius: 8px; cursor: pointer; color: #aebac1;
      opacity: .9; user-select: none; transition: background .15s, color .15s;
    }
    .wr-btn:hover { background: #2a3942; color: #e9edef; opacity: 1; }
    #wamini-arrow { font-size: 22px; line-height: 1; font-weight: 700; }
    #wamini-pin { position: absolute; top: 12px; font-size: 17px; }
    #wamini-pin.on { color: #00a884; opacity: 1; }
  `;
  document.documentElement.appendChild(style);

  /* ------------------------- Barra laterale ---------------------- */
  const rail = document.createElement('div');
  rail.id = 'wamini-rail';

  const pinBtn = document.createElement('div');
  pinBtn.className = 'wr-btn';
  pinBtn.id = 'wamini-pin';
  pinBtn.textContent = '📌';
  pinBtn.title = 'Pin over other apps';
  pinBtn.addEventListener('click', () => ipcRenderer.send('wamini:toggle-top'));

  const arrowBtn = document.createElement('div');
  arrowBtn.className = 'wr-btn';
  arrowBtn.id = 'wamini-arrow';
  arrowBtn.textContent = '›';
  arrowBtn.title = 'Open / close chat list  (Alt+W)';
  arrowBtn.addEventListener('click', toggleList);

  rail.append(pinBtn, arrowBtn);
  document.body.appendChild(rail);

  /* ------------------------ Stato "sempre sopra" ------------------ */
  ipcRenderer.on('wamini:top-state', (_e, state) => {
    onTop = state;
    pinBtn.classList.toggle('on', onTop);
    pinBtn.title = onTop ? 'Pinned over other apps — click to unpin' : 'Not pinned — click to pin over other apps';
  });
  ipcRenderer.send('wamini:get-top');

  /* ---------------------- Marcatura "catena" --------------------- */
  function clearMarks() {
    document.querySelectorAll('.wamini-keep').forEach((el) => el.classList.remove('wamini-keep'));
  }
  function markChain() {
    clearMarks();
    let el = document.querySelector('#main');
    while (el && el !== document.body) { el.classList.add('wamini-keep'); el = el.parentElement; }
  }

  /* --------------------------- Logica ---------------------------- */
  function apply() {
    const hasChat = !!document.querySelector('#main');
    document.body.classList.toggle('wamini-haschat', hasChat);
    const focusNow = focusEnabled && !peeking && hasChat;
    document.body.classList.toggle('wamini-focus', focusNow);
    if (focusNow) markChain(); else clearMarks();

    const showingList = !focusEnabled || peeking || !hasChat;
    // freccia: › = apri lista (ora vedi solo la chat) · ‹ = chiudi lista
    arrowBtn.textContent = showingList ? '‹' : '›';
  }

  function toggleList() {
    if (focusEnabled && !peeking) {
      peeking = true;              // sto mostrando solo la chat → sbircia la lista
    } else {
      peeking = false;            // torna a "solo chat"
      focusEnabled = true;
    }
    localStorage.setItem(STORAGE_KEY, String(focusEnabled));
    apply();
  }

  // Alt+W = mostra/nascondi lista
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'w' || e.key === 'W')) { e.preventDefault(); toggleList(); }
  });

  // Se sbirci la lista e clicchi una chat, richiude da solo
  document.addEventListener('click', (e) => {
    if (!peeking) return;
    if (!e.target.closest('#pane-side')) return;
    if (e.target.closest('[contenteditable], input')) return; // ignora la ricerca
    setTimeout(() => { if (document.querySelector('#main')) { peeking = false; apply(); } }, 350);
  }, true);

  // WhatsApp ricostruisce il DOM in continuazione → riapplica con un piccolo throttle
  let t = null;
  new MutationObserver(() => {
    if (t) return;
    t = setTimeout(() => { t = null; apply(); }, 150);
  }).observe(document.documentElement, { childList: true, subtree: true });

  apply();
});
