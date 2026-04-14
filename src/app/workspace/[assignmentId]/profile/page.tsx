import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketActivityEvents } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { getDeveloperTicket } from "@/lib/workflow-access";
import { summarizeTicketActivity } from "@/lib/ticket-analytics";

type Props = { params: Promise<{ assignmentId: string }> };

export default async function WorkspaceProfilePage({ params }: Props) {
  const { assignmentId } = await params;
  const session = await getSession();
  if (!session || session.role !== "developer") {
    redirect("/login");
  }

  const row = await getDeveloperTicket(assignmentId, session.orgId, session.sub);
  if (!row) {
    redirect("/employee");
  }
  if (!row.ticket.allowedApps.includes("profile")) {
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
      <h2 className="text-xl font-semibold">Approved apps</h2>
      <p className="text-zinc-600 dark:text-zinc-400">
        These are the only workspace routes exposed for this ticket.
      </p>
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <label className="block text-sm font-medium">Allowed apps</label>
        <p className="mt-1 text-zinc-800 dark:text-zinc-200">{row.ticket.allowedApps.join(", ")}</p>
        <p className="mt-4 text-xs uppercase tracking-wide text-zinc-500">Created by {row.creatorName}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Blocked URLs</p>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{row.ticket.blockedUrlPatterns.join(", ") || "None"}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm font-medium text-zinc-500">Focus timer</p>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">{summary.performanceLabel} · {summary.uniquePaths} routes tracked</p>
        </div>
      </div>
    </div>
  );
}
