/* global chrome */

function decodeJwtPayload(token) {
  try {
    const parts = String(token).split(".");
    if (parts.length < 2) return null;
    const json = atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function el(id) {
  return document.getElementById(id);
}

async function load() {
  const s = await chrome.storage.local.get([
    "baseUrl",
    "token",
    "ticketId",
    "tracking",
    "breakMode",
  ]);
  el("baseUrl").value = s.baseUrl || "http://localhost:3000";
  el("token").value = s.token || "";
  el("ticketId").value = s.ticketId || "";
  updateButtons(!!s.tracking, !!s.breakMode);
}

function updateButtons(tracking, breakMode) {
  el("toggleTracking").textContent = tracking ? "Stop tracking" : "Start tracking";
  el("toggleBreak").textContent = breakMode ? "End break" : "Start break";
}

function setStatus(text) {
  el("status").textContent = text;
}

el("save").addEventListener("click", async () => {
  const baseUrl = el("baseUrl").value.trim().replace(/\/+$/, "");
  const token = el("token").value.trim();
  let ticketId = el("ticketId").value.trim();
  if (!ticketId && token) {
    const p = decodeJwtPayload(token);
    if (p?.ticketId) ticketId = p.ticketId;
  }
  await chrome.storage.local.set({ baseUrl, token, ticketId });
  setStatus("Saved.");
});

el("toggleTracking").addEventListener("click", async () => {
  const s = await chrome.storage.local.get(["tracking"]);
  const next = !s.tracking;
  await chrome.storage.local.set({ tracking: next });
  updateButtons(next, (await chrome.storage.local.get(["breakMode"])).breakMode);
  chrome.runtime.sendMessage({ type: "WFG_SYNC", tracking: next, breakMode: false }, () => {});
  setStatus(next ? "Tracking on — active tab URLs are sent to WorkFlowGuard." : "Tracking off.");
});

el("toggleBreak").addEventListener("click", async () => {
  const s = await chrome.storage.local.get(["breakMode", "tracking"]);
  const next = !s.breakMode;
  await chrome.storage.local.set({ breakMode: next });
  updateButtons(!!s.tracking, next);
  chrome.runtime.sendMessage(
    { type: "WFG_SYNC", tracking: !!s.tracking, breakMode: next },
    () => {}
  );
  setStatus(
    next
      ? "Break on — URLs are not reported until you end break."
      : "Break off — tracking resumes if enabled."
  );
});

void load();
