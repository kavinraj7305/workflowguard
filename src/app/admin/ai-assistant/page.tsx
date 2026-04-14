"use client";

import { useMemo, useState } from "react";
import { demoTickets, demoUsers } from "@/lib/demo/mock-data";

export default function AdminAiAssistantPage() {
  const [generated, setGenerated] = useState(false);

  const suggestions = useMemo(() => {
    const open = demoTickets.filter((t) => t.status === "open").length;
    const testing = demoTickets.filter((t) => t.status === "testing").length;
    const bugs = demoTickets.filter((t) => t.type === "bug").length;
    const devCount = demoUsers.filter((u) => u.role === "developer").length;

    return [
      `Move ${Math.max(1, open)} open ticket(s) into in-progress today for better flow.`,
      `Focus QA on ${testing} ticket(s) in testing to increase closure speed.`,
      bugs > 1
        ? "Bug count is elevated; schedule a short root-cause review."
        : "Bug trend is stable; maintain current quality checks.",
      devCount < 2
        ? "Consider increasing developer bandwidth for faster turnaround."
        : "Developer capacity looks healthy for current workload.",
    ];
  }, []);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-indigo-300">
          AI Assistant
        </p>
        <h2 className="mt-1 text-2xl font-bold text-white">
          Smart suggestions panel
        </h2>
        <p className="mt-2 text-sm text-zinc-400">
          Use this screen to explain how the system gives next-best actions to
          managers.
        </p>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-base font-semibold text-white">
            Action recommendations
          </h3>
          <button
            type="button"
            onClick={() => setGenerated(true)}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
          >
            Generate suggestions
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {!generated ? (
            <p className="text-sm text-zinc-500">
              Click generate to get management suggestions.
            </p>
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

