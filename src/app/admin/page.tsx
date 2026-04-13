"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Task = {
  id: string;
  title: string;
  description: string;
  expectedMinutes: number;
  allowedUrlPatterns: string[];
};

type Employee = { id: string; email: string; name: string };

type Insight = {
  bottlenecks: Array<{
    taskId: string;
    title: string;
    sampleSize: number;
    avgMinutes: number;
    expectedMinutes: number;
    slowRatio: number;
    isBottleneck: boolean;
  }>;
  recentAssignments: Array<{
    id: string;
    status: string;
    employeeName: string;
    employeeEmail: string;
    taskTitle: string;
    taskExpectedMinutes: number;
    latestSnapshot: {
      score: number;
      classification: string;
    } | null;
  }>;
};

export default function AdminPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [insights, setInsights] = useState<Insight | null>(null);
  const [title, setTitle] = useState("Fill customer data");
  const [description, setDescription] = useState(
    "Complete the CRM intake for assigned accounts."
  );
  const [expectedMinutes, setExpectedMinutes] = useState(45);
  const [patterns, setPatterns] = useState("dashboard,profile,analytics");
  const [assignTaskId, setAssignTaskId] = useState("");
  const [assignEmployeeId, setAssignEmployeeId] = useState("");
  const [empName, setEmpName] = useState("");
  const [empEmail, setEmpEmail] = useState("");
  const [empPassword, setEmpPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [tRes, eRes, iRes] = await Promise.all([
        fetch("/api/tasks"),
        fetch("/api/employees"),
        fetch("/api/admin/insights"),
      ]);
      if (tRes.ok) {
        const data = (await tRes.json()) as { tasks: Task[] };
        setTasks(data.tasks);
        setAssignTaskId((prev) => prev || data.tasks[0]?.id || "");
      }
      if (eRes.ok) {
        const data = (await eRes.json()) as { employees: Employee[] };
        setEmployees(data.employees);
        setAssignEmployeeId((prev) => prev || data.employees[0]?.id || "");
      }
      if (iRes.ok) {
        setInsights((await iRes.json()) as Insight);
      }
    } catch {
      setError("Failed to load data");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTask(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const allowedUrlPatterns = patterns
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        expectedMinutes,
        allowedUrlPatterns,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create task");
      return;
    }
    setMessage("Task created.");
    await load();
  }

  async function assignTask(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await fetch(`/api/tasks/${assignTaskId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId: assignEmployeeId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not assign");
      return;
    }
    setMessage("Assignment created.");
    await load();
  }

  async function createEmployee(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await fetch("/api/admin/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: empName,
        email: empEmail,
        password: empPassword,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create employee");
      return;
    }
    setMessage("Employee account created.");
    setEmpPassword("");
    await load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400">
              HR / Admin
            </p>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              WorkFlowGuard
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

      <main className="mx-auto max-w-6xl space-y-10 px-4 py-10">
        {process.env.NEXT_PUBLIC_USE_MOCK === "true" ? (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            <strong>Mock demo data</strong> — nothing is saved to a database. Safe for judge presentations.
          </p>
        ) : null}
        {message ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        ) : null}

        <section className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Create task
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Define expected time and URL/path fragments that count as on-task
              (e.g. <code className="text-xs">dashboard</code>,{" "}
              <code className="text-xs">profile</code>).
            </p>
            <form onSubmit={createTask} className="mt-4 space-y-3">
              <input
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                placeholder="Description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="flex gap-2">
                <label className="flex flex-1 flex-col text-sm">
                  Expected minutes
                  <input
                    type="number"
                    min={1}
                    className="mt-1 rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                    value={expectedMinutes}
                    onChange={(e) => setExpectedMinutes(Number(e.target.value))}
                  />
                </label>
              </div>
              <label className="block text-sm">
                Allowed URL patterns (comma or newline separated)
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                  value={patterns}
                  onChange={(e) => setPatterns(e.target.value)}
                />
              </label>
              <button
                type="submit"
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                Save task
              </button>
            </form>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Add employee
            </h2>
            <form onSubmit={createEmployee} className="mt-4 space-y-3">
              <input
                required
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                placeholder="Name"
                value={empName}
                onChange={(e) => setEmpName(e.target.value)}
              />
              <input
                required
                type="email"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                placeholder="Email"
                value={empEmail}
                onChange={(e) => setEmpEmail(e.target.value)}
              />
              <input
                required
                type="password"
                minLength={8}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
                placeholder="Password (min 8 chars)"
                value={empPassword}
                onChange={(e) => setEmpPassword(e.target.value)}
              />
              <button
                type="submit"
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
              >
                Create employee
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Assign task
          </h2>
          <form onSubmit={assignTask} className="mt-4 flex flex-wrap gap-4">
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              value={assignTaskId}
              onChange={(e) => setAssignTaskId(e.target.value)}
            >
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white"
              value={assignEmployeeId}
              onChange={(e) => setAssignEmployeeId(e.target.value)}
            >
              {employees.map((em) => (
                <option key={em.id} value={em.id}>
                  {em.name} ({em.email})
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Assign
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Smart insights (bottlenecks)
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Tasks where average completion time exceeds expected help HR improve
            workflows—not just watch individuals.
          </p>
          <ul className="mt-4 space-y-2">
            {insights?.bottlenecks.length ? (
              insights.bottlenecks.map((b) => (
                <li
                  key={b.taskId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <span className="font-medium text-zinc-900 dark:text-white">
                    {b.title}
                  </span>
                  <span className="text-zinc-600 dark:text-zinc-400">
                    Avg {b.avgMinutes} min · expected {b.expectedMinutes} min · n=
                    {b.sampleSize}
                    {b.isBottleneck ? (
                      <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                        bottleneck
                      </span>
                    ) : null}
                  </span>
                </li>
              ))
            ) : (
              <li className="text-sm text-zinc-500">
                No completed assignments yet—insights appear after tasks are
                finished.
              </li>
            )}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Tasks
          </h2>
          <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
            {tasks.map((t) => (
              <li key={t.id} className="py-3 text-sm">
                <p className="font-medium text-zinc-900 dark:text-white">
                  {t.title}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Expected {t.expectedMinutes} min · patterns:{" "}
                  {t.allowedUrlPatterns.join(", ")}
                </p>
              </li>
            ))}
            {!tasks.length ? (
              <li className="py-3 text-zinc-500">No tasks yet.</li>
            ) : null}
          </ul>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Recent assignments
          </h2>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-500 dark:border-zinc-800">
                  <th className="py-2 pr-4">Employee</th>
                  <th className="py-2 pr-4">Task</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {insights?.recentAssignments.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-zinc-100 dark:border-zinc-800"
                  >
                    <td className="py-2 pr-4">
                      {a.employeeName}
                      <br />
                      <span className="text-xs text-zinc-500">{a.employeeEmail}</span>
                    </td>
                    <td className="py-2 pr-4">{a.taskTitle}</td>
                    <td className="py-2 pr-4 capitalize">{a.status.replace("_", " ")}</td>
                    <td className="py-2">
                      {a.latestSnapshot ? (
                        <span>
                          {a.latestSnapshot.score}/100 —{" "}
                          {a.latestSnapshot.classification}
                        </span>
                      ) : (
                        <span className="text-zinc-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
