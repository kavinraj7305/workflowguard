"use client";

import { useMemo, useState } from "react";

const corpus = [
  "urgent bugs by Sarah",
  "tickets waiting in testing",
  "developer workload this week",
  "fastest handoff today",
  "high priority login issues",
  "open tasks in analytics app",
];

export default function AdminMagicSearchPage() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return corpus.filter((item) => item.includes(q)).slice(0, 5);
  }, [query]);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">Magic Search</p>
        <h2 className="mt-1 text-2xl font-bold text-white">Natural language search</h2>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Try: "urgent bugs by Sarah"'
          className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/60 focus:outline-none"
        />
        <div className="mt-4 space-y-2">
          {results.length === 0 && query.trim() ? (
            <p className="text-sm text-zinc-500">No match found. Try a different phrase.</p>
          ) : (
            results.map((r) => (
              <p key={r} className="rounded-lg border border-indigo-500/20 bg-indigo-500/10 px-3 py-2 text-sm text-indigo-200">
                {r}
              </p>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

