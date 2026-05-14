"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BeautifulEmptyState } from "@/components/admin/BeautifulEmptyState";

type User = { id: string; orgId: string; email: string; name: string; role: string };

const inputClass =
  "w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors";
const selectClass =
  "w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30 transition-colors";

const roleMeta: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  hr: { label: "HR", bg: "bg-indigo-500/15", text: "text-indigo-300", dot: "bg-indigo-400" },
  manager: { label: "Manager", bg: "bg-violet-500/15", text: "text-violet-300", dot: "bg-violet-400" },
  developer: { label: "Developer", bg: "bg-cyan-500/15", text: "text-cyan-300", dot: "bg-cyan-400" },
  tester: { label: "Tester", bg: "bg-emerald-500/15", text: "text-emerald-300", dot: "bg-emerald-400" },
};

const roles = ["hr", "manager", "developer", "tester"] as const;

export default function AdminUsersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      }
    >
      <AdminUsersContent />
    </Suspense>
  );
}

function AdminUsersContent() {
  const searchParams = useSearchParams();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userRole, setUserRole] = useState<string>("developer");
  const [sendCredentialsEmail, setSendCredentialsEmail] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const r = searchParams.get("role");
    if (r && roles.includes(r as (typeof roles)[number])) {
      setUserRole(r);
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    try {
      const [meRes, usersRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/users")]);
      if (meRes.ok) {
        const me = (await meRes.json()) as { org?: { name: string } | null };
        setOrgName(me.org?.name ?? null);
      }
      const usersData = usersRes.ok ? ((await usersRes.json()) as { users: User[] }).users : [];
      setUsers(usersData);
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
      data.notification?.attempted ? `User created. ${data.notification.message}` : "User created successfully."
    );
    setUserName("");
    setUserEmail("");
    setUserPassword("");
    await load();
  }

  const byRole = (r: string) => users.filter((u) => u.role === r);

  return (
    <div className="grid gap-8 lg:grid-cols-[400px_1fr]">
      <div className="space-y-6">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h2 className="text-base font-medium text-white">Invite someone</h2>
          <p className="mt-1 text-sm text-zinc-400">
            They land in <span className="text-zinc-200">{orgName ?? "this org"}</span> — not anywhere else.
          </p>

          <form onSubmit={createUser} className="mt-5 space-y-4">
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Role</label>
              <select className={selectClass} value={userRole} onChange={(e) => setUserRole(e.target.value)}>
                <option value="hr">HR</option>
                <option value="manager">Manager</option>
                <option value="developer">Developer</option>
                <option value="tester">Tester (QA)</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Name</label>
              <input className={inputClass} value={userName} onChange={(e) => setUserName(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Email</label>
              <input type="email" className={inputClass} value={userEmail} onChange={(e) => setUserEmail(e.target.value)} required />
            </div>
            <div>
              <label className="mb-1.5 block text-xs text-zinc-500">Password</label>
              <input type="password" className={inputClass} value={userPassword} onChange={(e) => setUserPassword(e.target.value)} required />
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/8 px-3.5 py-2.5 text-sm text-zinc-300">
              <input
                type="checkbox"
                className="h-4 w-4 rounded accent-indigo-500"
                checked={sendCredentialsEmail}
                onChange={(e) => setSendCredentialsEmail(e.target.checked)}
              />
              Email login details to them (devs and testers)
            </label>
            {message ? <p className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">{message}</p> : null}
            {error ? <p className="rounded-xl border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</p> : null}
            <button
              type="submit"
              className="w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 hover:bg-indigo-500"
            >
              Create account
            </button>
          </form>
        </div>
      </div>

      <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-base font-medium text-white">Directory</h2>
          <span className="rounded-full bg-violet-500/15 px-2.5 py-0.5 text-xs font-semibold text-violet-300">{users.length}</span>
        </div>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : users.length === 0 ? (
          <BeautifulEmptyState title="No one here yet" hint="Use the form on the left to add people." />
        ) : (
          <div className="space-y-6">
            {(["hr", "manager", "developer", "tester"] as const).map((roleKey) => {
              const list = byRole(roleKey);
              const meta = roleMeta[roleKey];
              return (
                <div key={roleKey}>
                  <h3 className="mb-2 text-xs font-medium text-zinc-500">
                    {meta.label} · {list.length}
                  </h3>
                  <div className="space-y-2">
                    {list.map((u) => (
                      <div key={u.id} className="flex items-center justify-between rounded-xl border border-white/8 px-4 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.bg} text-xs font-bold ${meta.text}`}>
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">{u.name}</p>
                            <p className="truncate text-xs text-zinc-500">{u.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {list.length === 0 ? <p className="text-sm text-zinc-600">None yet.</p> : null}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
