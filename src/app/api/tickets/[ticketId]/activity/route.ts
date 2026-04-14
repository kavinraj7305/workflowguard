import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { ticketActivityEvents, tickets } from "@/db/schema";
import { requireEmployee } from "@/lib/api/auth";
import { getDeveloperTicket } from "@/lib/workflow-access";
import { summarizeTicketActivity } from "@/lib/ticket-analytics";

const eventSchema = z.object({
  eventType: z.enum([
    "session_start",
    "session_end",
    "page_view",
    "resource_use",
    "site_visit",
    "idle_start",
    "idle_end",
    "heartbeat",
    "focus_start",
    "focus_pause",
    "focus_resume",
    "focus_stop",
  ]),
  pathOrUrl: z.string().optional(),
  resourceName: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

type Params = { params: Promise<{ ticketId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireEmployee();
  if (session instanceof NextResponse) return session;

  const { ticketId } = await params;
  const ticket = await getDeveloperTicket(ticketId, session.orgId, session.sub);
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const events = await db()
    .select()
    .from(ticketActivityEvents)
    .where(and(eq(ticketActivityEvents.ticketId, ticketId), eq(ticketActivityEvents.userId, session.sub)))
    .orderBy(desc(ticketActivityEvents.createdAt));

  return NextResponse.json({
    events,
    summary: summarizeTicketActivity(events),
  });
}

export async function POST(request: Request, { params }: Params) {
  const session = await requireEmployee();
  if (session instanceof NextResponse) return session;

  const { ticketId } = await params;
  const ticket = await getDeveloperTicket(ticketId, session.orgId, session.sub);
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const payload = parsed.data;

  if (payload.pathOrUrl && ticket.ticket.blockedUrlPatterns.some((pattern) => payload.pathOrUrl!.includes(pattern))) {
    return NextResponse.json({ error: "Blocked by HR" }, { status: 403 });
  }

  if (payload.eventType === "session_start") {
    await db()
      .update(tickets)
      .set({
        status: "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, ticketId));
  }

  const [event] = await db()
    .insert(ticketActivityEvents)
    .values({
      ticketId,
      userId: session.sub,
      eventType: payload.eventType,
      pathOrUrl: payload.pathOrUrl ?? null,
      resourceName: payload.resourceName ?? null,
      metadata: payload.metadata ?? {},
    })
    .returning();

  const events = await db()
    .select()
    .from(ticketActivityEvents)
    .where(and(eq(ticketActivityEvents.ticketId, ticketId), eq(ticketActivityEvents.userId, session.sub)))
    .orderBy(desc(ticketActivityEvents.createdAt));

  return NextResponse.json({
    event,
    summary: summarizeTicketActivity(events),
  });
}