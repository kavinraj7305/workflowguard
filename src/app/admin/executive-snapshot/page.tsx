"use client";

export default function AdminExecutiveSnapshotPage() {
  const improvements = [
    "Ticket closure speed improved by 24% compared to last week.",
    "Testing backlog dropped from 5 tickets to 2 tickets.",
    "Cross-team handoff quality improved with screenshot compliance.",
    "Manager visibility increased due to role-based dashboard split.",
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border border-white/8 bg-linear-to-br from-indigo-500/12 via-[#020617] to-cyan-500/10 p-7">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Executive Snapshot</p>
        <h2 className="mt-1 text-2xl font-bold text-white">What improved this week</h2>
        <p className="mt-2 text-sm text-zinc-300">
          Plain-language leadership summary with no technical jargon.
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="space-y-3">
          {improvements.map((item) => (
            <p key={item} className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

