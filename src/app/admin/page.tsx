"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Org = { id: string; name: string; slug: string };
type User = { id: string; orgId: string; email: string; name: string; role: string };
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
  creatorName?: string;
  blockedUrlPatterns: string[];
};

export default function AdminPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [orgName, setOrgName] = useState("Acme Studio");
  const [orgSlug, setOrgSlug] = useState("");
  const [userName, setUserName] = useState("Jamie Rivera");
  const [userEmail, setUserEmail] = useState("jamie@acme.local");
  const [userPassword, setUserPassword] = useState("change-me-now");
  const [userRole, setUserRole] = useState("developer");
  const [userOrgId, setUserOrgId] = useState("");
  const [ticketTitle, setTicketTitle] = useState("Build login flow");
  const [ticketDescription, setTicketDescription] = useState(
    "Implement the login form, validation, and error states."
  );
  const [ticketType, setTicketType] = useState("task");
  const [ticketPriority, setTicketPriority] = useState("high");
  const [ticketApps, setTicketApps] = useState("dashboard,profile,analytics");
  const [ticketDeveloperId, setTicketDeveloperId] = useState("");
  const [ticketTesterId, setTicketTesterId] = useState("");
  const [ticketBlocked, setTicketBlocked] = useState("");
  const [assignTicketId, setAssignTicketId] = useState("");
  const [assignDeveloperId, setAssignDeveloperId] = useState("");
  const [assignTesterId, setAssignTesterId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [orgsRes, usersRes, ticketsRes] = await Promise.all([
        fetch("/api/orgs"),
        fetch("/api/users"),
        fetch("/api/tickets"),
      ]);

      if (orgsRes.ok) {
        const data = (await orgsRes.json()) as { orgs: Org[] };
        setOrgs(data.orgs);
        setUserOrgId((prev) => prev || data.orgs[0]?.id || "");
      }
      if (usersRes.ok) {
        const data = (await usersRes.json()) as { users: User[] };
        setUsers(data.users);
        const firstDeveloper = data.users.find((user) => user.role === "developer");
        const firstTester = data.users.find((user) => user.role === "tester");
        setTicketDeveloperId((prev) => prev || firstDeveloper?.id || "");
        setTicketTesterId((prev) => prev || firstTester?.id || "");
        setAssignDeveloperId((prev) => prev || firstDeveloper?.id || "");
        setAssignTesterId((prev) => prev || firstTester?.id || "");
      }
      if (ticketsRes.ok) {
        const data = (await ticketsRes.json()) as { tickets: Ticket[] };
        setTickets(data.tickets);
        setAssignTicketId((prev) => prev || data.tickets[0]?.id || "");
      }
    } catch {
      setError("Failed to load admin data");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createOrg(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: orgName, slug: orgSlug || undefined }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not create org");
      return;
    }
    setMessage("Organization created.");
    setOrgSlug("");
    await load();
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orgId: userOrgId || undefined,
        name: userName,
        email: userEmail,
        password: userPassword,
        role: userRole,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not create user");
      return;
    }
    setMessage("User created.");
    await load();
  }

  async function createTicket(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const allowedApps = ticketApps
      .split(/[,\n]+/)
      .map((value) => value.trim())
      .filter(Boolean);
    const blockedUrlPatterns = ticketBlocked.split(/[,\n]+/).map((value) => value.trim()).filter(Boolean);
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
    if (!res.ok) {
      setError(data.error ?? "Could not create ticket");
      return;
    }
    setMessage("Ticket created.");
    await load();
  }

  async function assignTicket(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setError(null);
    const res = await fetch(`/api/tickets/${assignTicketId}/assign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        developerId: assignDeveloperId,
        testerId: assignTesterId || null,
      }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(data.error ?? "Could not assign ticket");
      return;
    }
    setMessage("Ticket assignment updated.");
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
            <p className="text-xs font-semibold uppercase text-indigo-600 dark:text-indigo-400">HR / Manager</p>
            <h1 className="text-xl font-bold text-zinc-900 dark:text-white">WorkFlowGuard control panel</h1>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400">Home</Link>
            <button type="button" onClick={() => void logout()} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">Log out</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        {message ? <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">{message}</p> : null}
        {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-100">{error}</p> : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={createOrg} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Create org</h2>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Organization name" />
              <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={orgSlug} onChange={(e) => setOrgSlug(e.target.value)} placeholder="Slug (optional)" />
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Create org</button>
            </div>
          </form>

          <form onSubmit={createUser} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Create user</h2>
            <div className="mt-4 space-y-3">
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={userOrgId} onChange={(e) => setUserOrgId(e.target.value)}>
                {orgs.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
              </select>
              <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Name" />
              <input type="email" className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Email" />
              <input type="password" className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="Password" />
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="developer">Developer</option>
                <option value="tester">Tester</option>
              </select>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Create user</button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form onSubmit={createTicket} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Create ticket</h2>
            <div className="mt-4 space-y-3">
              <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={ticketTitle} onChange={(e) => setTicketTitle(e.target.value)} placeholder="Title" />
              <textarea className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={ticketDescription} onChange={(e) => setTicketDescription(e.target.value)} placeholder="Description" rows={3} />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={ticketType} onChange={(e) => setTicketType(e.target.value)}>
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                </select>
                <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={ticketPriority} onChange={(e) => setTicketPriority(e.target.value)}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={ticketApps} onChange={(e) => setTicketApps(e.target.value)} placeholder="Allowed apps, comma-separated" />
              <input className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={ticketBlocked} onChange={(e) => setTicketBlocked(e.target.value)} placeholder="Blocked urls or paths, comma-separated" />
              <div className="grid gap-3 sm:grid-cols-2">
                <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={ticketDeveloperId} onChange={(e) => setTicketDeveloperId(e.target.value)}>
                  <option value="">Assign developer</option>
                  {users.filter((user) => user.role === "developer").map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
                <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={ticketTesterId} onChange={(e) => setTicketTesterId(e.target.value)}>
                  <option value="">Assign tester</option>
                  {users.filter((user) => user.role === "tester").map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
                </select>
              </div>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Create ticket</button>
            </div>
          </form>

          <form onSubmit={assignTicket} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Assign existing ticket</h2>
            <div className="mt-4 space-y-3">
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={assignTicketId} onChange={(e) => setAssignTicketId(e.target.value)}>
                {tickets.map((ticket) => <option key={ticket.id} value={ticket.id}>{ticket.title}</option>)}
              </select>
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={assignDeveloperId} onChange={(e) => setAssignDeveloperId(e.target.value)}>
                {users.filter((user) => user.role === "developer").map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
              <select className="w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-950 dark:text-white" value={assignTesterId} onChange={(e) => setAssignTesterId(e.target.value)}>
                <option value="">No tester</option>
                {users.filter((user) => user.role === "tester").map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}
              </select>
              <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Update assignment</button>
            </div>
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Organizations</h2>
            <div className="mt-4 space-y-2">
              {orgs.map((org) => (
                <div key={org.id} className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <p className="font-medium text-zinc-900 dark:text-white">{org.name}</p>
                  <p className="text-xs text-zinc-500">{org.slug}</p>
                </div>
              ))}
              {!orgs.length ? <p className="text-sm text-zinc-500">No orgs yet.</p> : null}
            </div>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Users</h2>
            <div className="mt-4 space-y-2">
              {users.map((user) => (
                <div key={user.id} className="rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <p className="font-medium text-zinc-900 dark:text-white">{user.name} <span className="text-xs uppercase text-zinc-500">{user.role}</span></p>
                  <p className="text-xs text-zinc-500">{user.email}</p>
                </div>
              ))}
              {!users.length ? <p className="text-sm text-zinc-500">No users yet.</p> : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">Tickets</h2>
          <div className="mt-4 grid gap-4">
            {tickets.map((ticket) => (
              <article key={ticket.id} className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-white">{ticket.title}</h3>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{ticket.description}</p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-zinc-500">{ticket.type} · {ticket.priority} · {ticket.status}</p>
                    <p className="mt-2 text-xs text-zinc-500">Allowed apps: {ticket.allowedApps.join(", ")}</p>
                    <p className="mt-1 text-xs text-zinc-500">Blocked patterns: {ticket.blockedUrlPatterns.join(", ") || "None"}</p>
                  </div>
                  <Link href={`/workspace/${ticket.id}/dashboard`} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">Open workspace</Link>
                </div>
              </article>
            ))}
            {!tickets.length ? <p className="text-sm text-zinc-500">No tickets yet.</p> : null}
          </div>
        </section>
      </main>
    </div>
  );
}