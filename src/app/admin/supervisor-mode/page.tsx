"use client";

import Link from "next/link";

const buttons = [
  { href: "/admin/executive-snapshot", label: "Weekly Snapshot", color: "bg-indigo-600 hover:bg-indigo-500" },
  { href: "/admin/leaderboards", label: "Team Leaderboards", color: "bg-amber-600 hover:bg-amber-500" },
  { href: "/admin/live-activity", label: "Live Activity Feed", color: "bg-cyan-600 hover:bg-cyan-500" },
  { href: "/admin/productivity", label: "Productivity View", color: "bg-emerald-600 hover:bg-emerald-500" },
  { href: "/admin/finale", label: "Today’s Outcome", color: "bg-violet-600 hover:bg-violet-500" },
];

export default function AdminSupervisorModePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Supervisor Mode</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Simple navigation</h2>
        <p className="mt-2 text-sm text-zinc-400">Only 5 big buttons for non-technical walkthrough.</p>
      </div>

      <div className="grid gap-4">
        {buttons.map((btn) => (
          <Link
            key={btn.href}
            href={btn.href}
            className={`rounded-2xl px-6 py-5 text-lg font-semibold text-white shadow-xl transition-all hover:-translate-y-0.5 ${btn.color}`}
          >
            {btn.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

