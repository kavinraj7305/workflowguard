import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketActivityEvents } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { getDeveloperTicket } from "@/lib/workflow-access";
import { summarizeTicketActivity } from "@/lib/ticket-analytics";

type Props = { params: Promise<{ assignmentId: string }> };

export default async function WorkspaceAnalyticsPage({ params }: Props) {
  const { assignmentId } = await params;
  const session = await getSession();
  if (!session || session.role !== "developer") {
    redirect("/login");
  }

  const row = await getDeveloperTicket(assignmentId, session.orgId, session.sub);
  if (!row) {
    redirect("/employee");
  }
  if (!row.ticket.allowedApps.includes("analytics")) {
    redirect(`/workspace/${assignmentId}/${row.ticket.allowedApps[0] ?? "dashboard"}`);
  }

  const events = await db()
    .select()
    .from(ticketActivityEvents)
    .where(eq(ticketActivityEvents.ticketId, assignmentId))
    .orderBy(desc(ticketActivityEvents.createdAt));
  const summary = summarizeTicketActivity(events);

  const statusConfig: Record<string, { label: string; color: string }> = {
    open: { label: "Open", color: "text-blue-400" },
    in_progress: { label: "In progress", color: "text-amber-400" },
    testing: { label: "Testing", color: "text-violet-400" },
    closed: { label: "Closed", color: "text-emerald-400" },
  };

  const statusInfo = statusConfig[row.ticket.status] ?? statusConfig.open;

  const stats = [
    {
      label: "Productivity score",
      value: summary.productivityScore ?? 0,
      unit: "/100",
      bg: "bg-indigo-500/10",
      text: "text-indigo-400",
    },
    {
      label: "Page views",
      value: summary.pageViews,
      unit: "views",
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
    },
    {
      label: "Idle starts",
      value: summary.idleStarts,
      unit: "times",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Handoff summary</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Once the screenshot is attached, move the ticket to testing so QA can
          verify and close it.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`rounded-2xl border border-white/8 ${stat.bg} p-5`}
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {stat.label}
            </p>
            <p className={`mt-2 text-3xl font-bold tabular-nums ${stat.text}`}>
              {stat.value}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">{stat.unit}</p>
          </div>
        ))}
      </div>

      {/* Screenshot + Status */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Screenshot
          </p>
          {row.ticket.screenshotName ? (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                  className="h-4 w-4 text-emerald-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-emerald-300 font-medium">
                {row.ticket.screenshotName}
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.6}
                  stroke="currentColor"
                  className="h-4 w-4 text-zinc-500"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-zinc-500">Not uploaded yet</p>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/3 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
            Current status
          </p>
          <p className={`text-lg font-semibold ${statusInfo.color}`}>
            {statusInfo.label}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {row.ticket.status === "testing"
              ? "Waiting for QA verification."
              : row.ticket.status === "closed"
                ? "Ticket has been verified and closed."
                : "Use the Overview tab to move this ticket to testing."}
          </p>
        </div>
      </div>

      {/* Screenshot image */}
      {row.ticket.screenshotData && (
        <div>
          <p className="mb-3 text-sm font-semibold text-zinc-300">
            Uploaded screenshot
          </p>
          <img
            src={row.ticket.screenshotData}
            alt="Uploaded screenshot"
            className="w-full rounded-2xl border border-white/8 shadow-xl"
          />
        </div>
      )}
    </div>
  );
}
