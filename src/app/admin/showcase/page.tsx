"use client";

import { useCallback, useEffect, useState } from "react";

type Member = {
  userId: string;
  name: string;
  email: string;
  role: string;
  moodLabel: string;
  moodStyle: string;
};

type Payload = {
  productivityScore: number;
  ticketPipeline: { open: number; in_progress: number; testing: number; closed: number; total: number };
  focusMinutesOrg: number;
  members: Member[];
};

export default function AdminShowcasePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/org-retention");
      setData(res.ok ? ((await res.json()) as Payload) : null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  const roleKinds = new Set(data.members.map((m) => m.role)).size;
  const highlights = [
    {
      title: "Roles in use",
      value: `${roleKinds} type(s)`,
      tone: "text-indigo-300 bg-indigo-500/15",
    },
    {
      title: "Team on record",
      value: `${data.members.length} member(s)`,
      tone: "text-violet-300 bg-violet-500/15",
    },
    {
      title: "Tracked tickets",
      value: `${data.ticketPipeline.total}`,
      tone: "text-amber-300 bg-amber-500/15",
    },
    {
      title: "Recorded focus",
      value: `${data.focusMinutesOrg} min`,
      tone: "text-emerald-300 bg-emerald-500/15",
    },
  ];

  const p = data.ticketPipeline;
  const productivityScore = data.productivityScore;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-500/20 bg-linear-to-br from-indigo-500/12 via-[#020617] to-cyan-500/10 p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Operations intelligence</p>
        <h2 className="mt-2 text-3xl font-bold text-white">WorkFlowGuard command view</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-300">
          Presentation-friendly snapshot fed by the same Neon-backed analytics as productivity and retention — no
          canned demo numbers.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {highlights.map((item) => (
          <div key={item.title} className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-400">{item.title}</p>
            <span className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${item.tone}`}>
              {item.value}
            </span>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h3 className="text-base font-semibold text-white">Operational flow</h3>
          <ol className="mt-4 space-y-3 text-sm text-zinc-300">
            <li>1. HR completes onboarding and invites the team.</li>
            <li>2. Managers create and assign tickets.</li>
            <li>3. Developers work in the protected workspace with the timer.</li>
            <li>4. Testers verify handoff evidence and close tickets.</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h3 className="text-base font-semibold text-white">Current pipeline</h3>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-amber-500/10 p-3 text-center">
              <p className="text-xl font-bold text-amber-300 tabular-nums">{p.in_progress}</p>
              <p className="text-xs text-zinc-500">In progress</p>
            </div>
            <div className="rounded-xl bg-violet-500/10 p-3 text-center">
              <p className="text-xl font-bold text-violet-300 tabular-nums">{p.testing}</p>
              <p className="text-xs text-zinc-500">Testing</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
              <p className="text-xl font-bold text-emerald-300 tabular-nums">{p.closed}</p>
              <p className="text-xs text-zinc-500">Closed</p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white">Productivity score</h3>
            <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold text-emerald-300">
              Live
            </span>
          </div>
          <div className="mt-4 flex items-center gap-4">
            <div className="relative h-16 w-16">
              <svg viewBox="0 0 80 80" className="-rotate-90">
                <circle cx="40" cy="40" r="32" className="fill-none stroke-white/10" strokeWidth="8" />
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  className="fill-none stroke-emerald-400"
                  strokeWidth="8"
                  strokeDasharray={201}
                  strokeDashoffset={201 - (201 * Math.min(productivityScore, 100)) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-sm font-bold text-white tabular-nums">
                {productivityScore}
              </span>
            </div>
            <p className="text-sm text-zinc-300">
              Weighted from live ticket states across your organization ({p.total} total).
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h3 className="text-base font-semibold text-white">Sample talking points</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Derived from the live ticket pipeline counts for this organization.
          </p>
          <div className="mt-4 space-y-2">
            {p.open > 0 ? (
              <p className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200">
                {p.open} ticket(s) are still open — align owners before dates slip.
              </p>
            ) : null}
            {p.testing > 0 ? (
              <p className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200">
                {p.testing} ticket(s) in testing — keep QA unblocked for predictable releases.
              </p>
            ) : null}
            {p.total === 0 ? (
              <p className="text-sm text-zinc-500">Create tickets to unlock richer talking points.</p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <h3 className="text-base font-semibold text-white">Team mood indicator</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.members.map((u) => (
            <div key={u.userId} className="rounded-xl border border-white/8 px-4 py-3">
              <p className="font-medium text-white">{u.name}</p>
              <p className="text-xs text-zinc-500">{u.email}</p>
              <div className="mt-2 flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-cyan-300">{u.role}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.moodStyle}`}>{u.moodLabel}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
