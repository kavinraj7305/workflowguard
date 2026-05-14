/* global chrome */

const ALARM_HEARTBEAT = "wfg-heartbeat";

function normalizeBaseUrl(url) {
  return String(url || "").replace(/\/+$/, "");
}

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

async function getState() {
  return chrome.storage.local.get([
    "baseUrl",
    "token",
    "ticketId",
    "tracking",
    "breakMode",
    "lastPath",
  ]);
}

async function postActivity(body) {
  const s = await getState();
  const baseUrl = normalizeBaseUrl(s.baseUrl);
  const token = s.token;
  const ticketId = s.ticketId || decodeJwtPayload(token)?.ticketId;
  if (!baseUrl || !token || !ticketId) return;

  const url = `${baseUrl}/api/tickets/${ticketId}/activity`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.warn("WorkFlowGuard activity failed", res.status, t);
    }
  } catch (e) {
    console.warn("WorkFlowGuard fetch", e);
  }
}

async function sendTabActivity(body) {
  const s = await getState();
  if (!s.tracking || s.breakMode) return;
  await postActivity(body);
}

function refreshHeartbeatAlarm(enabled) {
  chrome.alarms.clear(ALARM_HEARTBEAT, () => {
    if (enabled) {
      chrome.alarms.create(ALARM_HEARTBEAT, { periodInMinutes: 1 });
    }
  });
}

chrome.runtime.onInstalled.addListener((detail) => {
  if (detail.reason !== "install") return;
  chrome.storage.local.set({
    baseUrl: "http://localhost:3000",
    tracking: false,
    breakMode: false,
    token: "",
    ticketId: "",
    lastPath: "",
  });
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg?.type !== "WFG_SYNC") return false;

  const nextTracking = !!msg.tracking;
  const nextBreak = !!msg.breakMode;

  chrome.storage.local.get(
    ["tracking", "breakMode", "baseUrl", "token", "ticketId"],
    async (old) => {
      const wasTracking = !!old.tracking;
      const wasBreak = !!old.breakMode;

      if (wasTracking && nextBreak && !wasBreak) {
        await postActivity({
          eventType: "idle_start",
          pathOrUrl: "extension",
          metadata: { source: "browser_extension", reason: "user_break" },
        });
      }
      if (wasTracking && !nextBreak && wasBreak) {
        await postActivity({
          eventType: "idle_end",
          pathOrUrl: "extension",
          metadata: { source: "browser_extension", reason: "user_break_end" },
        });
      }

      if (wasTracking && !nextTracking) {
        await postActivity({
          eventType: "session_end",
          pathOrUrl: "extension",
          metadata: { source: "browser_extension" },
        });
        await chrome.storage.local.set({ lastPath: "" });
      }

      await chrome.storage.local.set({
        tracking: nextTracking,
        breakMode: nextBreak,
      });

      refreshHeartbeatAlarm(nextTracking && !nextBreak);

      if (nextTracking && !nextBreak && !wasTracking) {
        await chrome.storage.local.set({ lastPath: "" });
      }

      if (nextTracking && !nextBreak) {
        await postActivity({
          eventType: "session_start",
          pathOrUrl: "extension",
          metadata: { source: "browser_extension" },
        });
      }

      sendResponse({ ok: true });
    }
  );
  return true;
});

async function maybeReportTab(tabId) {
  const s = await getState();
  if (!s.tracking || s.breakMode) return;
  if (!tabId) return;

  let tab;
  try {
    tab = await chrome.tabs.get(tabId);
  } catch {
    return;
  }
  const u = tab.url || "";
  if (!u.startsWith("http://") && !u.startsWith("https://")) return;

  if (u === s.lastPath) return;
  await chrome.storage.local.set({ lastPath: u });
  await sendTabActivity({
    eventType: "page_view",
    pathOrUrl: u,
    metadata: { source: "browser_extension", tabId },
  });
}

chrome.tabs.onActivated.addListener((activeInfo) => {
  void maybeReportTab(activeInfo.tabId);
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === "complete" || changeInfo.url) {
    void maybeReportTab(tabId);
  }
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name !== ALARM_HEARTBEAT) return;
  void (async () => {
    const s = await getState();
    if (!s.tracking || s.breakMode) return;
    await sendTabActivity({
      eventType: "heartbeat",
      pathOrUrl: "extension",
      metadata: { source: "browser_extension" },
    });
  })();
});
