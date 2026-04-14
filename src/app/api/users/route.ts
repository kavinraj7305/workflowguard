import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { orgs, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { requireHr } from "@/lib/api/auth";
import { sendCredentialsEmail } from "@/lib/notify/credentials-email";

const roles = ["hr", "manager", "developer", "tester"] as const;

const createSchema = z.object({
  orgId: z.string().uuid().optional(),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(roles),
  sendCredentialsEmail: z.boolean().optional().default(true),
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
      .where(and(eq(users.orgId, session.orgId), eq(users.role, role as (typeof roles)[number])))
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
  const shouldNotifyByEmail =
    input.sendCredentialsEmail && (input.role === "developer" || input.role === "tester");

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

  let notification: {
    attempted: boolean;
    sent: boolean;
    message: string;
  } = {
    attempted: false,
    sent: false,
    message: "Email not requested for this role.",
  };

  if (shouldNotifyByEmail) {
    notification.attempted = true;
    const org = await db()
      .select({ name: orgs.name })
      .from(orgs)
      .where(eq(orgs.id, session.orgId))
      .limit(1)
      .then((rows) => rows[0]);

    const loginUrl = process.env.APP_LOGIN_URL ?? "http://localhost:3000/login";
    const result = await sendCredentialsEmail({
      to: user.email,
      userName: user.name,
      role: user.role,
      temporaryPassword: input.password,
      orgName: org?.name ?? "Your organization",
      loginUrl,
      createdByName: session.name,
    });

    notification = {
      attempted: true,
      sent: result.sent,
      message: result.message,
    };
  }

  return NextResponse.json({ user, notification });
}