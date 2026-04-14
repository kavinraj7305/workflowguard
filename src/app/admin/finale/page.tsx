"use client";

export default function AdminFinalePage() {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/8 bg-linear-to-br from-indigo-500/15 via-[#020617] to-emerald-500/15 p-10 text-center">
      <div className="pointer-events-none absolute left-8 top-8 h-3 w-3 rounded-full bg-yellow-300 animate-bounce" />
      <div className="pointer-events-none absolute right-12 top-14 h-2 w-2 rounded-full bg-pink-300 animate-pulse" />
      <div className="pointer-events-none absolute left-16 bottom-16 h-2.5 w-2.5 rounded-full bg-cyan-300 animate-bounce" />
      <div className="pointer-events-none absolute right-20 bottom-10 h-3 w-3 rounded-full bg-emerald-300 animate-pulse" />

      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-200">Grand Finale</p>
      <h1 className="mt-2 text-4xl font-extrabold text-white">Today’s Outcome</h1>
      <p className="mx-auto mt-3 max-w-2xl text-zinc-200">
        7 tickets closed, team efficiency improved, and QA confidence is at release-ready level.
      </p>

      <div className="mx-auto mt-8 grid max-w-3xl gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-3xl font-bold text-emerald-300">7</p>
          <p className="mt-1 text-sm text-zinc-300">Closed tickets</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-3xl font-bold text-cyan-300">+18%</p>
          <p className="mt-1 text-sm text-zinc-300">Team efficiency</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-3xl font-bold text-indigo-300">92%</p>
          <p className="mt-1 text-sm text-zinc-300">Release confidence</p>
        </div>
      </div>

      <p className="mt-8 text-lg font-semibold text-white">Celebrating a strong delivery day 🎉</p>
    </div>
  );
}

