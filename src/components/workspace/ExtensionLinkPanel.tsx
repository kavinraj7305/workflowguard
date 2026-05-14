"use client";

import { useCallback, useState } from "react";

type Props = { ticketId: string };

export function ExtensionLinkPanel({ ticketId }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const issue = useCallback(async () => {
    setLoading(true);
    setError(null);
    setToken(null);
    try {
      const res = await fetch("/api/auth/extension-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId }),
      });
      const data = (await res.json()) as { token?: string; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not create extension token");
        return;
      }
      if (data.token) setToken(data.token);
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  const copy = useCallback(async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy to clipboard");
    }
  }, [token]);

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-500/15">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.7}
            stroke="currentColor"
            className="h-4 w-4 text-sky-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
            />
          </svg>
        </div>
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-white">Browser extension</h3>
            <p className="mt-1 text-xs text-zinc-400 leading-relaxed">
              Generate a token and paste it into the WorkFlowGuard Tracker extension
              (folder <code className="text-zinc-300">browser-extension</code> in this
              repo). While tracking is on, tab URLs are sent as activity for this ticket
              only. Use <strong className="text-zinc-200">Break</strong> in the extension
              when you are off the clock. Token expires in 8 hours.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void issue()}
              disabled={loading}
              className="rounded-lg bg-sky-600 px-3 py-2 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Generate extension token"}
            </button>
            {token ? (
              <button
                type="button"
                onClick={() => void copy()}
                className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-200 hover:bg-white/10"
              >
                {copied ? "Copied" : "Copy token"}
              </button>
            ) : null}
          </div>
          {origin ? (
            <p className="text-[11px] text-zinc-500">
              API base URL for the extension:{" "}
              <span className="font-mono text-zinc-400">{origin}</span>
            </p>
          ) : null}
          {token ? (
            <textarea
              readOnly
              rows={3}
              className="w-full resize-none rounded-lg border border-white/10 bg-black/40 p-2 font-mono text-[11px] text-zinc-300"
              value={token}
            />
          ) : null}
          {error ? (
            <p className="text-xs text-rose-400">{error}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
