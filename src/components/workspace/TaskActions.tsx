"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { ticketId: string };

export function TaskActions({ ticketId }: Props) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function sendToTesting() {
    setLoading(true);
    setMessage(null);
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
      router.push("/employee");
      router.refresh();
    } catch {
      setMessage("Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-10 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Attach the handoff screenshot, then move the ticket into testing for QA.
      </p>
      <input
        type="file"
        accept="image/*"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="mt-3 block w-full text-sm text-zinc-700 file:mr-4 file:rounded-lg file:border-0 file:bg-zinc-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:text-zinc-300 dark:file:bg-zinc-100 dark:file:text-zinc-900"
      />
      <button
        type="button"
        onClick={() => void sendToTesting()}
        disabled={loading}
        className="mt-3 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Upload screenshot and send to testing"}
      </button>
      {message ? (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      ) : null}
    </div>
  );
}
