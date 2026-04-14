"use client";

import { demoTickets, demoUsers } from "@/lib/demo/mock-data";

export default function AdminLeaderboardsPage() {
  const topCloser = demoUsers.find((u) => u.role === "tester")?.name ?? "Maya Joseph";
  const fastestHandoff = demoTickets.find((t) => t.status === "testing")?.title ?? "Login bug";
  const stableWorkflow = "Nova Labs / Core Web Flow";
  const qaConfidence = 92;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Leaderboards</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Performance highlights</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-emerald-500/10 p-5">
          <p className="text-xs text-zinc-300">Top closer today</p>
          <p className="mt-1 text-lg font-semibold text-emerald-200">{topCloser}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-cyan-500/10 p-5">
          <p className="text-xs text-zinc-300">Fastest handoff</p>
          <p className="mt-1 text-lg font-semibold text-cyan-200">{fastestHandoff}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-violet-500/10 p-5">
          <p className="text-xs text-zinc-300">Most stable workflow</p>
          <p className="mt-1 text-lg font-semibold text-violet-200">{stableWorkflow}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Confidence meter for QA</p>
          <span className="text-sm font-bold text-emerald-300">Ready for release: {qaConfidence}%</span>
        </div>
        <div className="mt-3 h-3 w-full rounded-full bg-white/10">
          <div className="h-3 rounded-full bg-linear-to-r from-emerald-500 to-cyan-500" style={{ width: `${qaConfidence}%` }} />
        </div>
      </div>
    </div>
  );
}

