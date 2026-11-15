// ==UserScript==
// @name         WhatsApp Mini — popup chat (hide chat list)
// @namespace    https://github.com/SipCya/WhatsappPopUp
// @version      1.3.0
// @description  Hides the chat list on WhatsApp Web and shows only the open conversation, to take less space. A slim left sidebar opens/closes the list when you need to switch chat.
// @author       dado
// @match        https://web.whatsapp.com/*
// @icon         https://web.whatsapp.com/favicon.ico
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  const STORAGE_KEY = 'wamini-focus-enabled';
  let focusEnabled = localStorage.getItem(STORAGE_KEY) !== 'false'; // default: "chat only"
  let peeking = false; // temporarily showing the list while you pick a chat

  /* ----------------------------------------------------------------
   *  CSS
   * ---------------------------------------------------------------- */
  const style = document.createElement('style');
  style.id = 'wamini-style';
  style.textContent = `
    /* --- FOCUS MODE ("chain" method) ---
       Every ancestor of #main gets .wamini-keep; at each level we hide the
       UNMARKED siblings. This removes the nav rail + chat list at any nesting
       depth, without relying on WhatsApp's (obfuscated) class names. */
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

    /* --- LEFT SIDEBAR: only visible in "chat only" mode (not on the list) --- */
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
  `;
  document.documentElement.appendChild(style);

  /* ----------------------------------------------------------------
   *  Sidebar
   * ---------------------------------------------------------------- */
  let rail, arrowBtn;
  function makeRail() {
    rail = document.createElement('div');
    rail.id = 'wamini-rail';

    arrowBtn = document.createElement('div');
    arrowBtn.className = 'wr-btn';
    arrowBtn.id = 'wamini-arrow';
    arrowBtn.textContent = '›';
    arrowBtn.title = 'Open / close chat list  (Alt+W)';
    arrowBtn.addEventListener('click', toggle);

    rail.appendChild(arrowBtn);
    document.body.appendChild(rail);
  }

  /* ----------------------------------------------------------------
   *  Chain marking
   * ---------------------------------------------------------------- */
  function clearMarks() {
    document.querySelectorAll('.wamini-keep').forEach((el) => el.classList.remove('wamini-keep'));
  }
  function markChain() {
    clearMarks();
    let el = document.querySelector('#main');
    while (el && el !== document.body) { el.classList.add('wamini-keep'); el = el.parentElement; }
  }

  /* ----------------------------------------------------------------
   *  Apply state
   * ---------------------------------------------------------------- */
  function apply() {
    const hasChat = !!document.querySelector('#main');
    document.body.classList.toggle('wamini-haschat', hasChat);

    // "Chat only" is active when: enabled, not peeking, and a chat is open.
    // With no chat open we show the list so you can pick one.
    const focusNow = focusEnabled && !peeking && hasChat;
    document.body.classList.toggle('wamini-focus', focusNow);
    if (focusNow) markChain(); else clearMarks();

    if (arrowBtn) {
      const showingList = !focusEnabled || peeking || !hasChat;
      arrowBtn.textContent = showingList ? '‹' : '›';
    }
  }

  /* ----------------------------------------------------------------
   *  Toggle logic
   * ---------------------------------------------------------------- */
  function toggle() {
    if (focusEnabled && !peeking) {
      peeking = true;        // showing only the chat → peek the list
    } else {
      peeking = false;       // back to "chat only"
      focusEnabled = true;
    }
    localStorage.setItem(STORAGE_KEY, String(focusEnabled));
    apply();
  }

  // Keyboard shortcut: Alt+W
  document.addEventListener('keydown', (e) => {
    if (e.altKey && (e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
      toggle();
    }
  });

  // While peeking, clicking a chat in the list auto-collapses back to "chat only"
  document.addEventListener('click', (e) => {
    if (!peeking) return;
    if (!e.target.closest('#pane-side')) return;
    if (e.target.closest('[contenteditable], input')) return; // ignore the search box
    setTimeout(() => {
      if (document.querySelector('#main')) { peeking = false; apply(); }
    }, 350);
  }, true);

  /* ----------------------------------------------------------------
   *  Boot + observer (WhatsApp rebuilds the DOM continuously)
   * ---------------------------------------------------------------- */
  function boot() {
    if (!document.body) { return setTimeout(boot, 200); }
    if (!rail) makeRail();
    apply();
  }
  boot();

  const obs = new MutationObserver(() => {
    if (obs._t) return;
    obs._t = setTimeout(() => { obs._t = null; apply(); }, 150);
  });
  obs.observe(document.documentElement, { childList: true, subtree: true });
})();
