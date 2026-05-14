import { NextResponse } from "next/server";
import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  ticketActivityEvents,
  ticketFocusSessions,
  tickets,
} from "@/db/schema";
import { requireEmployee } from "@/lib/api/auth";
import { summarizeTicketActivity } from "@/lib/ticket-analytics";

type ActivityEvent = InferSelectModel<typeof ticketActivityEvents>;

export async function GET() {
  const session = await requireEmployee();
  if (session instanceof NextResponse) return session;

  if (session.role !== "developer") {
    return NextResponse.json({ error: "Developers only" }, { status: 403 });
  }

  const userId = session.sub;
  const orgId = session.orgId;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

  const mine = await db()
    .select({ status: tickets.status })
    .from(tickets)
    .where(and(eq(tickets.orgId, orgId), eq(tickets.assignedDeveloperId, userId)));

  const byStatus = { open: 0, in_progress: 0, testing: 0, closed: 0 };
  for (const row of mine) {
    byStatus[row.status] += 1;
  }
  const totalAssigned = mine.length;

  const recentEvents = await db()
    .select({
      eventType: ticketActivityEvents.eventType,
      createdAt: ticketActivityEvents.createdAt,
      pathOrUrl: ticketActivityEvents.pathOrUrl,
      resourceName: ticketActivityEvents.resourceName,
      metadata: ticketActivityEvents.metadata,
    })
    .from(ticketActivityEvents)
    .innerJoin(tickets, eq(ticketActivityEvents.ticketId, tickets.id))
    .where(
      and(
        eq(tickets.orgId, orgId),
        eq(ticketActivityEvents.userId, userId),
        gte(ticketActivityEvents.createdAt, thirtyDaysAgo)
      )
    );

  const asActivity: ActivityEvent[] = recentEvents.map(
    (e) =>
      ({
        id: "",
        ticketId: "",
        userId,
        eventType: e.eventType,
        pathOrUrl: e.pathOrUrl,
        resourceName: e.resourceName,
        metadata: e.metadata,
        createdAt: e.createdAt,
      }) as ActivityEvent
  );

  const summary = summarizeTicketActivity(asActivity);

  let lastAt: Date | null = null;
  for (const e of recentEvents) {
    const d = e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt);
    if (!lastAt || d > lastAt) lastAt = d;
  }

  const [focusRow] = await db()
    .select({
      totalMinutes: sql<number>`COALESCE(
        SUM(EXTRACT(EPOCH FROM (${ticketFocusSessions.completedAt} - ${ticketFocusSessions.startedAt})) / 60.0),
        0
      )`.mapWith(Number),
      sessionCount: count(),
    })
    .from(ticketFocusSessions)
    .innerJoin(tickets, eq(ticketFocusSessions.ticketId, tickets.id))
    .where(
      and(
        eq(tickets.orgId, orgId),
        eq(ticketFocusSessions.userId, userId),
        isNotNull(ticketFocusSessions.completedAt)
      )
    );

  return NextResponse.json({
    ticketPipeline: { ...byStatus, total: totalAssigned },
    activityLast30Days: summary,
    lastActivityAt: lastAt ? lastAt.toISOString() : null,
    focusMinutes: Math.round(focusRow?.totalMinutes ?? 0),
    completedFocusSessions: Number(focusRow?.sessionCount ?? 0),
  });
}
