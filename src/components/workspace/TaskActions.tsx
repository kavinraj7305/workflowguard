"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { ticketId: string };

export function TaskActions({ ticketId }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function sendToTesting() {
    setLoading(true);
    setMessage(null);
    setSuccess(false);
    try {
      if (file) {
        const form = new FormData();
        form.append("screenshot", file);
        const uploadRes = await fetch(`/api/tickets/${ticketId}/screenshot`, {
          method: "POST",
          body: form,
        });
        if (!uploadRes.ok) {
          const uploadData = (await uploadRes.json()) as { error?: string };
          setMessage(uploadData.error ?? "Screenshot upload failed");
          return;
        }
      }

      const statusRes = await fetch(`/api/tickets/${ticketId}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "testing" }),
      });
      if (!statusRes.ok) {
        const statusData = (await statusRes.json()) as { error?: string };
        setMessage(statusData.error ?? "Could not move ticket to testing");
        return;
      }

      setMessage("Screenshot saved. Ticket moved to testing.");
      setSuccess(true);
      router.push("/employee");
      router.refresh();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
      <div className="flex items-center gap-2 mb-1">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.8}
            stroke="currentColor"
            className="h-4 w-4 text-emerald-400"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
            />
          </svg>
        </div>
        <h3 className="text-base font-semibold text-white">Handoff to QA</h3>
      </div>
      <p className="mb-5 text-sm text-zinc-400">
        Attach a screenshot proving your work is done, then send the ticket to
        QA for verification.
      </p>

      {/* File upload zone */}
      <label className="block cursor-pointer">
        <div
          className={`rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors ${
            file
              ? "border-emerald-500/40 bg-emerald-500/8"
              : "border-white/10 hover:border-white/20 hover:bg-white/3"
          }`}
        >
          {file ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-5 w-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm font-medium">{file.name}</span>
            </div>
          ) : (
            <div className="text-zinc-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.4}
                stroke="currentColor"
                className="mx-auto mb-2 h-8 w-8 text-zinc-600"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="text-sm font-medium text-zinc-400">
                Click to upload screenshot
              </p>
              <p className="mt-1 text-xs text-zinc-600">PNG, JPG, GIF accepted</p>
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="sr-only"
        />
      </label>

      <button
        type="button"
        onClick={() => void sendToTesting()}
        disabled={loading}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
      >
        {loading ? (
          <>
            <svg
              className="h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Sending to testing…
          </>
        ) : (
          <>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-4 w-4"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
            Send to testing
          </>
        )}
      </button>

      {message && (
        <p
          className={`mt-3 rounded-xl border px-3 py-2 text-sm ${
            success
              ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-300"
              : "border-rose-500/25 bg-rose-500/10 text-rose-300"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
