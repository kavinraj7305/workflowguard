import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketActivityEvents } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { getDeveloperTicket } from "@/lib/workflow-access";
import { TaskActions } from "@/components/workspace/TaskActions";
import { summarizeTicketActivity } from "@/lib/ticket-analytics";

type Props = { params: Promise<{ assignmentId: string }> };

export default async function WorkspaceDashboardPage({ params }: Props) {
  const { assignmentId } = await params;
  const session = await getSession();
  if (!session || session.role !== "developer") {
    redirect("/login");
  }

  const row = await getDeveloperTicket(assignmentId, session.orgId, session.sub);
  if (!row) {
    redirect("/employee");
  }
  if (!row.ticket.allowedApps.includes("dashboard")) {
    redirect(`/workspace/${assignmentId}/${row.ticket.allowedApps[0] ?? "profile"}`);
  }

  const events = await db()
    .select()
    .from(ticketActivityEvents)
    .where(eq(ticketActivityEvents.ticketId, assignmentId))
    .orderBy(desc(ticketActivityEvents.createdAt));
  const summary = summarizeTicketActivity(events);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Ticket overview</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        Work only in the approved app tabs listed by HR. When the ticket is done,
        attach a screenshot and move it to testing.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Status</p>
          <p className="mt-2 text-3xl font-semibold">{row.ticket.status}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Priority</p>
          <p className="mt-2 text-3xl font-semibold">{row.ticket.priority}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Productivity</p>
          <p className="mt-2 text-3xl font-semibold">{summary.productivityScore}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Resources used</p>
          <p className="mt-2 text-3xl font-semibold">{summary.uniqueResources}</p>
        </div>
      </div>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-medium text-zinc-500">Sites and routes visited</p>
        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
          {summary.uniquePaths ? `${summary.uniquePaths} unique paths tracked` : "No activity yet"}
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Focus mode: {summary.performanceLabel}
        </p>
      </div>
      <TaskActions ticketId={assignmentId} />
    </div>
  );
}
