"use client";

import { useCallback, useEffect, useState } from "react";

type UserOpt = { id: string; name: string; email: string; role: string };

type Payment = {
  id: string;
  userId: string;
  payPeriod: string;
  grossCents: number;
  deductionsCents: number;
  netCents: number;
  status: string;
  notes: string;
  employeeName: string;
  employeeEmail: string;
  paidAt: string | null;
};

const inputClass =
  "w-full rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/30";

function fmtMoney(cents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

export default function AdminPayrollPage() {
  const [users, setUsers] = useState<UserOpt[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totals, setTotals] = useState({ gross: 0, net: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState("");
  const [period, setPeriod] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [gross, setGross] = useState("");
  const [deductions, setDeductions] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "approved" | "paid">("draft");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [uRes, pRes] = await Promise.all([fetch("/api/users"), fetch("/api/payroll/payments")]);
      if (!pRes.ok) {
        const j = (await pRes.json()) as { error?: string };
        setError(j.error ?? "Could not load payroll");
        setPayments([]);
        setTotals({ gross: 0, net: 0 });
      } else {
        const pJson = (await pRes.json()) as { payments: Payment[]; totalsCents: { gross: number; net: number } };
        setPayments(pJson.payments);
        setTotals(pJson.totalsCents);
        setError(null);
      }
      if (uRes.ok) {
        const uJson = (await uRes.json()) as { users: UserOpt[] };
        setUsers(uJson.users);
        setUserId((prev) => prev || uJson.users[0]?.id || "");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function addPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const g = Math.round(parseFloat(gross) * 100);
    const d = Math.round(parseFloat(deductions || "0") * 100);
    if (Number.isNaN(g) || g < 0 || Number.isNaN(d) || d < 0) {
      setError("Enter valid dollar amounts");
      return;
    }
    const res = await fetch("/api/payroll/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId,
        payPeriod: period,
        grossCents: g,
        deductionsCents: d,
        notes,
        status,
      }),
    });
    const j = (await res.json()) as { error?: string };
    if (!res.ok) {
      setError(j.error ?? "Could not save");
      return;
    }
    setGross("");
    setDeductions("");
    setNotes("");
    await load();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (error && payments.length === 0) {
    return (
      <div className="max-w-lg rounded-2xl border border-rose-500/25 bg-rose-500/10 p-6 text-sm text-rose-200">
        {error}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <p className="text-xs text-zinc-500">Compensation</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">Payroll</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          One row per person per pay period (stored in cents). This is not tax advice — it is a structured place to
          track what you have already decided to pay.
        </p>
      </div>

      {error ? <p className="text-sm text-amber-300">{error}</p> : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/10 to-transparent p-6">
          <h3 className="text-base font-medium text-white">Add a run line</h3>
          <form onSubmit={addPayment} className="mt-4 space-y-3">
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Person</label>
              <select className={inputClass} value={userId} onChange={(e) => setUserId(e.target.value)}>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Pay period</label>
              <input className={inputClass} value={period} onChange={(e) => setPeriod(e.target.value)} placeholder="2026-05" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Gross (USD)</label>
              <input className={inputClass} inputMode="decimal" value={gross} onChange={(e) => setGross(e.target.value)} placeholder="8500.00" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Deductions (USD)</label>
              <input
                className={inputClass}
                inputMode="decimal"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                placeholder="0"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Status</label>
              <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                <option value="draft">Draft</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-zinc-500">Notes</label>
              <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Bonus, proration, …" />
            </div>
            <button type="submit" className="w-full rounded-xl bg-cyan-600 py-2.5 text-sm font-medium text-white hover:bg-cyan-500">
              Save line
            </button>
          </form>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm">
            <div>
              <p className="text-zinc-500">Total gross (listed)</p>
              <p className="text-lg font-semibold text-white">{fmtMoney(totals.gross)}</p>
            </div>
            <div>
              <p className="text-zinc-500">Total net (listed)</p>
              <p className="text-lg font-semibold text-emerald-300">{fmtMoney(totals.net)}</p>
            </div>
          </div>

          <div className="admin-scroll max-h-[min(28rem,55vh)] rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 border-b border-white/10 bg-zinc-950/95 text-xs text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Period</th>
                  <th className="px-4 py-3 font-medium">Gross</th>
                  <th className="px-4 py-3 font-medium">Net</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-white/[0.03]">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{p.employeeName}</p>
                      <p className="text-xs text-zinc-500">{p.employeeEmail}</p>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">{p.payPeriod}</td>
                    <td className="px-4 py-3 tabular-nums text-zinc-200">{fmtMoney(p.grossCents)}</td>
                    <td className="px-4 py-3 tabular-nums text-emerald-200">{fmtMoney(p.netCents)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-300">{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {payments.length === 0 ? <p className="p-6 text-sm text-zinc-500">No payroll lines yet.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
