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

export default function TesterPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [developers, setDevelopers] = useState<User[]>([]);
  const [title, setTitle] = useState("Login bug");
  const [description, setDescription] = useState("The login button does not respond on smaller screens.");
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
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400">
              Tester
            </p>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">
              Bug triage
            </h1>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">Home</Link>
            <button type="button" onClick={() => void logout()} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">Log out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[360px_1fr]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Add bug</h2>
          <form onSubmit={createBug} className="mt-4 space-y-3">
            <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Bug title" />
            <textarea className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe the issue" />
            <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={developerId} onChange={(e) => setDeveloperId(e.target.value)}>
              {developers.map((dev) => (
                <option key={dev.id} value={dev.id}>{dev.name} · {dev.email}</option>
              ))}
            </select>
            <button type="submit" className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Create bug</button>
          </form>
          {message ? <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-400">{message}</p> : null}
          {error ? <p className="mt-3 text-sm text-red-700 dark:text-red-400">{error}</p> : null}
        </section>

        <section className="space-y-4">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Review tickets ready for verification, then close them after the developer uploads a screenshot.</p>
          <div className="grid gap-4">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">{ticket.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{ticket.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{ticket.type} · {ticket.priority} · {ticket.status}</p>
                  </div>
                  <button type="button" onClick={() => void closeTicket(ticket.id)} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500">Close</button>
                </div>
              </article>
            ))}
            {!tickets.length ? <p className="text-sm text-zinc-500">No tickets are waiting for testing right now.</p> : null}
          </div>
        </section>
      </main>
    </div>
  );
}