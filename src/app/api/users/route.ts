import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { requireHr } from "@/lib/api/auth";

const roles = ["hr", "manager", "developer", "tester"] as const;

const createSchema = z.object({
  orgId: z.string().uuid().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(roles),
});

export async function GET(request: Request) {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  const url = new URL(request.url);
  const role = url.searchParams.get("role");

  let query = db().select().from(users).where(eq(users.orgId, session.orgId)).orderBy(desc(users.createdAt));
  if (role && roles.includes(role as (typeof roles)[number])) {
    query = db()
      .select()
      .from(users)
      .where(eq(users.orgId, session.orgId))
      .where(eq(users.role, role as (typeof roles)[number]))
      .orderBy(desc(users.createdAt));
  }

  const rows = await query;
  return NextResponse.json({ users: rows });
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
  const passwordHash = await hashPassword(input.password);

  const [user] = await db()
    .insert(users)
    .values({
      orgId: session.orgId,
      email: input.email.toLowerCase(),
      passwordHash,
      name: input.name.trim(),
      role: input.role,
    })
    .returning();

  if (!user) {
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }

  return NextResponse.json({ user });
}