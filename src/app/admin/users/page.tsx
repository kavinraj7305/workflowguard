"use client";

import { useCallback, useEffect, useState } from "react";
import { demoOrgs, demoUsers } from "@/lib/demo/mock-data";
import { BeautifulEmptyState } from "@/components/admin/BeautifulEmptyState";

type Org = { id: string; name: string; slug: string };
type User = { id: string; orgId: string; email: string; name: string; role: string };
type Ticket = { id: string; assignedDeveloperId: string | null; testerId: string | null; status: string };

const inputClass =
  "w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors";
const selectClass =
  "w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors";

const roleMeta: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  hr:        { label: "HR",        bg: "bg-indigo-500/15",  text: "text-indigo-300",  dot: "bg-indigo-400" },
  manager:   { label: "Manager",   bg: "bg-violet-500/15",  text: "text-violet-300",  dot: "bg-violet-400" },
  developer: { label: "Developer", bg: "bg-cyan-500/15",    text: "text-cyan-300",    dot: "bg-cyan-400" },
  tester:    { label: "Tester",    bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400" },
};

export default function AdminUsersPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userName, setUserName] = useState("Jamie Rivera");
  const [userEmail, setUserEmail] = useState("jamie@acme.local");
  const [userPassword, setUserPassword] = useState("change-me-now");
  const [userRole, setUserRole] = useState("developer");
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(true);
  const [userOrgId, setUserOrgId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const load = useCallback(async () => {
    try {
      const [orgsRes, usersRes, ticketsRes] = await Promise.all([
        fetch("/api/orgs"),
        fetch("/api/users"),
        fetch("/api/tickets"),
      ]);
      const orgsData = orgsRes.ok
        ? ((await orgsRes.json()) as { orgs: Org[] }).orgs
        : [];
      const usersData = usersRes.ok
        ? ((await usersRes.json()) as { users: User[] }).users
        : [];
      const ticketsData = ticketsRes.ok
        ? ((await ticketsRes.json()) as { tickets: Ticket[] }).tickets
        : [];
      const useMock = orgsData.length === 0 && usersData.length === 0;
      if (useMock) {
        setOrgs(demoOrgs as Org[]);
        setUsers(demoUsers as User[]);
        setTickets([]);
        setUserOrgId((prev) => prev || demoOrgs[0]?.id || "");
      } else {
        setOrgs(orgsData);
        setUsers(usersData);
        setTickets(ticketsData);
        setUserOrgId((prev) => prev || orgsData[0]?.id || "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

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
        sendCredentialsEmail,
      }),
    });
    const data = (await res.json()) as {
      error?: string;
      notification?: { attempted: boolean; sent: boolean; message: string };
    };
    if (!res.ok) {
      setError(data.error ?? "Could not create user");
      return;
    }
    setMessage(
      data.notification?.attempted
        ? `User created. ${data.notification.message}`
        : "User created successfully."
    );
    await load();
  }

  const developerUsers = users.filter((u) => u.role === "developer");
  const testerUsers = users.filter((u) => u.role === "tester");

  function ticketLoadForUser(userId: string) {
    return tickets.filter(
      (t) => t.assignedDeveloperId === userId || t.testerId === userId
    ).length;
  }

  function moodForUser(user: User) {
    const loadCount = ticketLoadForUser(user.id);
    const inProgress = tickets.filter(
      (t) =>
        (t.assignedDeveloperId === user.id || t.testerId === user.id) &&
        t.status !== "closed"
    ).length;
    if (inProgress >= 4 || loadCount >= 6) return { label: "Overloaded", style: "bg-rose-500/15 text-rose-300" };
    if (inProgress >= 2) return { label: "Busy", style: "bg-amber-500/15 text-amber-300" };
    return { label: "Calm", style: "bg-emerald-500/15 text-emerald-300" };
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[420px_1fr]">
      {/* ── Left: Create user form ───────────────────────────── */}
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-violet-500/15">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4 text-violet-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
              </svg>
            </div>
            <h2 className="text-base font-semibold text-white">Add team member</h2>
          </div>
          <p className="mb-5 text-sm text-zinc-400">
            Create a new account and assign them a role within an organization.
          </p>

          <form onSubmit={createUser} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Organization</label>
              <select className={selectClass} value={userOrgId} onChange={(e) => setUserOrgId(e.target.value)}>
                {orgs.map((org) => (
                  <option key={org.id} value={org.id}>{org.name}</option>
                ))}
                {!orgs.length && <option value="">No organizations yet</option>}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Full name</label>
              <input className={inputClass} value={userName} onChange={(e) => setUserName(e.target.value)} placeholder="Full name" required />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Email address</label>
              <input type="email" className={inputClass} value={userEmail} onChange={(e) => setUserEmail(e.target.value)} placeholder="Email" required />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Password</label>
              <input type="password" className={inputClass} value={userPassword} onChange={(e) => setUserPassword(e.target.value)} placeholder="Password" required />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-zinc-400">Role</label>
              <select className={selectClass} value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="developer">Developer</option>
                <option value="tester">Tester</option>
              </select>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/8 px-3.5 py-2.5 text-sm text-zinc-300 transition-colors hover:border-white/15">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-indigo-500"
                checked={sendCredentialsEmail}
                onChange={(e) => setSendCredentialsEmail(e.target.checked)}
              />
              Email credentials to developer or tester
            </label>

            {message && (
              <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p>
            )}
            {error && (
              <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
            >
              Create user
            </button>
          </form>
        </div>
      </div>

      {/* ── Right: Team view + All users ────────────────────── */}
      <div className="space-y-6">
        {/* Team breakdown */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h2 className="mb-5 text-base font-semibold text-white">Team overview</h2>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Developers</h3>
                <div className="space-y-2">
                  {developerUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-xl border border-white/8 px-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-xs font-bold text-cyan-400">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{u.name}</p>
                        <p className="truncate text-xs text-zinc-500">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${moodForUser(u).style}`}>
                          {moodForUser(u).label}
                        </span>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {ticketLoadForUser(u.id)} tickets
                        </p>
                      </div>
                    </div>
                  ))}
                  {!developerUsers.length && <p className="text-sm text-zinc-500">No developers yet.</p>}
                </div>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Testers</h3>
                <div className="space-y-2">
                  {testerUsers.map((u) => (
                    <div key={u.id} className="flex items-center gap-3 rounded-xl border border-white/8 px-4 py-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-xs font-bold text-emerald-400">
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-white">{u.name}</p>
                        <p className="truncate text-xs text-zinc-500">{u.email}</p>
                      </div>
                      <div className="text-right">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${moodForUser(u).style}`}>
                          {moodForUser(u).label}
                        </span>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {ticketLoadForUser(u.id)} tickets
                        </p>
                      </div>
                    </div>
                  ))}
                  {!testerUsers.length && <p className="text-sm text-zinc-500">No testers yet.</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* All users */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">All users</h2>
            <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
              {users.length} total
            </span>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-2">
              {users.map((u) => {
                const meta = roleMeta[u.role] ?? roleMeta.developer;
                return (
                  <div key={u.id} className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${meta.bg} text-xs font-bold ${meta.text}`}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-white">{u.name}</p>
                        <p className="text-xs text-zinc-500">{u.email}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.bg} ${meta.text}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                      {meta.label}
                    </span>
                    <span className={`ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${moodForUser(u).style}`}>
                      {moodForUser(u).label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <BeautifulEmptyState
              title="No users yet"
              hint="Add team members so roles and assignments can begin."
            />
          )}
        </div>
      </div>
    </div>
  );
}
