"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type NavItem = {
  href: string;
  label: string;
  exact: boolean;
  requireHr?: boolean;
  icon: ReactNode;
};

/** Main product: tickets, people, performance, copilot */
const deliveryNav: NavItem[] = [
  {
    href: "/admin",
    label: "Overview",
    exact: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4.5 w-4.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
      </svg>
    ),
  },
  {
    href: "/admin/tickets",
    label: "Tickets",
    exact: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4.5 w-4.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L9.568 3z M6 6h.008v.008H6V6z" />
      </svg>
    ),
  },
  {
    href: "/admin/users",
    label: "Team",
    exact: false,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4.5 w-4.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/productivity",
    label: "Insights",
    exact: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4.5 w-4.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    href: "/admin/ai-assistant",
    label: "Copilot",
    exact: true,
    requireHr: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4.5 w-4.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
      </svg>
    ),
  },
];

/** HRM / payroll — secondary */
const extraNav: NavItem[] = [
  {
    href: "/admin/hrm",
    label: "HRM & leave",
    exact: true,
    requireHr: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .414-.336.75-.75.75h-4.5a.75.75 0 01-.65-.38l-1.15-1.95a.75.75 0 00-.65-.38H8.25a.75.75 0 00-.65.38l-1.15 1.95a.75.75 0 01-.65.38h-4.5a.75.75 0 01-.75-.75v-4.25m16.5 0V9a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 9v5.15m16.5 0c.69 0 1.25.56 1.25 1.25v.75c0 .69-.56 1.25-1.25 1.25H3.75c-.69 0-1.25-.56-1.25-1.25v-.75c0-.69.56-1.25 1.25-1.25h16.5z" />
      </svg>
    ),
  },
  {
    href: "/admin/payroll",
    label: "Payroll",
    exact: true,
    requireHr: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75a.75.75 0 01-.75.75H3.75a.75.75 0 01-.75-.75V6h19.5z" />
      </svg>
    ),
  },
  {
    href: "/admin/team-mood",
    label: "Team mood",
    exact: true,
    requireHr: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm4.5 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />
      </svg>
    ),
  },
  {
    href: "/admin/daily-report",
    label: "Daily report",
    exact: true,
    requireHr: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5a1.125 1.125 0 01-1.125-1.125v-1.5a3.375 3.375 0 00-3.375-3.375H9.75M9.75 6.75h4.875c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125H3.375c-.621 0-1.125-.504-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125h5.25M9.75 6.75L12 4.5" />
      </svg>
    ),
  },
  {
    href: "/admin/orgs",
    label: "Company",
    exact: true,
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5v-8.25H3.75V21zm0-10.5h4.5V3.75H3.75v7.5zm6-7.5v18h4.5V3h-4.5zm6 4.5v13.5h4.5V7.5h-4.5z" />
      </svg>
    ),
  },
];

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

function filterNav(items: NavItem[], hr: boolean) {
  return items.filter((item) => !item.requireHr || hr);
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [orgName, setOrgName] = useState<string | null>(null);
  const [staffRole, setStaffRole] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = (await res.json()) as { org?: { name: string } | null; user?: { role: string } | null };
        if (!cancelled) {
          if (data.org?.name) setOrgName(data.org.name);
          if (data.user?.role) setStaffRole(data.user.role);
        }
      } catch {
        /* ignore */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const hr = staffRole === "hr" || staffRole === "manager";
  const primaryItems = useMemo(() => filterNav(deliveryNav, hr), [hr]);
  const secondaryItems = useMemo(() => filterNav(extraNav, hr), [hr]);
  const allForActive = useMemo(() => [...primaryItems, ...secondaryItems], [primaryItems, secondaryItems]);

  function isActive(item: NavItem) {
    if (item.exact) return pathname === item.href;
    return pathname.startsWith(item.href);
  }

  function navLinkClass(item: NavItem, compact: boolean) {
    const active = isActive(item);
    const base = compact
      ? "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all"
      : "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all";
    return `${base} ${
      active ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-200"
    }`;
  }

  return (
    <div className="flex h-dvh max-h-dvh min-h-0 bg-[#020617] text-white">
      <aside className="flex h-full min-h-0 w-60 shrink-0 flex-col border-r border-white/8 bg-[#020617]">
        <div className="flex shrink-0 items-center gap-2.5 border-b border-white/8 px-5 py-5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-500 shadow-lg shadow-indigo-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-white">
              <path
                fillRule="evenodd"
                d="M12.516 2.17a.75.75 0 00-1.032 0 11.209 11.209 0 01-7.877 3.08a.75.75 0 00-.722.515A12.74 12.74 0 002.25 9.75c0 5.942 4.064 10.933 9.563 12.348a.749.749 0 00.374 0c5.499-1.415 9.563-6.406 9.563-12.348 0-1.39-.223-2.73-.635-3.985a.75.75 0 00-.722-.516l-.143.001c-2.996 0-5.717-1.17-7.734-3.08z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight truncate">WorkFlowGuard</p>
            <p className="text-xs text-indigo-400 font-medium truncate" title={orgName ?? undefined}>
              {orgName ?? "…"}
            </p>
          </div>
        </div>

        <nav className="admin-scroll min-h-0 flex-1 space-y-1 px-3 py-4">
          <p className="mb-2 px-3 text-xs font-medium text-zinc-500">Delivery &amp; performance</p>
          {primaryItems.map((item) => (
            <Link key={item.href} href={item.href} className={navLinkClass(item, false)}>
              {item.icon}
              {item.label}
            </Link>
          ))}

          {secondaryItems.length > 0 ? (
            <>
              <p className="mb-2 mt-5 px-3 text-xs font-medium text-zinc-600">HR &amp; admin</p>
              {secondaryItems.map((item) => (
                <Link key={item.href} href={item.href} className={navLinkClass(item, true)}>
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </>
          ) : null}
        </nav>

        <div className="shrink-0 space-y-1 border-t border-white/8 px-3 py-4">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4.5 w-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Home
          </Link>
          <button
            type="button"
            onClick={() => void logout()}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="h-4.5 w-4.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Log out
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between border-b border-white/8 bg-[#020617]/90 px-8 py-4 backdrop-blur-md">
          <div className="min-w-0">
            <p className="truncate text-xs text-zinc-500">{orgName ? `Signed in · ${orgName}` : "Admin"}</p>
            <h1 className="truncate text-lg font-semibold leading-tight text-white">
              {allForActive.find((item) => isActive(item))?.label ??
                (() => {
                  const seg = pathname.replace(/^\/admin\/?/, "").split("/")[0];
                  if (!seg) return "Admin";
                  return seg
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ");
                })()}
            </h1>
          </div>
        </header>

        <main className="admin-scroll min-h-0 flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
