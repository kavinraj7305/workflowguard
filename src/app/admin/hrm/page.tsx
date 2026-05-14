"use client";

import { useCallback, useEffect, useState } from "react";

type Person = {
  id: string;
  email: string;
  name: string;
  role: string;
  profileId: string | null;
  jobTitle: string | null;
  department: string | null;
  hireDate: string | null;
  workLocation: string | null;
};

type LeaveRow = {
  id: string;
  userId: string;
  startDate: string;
  endDate: string;
  kind: string;
  reason: string;
  status: string;
  requesterName: string;
  requesterEmail: string;
};

const inputClass =
  "w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30";

export default function AdminHrmPage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [coverage, setCoverage] = useState(0);
  const [requests, setRequests] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);

  const [leaveStart, setLeaveStart] = useState("");
  const [leaveEnd, setLeaveEnd] = useState("");
  const [leaveKind, setLeaveKind] = useState("pto");
  const [leaveReason, setLeaveReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [meRes, pRes, lRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/hrm/profiles"),
        fetch("/api/hrm/leave"),
      ]);
      if (meRes.ok) {
        const me = (await meRes.json()) as { user: { role: string } | null };
        setRole(me.user?.role ?? null);
      }
      if (pRes.ok) {
        const p = (await pRes.json()) as { people: Person[]; profileCoveragePercent: number };
        setPeople(p.people);
        setCoverage(p.profileCoveragePercent);
      } else {
        setPeople([]);
        setCoverage(0);
      }
      if (lRes.ok) {
        const l = (await lRes.json()) as { requests: LeaveRow[] };
        setRequests(l.requests);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const isHr = role === "hr" || role === "manager";

  const [edits, setEdits] = useState<Record<string, Partial<Person>>>({});

  function field(id: string, key: keyof Person, fallback: string) {
    const e = edits[id]?.[key];
    if (e !== undefined && e !== null) return String(e);
    const p = people.find((x) => x.id === id);
    const v = p?.[key];
    return v != null ? String(v) : fallback;
  }

  async function saveProfile(userId: string) {
    setSavingId(userId);
    setMessage(null);
    const e = edits[userId] ?? {};
    const person = people.find((p) => p.id === userId);
    const res = await fetch("/api/hrm/profiles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        jobTitle: e.jobTitle ?? person?.jobTitle ?? "",
        department: e.department ?? person?.department ?? "",
        hireDate: e.hireDate === "" ? null : (e.hireDate ?? person?.hireDate ?? null),
        workLocation: e.workLocation ?? person?.workLocation ?? "",
      }),
    });
    setSavingId(null);
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setMessage(j.error ?? "Could not save");
      return;
    }
    setMessage("Saved.");
    await load();
  }

  async function decideLeave(id: string, status: "approved" | "rejected") {
    setMessage(null);
    const res = await fetch("/api/hrm/leave", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setMessage(j.error ?? "Could not update");
      return;
    }
    await load();
  }

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const res = await fetch("/api/hrm/leave", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: leaveStart,
        endDate: leaveEnd,
        kind: leaveKind,
        reason: leaveReason,
      }),
    });
    if (!res.ok) {
      const j = (await res.json()) as { error?: string };
      setMessage(j.error ?? "Could not submit");
      return;
    }
    setLeaveReason("");
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-10">
      <div>
        <p className="text-xs text-zinc-500">People operations</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">HRM</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Job records and time off in one place. Profiles help payroll and reporting stay aligned with who actually
          works here.
        </p>
        {isHr ? (
          <p className="mt-2 text-sm text-emerald-300/90">
            Profile coverage: <strong>{coverage}%</strong> of people have an HR record on file.
          </p>
        ) : null}
      </div>

      {message ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200">{message}</p>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-500/10 via-transparent to-cyan-500/5 p-6">
        <h3 className="text-base font-medium text-white">Request time off</h3>
        <p className="mt-1 text-sm text-zinc-500">Anyone on the team can submit. HR or a manager approves below.</p>
        <form onSubmit={submitLeave} className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <input type="date" className={inputClass} value={leaveStart} onChange={(e) => setLeaveStart(e.target.value)} required />
          <input type="date" className={inputClass} value={leaveEnd} onChange={(e) => setLeaveEnd(e.target.value)} required />
          <select className={inputClass} value={leaveKind} onChange={(e) => setLeaveKind(e.target.value)}>
            <option value="pto">PTO</option>
            <option value="sick">Sick</option>
            <option value="other">Other</option>
          </select>
          <input className={inputClass} placeholder="Note (optional)" value={leaveReason} onChange={(e) => setLeaveReason(e.target.value)} />
          <div className="sm:col-span-2 lg:col-span-4">
            <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500">
              Submit request
            </button>
          </div>
        </form>
      </div>

      {isHr ? (
        <>
          <div>
            <h3 className="mb-3 text-base font-medium text-white">Employee records</h3>
            <div className="admin-scroll max-h-[28rem] overflow-x-auto rounded-2xl border border-white/10">
              <table className="min-w-[720px] w-full text-left text-sm">
                <thead className="sticky top-0 border-b border-white/10 bg-zinc-950/95 text-xs text-zinc-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Person</th>
                    <th className="px-4 py-3 font-medium">Role</th>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Department</th>
                    <th className="px-4 py-3 font-medium">Hired</th>
                    <th className="px-4 py-3 font-medium">Location</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {people.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{p.name}</p>
                        <p className="text-xs text-zinc-500">{p.email}</p>
                      </td>
                      <td className="px-4 py-3 text-zinc-400">{p.role}</td>
                      <td className="px-4 py-3">
                        <input
                          className={inputClass}
                          value={field(p.id, "jobTitle", "")}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], jobTitle: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className={inputClass}
                          value={field(p.id, "department", "")}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], department: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="date"
                          className={inputClass}
                          value={field(p.id, "hireDate", "")}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], hireDate: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <input
                          className={inputClass}
                          value={field(p.id, "workLocation", "")}
                          onChange={(e) =>
                            setEdits((prev) => ({
                              ...prev,
                              [p.id]: { ...prev[p.id], workLocation: e.target.value },
                            }))
                          }
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          disabled={savingId === p.id}
                          onClick={() => void saveProfile(p.id)}
                          className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-50"
                        >
                          {savingId === p.id ? "…" : "Save"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-base font-medium text-white">Leave inbox</h3>
            <div className="space-y-2">
              {requests.filter((r) => r.status === "pending").length === 0 ? (
                <p className="text-sm text-zinc-500">No pending requests.</p>
              ) : (
                requests
                  .filter((r) => r.status === "pending")
                  .map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
                    >
                      <div>
                        <p className="font-medium text-white">{r.requesterName}</p>
                        <p className="text-xs text-zinc-500">
                          {r.kind.toUpperCase()} · {r.startDate} → {r.endDate}
                        </p>
                        {r.reason ? <p className="mt-1 text-sm text-zinc-400">{r.reason}</p> : null}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => void decideLeave(r.id, "approved")}
                          className="rounded-lg bg-emerald-600/90 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => void decideLeave(r.id, "rejected")}
                          className="rounded-lg border border-white/15 bg-transparent px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-sm text-zinc-400">
          Employee records and approvals are visible to HR and managers. You can still submit time off above.
        </div>
      )}

      <div>
        <h3 className="mb-2 text-base font-medium text-white">Recent leave (everyone you can see)</h3>
        <div className="admin-scroll max-h-64 space-y-1 rounded-xl border border-white/10 p-3 text-sm">
          {requests.map((r) => (
            <div key={r.id} className="flex justify-between gap-2 border-b border-white/5 py-2 last:border-0">
              <span className="text-zinc-300">
                {r.requesterName} · {r.startDate}–{r.endDate}
              </span>
              <span className="shrink-0 text-xs uppercase text-zinc-500">{r.status}</span>
            </div>
          ))}
          {requests.length === 0 ? <p className="text-zinc-500">Nothing yet.</p> : null}
        </div>
      </div>
    </div>
  );
}
