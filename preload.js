// preload.js — runs in an "isolated world" with access to both the page DOM
// and the Electron APIs. Here we inject the CSS and the control buttons.

const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const STORAGE_KEY = 'wamini-focus-enabled';
  let focusEnabled = localStorage.getItem(STORAGE_KEY) !== 'false'; // enabled by default
  let peeking = false;      // temporarily showing the list while waiting to open a chat
  let onTop = true;         // always-on-top state (mirrors the main process)

  /* ----------------------------- CSS ----------------------------- */
  const style = document.createElement('style');
  style.textContent = `
    /* FOCUS — "chain" method: every ancestor of #main gets .wamini-keep, then at
       each level we hide the UNMARKED siblings. This removes the left column at
       any depth where #main happens to be nested. */
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
      padding-left: 44px !important; /* room for the sidebar, no overlap */
    }

    /* Left sidebar: visible ONLY in "chat only" mode (not on the list) */
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

  /* ------------------------- Sidebar ----------------------------- */
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

  /* ----------------------- Always-on-top state ------------------- */
  ipcRenderer.on('wamini:top-state', (_e, state) => {
    onTop = state;
    pinBtn.classList.toggle('on', onTop);
    pinBtn.title = onTop ? 'Pinned over other apps — click to unpin' : 'Not pinned — click to pin over other apps';
  });
  ipcRenderer.send('wamini:get-top');

  /* ------------------------- "Chain" marking --------------------- */
  function clearMarks() {
    document.querySelectorAll('.wamini-keep').forEach((el) => el.classList.remove('wamini-keep'));
  }
  function markChain() {
    clearMarks();
    let el = document.querySelector('#main');
    while (el && el !== document.body) { el.classList.add('wamini-keep'); el = el.parentElement; }
  }

  /* ----------------------------- Logic --------------------------- */
  function apply() {
    const hasChat = !!document.querySelector('#main');
    document.body.classList.toggle('wamini-haschat', hasChat);
    const focusNow = focusEnabled && !peeking && hasChat;
    document.body.classList.toggle('wamini-focus', focusNow);
    if (focusNow) markChain(); else clearMarks();

    const showingList = !focusEnabled || peeking || !hasChat;
    // arrow: › = open list (currently chat only) · ‹ = close list
    arrowBtn.textContent = showingList ? '‹' : '›';
  }

  function toggleList() {
    if (focusEnabled && !peeking) {
      peeking = true;              // showing only the chat → peek the list
    } else {
      peeking = false;            // back to "chat only"
      focusEnabled = true;
    }
    localStorage.setItem(STORAGE_KEY, String(focusEnabled));
    apply();
  }

  // Alt+W = show/hide the list
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'w' || e.key === 'W')) { e.preventDefault(); toggleList(); }
  });

  // While peeking, clicking a chat auto-collapses back to "chat only"
  document.addEventListener('click', (e) => {
    if (!peeking) return;
    if (!e.target.closest('#pane-side')) return;
    if (e.target.closest('[contenteditable], input')) return; // ignore the search box
    setTimeout(() => { if (document.querySelector('#main')) { peeking = false; apply(); } }, 350);
  }, true);

  // WhatsApp constantly rebuilds the DOM → reapply with a small throttle
  let t = null;
  new MutationObserver(() => {
    if (t) return;
    t = setTimeout(() => { t = null; apply(); }, 150);
  }).observe(document.documentElement, { childList: true, subtree: true });

  apply();
});
