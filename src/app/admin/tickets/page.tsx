"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { BeautifulEmptyState } from "@/components/admin/BeautifulEmptyState";

type User = { id: string; name: string; email: string; role: string };
type Ticket = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  priority: string;
  allowedApps: string[];
  assignedDeveloperId: string | null;
  testerId: string | null;
  blockedUrlPatterns: string[];
};

const inputClass =
  "w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors";
const selectClass =
  "w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors";

const priorityMeta: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  urgent: { label: "Urgent", dot: "bg-red-400",    text: "text-red-300",    bg: "bg-red-500/10 border-red-500/25" },
  high:   { label: "High",   dot: "bg-orange-400", text: "text-orange-300", bg: "bg-orange-500/10 border-orange-500/25" },
  medium: { label: "Medium", dot: "bg-yellow-400", text: "text-yellow-300", bg: "bg-yellow-500/10 border-yellow-500/25" },
  low:    { label: "Low",    dot: "bg-green-400",  text: "text-green-300",  bg: "bg-green-500/10 border-green-500/25" },
};

const statusMeta: Record<string, { label: string; dot: string; text: string; bg: string }> = {
  open:        { label: "Open",        dot: "bg-blue-400",    text: "text-blue-300",    bg: "bg-blue-500/10 border-blue-500/25" },
  in_progress: { label: "In progress", dot: "bg-amber-400",   text: "text-amber-300",   bg: "bg-amber-500/10 border-amber-500/25" },
  testing:     { label: "Testing",     dot: "bg-violet-400",  text: "text-violet-300",  bg: "bg-violet-500/10 border-violet-500/25" },
  closed:      { label: "Closed",      dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-500/10 border-emerald-500/25" },
};

type ActiveForm = "create" | "assign";

export default function AdminTicketsPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeForm, setActiveForm] = useState<ActiveForm>("create");
  const [loading, setLoading] = useState(true);

  // Create ticket form
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDescription, setTicketDescription] = useState("");
  const [ticketType, setTicketType] = useState("task");
  const [ticketPriority, setTicketPriority] = useState("high");
  const [ticketApps, setTicketApps] = useState("dashboard,profile,analytics");
  const [ticketDeveloperId, setTicketDeveloperId] = useState("");
  const [ticketTesterId, setTicketTesterId] = useState("");
  const [ticketBlocked, setTicketBlocked] = useState("");

  // Assign form
  const [assignTicketId, setAssignTicketId] = useState("");
  const [assignDeveloperId, setAssignDeveloperId] = useState("");
  const [assignTesterId, setAssignTesterId] = useState("");

  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const developerUsers = users.filter((u) => u.role === "developer");
  const testerUsers = users.filter((u) => u.role === "tester");

  const load = useCallback(async () => {
    try {
      const [usersRes, ticketsRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/tickets"),
      ]);
      const usersData = usersRes.ok
        ? ((await usersRes.json()) as { users: User[] }).users
        : [];
      const ticketsData = ticketsRes.ok
        ? ((await ticketsRes.json()) as { tickets: Ticket[] }).tickets
        : [];

      setUsers(usersData);
      setTickets(ticketsData);

      const firstDev = usersData.find((u) => u.role === "developer");
      const firstTester = usersData.find((u) => u.role === "tester");
      setTicketDeveloperId((prev) => prev || firstDev?.id || "");
      setTicketTesterId((prev) => prev || firstTester?.id || "");
      setAssignDeveloperId((prev) => prev || firstDev?.id || "");
      setAssignTesterId((prev) => prev || firstTester?.id || "");
      setAssignTicketId((prev) => prev || ticketsData[0]?.id || "");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const allowedApps = ticketApps.split(/[,\n]+/).map((v) => v.trim()).filter(Boolean);
    const blockedUrlPatterns = ticketBlocked.split(/[,\n]+/).map((v) => v.trim()).filter(Boolean);
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: ticketTitle,
        description: ticketDescription,
        type: ticketType,
        priority: ticketPriority,
        allowedApps,
        assignedDeveloperId: ticketDeveloperId || null,
        testerId: ticketTesterId || null,
        blockedUrlPatterns,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) { setError(data.error ?? "Could not create ticket"); return; }
    setMessage("Ticket created successfully.");
    await load();
  }

  async function assignTicket(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await fetch(`/api/tickets/${assignTicketId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ developerId: assignDeveloperId, testerId: assignTesterId || null }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) { setError(data.error ?? "Could not assign ticket"); return; }
    setMessage("Ticket assignment updated.");
    await load();
  }

  return (
    <div className="space-y-8">
      {/* ── Form selector tabs ───────────────────────────────── */}
      <div className="flex gap-2">
        {(["create", "assign"] as ActiveForm[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setActiveForm(tab); setMessage(null); setError(null); }}
            className={`rounded-xl px-5 py-2.5 text-sm font-semibold capitalize transition-all ${
              activeForm === tab
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                : "border border-white/10 bg-white/3 text-zinc-300 hover:bg-white/6"
            }`}
          >
            {tab === "create" ? "Create ticket" : "Reassign ticket"}
          </button>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
        {/* ── Left: Active form ──────────────────────────────── */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          {activeForm === "create" ? (
            <>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/15">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4 text-amber-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-white">Create ticket</h2>
              </div>
              <p className="mb-5 text-sm text-zinc-400">Define a new task or bug and optionally assign it immediately.</p>
              <form onSubmit={createTicket} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Title</label>
                  <input className={inputClass} value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} placeholder="Ticket title" required />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Description</label>
                  <textarea className={inputClass} value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)} placeholder="Description" rows={3} />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Type</label>
                    <select className={selectClass} value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
                      <option value="task">Task</option>
                      <option value="bug">Bug</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Priority</label>
                    <select className={selectClass} value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)}>
                      <option value="urgent">🔴 Urgent</option>
                      <option value="high">🟠 High</option>
                      <option value="medium">🟡 Medium</option>
                      <option value="low">🟢 Low</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Allowed apps</label>
                  <input className={inputClass} value={ticketApps} onChange={(e) => setTicketApps(e.target.value)} placeholder="dashboard,profile,analytics" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Blocked URLs <span className="text-zinc-600 normal-case font-normal">(optional)</span></label>
                  <input className={inputClass} value={ticketBlocked} onChange={(e) => setTicketBlocked(e.target.value)} placeholder="Comma-separated patterns" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Assign developer</label>
                    <select className={selectClass} value={ticketDeveloperId} onChange={(e) => setTicketDeveloperId(e.target.value)}>
                      <option value="">None</option>
                      {developerUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Assign tester</label>
                    <select className={selectClass} value={ticketTesterId} onChange={(e) => setTicketTesterId(e.target.value)}>
                      <option value="">None</option>
                      {testerUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                  </div>
                </div>

                {message && <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}
                {error && <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

                <button type="submit" className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500">
                  Create ticket
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 mb-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4 text-violet-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <h2 className="text-base font-semibold text-white">Reassign ticket</h2>
              </div>
              <p className="mb-5 text-sm text-zinc-400">Update the developer or tester assignment on an existing ticket.</p>
              <form onSubmit={assignTicket} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Ticket</label>
                  <select className={selectClass} value={assignTicketId} onChange={(e) => setAssignTicketId(e.target.value)}>
                    {tickets.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
                    {!tickets.length && <option value="">No tickets yet</option>}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Developer</label>
                  <select className={selectClass} value={assignDeveloperId} onChange={(e) => setAssignDeveloperId(e.target.value)}>
                    {developerUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Tester <span className="text-zinc-600 normal-case font-normal">(optional)</span></label>
                  <select className={selectClass} value={assignTesterId} onChange={(e) => setAssignTesterId(e.target.value)}>
                    <option value="">No tester</option>
                    {testerUsers.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>

                {message && <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>}
                {error && <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>}

                <button type="submit" className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500">
                  Update assignment
                </button>
              </form>
            </>
          )}
        </div>

        {/* ── Right: Tickets list ─────────────────────────────── */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">All tickets</h2>
            <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">
              {tickets.length} total
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : tickets.length > 0 ? (
            <div className="space-y-3">
              {tickets.map((ticket) => {
                const p = priorityMeta[ticket.priority] ?? priorityMeta.medium;
                const s = statusMeta[ticket.status] ?? statusMeta.open;
                return (
                  <article key={ticket.id} className="rounded-xl border border-white/8 p-4 transition-colors hover:border-white/14">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${ticket.type === "bug" ? "bg-rose-500/10 border-rose-500/25 text-rose-300" : "bg-indigo-500/10 border-indigo-500/25 text-indigo-300"}`}>
                            {ticket.type === "bug" ? "Bug" : "Task"}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${p.bg} ${p.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${p.dot}`} />
                            {p.label}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold border ${s.bg} ${s.text}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                            {s.label}
                          </span>
                        </div>
                        <h3 className="font-semibold text-white">{ticket.title}</h3>
                        <p className="mt-1 text-sm text-zinc-400 line-clamp-1">{ticket.description}</p>
                        <p className="mt-1.5 text-xs text-zinc-500">Apps: {ticket.allowedApps.join(", ")}</p>
                      </div>
                      <Link
                        href={`/workspace/${ticket.id}/dashboard`}
                        className="shrink-0 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-white/10"
                      >
                        Workspace →
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <BeautifulEmptyState
              title="No tickets yet"
              hint="Create your first ticket from the form to start workflow tracking."
            />
          )}
        </div>
      </div>
    </div>
  );
}
