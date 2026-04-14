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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Handoff</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Once the screenshot is attached, move the ticket to testing so QA can
        verify the handoff and close it.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Productivity score</p>
          <p className="mt-2 text-3xl font-semibold">{summary.productivityScore}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Page views</p>
          <p className="mt-2 text-3xl font-semibold">{summary.pageViews}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Idle starts</p>
          <p className="mt-2 text-3xl font-semibold">{summary.idleStarts}</p>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Screenshot</p>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            {row.ticket.screenshotName ?? "Not uploaded yet"}
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Current status</p>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{row.ticket.status}</p>
        </div>
      </div>
      {row.ticket.screenshotData ? (
        <img
          src={row.ticket.screenshotData}
          alt="Uploaded screenshot"
          className="w-full rounded-2xl border border-zinc-200 shadow-sm dark:border-zinc-800"
        />
      ) : null}
    </div>
  );
}
