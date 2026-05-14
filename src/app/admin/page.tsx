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

export default function AdminOverviewPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);

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

      setOrgs(orgsData);
      setUsers(usersData);
      setTickets(ticketsData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const developerUsers = users.filter((u) => u.role === "developer");
  const testerUsers = users.filter((u) => u.role === "tester");
  const hrManagerUsers = users.filter((u) => u.role === "hr" || u.role === "manager");
  const bugTickets = tickets.filter((t) => t.type === "bug");
  const taskTickets = tickets.filter((t) => t.type === "task");

  const openTickets = tickets.filter((t) => t.status === "open");
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress");
  const testingTickets = tickets.filter((t) => t.status === "testing");
  const closedTickets = tickets.filter((t) => t.status === "closed");

  const quickLinks = [
    { href: "/admin/orgs", label: "Manage Organizations", desc: "Create and view orgs", color: "border-indigo-500/30 hover:border-indigo-500/50", icon: "bg-indigo-500/15 text-indigo-400" },
    { href: "/admin/users", label: "Manage Users", desc: "Add team members, view roles", color: "border-violet-500/30 hover:border-violet-500/50", icon: "bg-violet-500/15 text-violet-400" },
    { href: "/admin/tickets", label: "Manage Tickets", desc: "Create, assign, and track tickets", color: "border-amber-500/30 hover:border-amber-500/50", icon: "bg-amber-500/15 text-amber-400" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  function generateAiSuggestions() {
    setIsGeneratingSuggestions(true);
    window.setTimeout(() => {
      const suggestions: string[] = [];
      if (openTickets.length > 0) {
        suggestions.push(
          `${openTickets.length} ticket(s) are open — clarify owners or move them into active work.`
        );
      }
      if (testingTickets.length > 2) {
        suggestions.push(
          `Testing queue is ${testingTickets.length} deep — consider QA capacity or parallel review.`
        );
      }
      if (bugTickets.length > taskTickets.length && bugTickets.length > 0) {
        suggestions.push(
          `Bugs (${bugTickets.length}) exceed tasks (${taskTickets.length}) — review root causes and stabilization work.`
        );
      }
      if (inProgressTickets.length === 0 && openTickets.length > 0) {
        suggestions.push("Nothing is in progress while tickets are open — start the next execution slice.");
      }
      if (suggestions.length === 0) {
        suggestions.push("Pipeline is balanced for current volume — keep creating tickets to sustain measurable throughput.");
      }
      setAiSuggestions(suggestions.slice(0, 4));
      setIsGeneratingSuggestions(false);
    }, 400);
  }

  return (
    <div className="space-y-8">
      {/* ── Stat cards ───────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Organizations */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Organizations</p>
              <p className="mt-2 text-3xl font-bold text-white tabular-nums">{orgs.length}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/15">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21" />
              </svg>
            </div>
          </div>
          <div className="mt-3 h-0.5 w-full rounded-full bg-indigo-500/15">
            <div className="h-0.5 rounded-full bg-indigo-500" style={{ width: orgs.length > 0 ? "100%" : "0%" }} />
          </div>
        </div>

        {/* Team members */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Team members</p>
              <p className="mt-2 text-3xl font-bold text-white tabular-nums">{users.length}</p>
              <p className="mt-1 text-xs text-zinc-500">HR/Mgr {hrManagerUsers.length} · Dev {developerUsers.length} · QA {testerUsers.length}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/15">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5 text-violet-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 h-0.5 w-full rounded-full bg-violet-500/15">
            <div className="h-0.5 rounded-full bg-violet-500 transition-all" style={{ width: users.length > 0 ? `${Math.min(100, users.length * 10)}%` : "0%" }} />
          </div>
        </div>

        {/* Task tickets */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Task tickets</p>
              <p className="mt-2 text-3xl font-bold text-white tabular-nums">{taskTickets.length}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5 text-amber-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 h-0.5 w-full rounded-full bg-amber-500/15">
            <div className="h-0.5 rounded-full bg-amber-500 transition-all" style={{ width: tickets.length > 0 ? `${Math.round((taskTickets.length / tickets.length) * 100)}%` : "0%" }} />
          </div>
        </div>

        {/* Bug tickets */}
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Bug tickets</p>
              <p className="mt-2 text-3xl font-bold text-white tabular-nums">{bugTickets.length}</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500/15">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5 text-rose-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.047.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.778 3.778 0 01.4-2.25m0 0a5.002 5.002 0 019.45 0m-9.45 0A5.002 5.002 0 002.55 6" />
              </svg>
            </div>
          </div>
          <div className="mt-3 h-0.5 w-full rounded-full bg-rose-500/15">
            <div className="h-0.5 rounded-full bg-rose-500 transition-all" style={{ width: tickets.length > 0 ? `${Math.round((bugTickets.length / tickets.length) * 100)}%` : "0%" }} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/ai-assistant" className="rounded-2xl border border-indigo-500/25 bg-indigo-500/10 p-5 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/15">
          <p className="text-sm font-semibold text-indigo-200">AI Assistant</p>
          <p className="mt-1 text-xs text-zinc-300">Open dedicated suggestions page</p>
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                generateAiSuggestions();
              }}
              disabled={isGeneratingSuggestions}
              className="rounded-md bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {isGeneratingSuggestions ? "Analyzing..." : "Quick Suggest"}
            </button>
            <span className="text-xs text-indigo-200">{aiSuggestions.length} ready</span>
          </div>
        </Link>
        <Link href="/admin/productivity" className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 transition-all hover:border-emerald-500/50 hover:bg-emerald-500/15">
          <p className="text-sm font-semibold text-emerald-200">Productivity</p>
          <p className="mt-1 text-xs text-zinc-300">Live ticket pipeline and focus metrics from the database</p>
        </Link>
        <Link href="/admin/retention" className="rounded-2xl border border-violet-500/25 bg-violet-500/10 p-5 transition-all hover:border-violet-500/50 hover:bg-violet-500/15">
          <p className="text-sm font-semibold text-violet-200">Retention</p>
          <p className="mt-1 text-xs text-zinc-300">Per-developer engagement and workload risk from real activity</p>
        </Link>
        <Link href="/admin/team-mood" className="rounded-2xl border border-cyan-500/25 bg-cyan-500/10 p-5 transition-all hover:border-cyan-500/50 hover:bg-cyan-500/15">
          <p className="text-sm font-semibold text-cyan-200">Team Mood</p>
          <p className="mt-1 text-xs text-zinc-300">View each person mood indicator</p>
        </Link>
      </div>

      {/* ── Ticket pipeline ──────────────────────────────────── */}
      {tickets.length > 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-6">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-zinc-400">
            Ticket pipeline
          </h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { label: "Open", count: openTickets.length, bg: "bg-blue-500/10", text: "text-blue-400", bar: "bg-blue-500" },
              { label: "In progress", count: inProgressTickets.length, bg: "bg-amber-500/10", text: "text-amber-400", bar: "bg-amber-500" },
              { label: "Testing", count: testingTickets.length, bg: "bg-violet-500/10", text: "text-violet-400", bar: "bg-violet-500" },
              { label: "Closed", count: closedTickets.length, bg: "bg-emerald-500/10", text: "text-emerald-400", bar: "bg-emerald-500" },
            ].map((stage) => (
              <div key={stage.label} className={`rounded-xl ${stage.bg} p-4`}>
                <p className={`text-xs font-semibold uppercase tracking-wide ${stage.text}`}>{stage.label}</p>
                <p className="mt-1 text-2xl font-bold text-white tabular-nums">{stage.count}</p>
                <div className="mt-2 h-1 w-full rounded-full bg-white/10">
                  <div
                    className={`h-1 rounded-full ${stage.bar} transition-all`}
                    style={{ width: tickets.length > 0 ? `${Math.round((stage.count / tickets.length) * 100)}%` : "0%" }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick nav cards ──────────────────────────────────── */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Quick access
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`group flex items-center gap-4 rounded-2xl border bg-white/3 p-5 transition-all hover:bg-white/5 ${link.color}`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${link.icon}`}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">{link.label}</p>
                <p className="mt-0.5 text-xs text-zinc-400">{link.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── Empty state ──────────────────────────────────────── */}
      {!loading && orgs.length === 0 && (
        <div className="rounded-2xl border border-white/8 bg-white/3 p-10 text-center">
          <p className="text-sm font-medium text-white">No data yet</p>
          <p className="mt-1 text-sm text-zinc-500">Start by creating an organization and adding team members.</p>
          <Link href="/admin/orgs" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 transition-colors">
            Create organization
          </Link>
        </div>
      )}
    </div>
  );
}
