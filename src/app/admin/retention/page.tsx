"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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

export default function AdminRetentionPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/analytics/org-retention");
      if (!res.ok) {
        setError("Could not load retention metrics");
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        {error ?? "No data"}
      </div>
    );
  }

  const developers = data.members.filter((m) => m.role === "developer");
  const atRisk = developers.filter((m) => m.retentionRisk === "high" || m.retentionRisk === "medium");

  return (
    <div className="max-w-6xl space-y-8">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-violet-300">
          Retention management
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">Engagement and delivery risk</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Every number below is computed from your Neon database: ticket assignments, workspace activity
          (last 30 days), and completed Pomodoro sessions. Updated{" "}
          <span className="text-zinc-300">{new Date(data.generatedAt).toLocaleString()}</span>.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Developers</p>
          <p className="mt-2 text-3xl font-bold text-white tabular-nums">{data.developerCount}</p>
          <p className="mt-1 text-xs text-zinc-400">active in last 7d: {data.developersActiveLast7Days}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Completion rate</p>
          <p className="mt-2 text-3xl font-bold text-emerald-300 tabular-nums">
            {data.completionRatePercent}%
          </p>
          <p className="mt-1 text-xs text-zinc-400">closed ÷ all org tickets</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Org focus time</p>
          <p className="mt-2 text-3xl font-bold text-cyan-300 tabular-nums">{data.focusMinutesOrg}</p>
          <p className="mt-1 text-xs text-zinc-400">completed focus minutes · {data.focusSessionsCompleted} sessions</p>
        </div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-200/80">Watch list</p>
          <p className="mt-2 text-3xl font-bold text-amber-200 tabular-nums">{atRisk.length}</p>
          <p className="mt-1 text-xs text-zinc-400">developers with medium or high engagement risk</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/8 bg-white/3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Developer retention signals</h3>
          <Link
            href="/admin/productivity"
            className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
          >
            Open productivity dashboard →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/8 bg-black/20 text-xs uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Open assigned</th>
                <th className="px-5 py-3 font-semibold">Last activity</th>
                <th className="px-5 py-3 font-semibold">30d score</th>
                <th className="px-5 py-3 font-semibold">Focus min</th>
                <th className="px-5 py-3 font-semibold">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {developers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-zinc-500">
                    No developers in this organization yet. Add users with the developer role.
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
                      {m.performanceLabel ? (
                        <span className="ml-2 text-xs text-zinc-500">({m.performanceLabel})</span>
                      ) : null}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-zinc-300">{m.focusMinutes}</td>
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

      <p className="text-xs text-zinc-500">
        <strong className="text-zinc-400">Risk rules:</strong> high = has open assigned work but no workspace activity
        in 14 days; medium = activity older than 7 days; low = active within 7 days; n/a = no open assigned tickets.
      </p>
    </div>
  );
}
