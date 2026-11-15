# How to install the browser extension (Tampermonkey)

This folder contains **`whatsapp-mini.user.js`** — a *userscript* that hides the chat list
directly inside **WhatsApp Web in your browser**. No separate app, no Node.js.

> **How it fits together**
> **Tampermonkey** is the browser extension (it runs small scripts on web pages).
> **`whatsapp-mini.user.js`** is the script you add *into* Tampermonkey.
> Install Tampermonkey once, add this script, and WhatsApp Web gets the mini sidebar.

---

## Step 1 — Install Tampermonkey

Install the Tampermonkey extension for your browser:

- **Chrome / Edge / Brave / Opera GX** → [Chrome Web Store](https://chromewebstore.google.com/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
- **Firefox** → [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/tampermonkey/)

### Opera GX note
Opera GX can install Chrome extensions, but it may ask you to **enable** them:
if a bar appears at the top saying *"Install Chrome extensions"* / *"Enable"*, click it.

### Chrome / Opera (recent versions) note
Newer Chromium browsers require a toggle to let extensions run userscripts:
go to the extensions page, open **Tampermonkey → Details**, and turn on
**"Allow User Scripts"** (sometimes shown as *Developer mode*). Do this once.

---

## Step 2 — Add this script

1. Click the **Tampermonkey icon** in the toolbar → **Create a new script…**
   (or open the **Dashboard** → the **`+`** tab).
2. **Select all** the template code in the editor and **delete** it.
3. Open **`whatsapp-mini.user.js`** (in this folder), copy **all** of its contents,
   and **paste** it into the editor.
4. Save with **File → Save** (or `Ctrl+S`).
5. Back in the Dashboard, make sure the script is **Enabled** (the toggle is on/green).

---

## Step 3 — Use it

1. Open **<https://web.whatsapp.com>** and sign in (scan the QR with your phone).
2. Open any chat → the **chat list collapses** and a slim **left sidebar** appears.
3. **Open / close the list:** click the sidebar arrow `›` / `‹`, or press **Alt+W**.
   Picking a chat from the list collapses it back automatically.

---

## Updating the script later

Tampermonkey won't auto-update a script pasted by hand. To update:

1. Tampermonkey **Dashboard** → click **WhatsApp Mini** to edit it.
2. **Select all**, delete, and **paste** the new version of `whatsapp-mini.user.js`.
3. **Save** (`Ctrl+S`).

---

## Troubleshooting — "nothing happens"

- Check the **Tampermonkey icon** shows a small number (`1`) on `web.whatsapp.com` —
  that means a script is running on the page. If not, the script is disabled or not matching.
- Make sure the script is **Enabled** in the Dashboard.
- On recent Chrome/Opera, confirm **"Allow User Scripts"** is ON (see Step 1).
- Reload the WhatsApp Web tab after enabling.
- Still nothing? WhatsApp may have changed its page structure — please open an issue on the repo.

> This runs on **WhatsApp Web** only. It can't modify the standalone *WhatsApp Desktop*
> app from the Microsoft Store (that one is sandboxed) — for a desktop experience, use the
> **Desktop app** version in the main project instead.
