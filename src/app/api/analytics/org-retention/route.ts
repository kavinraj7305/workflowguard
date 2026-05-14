import { NextResponse } from "next/server";
import type { InferSelectModel } from "drizzle-orm";
import { and, count, eq, gte, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  ticketActivityEvents,
  ticketFocusSessions,
  tickets,
  users,
} from "@/db/schema";
import { requireHr } from "@/lib/api/auth";
import { moodFromWorkload } from "@/lib/analytics/mood";
import { summarizeTicketActivity } from "@/lib/ticket-analytics";

type ActivityEvent = InferSelectModel<typeof ticketActivityEvents>;

function retentionRiskForDeveloper(args: {
  openTickets: number;
  lastActivityAt: Date | null;
  sevenDaysAgo: Date;
  fourteenDaysAgo: Date;
}): "low" | "medium" | "high" | "n/a" {
  const { openTickets, lastActivityAt, sevenDaysAgo, fourteenDaysAgo } = args;
  if (openTickets === 0) return "n/a";
  if (!lastActivityAt || lastActivityAt < fourteenDaysAgo) return "high";
  if (lastActivityAt < sevenDaysAgo) return "medium";
  return "low";
}

export async function GET() {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  const orgId = session.orgId;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000);

  const ticketStatusRows = await db()
    .select({
      status: tickets.status,
      cnt: count(),
    })
    .from(tickets)
    .where(eq(tickets.orgId, orgId))
    .groupBy(tickets.status);

  const pipeline = {
    open: 0,
    in_progress: 0,
    testing: 0,
    closed: 0,
  };
  for (const row of ticketStatusRows) {
    pipeline[row.status] = Number(row.cnt);
  }
  const totalTickets =
    pipeline.open + pipeline.in_progress + pipeline.testing + pipeline.closed;

  const productivityScore =
    totalTickets === 0
      ? 0
      : Math.min(
          100,
          Math.round(
            (pipeline.closed * 100 +
              pipeline.testing * 70 +
              pipeline.in_progress * 45 +
              pipeline.open * 18) /
              totalTickets
          )
        );

  const completionRatePercent =
    totalTickets === 0 ? 0 : Math.round((pipeline.closed / totalTickets) * 1000) / 10;

  const orgUsers = await db()
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(eq(users.orgId, orgId));

  const orgTicketRows = await db()
    .select({
      assignedDeveloperId: tickets.assignedDeveloperId,
      testerId: tickets.testerId,
      status: tickets.status,
    })
    .from(tickets)
    .where(eq(tickets.orgId, orgId));

  const workloadByUser = new Map<string, number>();
  function bump(uid: string | null) {
    if (!uid) return;
    workloadByUser.set(uid, (workloadByUser.get(uid) ?? 0) + 1);
  }
  for (const t of orgTicketRows) {
    bump(t.assignedDeveloperId);
    if (t.testerId && t.testerId !== t.assignedDeveloperId) {
      bump(t.testerId);
    }
  }

  const openAssignedByDev = new Map<string, number>();
  for (const t of orgTicketRows) {
    if (!t.assignedDeveloperId) continue;
    if (t.status === "closed") continue;
    const id = t.assignedDeveloperId;
    openAssignedByDev.set(id, (openAssignedByDev.get(id) ?? 0) + 1);
  }

  const recentEvents = await db()
    .select({
      userId: ticketActivityEvents.userId,
      eventType: ticketActivityEvents.eventType,
      createdAt: ticketActivityEvents.createdAt,
      pathOrUrl: ticketActivityEvents.pathOrUrl,
      resourceName: ticketActivityEvents.resourceName,
      metadata: ticketActivityEvents.metadata,
    })
    .from(ticketActivityEvents)
    .innerJoin(tickets, eq(ticketActivityEvents.ticketId, tickets.id))
    .where(and(eq(tickets.orgId, orgId), gte(ticketActivityEvents.createdAt, thirtyDaysAgo)));

  const eventsByUser = new Map<string, ActivityEvent[]>();
  const lastActivityByUser = new Map<string, Date>();

  for (const e of recentEvents) {
    const row = {
      id: "",
      ticketId: "",
      userId: e.userId,
      eventType: e.eventType,
      pathOrUrl: e.pathOrUrl,
      resourceName: e.resourceName,
      metadata: e.metadata,
      createdAt: e.createdAt,
    } as ActivityEvent;
    const list = eventsByUser.get(e.userId) ?? [];
    list.push(row);
    eventsByUser.set(e.userId, list);

    const d = e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt);
    const prev = lastActivityByUser.get(e.userId);
    if (!prev || d > prev) lastActivityByUser.set(e.userId, d);
  }

  const activeDevelopers7d = new Set<string>();
  for (const e of recentEvents) {
    const d = e.createdAt instanceof Date ? e.createdAt : new Date(e.createdAt);
    if (d >= sevenDaysAgo) {
      const u = orgUsers.find((x) => x.id === e.userId);
      if (u?.role === "developer") activeDevelopers7d.add(e.userId);
    }
  }

  const developerRoleUsers = orgUsers.filter((u) => u.role === "developer");

  const focusRows = await db()
    .select({
      userId: ticketFocusSessions.userId,
      totalMinutes: sql<number>`COALESCE(
        SUM(EXTRACT(EPOCH FROM (${ticketFocusSessions.completedAt} - ${ticketFocusSessions.startedAt})) / 60.0),
        0
      )`.mapWith(Number),
      sessionCount: count(),
    })
    .from(ticketFocusSessions)
    .innerJoin(tickets, eq(ticketFocusSessions.ticketId, tickets.id))
    .where(
      and(eq(tickets.orgId, orgId), isNotNull(ticketFocusSessions.completedAt))
    )
    .groupBy(ticketFocusSessions.userId);

  const focusByUser = new Map(
    focusRows.map((r) => [
      r.userId,
      { minutes: Math.round(r.totalMinutes), sessions: Number(r.sessionCount) },
    ])
  );

  let focusMinutesOrg = 0;
  let focusSessionsCompleted = 0;
  for (const r of focusRows) {
    focusMinutesOrg += Math.round(r.totalMinutes);
    focusSessionsCompleted += Number(r.sessionCount);
  }

  const members = orgUsers.map((u) => {
    const load = workloadByUser.get(u.id) ?? 0;
    const mood = moodFromWorkload(load);
    const lastAt = lastActivityByUser.get(u.id) ?? null;
    const focus = focusByUser.get(u.id);

    const base = {
      userId: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      ticketWorkload: load,
      moodLabel: mood.label,
      moodStyle: mood.style,
      lastActivityAt: lastAt ? lastAt.toISOString() : null,
      focusMinutes: focus?.minutes ?? 0,
      completedFocusSessions: focus?.sessions ?? 0,
    };

    if (u.role !== "developer") {
      return {
        ...base,
        productivityScore: null as number | null,
        performanceLabel: null as string | null,
        retentionRisk: "n/a" as const,
        openAssignedTickets: 0,
      };
    }

    const events = eventsByUser.get(u.id) ?? [];
    const summary = summarizeTicketActivity(events);
    const openAssigned = openAssignedByDev.get(u.id) ?? 0;
    const risk = retentionRiskForDeveloper({
      openTickets: openAssigned,
      lastActivityAt: lastAt,
      sevenDaysAgo,
      fourteenDaysAgo,
    });

    return {
      ...base,
      productivityScore: summary.productivityScore,
      performanceLabel: summary.performanceLabel,
      retentionRisk: risk,
      openAssignedTickets: openAssigned,
    };
  });

  return NextResponse.json({
    generatedAt: now.toISOString(),
    ticketPipeline: { ...pipeline, total: totalTickets },
    productivityScore,
    completionRatePercent,
    developerCount: developerRoleUsers.length,
    developersActiveLast7Days: activeDevelopers7d.size,
    focusMinutesOrg,
    focusSessionsCompleted,
    members,
  });
}
