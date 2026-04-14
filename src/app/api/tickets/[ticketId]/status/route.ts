import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { requireEmployee, requireHr } from "@/lib/api/auth";

const bodySchema = z.object({
  status: z.enum(["open", "in_progress", "testing", "closed"]),
});

type Params = { params: Promise<{ ticketId: string }> };

export async function POST(request: Request, { params }: Params) {
  const worker = await requireEmployee();
  const admin = await requireHr();
  const session = worker instanceof NextResponse ? admin : worker;
  if (session instanceof NextResponse) return session;

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

  const { ticketId } = await params;
  const ticket = await db()
    .select({ id: tickets.id, assignedDeveloperId: tickets.assignedDeveloperId, testerId: tickets.testerId })
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, session.orgId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const allowedForWorker =
    session.role === "developer" && ticket.assignedDeveloperId === session.sub;
  const allowedForTester =
    session.role === "tester" && (ticket.testerId === session.sub || parsed.data.status === "closed");
  const allowedForAdmin = session.role === "hr" || session.role === "manager";

  if (!allowedForWorker && !allowedForTester && !allowedForAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.status === "closed" && session.role !== "hr" && session.role !== "manager" && session.role !== "tester") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (parsed.data.status === "testing" && session.role !== "developer" && !allowedForAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [updated] = await db()
    .update(tickets)
    .set({
      status: parsed.data.status,
      closedAt: parsed.data.status === "closed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, session.orgId)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ticket: updated });
}