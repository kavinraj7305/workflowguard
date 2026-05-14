# WorkFlowGuard Tracker (Chrome extension)

Sends **active tab URLs** and **heartbeats** to your WorkFlowGuard server for the **ticket** tied to the extension token, so managers can correlate browser time with ticket activity.

## Install (developer / unpacked)

1. Open Chrome → **Extensions** → enable **Developer mode**.
2. **Load unpacked** → select this folder: `workflowguard/browser-extension`.
3. In WorkFlowGuard, open your assigned ticket **workspace** (e.g. `/workspace/<ticketId>/dashboard`).
4. Click **Generate extension token**, then **Copy token**.
5. Open the extension popup → paste **API base URL** (e.g. `http://localhost:3000`) and **token** → **Save**.
6. Click **Start tracking**. Use **Start break** when you are not working (nothing is sent until **End break**).

## Permissions

The manifest includes `https://*/*` and localhost so `fetch` to your app works from the service worker. For a private deploy, you can narrow `host_permissions` in `manifest.json` to your domain only.

## Security

- The token expires in **8 hours**. Generate a new one from the workspace when it expires.
- Anyone with the token can post activity for that ticket as you — treat it like a password.

## Production base URL

Use your deployed origin (e.g. `https://app.example.com`) in the popup. If Chrome blocks the request, add that host to `host_permissions` in `manifest.json` and reload the extension.
