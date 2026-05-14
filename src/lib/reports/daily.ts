import { and, count, eq, gte, isNotNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { leaveRequests, tickets } from "@/db/schema";

export type DailyReportPayload = {
  generatedAt: string;
  periodUtc: { start: string; end: string };
  ticketsCreatedToday: number;
  ticketsClosedToday: number;
  openBugs: number;
  pendingLeave: number;
  pipeline: { open: number; in_progress: number; testing: number; closed: number; total: number };
  highlights: string[];
};

function startOfUtcDay(d: Date) {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

export async function buildDailyReport(orgId: string): Promise<DailyReportPayload> {
  const now = new Date();
  const dayStart = startOfUtcDay(now);
  const nextDay = new Date(dayStart);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const [createdRow] = await db()
    .select({ c: count() })
    .from(tickets)
    .where(and(eq(tickets.orgId, orgId), gte(tickets.createdAt, dayStart)));

  const [closedRow] = await db()
    .select({ c: count() })
    .from(tickets)
    .where(
      and(
        eq(tickets.orgId, orgId),
        isNotNull(tickets.closedAt),
        gte(tickets.closedAt, dayStart)
      )
    );

  const [bugsRow] = await db()
    .select({ c: count() })
    .from(tickets)
    .where(
      and(eq(tickets.orgId, orgId), eq(tickets.type, "bug"), ne(tickets.status, "closed"))
    );

  const [leaveRow] = await db()
    .select({ c: count() })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.orgId, orgId), eq(leaveRequests.status, "pending")));

  const statusRows = await db()
    .select({ status: tickets.status, c: count() })
    .from(tickets)
    .where(eq(tickets.orgId, orgId))
    .groupBy(tickets.status);

  const pipeline = { open: 0, in_progress: 0, testing: 0, closed: 0, total: 0 };
  for (const r of statusRows) {
    const n = Number(r.c);
    pipeline.total += n;
    if (r.status === "open") pipeline.open = n;
    else if (r.status === "in_progress") pipeline.in_progress = n;
    else if (r.status === "testing") pipeline.testing = n;
    else if (r.status === "closed") pipeline.closed = n;
  }

  const ticketsCreatedToday = Number(createdRow?.c ?? 0);
  const ticketsClosedToday = Number(closedRow?.c ?? 0);
  const openBugs = Number(bugsRow?.c ?? 0);
  const pendingLeave = Number(leaveRow?.c ?? 0);

  const highlights: string[] = [];
  if (ticketsClosedToday > 0) {
    highlights.push(`${ticketsClosedToday} ticket(s) moved to closed today (UTC).`);
  }
  if (ticketsCreatedToday > 0) {
    highlights.push(`${ticketsCreatedToday} new ticket(s) opened today (UTC).`);
  }
  if (openBugs > 0) {
    highlights.push(`${openBugs} open bug(s) still need engineering attention.`);
  }
  if (pipeline.testing > 0) {
    highlights.push(`${pipeline.testing} ticket(s) in testing — good moment for QA throughput.`);
  }
  if (pendingLeave > 0) {
    highlights.push(`${pendingLeave} leave request(s) waiting for approval.`);
  }
  if (highlights.length === 0) {
    highlights.push("Quiet day on paper — nudge the team if queues look empty but work is still in flight.");
  }

  return {
    generatedAt: now.toISOString(),
    periodUtc: { start: dayStart.toISOString(), end: nextDay.toISOString() },
    ticketsCreatedToday,
    ticketsClosedToday,
    openBugs,
    pendingLeave,
    pipeline,
    highlights,
  };
}
