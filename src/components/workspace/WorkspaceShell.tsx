"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WorkspaceActivityTracker } from "./WorkspaceActivityTracker";
import { PomodoroTimer } from "./PomodoroTimer";
import { ExtensionLinkPanel } from "./ExtensionLinkPanel";

type Props = {
  ticketId: string;
  ticketTitle: string;
  allowedApps: string[];
  blockedUrlPatterns: string[];
  children: React.ReactNode;
};

const tabConfig: Record<string, { label: string; icon: React.ReactNode }> = {
  dashboard: {
    label: "Overview",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="h-3.5 w-3.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
        />
      </svg>
    ),
  },
  profile: {
    label: "Apps",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="h-3.5 w-3.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z"
        />
      </svg>
    ),
  },
  analytics: {
    label: "Handoff",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="h-3.5 w-3.5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
        />
      </svg>
    ),
  },
};

export function WorkspaceShell({
  ticketId,
  ticketTitle,
  allowedApps,
  blockedUrlPatterns,
  children,
}: Props) {
  const pathname = usePathname();
  const tabs = allowedApps.length ? allowedApps : ["dashboard", "profile", "analytics"];

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#020617] text-white">
      <WorkspaceActivityTracker
        ticketId={ticketId}
        blockedUrlPatterns={blockedUrlPatterns}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#020617]/92 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3.5 sm:gap-4 sm:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.6}
                stroke="currentColor"
                className="h-4 w-4 text-indigo-400"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Developer workspace
              </p>
              <h1 className="truncate text-sm font-semibold text-white">
                {ticketTitle}
              </h1>
            </div>
          </div>

          <div className="flex w-full min-w-0 flex-1 items-center justify-end gap-2 sm:w-auto sm:flex-initial sm:gap-3">
            {/* Tab navigation */}
            <nav className="flex min-w-0 flex-1 items-center justify-end gap-1.5 overflow-x-auto sm:flex-initial sm:justify-start">
              {tabs.map((tab) => {
                const href = `/workspace/${ticketId}/${tab}`;
                const active = pathname === href;
                const config = tabConfig[tab];
                return (
                  <Link
                    key={tab}
                    href={href}
                    className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                      active
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                        : "text-zinc-400 hover:bg-white/6 hover:text-white"
                    }`}
                  >
                    {config?.icon}
                    <span className="hidden sm:inline">
                      {config?.label ?? tab}
                    </span>
                  </Link>
                );
              })}
            </nav>
            <Link
              href="/employee"
              className="shrink-0 rounded-lg px-3 py-1.5 text-sm text-zinc-400 transition-colors hover:text-white"
            >
              My tickets
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      {/* Pomodoro + extension */}
      <div className="mx-auto w-full max-w-5xl space-y-4 px-4 pt-5 sm:px-6">
        <PomodoroTimer ticketId={ticketId} />
        <ExtensionLinkPanel ticketId={ticketId} />
      </div>

      {/* Page content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        {children}
      </main>
    </div>
  );
}
