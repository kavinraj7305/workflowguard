"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Org = { id: string; name: string; slug: string };
type User = { id: string; orgId: string; email: string; name: string; role: string };
type Ticket = {
  id: string;
  title: string;
  type: string;
  status: string;
  priority: string;
  assignedDeveloperId: string | null;
  testerId: string | null;
};

function TeamPillar(props: {
  title: string;
  subtitle: string;
  count: number;
  accent: string;
  borderAccent: string;
  addHref: string;
  addLabel: string;
  preview: User[];
}) {
  const { title, subtitle, count, accent, borderAccent, addHref, addLabel, preview } = props;
  return (
    <div className={`rounded-2xl border ${borderAccent} bg-white/3 p-5 flex flex-col`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-zinc-300">{title}</p>
          <p className={`mt-2 text-4xl font-bold tabular-nums ${accent}`}>{count}</p>
          <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>
        </div>
        <Link
          href={addHref}
          className="shrink-0 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
        >
          {addLabel}
        </Link>
      </div>
      <ul className="mt-4 space-y-1.5 border-t border-white/6 pt-4 flex-1">
        {preview.length === 0 ? (
          <li className="text-xs text-zinc-600">Nobody listed yet</li>
        ) : (
          preview.map((u) => (
            <li key={u.id} className="truncate text-sm text-zinc-300">
              {u.name}
              <span className="text-zinc-600"> · {u.email}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [org, setOrg] = useState<Org | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [orgsRes, usersRes, ticketsRes] = await Promise.all([
        fetch("/api/orgs"),
        fetch("/api/users"),
        fetch("/api/tickets"),
      ]);
      const orgsData = orgsRes.ok ? ((await orgsRes.json()) as { orgs: Org[] }).orgs : [];
      const usersData = usersRes.ok ? ((await usersRes.json()) as { users: User[] }).users : [];
      const ticketsData = ticketsRes.ok ? ((await ticketsRes.json()) as { tickets: Ticket[] }).tickets : [];
      setOrg(orgsData[0] ?? null);
      setUsers(usersData);
      setTickets(ticketsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const leadership = users.filter((u) => u.role === "hr" || u.role === "manager");
  const developers = users.filter((u) => u.role === "developer");
  const qa = users.filter((u) => u.role === "tester");

  const open = tickets.filter((t) => t.status === "open").length;
  const inProgress = tickets.filter((t) => t.status === "in_progress").length;
  const testing = tickets.filter((t) => t.status === "testing").length;
  const closed = tickets.filter((t) => t.status === "closed").length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <div>
        <p className="text-xs text-zinc-500">Overview</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">{org?.name ?? "Your company"}</h2>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          This screen is just your org: headcount by group, how tickets are spread, and a link to the numbers page.
          Add someone from a card if you already know their role.
        </p>
      </div>

      <div>
        <h3 className="mb-4 text-sm font-medium text-zinc-400">Who is on the team</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <TeamPillar
            title="Leadership"
            subtitle="HR and managers"
            count={leadership.length}
            accent="text-indigo-300"
            borderAccent="border-indigo-500/25"
            addHref="/admin/users?role=manager"
            addLabel="Add person"
            preview={leadership.slice(0, 4)}
          />
          <TeamPillar
            title="Developers"
            subtitle="People who ship work"
            count={developers.length}
            accent="text-cyan-300"
            borderAccent="border-cyan-500/25"
            addHref="/admin/users?role=developer"
            addLabel="Add person"
            preview={developers.slice(0, 4)}
          />
          <TeamPillar
            title="QA"
            subtitle="Testers on your side"
            count={qa.length}
            accent="text-emerald-300"
            borderAccent="border-emerald-500/25"
            addHref="/admin/users?role=tester"
            addLabel="Add person"
            preview={qa.slice(0, 4)}
          />
        </div>
        <p className="mt-3 text-xs text-zinc-600">
          “Add person” jumps to Team with that role picked in the form. HR is often set up during onboarding; use Team
          for everyone else.
        </p>
      </div>

      <div>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-medium text-zinc-400">Tasks (tickets)</h3>
            <p className="mt-1 text-sm text-zinc-400">
              {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"} right now
            </p>
          </div>
          <Link
            href="/admin/tickets"
            className="rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/15 transition-colors hover:bg-white/15"
          >
            Open tasks
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Open", n: open, c: "border-blue-500/20 bg-blue-500/10 text-blue-200" },
            { label: "In progress", n: inProgress, c: "border-amber-500/20 bg-amber-500/10 text-amber-200" },
            { label: "Testing", n: testing, c: "border-violet-500/20 bg-violet-500/10 text-violet-200" },
            { label: "Closed", n: closed, c: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200" },
          ].map((x) => (
            <div key={x.label} className={`rounded-2xl border px-4 py-4 ${x.c}`}>
              <p className="text-xs font-medium opacity-90">{x.label}</p>
              <p className="mt-1 text-2xl font-bold tabular-nums">{x.n}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-linear-to-br from-indigo-500/10 to-transparent p-6">
        <h3 className="text-sm font-medium text-white">Insights</h3>
        <p className="mt-1 text-sm text-zinc-400">
          Ticket flow, focus time, and a simple read on which developers might need a check-in — same org only.
        </p>
        <Link
          href="/admin/productivity"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-indigo-500/20 transition-colors hover:bg-indigo-500"
        >
          View insights
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="h-4 w-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>
    </div>
  );
}
