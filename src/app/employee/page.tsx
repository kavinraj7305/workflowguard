"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Ticket = {
  id: string;
  status: string;
  title: string;
  description: string;
  type: string;
  priority: string;
  allowedApps: string[];
};

type MyProductivity = {
  ticketPipeline: {
    open: number;
    in_progress: number;
    testing: number;
    closed: number;
    total: number;
  };
  activityLast30Days: {
    productivityScore: number;
    performanceLabel: string;
  };
  lastActivityAt: string | null;
  focusMinutes: number;
  completedFocusSessions: number;
};

const priorityConfig: Record<
  string,
  { label: string; dot: string; text: string; bg: string }
> = {
  urgent: {
    label: "Urgent",
    dot: "bg-red-400",
    text: "text-red-300",
    bg: "bg-red-500/10 border-red-500/25",
  },
  high: {
    label: "High",
    dot: "bg-orange-400",
    text: "text-orange-300",
    bg: "bg-orange-500/10 border-orange-500/25",
  },
  medium: {
    label: "Medium",
    dot: "bg-yellow-400",
    text: "text-yellow-300",
    bg: "bg-yellow-500/10 border-yellow-500/25",
  },
  low: {
    label: "Low",
    dot: "bg-green-400",
    text: "text-green-300",
    bg: "bg-green-500/10 border-green-500/25",
  },
};

const statusConfig: Record<
  string,
  { label: string; dot: string; text: string; bg: string }
> = {
  open: {
    label: "Open",
    dot: "bg-blue-400",
    text: "text-blue-300",
    bg: "bg-blue-500/10 border-blue-500/25",
  },
  in_progress: {
    label: "In progress",
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-500/10 border-amber-500/25",
  },
  testing: {
    label: "In testing",
    dot: "bg-violet-400",
    text: "text-violet-300",
    bg: "bg-violet-500/10 border-violet-500/25",
  },
  closed: {
    label: "Closed",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/25",
  },
};

export default function EmployeePage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<MyProductivity | null>(null);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [tRes, mRes] = await Promise.all([
        fetch("/api/tickets?scope=mine"),
        fetch("/api/analytics/my-productivity"),
      ]);
      if (!tRes.ok) {
        setError("Could not load tickets");
        return;
      }
      const data = (await tRes.json()) as { tickets: Ticket[] };
      setTickets(data.tickets);
      setError(null);
      if (mRes.ok) {
        setMetrics((await mRes.json()) as MyProductivity);
        setMetricsError(null);
      } else {
        setMetrics(null);
        setMetricsError("Could not load productivity metrics");
      }
    } catch {
      setError("Network error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const open = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#020617]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
                className="h-5 w-5 text-cyan-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                Developer
              </p>
              <h1 className="text-lg font-bold text-white leading-tight">
                My workspace
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {/* Stats bar */}
        {tickets.length > 0 && (
          <div className="mb-8 grid grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/8 bg-white/3 p-4 text-center">
              <p className="text-2xl font-bold text-white tabular-nums">
                {tickets.length}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">Total tickets</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-amber-500/8 p-4 text-center">
              <p className="text-2xl font-bold text-amber-400 tabular-nums">
                {inProgress}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">In progress</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-blue-500/8 p-4 text-center">
              <p className="text-2xl font-bold text-blue-400 tabular-nums">
                {open}
              </p>
              <p className="mt-0.5 text-xs text-zinc-400">Open</p>
            </div>
          </div>
        )}

        {metrics && (
          <div className="mb-8 rounded-2xl border border-white/8 bg-white/3 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
              Your productivity (live)
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-white/6 bg-black/20 p-4 text-center">
                <p className="text-2xl font-bold text-white tabular-nums">
                  {metrics.activityLast30Days.productivityScore}
                </p>
                <p className="mt-1 text-xs text-zinc-400">30-day activity score</p>
                <p className="mt-0.5 text-xs capitalize text-cyan-300/90">
                  {metrics.activityLast30Days.performanceLabel}
                </p>
              </div>
              <div className="rounded-xl border border-white/6 bg-black/20 p-4 text-center">
                <p className="text-2xl font-bold text-white tabular-nums">{metrics.focusMinutes}</p>
                <p className="mt-1 text-xs text-zinc-400">Focus minutes (completed)</p>
                <p className="mt-0.5 text-xs text-zinc-500 tabular-nums">
                  {metrics.completedFocusSessions} session(s)
                </p>
              </div>
              <div className="rounded-xl border border-white/6 bg-black/20 p-4 text-center">
                <p className="text-2xl font-bold text-white tabular-nums">{metrics.ticketPipeline.total}</p>
                <p className="mt-1 text-xs text-zinc-400">Tickets assigned to you</p>
              </div>
              <div className="rounded-xl border border-white/6 bg-black/20 p-4 text-center">
                <p className="text-sm font-medium text-zinc-200">
                  {metrics.lastActivityAt
                    ? new Date(metrics.lastActivityAt).toLocaleString()
                    : "No activity yet"}
                </p>
                <p className="mt-1 text-xs text-zinc-400">Last workspace activity</p>
              </div>
            </div>
          </div>
        )}

        {metricsError && (
          <div className="mb-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            {metricsError}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <p className="mb-6 text-sm text-zinc-400">
          Only the ticket workspace and approved app tabs are exposed here —
          everything else stays out of reach by design.
        </p>

        <ul className="space-y-4">
          {tickets.map((ticket) => {
            const p = priorityConfig[ticket.priority] ?? priorityConfig.medium;
            const s = statusConfig[ticket.status] ?? statusConfig.open;
            return (
              <li
                key={ticket.id}
                className="rounded-2xl border border-white/8 bg-white/3 p-5 transition-all hover:border-white/14 hover:bg-white/4"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Badges row */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {/* Type */}
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          ticket.type === "bug"
                            ? "bg-rose-500/10 border-rose-500/25 text-rose-300"
                            : "bg-indigo-500/10 border-indigo-500/25 text-indigo-300"
                        }`}
                      >
                        {ticket.type === "bug" ? "Bug" : "Task"}
                      </span>
                      {/* Priority */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${p.bg} ${p.text}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${p.dot}`}
                        />
                        {p.label}
                      </span>
                      {/* Status */}
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${s.bg} ${s.text}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
                        />
                        {s.label}
                      </span>
                    </div>

                    <h2 className="text-lg font-semibold text-white">
                      {ticket.title}
                    </h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      {ticket.description}
                    </p>
                    <p className="mt-2.5 text-xs text-zinc-500">
                      Approved apps:{" "}
                      <span className="text-zinc-400">
                        {ticket.allowedApps.join(", ")}
                      </span>
                    </p>
                  </div>

                  <Link
                    href={`/workspace/${ticket.id}/dashboard`}
                    className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 hover:-translate-y-0.5"
                  >
                    Open workspace
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="h-3.5 w-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>

        {!tickets.length && !error && (
          <div className="rounded-2xl border border-white/8 bg-white/3 p-10 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.4}
                stroke="currentColor"
                className="h-6 w-6 text-zinc-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-white">No tickets yet</p>
            <p className="mt-1 text-sm text-zinc-500">
              Ask HR or a manager to assign a ticket to your account.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
