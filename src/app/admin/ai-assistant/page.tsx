"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Ticket = { status: string; type: string };
type User = { role: string };

export default function AdminAiAssistantPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [generated, setGenerated] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tRes, uRes] = await Promise.all([fetch("/api/tickets"), fetch("/api/users")]);
      const tJson = tRes.ok ? ((await tRes.json()) as { tickets: Ticket[] }).tickets : [];
      const uJson = uRes.ok ? ((await uRes.json()) as { users: User[] }).users : [];
      setTickets(tJson);
      setUsers(uJson);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const suggestions = useMemo(() => {
    const open = tickets.filter((t) => t.status === "open").length;
    const testing = tickets.filter((t) => t.status === "testing").length;
    const bugs = tickets.filter((t) => t.type === "bug").length;
    const devCount = users.filter((u) => u.role === "developer").length;
    const tips: string[] = [];
    if (tickets.length === 0) {
      tips.push("Create the first tickets so execution and analytics stay grounded in real work.");
    } else {
      tips.push(
        open > 0
          ? `Move ${open} open ticket(s) into in-progress when owners are ready.`
          : "No open tickets — keep the next batch of work visible in the backlog."
      );
      tips.push(
        testing > 0
          ? `QA has ${testing} ticket(s) in testing — prioritize review to protect cycle time.`
          : "Testing queue is empty — either great throughput or a gap before the next release slice."
      );
      tips.push(
        bugs > Math.max(1, Math.floor(tickets.length / 3))
          ? "Bug share is high versus total tickets; schedule a short stabilization window."
          : "Bug mix looks proportionate for the current portfolio."
      );
      tips.push(
        devCount < 2
          ? "Fewer than two developers on record — confirm capacity matches delivery goals."
          : `Developer headcount is ${devCount}; align assignments to avoid single-threaded risk.`
      );
    }
    return tips;
  }, [tickets, users]);

  return (
    <div className="max-w-4xl space-y-6">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">AI Assistant</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Smart suggestions panel</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Recommendations are computed from your live tickets and user roster — no bundled demo dataset.
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">Action recommendations</h3>
          <button
            type="button"
            onClick={() => {
              void load();
              setGenerated(true);
            }}
            disabled={loading}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Generate suggestions"}
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {!generated ? (
            <p className="text-sm text-zinc-500">Generate to analyze the latest ticket and team snapshot.</p>
          ) : (
            suggestions.map((tip) => (
              <p
                key={tip}
                className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200"
              >
                {tip}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
