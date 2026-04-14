"use client";

import { demoTickets, demoUsers } from "@/lib/demo/mock-data";

const highlights = [
  { title: "Role-based control", value: "4 Roles", tone: "text-indigo-300 bg-indigo-500/15" },
  { title: "Team capacity", value: "5 Members", tone: "text-violet-300 bg-violet-500/15" },
  { title: "Active workflows", value: "4 Flows", tone: "text-amber-300 bg-amber-500/15" },
  { title: "Polished UI", value: "Wow Mode", tone: "text-emerald-300 bg-emerald-500/15" },
];

export default function AdminShowcasePage() {
  const inProgress = demoTickets.filter((t) => t.status === "in_progress").length;
  const testing = demoTickets.filter((t) => t.status === "testing").length;
  const closed = demoTickets.filter((t) => t.status === "closed").length;
  const productivityScore = Math.round(((closed * 100) + (testing * 70) + (inProgress * 45)) / demoTickets.length);

  function moodForRole(role: string) {
    if (role === "hr" || role === "manager") {
      return { label: "Calm", style: "bg-emerald-500/15 text-emerald-300" };
    }
    if (role === "tester") {
      return { label: "Busy", style: "bg-amber-500/15 text-amber-300" };
    }
    return { label: "Focused", style: "bg-cyan-500/15 text-cyan-300" };
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-indigo-500/20 bg-linear-to-br from-indigo-500/12 via-[#020617] to-cyan-500/10 p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">
          Operations intelligence
        </p>
        <h2 className="mt-2 text-3xl font-bold text-white">
          WorkFlowGuard Command View
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-300">
          This screen is purposely crafted for presentation. It summarizes the
          full project story in a non-technical way: team, progress, outcomes,
          and visual quality.
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
            <li>1. HR creates organization and user accounts.</li>
            <li>2. Manager creates and assigns tickets.</li>
            <li>3. Developer works in protected workspace + timer.</li>
            <li>4. Tester verifies screenshot and closes ticket.</li>
          </ol>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h3 className="text-base font-semibold text-white">Current state</h3>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-amber-500/10 p-3 text-center">
              <p className="text-xl font-bold text-amber-300">{inProgress}</p>
              <p className="text-xs text-zinc-500">In progress</p>
            </div>
            <div className="rounded-xl bg-violet-500/10 p-3 text-center">
              <p className="text-xl font-bold text-violet-300">{testing}</p>
              <p className="text-xs text-zinc-500">Testing</p>
            </div>
            <div className="rounded-xl bg-emerald-500/10 p-3 text-center">
              <p className="text-xl font-bold text-emerald-300">{closed}</p>
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
                  strokeDashoffset={201 - (201 * productivityScore) / 100}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-sm font-bold text-white">
                {productivityScore}
              </span>
            </div>
            <p className="text-sm text-zinc-300">
              Team throughput is healthy with strong closure momentum.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h3 className="text-base font-semibold text-white">AI assistant suggestions</h3>
          <div className="mt-4 space-y-2">
            <p className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200">
              Move 1 open ticket to in-progress for smoother sprint velocity.
            </p>
            <p className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200">
              Prioritize QA closure on testing queue to increase completion rate.
            </p>
            <p className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200">
              Keep current developer-tester ratio; assignment balance looks stable.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <h3 className="text-base font-semibold text-white">Team mood indicator</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {demoUsers.map((u) => (
            <div key={u.id} className="rounded-xl border border-white/8 px-4 py-3">
              <p className="font-medium text-white">{u.name}</p>
              <p className="text-xs text-zinc-500">{u.email}</p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-cyan-300">{u.role}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${moodForRole(u.role).style}`}>
                  {moodForRole(u.role).label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

