"use client";

import { useEffect, useMemo, useState } from "react";

type Props = { ticketId: string };

const DEFAULT_FOCUS_SECONDS = 25 * 60;
const DEFAULT_BREAK_SECONDS = 5 * 60;
const RING_RADIUS = 52;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // ≈ 326.7

export function PomodoroTimer({ ticketId }: Props) {
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [running, setRunning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(DEFAULT_FOCUS_SECONDS);

  const totalSeconds =
    mode === "focus" ? DEFAULT_FOCUS_SECONDS : DEFAULT_BREAK_SECONDS;

  const dashOffset = useMemo(
    () => RING_CIRCUMFERENCE * (1 - secondsLeft / totalSeconds),
    [secondsLeft, totalSeconds]
  );

  const label = mode === "focus" ? "Focus" : "Break";
  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const secs = String(secondsLeft % 60).padStart(2, "0");

  const isFocus = mode === "focus";
  const ringColor = isFocus ? "#6366f1" : "#10b981";
  const ringGlow = isFocus
    ? "drop-shadow(0 0 8px rgba(99,102,241,0.6))"
    : "drop-shadow(0 0 8px rgba(16,185,129,0.6))";

  const progressPercent = Math.round((secondsLeft / totalSeconds) * 100);

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

  function handleToggle() {
    setRunning((v) => !v);
    void notify(running ? "focus_pause" : "focus_start");
  }

  function handleReset() {
    setRunning(false);
    setMode("focus");
    setSecondsLeft(DEFAULT_FOCUS_SECONDS);
    void notify("focus_stop");
  }

  return (
    <div className={`rounded-2xl border ${isFocus ? "border-indigo-500/20 bg-indigo-500/5" : "border-emerald-500/20 bg-emerald-500/5"} p-4 transition-colors duration-700`}>
      <div className="flex items-center gap-6">
        {/* SVG Ring */}
        <div className="relative shrink-0">
          <svg
            width="128"
            height="128"
            viewBox="0 0 128 128"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Track */}
            <circle
              cx="64"
              cy="64"
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="8"
            />
            {/* Progress */}
            <circle
              cx="64"
              cy="64"
              r={RING_RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={dashOffset}
              style={{
                transition: "stroke-dashoffset 1s linear, stroke 0.5s ease",
                filter: running ? ringGlow : "none",
              }}
            />
          </svg>
          {/* Center text overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p
              className={`text-2xl font-bold tabular-nums leading-none ${isFocus ? "text-indigo-300" : "text-emerald-300"}`}
            >
              {minutes}:{secs}
            </p>
            <p className="mt-0.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {label}
            </p>
          </div>
        </div>

        {/* Controls + info */}
        <div className="flex flex-1 flex-col gap-3">
          <div>
            <p
              className={`text-sm font-semibold ${isFocus ? "text-indigo-300" : "text-emerald-300"}`}
            >
              {running
                ? isFocus
                  ? "Stay focused…"
                  : "Take a breather."
                : isFocus
                  ? "Ready to focus?"
                  : "Break time!"}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {progressPercent}% remaining · {isFocus ? "25 min sprint" : "5 min break"}
            </p>
          </div>

          {/* Progress bar */}
          <div className="h-1 w-full rounded-full bg-white/8">
            <div
              className={`h-1 rounded-full transition-all duration-1000 ${isFocus ? "bg-indigo-500" : "bg-emerald-500"}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleToggle}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 ${
                isFocus
                  ? "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-500/25"
                  : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/25"
              }`}
            >
              {running ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M6.75 5.25a.75.75 0 01.75-.75H9a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H7.5a.75.75 0 01-.75-.75V5.25zm7.5 0A.75.75 0 0115 4.5h1.5a.75.75 0 01.75.75v13.5a.75.75 0 01-.75.75H15a.75.75 0 01-.75-.75V5.25z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Pause
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Start
                </>
              )}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-zinc-300 transition-all hover:border-white/20 hover:text-white"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Mode toggle (small) */}
        <div className="hidden shrink-0 flex-col gap-1 sm:flex">
          {(["focus", "break"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setRunning(false);
                setSecondsLeft(
                  m === "focus" ? DEFAULT_FOCUS_SECONDS : DEFAULT_BREAK_SECONDS
                );
              }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${
                mode === m
                  ? m === "focus"
                    ? "bg-indigo-500/20 text-indigo-300"
                    : "bg-emerald-500/20 text-emerald-300"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
