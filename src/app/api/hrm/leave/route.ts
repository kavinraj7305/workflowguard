import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { leaveRequests, users } from "@/db/schema";
import { requireHr, requireSession } from "@/lib/api/auth";

const createSchema = z.object({
  startDate: z.string().min(8).max(32),
  endDate: z.string().min(8).max(32),
  kind: z.enum(["pto", "sick", "other"]).optional().default("pto"),
  reason: z.string().max(2000).optional().default(""),
  /** HR/manager only: submit on behalf of another user */
  forUserId: z.string().uuid().optional(),
});

const patchSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
});

export async function GET() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const isHr = session.role === "hr" || session.role === "manager";

  const rows = await db()
    .select({
      id: leaveRequests.id,
      userId: leaveRequests.userId,
      startDate: leaveRequests.startDate,
      endDate: leaveRequests.endDate,
      kind: leaveRequests.kind,
      reason: leaveRequests.reason,
      status: leaveRequests.status,
      createdAt: leaveRequests.createdAt,
      decidedAt: leaveRequests.decidedAt,
      requesterName: users.name,
      requesterEmail: users.email,
    })
    .from(leaveRequests)
    .innerJoin(users, eq(users.id, leaveRequests.userId))
    .where(
      isHr
        ? eq(leaveRequests.orgId, session.orgId)
        : and(eq(leaveRequests.orgId, session.orgId), eq(leaveRequests.userId, session.sub))
    )
    .orderBy(desc(leaveRequests.createdAt))
    .limit(100);

  return NextResponse.json({ requests: rows });
}

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const isHr = session.role === "hr" || session.role === "manager";
  const targetUserId = isHr && parsed.data.forUserId ? parsed.data.forUserId : session.sub;

  if (!isHr && parsed.data.forUserId && parsed.data.forUserId !== session.sub) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const member = await db()
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, targetUserId), eq(users.orgId, session.orgId)))
    .limit(1)
    .then((r) => r[0]);

  if (!member) {
    return NextResponse.json({ error: "User not in organization" }, { status: 404 });
  }

  const [created] = await db()
    .insert(leaveRequests)
    .values({
      orgId: session.orgId,
      userId: targetUserId,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      kind: parsed.data.kind,
      reason: parsed.data.reason.trim(),
    })
    .returning();

  return NextResponse.json({ request: created });
}

export async function PATCH(request: Request) {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

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

  const row = await db()
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.id, parsed.data.id), eq(leaveRequests.orgId, session.orgId)))
    .limit(1)
    .then((r) => r[0]);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db()
    .update(leaveRequests)
    .set({
      status: parsed.data.status,
      decidedAt: new Date(),
      decidedById: session.sub,
    })
    .where(eq(leaveRequests.id, parsed.data.id));

  return NextResponse.json({ ok: true });
}
