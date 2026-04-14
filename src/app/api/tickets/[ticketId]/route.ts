import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import { requireHr, requireEmployee } from "@/lib/api/auth";

const patchSchema = z.object({
  title: z.string().min(2).optional(),
  description: z.string().optional(),
  status: z.enum(["open", "in_progress", "testing", "closed"]).optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  allowedApps: z.array(z.string().min(1)).optional(),
  blockedUrlPatterns: z.array(z.string().min(1)).optional(),
  testerId: z.string().uuid().nullable().optional(),
  assignedDeveloperId: z.string().uuid().nullable().optional(),
});

type Params = { params: Promise<{ ticketId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const session = await requireEmployee();
  const admin = await requireHr();
  const actor = session instanceof NextResponse ? admin : session;
  if (actor instanceof NextResponse) return actor;

  const { ticketId } = await params;
  const row = await db()
    .select({ ticket: tickets, creatorName: users.name })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, actor.orgId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket: { ...row.ticket, creatorName: row.creatorName } });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  const { ticketId } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const [ticket] = await db()
    .update(tickets)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
      closedAt: parsed.data.status === "closed" ? new Date() : undefined,
    })
    .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, session.orgId)))
    .returning();

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}