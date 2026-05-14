import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { payrollPayments, users } from "@/db/schema";
import { requireHr } from "@/lib/api/auth";

const createSchema = z.object({
  userId: z.string().uuid(),
  payPeriod: z.string().min(4).max(32),
  grossCents: z.number().int().nonnegative(),
  deductionsCents: z.number().int().nonnegative().optional().default(0),
  notes: z.string().max(2000).optional().default(""),
  status: z.enum(["draft", "approved", "paid"]).optional().default("draft"),
});

export async function GET() {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  const rows = await db()
    .select({
      id: payrollPayments.id,
      userId: payrollPayments.userId,
      payPeriod: payrollPayments.payPeriod,
      grossCents: payrollPayments.grossCents,
      deductionsCents: payrollPayments.deductionsCents,
      netCents: payrollPayments.netCents,
      status: payrollPayments.status,
      notes: payrollPayments.notes,
      createdAt: payrollPayments.createdAt,
      paidAt: payrollPayments.paidAt,
      employeeName: users.name,
      employeeEmail: users.email,
    })
    .from(payrollPayments)
    .innerJoin(users, eq(users.id, payrollPayments.userId))
    .where(eq(payrollPayments.orgId, session.orgId))
    .orderBy(desc(payrollPayments.createdAt))
    .limit(200);

  const totals = rows.reduce(
    (acc, r) => {
      acc.gross += r.grossCents;
      acc.net += r.netCents;
      return acc;
    },
    { gross: 0, net: 0 }
  );

  return NextResponse.json({ payments: rows, totalsCents: totals });
}

export async function POST(request: Request) {
  const session = await requireHr();
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

  const member = await db()
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, parsed.data.userId), eq(users.orgId, session.orgId)))
    .limit(1)
    .then((r) => r[0]);

  if (!member) {
    return NextResponse.json({ error: "User not in organization" }, { status: 404 });
  }

  const netCents = parsed.data.grossCents - parsed.data.deductionsCents;
  if (netCents < 0) {
    return NextResponse.json({ error: "Net pay cannot be negative" }, { status: 400 });
  }

  try {
    const [row] = await db()
      .insert(payrollPayments)
      .values({
        orgId: session.orgId,
        userId: parsed.data.userId,
        payPeriod: parsed.data.payPeriod.trim(),
        grossCents: parsed.data.grossCents,
        deductionsCents: parsed.data.deductionsCents,
        netCents,
        status: parsed.data.status,
        notes: parsed.data.notes.trim(),
        paidAt: parsed.data.status === "paid" ? new Date() : null,
      })
      .returning();

    return NextResponse.json({ payment: row });
  } catch {
    return NextResponse.json(
      { error: "Duplicate pay period for this person, or database error" },
      { status: 409 }
    );
  }
}
