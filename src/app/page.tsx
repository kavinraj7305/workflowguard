import { count } from "drizzle-orm";
import { db } from "@/db";
import { orgs, tickets, users } from "@/db/schema";
import Link from "next/link";

const features = [
  {
    title: "Role-based access",
    body: "HR, manager, developer, and tester accounts each see only what their role requires — nothing more.",
    colorClass: "text-indigo-400",
    bgClass: "bg-indigo-500/10 border-indigo-500/20",
    iconPath:
      "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z",
  },
  {
    title: "Ticket lifecycle",
    body: "Create tasks and bugs, assign them to the right people, and watch every status change from open to closed.",
    colorClass: "text-cyan-400",
    bgClass: "bg-cyan-500/10 border-cyan-500/20",
    iconPath:
      "M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3z M6 6h.008v.008H6V6z",
  },
  {
    title: "Focus mode",
    body: "A built-in Pomodoro timer keeps developers in focused 25-minute sprints, tied directly to each ticket.",
    colorClass: "text-violet-400",
    bgClass: "bg-violet-500/10 border-violet-500/20",
    iconPath: "M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    title: "Activity tracking",
    body: "Every session start, page view, resource use, and idle period is automatically logged per ticket.",
    colorClass: "text-amber-400",
    bgClass: "bg-amber-500/10 border-amber-500/20",
    iconPath:
      "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
  },
  {
    title: "Bug reporting",
    body: "Testers file detailed bug reports, assign them to developers, and close verified fixes with one click.",
    colorClass: "text-rose-400",
    bgClass: "bg-rose-500/10 border-rose-500/20",
    iconPath:
      "M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.047.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.778 3.778 0 01.4-2.25m0 0a5.002 5.002 0 019.45 0m-9.45 0A5.002 5.002 0 002.55 6",
  },
  {
    title: "Screenshot handoff",
    body: "Developers attach proof of completion before sending work to QA, creating a clear, traceable handoff.",
    colorClass: "text-emerald-400",
    bgClass: "bg-emerald-500/10 border-emerald-500/20",
    iconPath:
      "M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z",
  },
];

const steps = [
  {
    number: "01",
    title: "Set up your org",
    body: "HR creates the organization, invites team members, and defines which apps and URLs are allowed per ticket.",
    color: "bg-indigo-500",
    textColor: "text-indigo-400",
    borderColor: "border-indigo-500/30",
  },
  {
    number: "02",
    title: "Develop in focus",
    body: "Developers open a protected workspace with the Pomodoro timer running, working only in their approved tabs.",
    color: "bg-cyan-500",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-500/30",
  },
  {
    number: "03",
    title: "Test and close",
    body: "Testers review the uploaded screenshot, verify the fix, and close the ticket — or file a new bug.",
    color: "bg-emerald-500",
    textColor: "text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
];

const roles = [
  {
    label: "HR",
    title: "Human Resources",
    body: "Creates orgs, manages users, defines blocked URLs and allowed apps per ticket.",
    badgeClass: "bg-indigo-500/15 text-indigo-300 border border-indigo-500/30",
    gradientClass: "from-indigo-500/8",
    dotClass: "bg-indigo-400",
  },
  {
    label: "Manager",
    title: "Manager",
    body: "Oversees tickets, reassigns work, and monitors team productivity across the org.",
    badgeClass: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
    gradientClass: "from-violet-500/8",
    dotClass: "bg-violet-400",
  },
  {
    label: "Developer",
    title: "Developer",
    body: "Works inside the protected workspace and attaches handoff screenshots before sending to QA.",
    badgeClass: "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30",
    gradientClass: "from-cyan-500/8",
    dotClass: "bg-cyan-400",
  },
  {
    label: "Tester",
    title: "QA Tester",
    body: "Files bug reports, verifies developer fixes, and closes confirmed tickets.",
    badgeClass: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
    gradientClass: "from-emerald-500/8",
    dotClass: "bg-emerald-400",
  },
];

export default async function HomePage() {
  const [[{ total: userTotal }], [{ total: ticketTotal }], [{ total: orgTotal }]] = await Promise.all([
    db().select({ total: count() }).from(users),
    db().select({ total: count() }).from(tickets),
    db().select({ total: count() }).from(orgs),
  ]);

  const userCount = Number(userTotal ?? 0);
  const ticketCount = Number(ticketTotal ?? 0);
  const orgCount = Number(orgTotal ?? 0);

  return (
    <div className="min-h-screen bg-[#020617] text-white overflow-x-hidden">
      {/* Animated background orbs */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="animate-orb-a absolute -top-48 -left-48 h-[640px] w-[640px] rounded-full bg-indigo-600/18 blur-[140px]" />
        <div className="animate-orb-b absolute -bottom-64 -right-32 h-[720px] w-[720px] rounded-full bg-cyan-600/12 blur-[160px]" />
        <div className="animate-orb-c absolute left-1/3 top-1/2 h-[420px] w-[420px] rounded-full bg-violet-600/10 blur-[110px]" />
      </div>

      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
        aria-hidden="true"
      />

      {/* Sticky nav */}
      <nav className="sticky top-0 z-50 border-b border-white/6 bg-[#020617]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/30">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 text-white"
              >
                <path
                  fillRule="evenodd"
                  d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <span className="font-bold text-white tracking-tight">WorkFlowGuard</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="rounded-lg px-4 py-1.5 text-sm text-zinc-300 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/setup"
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500"
            >
              New organization
            </Link>
          </div>
        </div>
      </nav>

      <div className="relative z-10">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-28 text-center sm:px-6 lg:py-36">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-medium text-indigo-300 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-dot-ping" />
            Workflow management with productivity and retention signals
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl lg:text-8xl">
            <span className="block text-white">Guard your</span>
            <span className="block bg-linear-to-r from-indigo-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent pb-2">
              workflow
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-300">
            WorkFlowGuard connects onboarding, guarded workspaces, and live analytics so HR and managers can see
            delivery health and engagement risk from real ticket and activity data.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/setup"
              className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all hover:bg-indigo-500 hover:shadow-indigo-500/50 hover:-translate-y-0.5"
            >
              Create organization
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/12 bg-white/5 px-8 py-3.5 text-base font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/10 hover:-translate-y-0.5"
            >
              Sign in
            </Link>
          </div>

          {/* Stats row */}
          <div className="mx-auto mt-20 grid max-w-2xl grid-cols-3 gap-8 border-t border-white/8 pt-12">
            <div>
              <p className="text-4xl font-bold text-white tabular-nums">
                {userCount}
              </p>
              <p className="mt-1 text-sm text-zinc-400">accounts ready</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white tabular-nums">{orgCount}</p>
              <p className="mt-1 text-sm text-zinc-400">organizations</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-white tabular-nums">{ticketCount}</p>
              <p className="mt-1 text-sm text-zinc-400">tickets tracked</p>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-400">
              Everything you need
            </p>
            <h2 className="mt-3 text-4xl font-bold text-white">
              Built for structured teams
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              One platform that takes a ticket from creation to verified close,
              keeping every role focused on their part.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-white/8 bg-white/3 p-6 backdrop-blur-sm transition-all hover:border-white/14 hover:bg-white/5 hover:-translate-y-0.5"
              >
                <div
                  className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border ${f.bgClass}`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.6}
                    stroke="currentColor"
                    className={`h-5 w-5 ${f.colorClass}`}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d={f.iconPath}
                    />
                  </svg>
                </div>
                <h3 className="text-base font-semibold text-white">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">
              Simple process
            </p>
            <h2 className="mt-3 text-4xl font-bold text-white">
              How it works
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Three clear steps move work from request to verified delivery.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number} className={`rounded-2xl border ${step.borderColor} bg-white/3 p-7`}>
                <div
                  className={`mb-5 inline-flex h-10 w-10 items-center justify-center rounded-xl ${step.color} text-sm font-bold text-white shadow-lg`}
                >
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-white">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {step.body}
                </p>
              </div>
            ))}
          </div>

          {/* Connector arrows */}
          <div className="mt-6 hidden items-center justify-center gap-4 md:flex">
            <div className="h-0.5 flex-1 bg-linear-to-r from-transparent via-indigo-500/30 to-cyan-500/30" />
            <p className="text-xs text-zinc-500 font-medium tracking-wide">
              Setup → Focus → Verify
            </p>
            <div className="h-0.5 flex-1 bg-linear-to-r from-cyan-500/30 via-emerald-500/30 to-transparent" />
          </div>
        </section>

        {/* ── Roles ────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="mb-14 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
              Team structure
            </p>
            <h2 className="mt-3 text-4xl font-bold text-white">
              Every role matters
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-zinc-400">
              Each person gets a focused view tailored to their responsibilities
              — no clutter, no confusion.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {roles.map((role) => (
              <div
                key={role.label}
                className={`rounded-2xl border border-white/8 bg-linear-to-b ${role.gradientClass} to-transparent p-6 transition-all hover:border-white/14`}
              >
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${role.badgeClass} mb-4`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${role.dotClass}`}
                  />
                  {role.label}
                </span>
                <h3 className="text-base font-semibold text-white">
                  {role.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">
                  {role.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="rounded-2xl border border-indigo-500/20 bg-linear-to-br from-indigo-500/10 via-[#020617] to-cyan-500/6 px-8 py-16 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Ready to bring your team in?
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-zinc-300">
              Each organization gets its own HR workspace and isolated tickets. Returning users should sign in;
              new teams can register below — many organizations can share this instance.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/setup"
                className="rounded-xl bg-indigo-600 px-8 py-3.5 text-base font-semibold text-white shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-500 hover:-translate-y-0.5"
              >
                Create organization
              </Link>
              <Link
                href="/login"
                className="rounded-xl border border-white/12 px-8 py-3.5 text-base font-semibold text-zinc-300 transition-all hover:border-white/25 hover:text-white"
              >
                Sign in instead
              </Link>
            </div>
          </div>
        </section>

        {/* ── Footer ───────────────────────────────────────────── */}
        <footer className="border-t border-white/8 py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-3.5 w-3.5 text-white"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-white">
                  WorkFlowGuard
                </span>
              </div>
              <p className="text-sm text-zinc-500">
                © 2026 WorkFlowGuard · Productivity & retention
              </p>
              <div className="flex gap-5">
                <Link
                  href="/login"
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  Sign in
                </Link>
                <Link
                  href="/setup"
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  Setup
                </Link>
                <Link
                  href="/admin"
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
