import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import { requireHr } from "@/lib/api/auth";

const bodySchema = z.object({
  developerId: z.string().uuid(),
  testerId: z.string().uuid().optional().nullable(),
});

type Params = { params: Promise<{ ticketId: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  const { ticketId } = await params;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const developer = await db()
    .select({ id: users.id, role: users.role, orgId: users.orgId })
    .from(users)
    .where(and(eq(users.id, parsed.data.developerId), eq(users.orgId, session.orgId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!developer || developer.role !== "developer") {
    return NextResponse.json({ error: "Invalid developer" }, { status: 400 });
  }

  if (parsed.data.testerId) {
    const tester = await db()
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(and(eq(users.id, parsed.data.testerId), eq(users.orgId, session.orgId)))
      .limit(1)
      .then((rows) => rows[0]);
    if (!tester || tester.role !== "tester") {
      return NextResponse.json({ error: "Invalid tester" }, { status: 400 });
    }
  }

  const [ticket] = await db()
    .update(tickets)
    .set({
      assignedDeveloperId: developer.id,
      testerId: parsed.data.testerId ?? null,
      status: "open",
      updatedAt: new Date(),
    })
    .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, session.orgId)))
    .returning();

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket });
}