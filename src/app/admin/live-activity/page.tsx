"use client";

import { useEffect, useState } from "react";

const events = [
  "Jamie started focus session for Login bug.",
  "Ticket #WFG-102 moved to testing.",
  "QA added verification note to Profile update.",
  "Manager reassigned urgent ticket to Sana.",
  "Ticket #WFG-099 closed successfully.",
];

export default function AdminLiveActivityPage() {
  const [feed, setFeed] = useState<string[]>([events[0], events[1]]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setFeed((prev) => {
        const next = events[(prev.length + 1) % events.length];
        return [next, ...prev].slice(0, 8);
      });
    }, 1800);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-cyan-300">Live Activity Feed</p>
            <h2 className="mt-1 text-2xl font-bold text-white">Real-time workflow events</h2>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="space-y-2">
          {feed.map((item, i) => (
            <p key={`${item}-${i}`} className="rounded-lg border border-white/8 bg-white/5 px-3 py-2 text-sm text-zinc-200">
              {item}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

