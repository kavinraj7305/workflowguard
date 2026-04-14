import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";
import { requireEmployee, requireHr } from "@/lib/api/auth";

const createSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional().default(""),
  type: z.enum(["task", "bug"]),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  allowedApps: z.array(z.string().min(1)).default(["dashboard", "profile", "analytics"]),
  assignedDeveloperId: z.string().uuid().optional().nullable(),
  testerId: z.string().uuid().optional().nullable(),
  blockedUrlPatterns: z.array(z.string().min(1)).default([]),
});

export async function GET(request: Request) {
  const session = await requireEmployee();
  const adminSession = await requireHr();
  const actor = session instanceof NextResponse ? adminSession : session;
  if (actor instanceof NextResponse) return actor;

  const url = new URL(request.url);
  const scope = url.searchParams.get("scope");

  let rows = await db()
    .select({
      ticket: tickets,
      creatorName: users.name,
    })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(eq(tickets.orgId, actor.orgId))
    .orderBy(desc(tickets.createdAt));

  if (scope === "mine" || actor.role === "developer") {
    rows = rows.filter((row) => row.ticket.assignedDeveloperId === actor.sub);
  }

  if (scope === "testing" || actor.role === "tester") {
    rows = rows.filter((row) => row.ticket.status === "testing" || row.ticket.testerId === actor.sub);
  }

  return NextResponse.json({
    tickets: rows.map((row) => ({
      ...row.ticket,
      creatorName: row.creatorName,
    })),
  });
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

  const input = parsed.data;

  const [ticket] = await db()
    .insert(tickets)
    .values({
      orgId: session.orgId,
      title: input.title,
      description: input.description,
      type: input.type,
      priority: input.priority,
      allowedApps: input.allowedApps,
      createdById: session.sub,
      assignedDeveloperId: input.assignedDeveloperId ?? null,
      testerId: input.testerId ?? null,
      blockedUrlPatterns: input.blockedUrlPatterns,
    })
    .returning();

  if (!ticket) {
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }

  return NextResponse.json({ ticket });
}