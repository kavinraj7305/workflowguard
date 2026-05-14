"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Member = {
  userId: string;
  name: string;
  email: string;
  role: string;
  ticketWorkload: number;
  moodLabel: string;
  moodStyle: string;
  lastActivityAt: string | null;
  focusMinutes: number;
  completedFocusSessions: number;
  productivityScore: number | null;
  performanceLabel: string | null;
  retentionRisk: "low" | "medium" | "high" | "n/a";
  openAssignedTickets: number;
};

type Payload = {
  generatedAt: string;
  ticketPipeline: {
    open: number;
    in_progress: number;
    testing: number;
    closed: number;
    total: number;
  };
  productivityScore: number;
  completionRatePercent: number;
  developerCount: number;
  developersActiveLast7Days: number;
  focusMinutesOrg: number;
  focusSessionsCompleted: number;
  members: Member[];
};

function riskStyle(r: Member["retentionRisk"]) {
  if (r === "high") return "text-rose-300 bg-rose-500/10 border-rose-500/25";
  if (r === "medium") return "text-amber-300 bg-amber-500/10 border-amber-500/25";
  if (r === "low") return "text-emerald-300 bg-emerald-500/10 border-emerald-500/25";
  return "text-zinc-400 bg-zinc-800/60 border-zinc-600/40";
}

export default function AdminProductivityPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/analytics/org-retention");
      if (!res.ok) {
        setError("Could not load insights");
        setData(null);
        return;
      }
      setData((await res.json()) as Payload);
    } catch {
      setError("Network error");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error ?? "No data"}</div>;
  }

  const p = data.ticketPipeline;
  const score = data.productivityScore;
  const developers = data.members.filter((m) => m.role === "developer");
  const atRisk = developers.filter((m) => m.retentionRisk === "high" || m.retentionRisk === "medium");

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <p className="text-xs text-zinc-500">Insights</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Numbers for your org</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Pulled from tickets, who showed up in the workspace lately, and focus blocks people finished. Last refresh:{" "}
          {new Date(data.generatedAt).toLocaleString()}.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/admin/tickets"
            className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10"
          >
            Tickets board
          </Link>
          <Link
            href="/admin/team-mood"
            className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10"
          >
            Team mood
          </Link>
          <Link
            href="/admin/daily-report"
            className="rounded-xl border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10"
          >
            Daily report
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <div className="relative mx-auto h-40 w-40">
            <svg viewBox="0 0 120 120" className="-rotate-90">
              <circle cx="60" cy="60" r="50" className="fill-none stroke-white/10" strokeWidth="10" />
              <circle
                cx="60"
                cy="60"
                r="50"
                className="fill-none stroke-emerald-400"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={314}
                strokeDashoffset={314 - (314 * Math.min(score, 100)) / 100}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-white tabular-nums">{score}</p>
                <p className="text-xs text-zinc-400">Ticket flow score</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1 text-center text-xs text-zinc-500">
            <p>
              {data.developersActiveLast7Days} / {data.developerCount} devs active (7d)
            </p>
            <p>
              {data.focusMinutesOrg} focus min · {data.focusSessionsCompleted} sessions
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h3 className="text-base font-medium text-white">Tickets by stage</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Done rate <span className="text-emerald-300">{data.completionRatePercent}%</span> ·{" "}
            <span className="text-zinc-300">{p.total}</span> total
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Open", value: p.open, color: "text-blue-300 bg-blue-500/10" },
              { label: "In progress", value: p.in_progress, color: "text-amber-300 bg-amber-500/10" },
              { label: "Testing", value: p.testing, color: "text-violet-300 bg-violet-500/10" },
              { label: "Closed", value: p.closed, color: "text-emerald-300 bg-emerald-500/10" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 text-center ${item.color}`}>
                <p className="text-xl font-bold tabular-nums">{item.value}</p>
                <p className="text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div id="developer-retention" className="space-y-4 scroll-mt-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-violet-300">Developers worth a second look</h3>
            <p className="mt-1 text-sm text-zinc-400">Rough signal from open work and recent activity — not a performance review.</p>
          </div>
          <div className="flex gap-3 text-xs text-zinc-500">
            <span>
              Flagged: <strong className="text-amber-200">{atRisk.length}</strong>
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/8 bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Developer</th>
                  <th className="px-5 py-3 font-semibold">Open</th>
                  <th className="px-5 py-3 font-semibold">Last activity</th>
                  <th className="px-5 py-3 font-semibold">30d</th>
                  <th className="px-5 py-3 font-semibold">Focus</th>
                  <th className="px-5 py-3 font-semibold">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {developers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                      No developers yet.{" "}
                      <Link href="/admin/users?role=developer" className="text-indigo-300 hover:underline">
                        Add a developer
                      </Link>
                    </td>
                  </tr>
                ) : (
                  developers.map((m) => (
                    <tr key={m.userId} className="hover:bg-white/4">
                      <td className="px-5 py-3">
                        <p className="font-medium text-white">{m.name}</p>
                        <p className="text-xs text-zinc-500">{m.email}</p>
                      </td>
                      <td className="px-5 py-3 tabular-nums text-zinc-300">{m.openAssignedTickets}</td>
                      <td className="px-5 py-3 text-zinc-400">
                        {m.lastActivityAt ? new Date(m.lastActivityAt).toLocaleString() : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <span className="tabular-nums text-white">{m.productivityScore ?? "—"}</span>
                        {m.performanceLabel ? <span className="ml-1 text-xs text-zinc-500">({m.performanceLabel})</span> : null}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-zinc-300">{m.focusMinutes}m</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${riskStyle(m.retentionRisk)}`}
                        >
                          {m.retentionRisk}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <p className="text-xs text-zinc-600">
          <span className="text-zinc-400">How we label risk:</span> high = open tickets and nothing in the workspace for two weeks · medium = quiet for a week · low =
          touched something in the last week · n/a = no open tickets assigned.
        </p>
      </div>
    </div>
  );
}
