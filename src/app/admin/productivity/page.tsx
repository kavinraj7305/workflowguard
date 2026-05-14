"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

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
};

export default function AdminProductivityPage() {
  const [data, setData] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/analytics/org-retention");
      if (!res.ok) {
        setError("Could not load productivity metrics");
        setData(null);
        return;
      }
      const json = (await res.json()) as Payload;
      setData(json);
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
    return (
      <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
        {error ?? "No data"}
      </div>
    );
  }

  const p = data.ticketPipeline;
  const productivityScore = data.productivityScore;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Productivity</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Org-wide delivery health</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Scores use live ticket distribution for your organization (same source as the retention API). Last
          computed {new Date(data.generatedAt).toLocaleString()}.
        </p>
        <p className="mt-3 text-sm">
          <Link href="/admin/retention" className="font-medium text-indigo-300 hover:text-indigo-200">
            View retention and per-developer signals →
          </Link>
        </p>
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
                strokeDashoffset={314 - (314 * Math.min(productivityScore, 100)) / 100}
              />
            </svg>
            <div className="absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-3xl font-bold text-white tabular-nums">{productivityScore}</p>
                <p className="text-xs text-zinc-400">pipeline score</p>
              </div>
            </div>
          </div>
          <div className="mt-4 space-y-1 text-center text-xs text-zinc-500">
            <p>
              {data.developersActiveLast7Days} / {data.developerCount} developers with recent workspace activity
            </p>
            <p>
              {data.focusMinutesOrg} focus minutes · {data.focusSessionsCompleted} completed sessions
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h3 className="text-base font-semibold text-white">Ticket pipeline</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Completion rate: <span className="text-emerald-300">{data.completionRatePercent}%</span> · Total
            tickets: <span className="text-zinc-300">{p.total}</span>
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
    </div>
  );
}
