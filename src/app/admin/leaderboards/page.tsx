"use client";

import { useCallback, useEffect, useState } from "react";

type Ticket = {
  id: string;
  title: string;
  status: string;
  assignedDeveloperId: string | null;
  testerId: string | null;
};
type User = { id: string; name: string; role: string };

type RetentionPayload = {
  productivityScore: number;
  completionRatePercent: number;
  ticketPipeline: { total: number };
};

export default function AdminLeaderboardsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [retention, setRetention] = useState<RetentionPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [tRes, uRes, rRes] = await Promise.all([
        fetch("/api/tickets"),
        fetch("/api/users"),
        fetch("/api/analytics/org-retention"),
      ]);
      setTickets(tRes.ok ? ((await tRes.json()) as { tickets: Ticket[] }).tickets : []);
      setUsers(uRes.ok ? ((await uRes.json()) as { users: User[] }).users : []);
      setRetention(rRes.ok ? ((await rRes.json()) as RetentionPayload) : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const closedByDeveloper = tickets.filter((t) => t.status === "closed" && t.assignedDeveloperId);
  const byDev = new Map<string, number>();
  for (const t of closedByDeveloper) {
    const id = t.assignedDeveloperId as string;
    byDev.set(id, (byDev.get(id) ?? 0) + 1);
  }
  let topDevId: string | null = null;
  let topDevScore = 0;
  for (const [id, n] of byDev) {
    if (n > topDevScore) {
      topDevScore = n;
      topDevId = id;
    }
  }
  const topFinisherName =
    topDevId && topDevScore > 0 ? users.find((u) => u.id === topDevId)?.name ?? "—" : "—";

  const testingTicket = tickets.find((t) => t.status === "testing");
  const qaConfidence = retention?.completionRatePercent ?? 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-amber-300">Leaderboards</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Performance highlights</h2>
        <p className="mt-2 text-sm text-zinc-400">Built from closed ticket counts, the testing queue, and org analytics.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/8 bg-emerald-500/10 p-5">
          <p className="text-xs text-zinc-300">Top finisher (closed assigned)</p>
          <p className="mt-1 text-lg font-semibold text-emerald-200">{topFinisherName}</p>
          <p className="mt-1 text-xs text-zinc-500 tabular-nums">{topDevScore} closed ticket(s)</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-cyan-500/10 p-5">
          <p className="text-xs text-zinc-300">Testing spotlight</p>
          <p className="mt-1 text-lg font-semibold text-cyan-200">{testingTicket?.title ?? "—"}</p>
        </div>
        <div className="rounded-2xl border border-white/8 bg-violet-500/10 p-5">
          <p className="text-xs text-zinc-300">Org pipeline score</p>
          <p className="mt-1 text-lg font-semibold text-violet-200 tabular-nums">
            {retention?.productivityScore ?? 0}
          </p>
          <p className="mt-1 text-xs text-zinc-500">{retention?.ticketPipeline.total ?? 0} total tickets</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Delivery confidence (closed ÷ all)</p>
          <span className="text-sm font-bold text-emerald-300 tabular-nums">{qaConfidence}%</span>
        </div>
        <div className="mt-3 h-3 w-full rounded-full bg-white/10">
          <div
            className="h-3 rounded-full bg-linear-to-r from-emerald-500 to-cyan-500"
            style={{ width: `${Math.min(100, qaConfidence)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
