"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Assignment = {
  id: string;
  status: string;
  task: {
    id: string;
    title: string;
    description: string;
    expectedMinutes: number;
    allowedUrlPatterns: string[];
  };
};

export default function EmployeePage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/my-assignments");
      if (!res.ok) {
        setError("Could not load assignments");
        return;
      }
      const data = (await res.json()) as { assignments: Assignment[] };
      setAssignments(data.assignments);
    } catch {
      setError("Network error");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400">
              Employee
            </p>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              My tasks
            </h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-10">
        {process.env.NEXT_PUBLIC_USE_MOCK === "true" ? (
          <p className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <strong>Mock demo</strong> — use workspace link below; engagement calls are simulated.
          </p>
        ) : null}
        {error ? (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Open the workspace to work on assigned flows. Engagement is derived from
          your activity on task-related pages and completion—not from judging
          arbitrary websites.
        </p>
        <ul className="mt-6 space-y-4">
          {assignments.map((a) => (
            <li
              key={a.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                    {a.task.title}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {a.task.description}
                  </p>
                  <p className="mt-2 text-xs text-zinc-500">
                    Expected ~{a.task.expectedMinutes} min · On-task path hints:{" "}
                    {a.task.allowedUrlPatterns.join(", ")}
                  </p>
                  <p className="mt-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Status: {a.status.replace("_", " ")}
                  </p>
                </div>
                <Link
                  href={`/workspace/${a.id}/dashboard`}
                  className="inline-flex shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-500"
                >
                  Open workspace
                </Link>
              </div>
            </li>
          ))}
        </ul>
        {!assignments.length && !error ? (
          <p className="text-sm text-zinc-500">
            No assignments yet. Ask HR to assign a task to your account.
          </p>
        ) : null}
      </main>
    </div>
  );
}
