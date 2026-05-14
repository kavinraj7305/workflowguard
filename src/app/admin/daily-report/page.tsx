"use client";

import { useCallback, useEffect, useState } from "react";

type Report = {
  generatedAt: string;
  periodUtc: { start: string; end: string };
  ticketsCreatedToday: number;
  ticketsClosedToday: number;
  openBugs: number;
  pendingLeave: number;
  pipeline: { open: number; in_progress: number; testing: number; closed: number; total: number };
  highlights: string[];
};

export default function AdminDailyReportPage() {
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/reports/daily");
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        setError(j.error ?? "Could not load report");
        setData(null);
        return;
      }
      setData((await res.json()) as Report);
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
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-lg rounded-2xl border border-rose-500/25 bg-rose-500/10 p-6 text-sm text-rose-200">
        {error ?? "No data"}
      </div>
    );
  }

  const p = data.pipeline;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <p className="text-xs text-zinc-500">Operations</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Daily report</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Built from tickets and leave in your database. Day boundary is <strong className="text-zinc-300">UTC midnight</strong>{" "}
          through now. Generated {new Date(data.generatedAt).toLocaleString()}.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5">
          <p className="text-xs text-emerald-200/90">Closed today (UTC)</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-white">{data.ticketsClosedToday}</p>
        </div>
        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-5">
          <p className="text-xs text-sky-200/90">Opened today (UTC)</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-white">{data.ticketsCreatedToday}</p>
        </div>
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5">
          <p className="text-xs text-rose-200/90">Open bugs</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-white">{data.openBugs}</p>
        </div>
        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-5">
          <p className="text-xs text-violet-200/90">Leave pending approval</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums text-white">{data.pendingLeave}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <h3 className="text-sm font-medium text-white">Pipeline (all time)</h3>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { k: "Open", v: p.open },
            { k: "In progress", v: p.in_progress },
            { k: "Testing", v: p.testing },
            { k: "Closed", v: p.closed },
          ].map((x) => (
            <div key={x.k} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-center">
              <p className="text-lg font-semibold tabular-nums text-white">{x.v}</p>
              <p className="text-xs text-zinc-500">{x.k}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-zinc-600">Total tickets in org: {p.total}</p>
      </div>

      <div className="rounded-2xl border border-amber-500/15 bg-amber-500/5 p-6">
        <h3 className="text-sm font-medium text-amber-200">Highlights</h3>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-300">
          {data.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
