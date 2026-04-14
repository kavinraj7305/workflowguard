"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Ticket = {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  type: string;
  assignedDeveloperId: string | null;
};

type User = { id: string; name: string; email: string; role: string };

const priorityOptions = [
  {
    value: "urgent",
    label: "Urgent",
    text: "text-red-300",
    bg: "bg-red-500/12",
    border: "border-red-500/30",
    activeBg: "bg-red-500",
    dot: "bg-red-400",
  },
  {
    value: "high",
    label: "High",
    text: "text-orange-300",
    bg: "bg-orange-500/12",
    border: "border-orange-500/30",
    activeBg: "bg-orange-500",
    dot: "bg-orange-400",
  },
  {
    value: "medium",
    label: "Medium",
    text: "text-yellow-300",
    bg: "bg-yellow-500/12",
    border: "border-yellow-500/30",
    activeBg: "bg-yellow-500",
    dot: "bg-yellow-400",
  },
  {
    value: "low",
    label: "Low",
    text: "text-green-300",
    bg: "bg-green-500/12",
    border: "border-green-500/30",
    activeBg: "bg-green-500",
    dot: "bg-green-400",
  },
];

const statusMeta: Record<
  string,
  { label: string; dot: string; text: string; bg: string }
> = {
  open: {
    label: "Open",
    dot: "bg-blue-400",
    text: "text-blue-300",
    bg: "bg-blue-500/10 border-blue-500/25",
  },
  in_progress: {
    label: "In progress",
    dot: "bg-amber-400",
    text: "text-amber-300",
    bg: "bg-amber-500/10 border-amber-500/25",
  },
  testing: {
    label: "Testing",
    dot: "bg-violet-400",
    text: "text-violet-300",
    bg: "bg-violet-500/10 border-violet-500/25",
  },
  closed: {
    label: "Closed",
    dot: "bg-emerald-400",
    text: "text-emerald-300",
    bg: "bg-emerald-500/10 border-emerald-500/25",
  },
};

const inputClass =
  "w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors";

export default function TesterPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [developers, setDevelopers] = useState<User[]>([]);
  const [title, setTitle] = useState("Login bug");
  const [description, setDescription] = useState(
    "The login button does not respond on smaller screens."
  );
  const [priority, setPriority] = useState("high");
  const [developerId, setDeveloperId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [ticketsRes, usersRes] = await Promise.all([
        fetch("/api/tickets?scope=testing"),
        fetch("/api/users?role=developer"),
      ]);
      if (ticketsRes.ok) {
        const data = (await ticketsRes.json()) as { tickets: Ticket[] };
        setTickets(data.tickets);
      }
      if (usersRes.ok) {
        const data = (await usersRes.json()) as { users: User[] };
        setDevelopers(data.users);
        setDeveloperId((prev) => prev || data.users[0]?.id || "");
      }
    } catch {
      setError("Failed to load tester data");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createBug(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        description,
        type: "bug",
        priority,
        assignedDeveloperId: developerId || null,
        allowedApps: ["dashboard", "profile", "analytics"],
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not create bug");
      return;
    }
    setMessage("Bug ticket created.");
    await load();
  }

  async function closeTicket(id: string) {
    setMessage(null);
    setError(null);
    const res = await fetch(`/api/tickets/${id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "closed" }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not close ticket");
      return;
    }
    setMessage("Ticket closed.");
    await load();
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#020617]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
                className="h-5 w-5 text-emerald-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Tester
              </p>
              <h1 className="text-lg font-bold text-white leading-tight">
                Bug Triage
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Home
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[380px_1fr]">
        {/* ── Bug form ─────────────────────────────────────────── */}
        <section className="rounded-2xl border border-white/8 bg-white/3 p-6 h-fit">
          <div className="flex items-center gap-2 mb-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-rose-500/15">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
                className="h-3.5 w-3.5 text-rose-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
                />
              </svg>
            </span>
            <h2 className="text-base font-semibold text-white">File a bug</h2>
          </div>
          <p className="mb-5 text-sm text-zinc-400">
            Describe the issue and assign it to a developer.
          </p>

          <form onSubmit={createBug} className="space-y-4">
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bug title"
            />
            <textarea
              className={inputClass}
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail"
            />

            {/* Priority selector */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Priority
              </p>
              <div className="grid grid-cols-2 gap-2">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition-all ${
                      priority === opt.value
                        ? `${opt.activeBg} border-transparent text-white shadow-lg`
                        : `${opt.bg} ${opt.border} ${opt.text} hover:opacity-80`
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${priority === opt.value ? "bg-white" : opt.dot}`}
                    />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Developer */}
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Assign to developer
              </p>
              <select
                className="w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/60 focus:outline-none"
                value={developerId}
                onChange={(e) => setDeveloperId(e.target.value)}
              >
                {developers.map((dev) => (
                  <option key={dev.id} value={dev.id}>
                    {dev.name} · {dev.email}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-rose-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20 transition-all hover:bg-rose-500"
            >
              Create bug ticket
            </button>
          </form>

          {message && (
            <p className="mt-4 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              {message}
            </p>
          )}
          {error && (
            <p className="mt-4 rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
              {error}
            </p>
          )}
        </section>

        {/* ── Tickets for testing ──────────────────────────────── */}
        <section>
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-white">
              Tickets ready for testing
            </h2>
            <p className="mt-1 text-sm text-zinc-400">
              Review each ticket, verify the developer's screenshot, and close
              it once confirmed.
            </p>
          </div>

          <div className="space-y-4">
            {tickets.map((ticket) => {
              const p =
                priorityOptions.find((o) => o.value === ticket.priority) ??
                priorityOptions[2];
              const s = statusMeta[ticket.status] ?? statusMeta.open;
              return (
                <article
                  key={ticket.id}
                  className="rounded-2xl border border-white/8 bg-white/3 p-5 transition-all hover:border-white/14"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Badges */}
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 text-xs font-semibold text-rose-300">
                          Bug
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${p.bg} ${p.border} ${p.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${p.dot}`}
                          />
                          {p.label}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${s.bg} ${s.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${s.dot}`}
                          />
                          {s.label}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-white">
                        {ticket.title}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-400">
                        {ticket.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => void closeTicket(ticket.id)}
                      className="shrink-0 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition-all hover:bg-emerald-500 hover:-translate-y-0.5"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2}
                        stroke="currentColor"
                        className="h-4 w-4"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                      Close ticket
                    </button>
                  </div>
                </article>
              );
            })}

            {!tickets.length && (
              <div className="rounded-2xl border border-white/8 bg-white/3 p-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-800">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.4}
                    stroke="currentColor"
                    className="h-6 w-6 text-zinc-400"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-sm font-medium text-white">
                  No tickets waiting
                </p>
                <p className="mt-1 text-sm text-zinc-500">
                  Tickets will appear here when developers move them to testing.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
