"use client";

import { demoTickets } from "@/lib/demo/mock-data";

export default function AdminProductivityPage() {
  const open = demoTickets.filter((t) => t.status === "open").length;
  const inProgress = demoTickets.filter((t) => t.status === "in_progress").length;
  const testing = demoTickets.filter((t) => t.status === "testing").length;
  const closed = demoTickets.filter((t) => t.status === "closed").length;

  const productivityScore = Math.round(
    ((closed * 100) + (testing * 70) + (inProgress * 45)) / demoTickets.length
  );

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">
          Productivity
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Team productivity score
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Dedicated screen to explain overall execution health.
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
                <p className="text-3xl font-bold text-white">{productivityScore}</p>
                <p className="text-xs text-zinc-400">score</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h3 className="text-base font-semibold text-white">Status breakdown</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {[
              { label: "Open", value: open, color: "text-blue-300 bg-blue-500/10" },
              { label: "In progress", value: inProgress, color: "text-amber-300 bg-amber-500/10" },
              { label: "Testing", value: testing, color: "text-violet-300 bg-violet-500/10" },
              { label: "Closed", value: closed, color: "text-emerald-300 bg-emerald-500/10" },
            ].map((item) => (
              <div key={item.label} className={`rounded-xl p-4 text-center ${item.color}`}>
                <p className="text-xl font-bold">{item.value}</p>
                <p className="text-xs">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

