import Link from "next/link";

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_45%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.12),transparent_40%)]" />
      <div className="relative mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
          WorkFlowGuard
        </p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-zinc-900 dark:text-white sm:text-5xl">
          Task-centric productivity for remote teams
        </h1>
        <p className="mt-5 text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          Measure engagement against assigned work using contextual signals—time on
          task pages, navigation, idle patterns, and completion—not invasive
          monitoring or crude website blocklists.
        </p>
        <ul className="mt-8 space-y-3 text-zinc-700 dark:text-zinc-200">
          <li className="flex gap-2">
            <span className="mt-1 text-emerald-600">✓</span>
            HR defines tasks and on-task URL patterns (e.g. internal tools).
          </li>
          <li className="flex gap-2">
            <span className="mt-1 text-emerald-600">✓</span>
            Employees work in a focused workspace; the system scores engagement
            and flags bottlenecks for process improvement.
          </li>
          <li className="flex gap-2">
            <span className="mt-1 text-emerald-600">✓</span>
            No screen recording or keystroke logging—behavioral signals only.
          </li>
        </ul>
        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-500"
          >
            Sign in
          </Link>
          <a
            href="#how"
            className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white/70 px-6 py-3 text-sm font-semibold text-zinc-800 backdrop-blur hover:bg-white dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-100"
          >
            How it works
          </a>
        </div>
        <section id="how" className="mt-16 rounded-2xl border border-zinc-200/80 bg-white/70 p-6 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
            Panel-ready summary
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-300">
            When an employee is assigned a task, WorkFlowGuard monitors interaction
            with task-related pages. Strong engagement yields a productive
            classification; sustained idle time or deviation from the task
            context indicates disengagement—reported to HR as structured insight,
            not raw browsing history.
          </p>
        </section>
      </div>
    </div>
  );
}
