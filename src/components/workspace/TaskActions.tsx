"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = { assignmentId: string };

export function TaskActions({ assignmentId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function complete() {
    setLoading(true);
    setMessage(null);
    try {
      await fetch(`/api/assignments/${assignmentId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType: "task_complete",
          pathOrUrl: typeof window !== "undefined" ? window.location.pathname : "",
        }),
      });
      await fetch(`/api/assignments/${assignmentId}/snapshot`, {
        method: "POST",
      });
      setMessage("Task marked complete. Productivity snapshot saved.");
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
        When you are done, mark completion so the system records engagement and
        outcome—not just time on page.
      </p>
      <button
        type="button"
        onClick={() => void complete()}
        disabled={loading}
        className="mt-3 inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-emerald-500 disabled:opacity-60"
      >
        {loading ? "Saving…" : "Mark task complete"}
      </button>
      {message ? (
        <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">
          {message}
        </p>
      ) : null}
    </div>
  );
}
