"use client";

import { demoTickets, demoUsers } from "@/lib/demo/mock-data";

function workloadForUser(userId: string) {
  return demoTickets.filter(
    (t) => t.assignedDeveloperId === userId || t.testerId === userId
  ).length;
}

function moodForUser(userId: string) {
  const load = workloadForUser(userId);
  if (load >= 3) return { label: "Overloaded", style: "bg-rose-500/15 text-rose-300" };
  if (load >= 2) return { label: "Busy", style: "bg-amber-500/15 text-amber-300" };
  return { label: "Calm", style: "bg-emerald-500/15 text-emerald-300" };
}

export default function AdminTeamMoodPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
          Team Mood
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Per-person mood indicator
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Separate view to explain each person’s workload and mood clearly.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {demoUsers.map((u) => {
          const mood = moodForUser(u.id);
          const load = workloadForUser(u.id);
          return (
            <div key={u.id} className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="font-semibold text-white">{u.name}</p>
              <p className="mt-0.5 text-xs text-zinc-500">{u.email}</p>
              <p className="mt-2 text-xs uppercase tracking-wide text-cyan-300">{u.role}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${mood.style}`}>
                  {mood.label}
                </span>
                <span className="text-xs text-zinc-400">{load} tickets</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

