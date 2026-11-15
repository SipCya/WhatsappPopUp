<div align="center">

<img src="build/icon.png" width="88" alt="WhatsApp Mini icon">

# WhatsApp Mini

A compact view for WhatsApp Web: hide the chat list and keep a single conversation visible while taking far less screen space.

<img src="docs/screenshot.png" width="300" alt="WhatsApp Mini screenshot">

</div>

---

## Overview

WhatsApp Web always shows the full chat list next to your conversation, which takes up a lot of
screen space. WhatsApp Mini collapses everything except the open chat, similar to the single-chat
view on a phone, so you can keep one conversation in view while using the rest of your screen for
something else.

It ships in two independent forms:

- A **desktop application** (Electron) that opens WhatsApp Web in its own small, always-on-top
  window.
- A **browser extension** (a userscript for Tampermonkey) that hides the chat list directly inside
  WhatsApp Web in your existing browser.

Both share the same left sidebar: a slim bar with an arrow (or the `Alt+W` shortcut) that opens and
closes the chat list when you need to switch conversation.

## Which one should I use?

| | Desktop application | Browser extension |
|---|---|---|
| What it is | A standalone program with its own window (Electron) | A userscript that runs inside your browser through Tampermonkey |
| Where WhatsApp opens | In a dedicated mini window | In a normal `web.whatsapp.com` tab |
| Always-on-top (pin) | Yes | No |
| Separate floating window | Yes | No |
| Requires Node.js | Yes (or the prebuilt executable) | No |
| Setup effort | Medium | Low |

In short: choose the desktop application for a small WhatsApp window that floats above your other
apps; choose the browser extension to simply declutter WhatsApp Web inside the browser you already
use.

---

## Desktop application (Electron)

Requires [Node.js](https://nodejs.org).

```bash
git clone https://github.com/SipCya/WhatsappPopUp.git
cd WhatsappPopUp
npm install
npm start
```

On first launch, scan the QR code with your phone (WhatsApp, then Linked devices). The login is
remembered for subsequent launches.

### Controls

| Action | How |
|---|---|
| Open or close the chat list | Sidebar arrow, or `Alt+W` |
| Switch chat | Open the list, pick a chat; it collapses back automatically |
| Pin or unpin over other apps | Pin button on the sidebar |
| Show or hide the window from anywhere | `Ctrl+Alt+W` (global shortcut) |
| Resize | Drag the window edges (minimum 320x440) |

### Building a standalone executable (optional)

```bash
npm install --save-dev electron-builder
npm run dist
```

The portable executable is written to `dist/`. The application icon is `build/icon.ico`.

Desktop files: `main.js` (window and always-on-top), `preload.js` (hides the list and draws the
sidebar), `package.json`, `build/` (icon), and `tools/build-assets.js` (regenerates the icon).

---

## Browser extension (Tampermonkey)

Runs inside Chrome, Edge, Opera GX, or Firefox. No Node.js and no separate application.

Full step-by-step instructions are in
[`tampermonkey script/EXTENSION_GUIDE.md`](tampermonkey%20script/EXTENSION_GUIDE.md).

Summary:

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension.
2. Open [`tampermonkey script/whatsapp-mini.user.js`](tampermonkey%20script/whatsapp-mini.user.js),
   copy its contents into a new Tampermonkey script, and save.
3. Open <https://web.whatsapp.com> and pick a chat; the list collapses and the sidebar appears.

The extension has the same list-hiding behaviour and sidebar, but no always-on-top or pin, which
are desktop-application features.

---

## How it works

The conversation pane (`#main`) is often deeply nested in WhatsApp's layout, so instead of targeting
fragile CSS class names, the script walks the chain of ancestors from `#main` up to `<body>`, marks
them, and hides every unmarked sibling at each level. This removes the navigation rail and the chat
list at any nesting depth, and keeps working even when WhatsApp changes its obfuscated class names.

## Compatibility

WhatsApp Web updates its page structure from time to time, so a future change could temporarily
break the hiding logic. The ancestor-chain method is designed to be resilient, but if something
stops working, please open an issue.

This works on WhatsApp Web only (in the browser, or wrapped by the Electron application, which is
itself a minimal browser). The official WhatsApp Desktop application from the Microsoft Store is
sandboxed and cannot be modified this way.

## Disclaimer

This is an unofficial project, not affiliated with, endorsed by, or sponsored by WhatsApp or Meta
Platforms, Inc. WhatsApp is a trademark of Meta Platforms, Inc. Use at your own risk.

## License

[MIT](LICENSE)
