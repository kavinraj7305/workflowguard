"use client";

import { useEffect, useMemo, useState } from "react";

type Props = {
  ticketId: string;
};

const DEFAULT_FOCUS_SECONDS = 25 * 60;
const DEFAULT_BREAK_SECONDS = 5 * 60;

export function PomodoroTimer({ ticketId }: Props) {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_SECONDS);

  const label = useMemo(
    () => (mode === "focus" ? "Promofocus" : "Short break"),
    [mode]
  );

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          const nextMode = mode === "focus" ? "break" : "focus";
          setMode(nextMode);
          return nextMode === "focus" ? DEFAULT_FOCUS_SECONDS : DEFAULT_BREAK_SECONDS;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [mode, running]);

  async function notify(eventType: string) {
    try {
      await fetch(`/api/tickets/${ticketId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventType, metadata: { mode, secondsLeft } }),
      });
    } catch {
      // ignore
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{label}</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">
            {String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:{String(secondsLeft % 60).padStart(2, "0")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              setRunning((value) => !value);
              void notify(running ? "focus_pause" : "focus_start");
            }}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-400"
          >
            {running ? "Pause" : "Start"}
          </button>
          <button
            type="button"
            onClick={() => {
              setRunning(false);
              setMode("focus");
              setSecondsLeft(DEFAULT_FOCUS_SECONDS);
              void notify("focus_stop");
            }}
            className="rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}