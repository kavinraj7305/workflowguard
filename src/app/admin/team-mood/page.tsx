"use client";

import { useCallback, useEffect, useState } from "react";

type Member = {
  userId: string;
  name: string;
  email: string;
  role: string;
  ticketWorkload: number;
  moodLabel: string;
  moodStyle: string;
};

type Payload = { members: Member[] };

export default function AdminTeamMoodPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/analytics/org-retention");
      if (!res.ok) {
        setError("Could not load team data");
        setMembers([]);
        return;
      }
      const data = (await res.json()) as Payload;
      setMembers(data.members ?? []);
    } catch {
      setError("Network error");
      setMembers([]);
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
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Team mood</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Workload snapshot</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Mood labels are derived from each person&apos;s assigned ticket load (developer assignee + separate tester
          assignments). Data comes from your database, not a demo fixture.
        </p>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {members.map((u) => (
          <div key={u.userId} className="rounded-2xl border border-white/8 bg-white/3 p-5">
            <p className="font-semibold text-white">{u.name}</p>
            <p className="mt-0.5 text-xs text-zinc-500">{u.email}</p>
            <p className="mt-2 text-xs uppercase tracking-wide text-cyan-300">{u.role}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${u.moodStyle}`}>
                {u.moodLabel}
              </span>
              <span className="text-xs text-zinc-400 tabular-nums">{u.ticketWorkload} tickets</span>
            </div>
          </div>
        ))}
      </div>

      {!error && members.length === 0 ? (
        <p className="text-center text-sm text-zinc-500">No team members found for this organization.</p>
      ) : null}
    </div>
  );
}
