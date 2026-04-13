"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { EngagementTracker } from "./EngagementTracker";

type Props = {
  assignmentId: string;
  taskTitle: string;
  children: React.ReactNode;
};

const tabs = [
  { href: (id: string) => `/workspace/${id}/dashboard`, label: "Dashboard" },
  { href: (id: string) => `/workspace/${id}/profile`, label: "Profile" },
  { href: (id: string) => `/workspace/${id}/analytics`, label: "Analytics" },
];

export function WorkspaceShell({
  assignmentId,
  taskTitle,
  children,
}: Props) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-0px)] flex-col bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50">
      <EngagementTracker assignmentId={assignmentId} />
      <header className="border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-indigo-600 dark:text-indigo-400">
              Task workspace
            </p>
            <h1 className="text-lg font-semibold">{taskTitle}</h1>
          </div>
          <nav className="flex flex-wrap gap-2">
            {tabs.map((t) => {
              const href = t.href(assignmentId);
              const active = pathname === href;
              return (
                <Link
                  key={t.label}
                  href={href}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                    active
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-zinc-200/80 text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</main>
    </div>
  );
}
