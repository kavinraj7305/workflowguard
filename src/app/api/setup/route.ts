import { NextResponse } from "next/server";
import { count, eq, type InferSelectModel } from "drizzle-orm";
import { db } from "@/db";
import { orgs, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { z } from "zod";

const bodySchema = z.object({
  orgName: z.string().min(2),
  orgSlug: z.string().min(2).optional(),
  adminName: z.string().min(2),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(8),
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "workspace";
}

/** Public: multi-tenant instance stats (every org shares one database; emails are globally unique). */
export async function GET() {
  const [[{ total: orgTotal }], [{ total: userTotal }]] = await Promise.all([
    db().select({ total: count() }).from(orgs),
    db().select({ total: count() }).from(users),
  ]);
  return NextResponse.json({
    signupAvailable: true,
    organizationCount: Number(orgTotal ?? 0),
    userCount: Number(userTotal ?? 0),
  });
}

export async function POST(request: Request) {
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

  const input = parsed.data;
  const email = input.adminEmail.toLowerCase();

  const [emailTaken] = await db()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (emailTaken) {
    return NextResponse.json(
      {
        error: "Email already registered",
        code: "EMAIL_IN_USE",
        detail:
          "This email is already used by an account in WorkFlowGuard. Sign in with that email, or use a different email for your new organization’s HR admin.",
      },
      { status: 409 }
    );
  }

  const slugBase = input.orgSlug?.trim() || slugify(input.orgName);
  const orgSlug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  const passwordHash = await hashPassword(input.adminPassword);

  let org: InferSelectModel<typeof orgs> | undefined;
  let admin: InferSelectModel<typeof users> | undefined;

  try {
    const [insertedOrg] = await db()
      .insert(orgs)
      .values({
        name: input.orgName.trim(),
        slug: orgSlug,
      })
      .returning();
    org = insertedOrg;

    if (!org) {
      return NextResponse.json({ error: "Failed to create org" }, { status: 500 });
    }

    const [insertedAdmin] = await db()
      .insert(users)
      .values({
        orgId: org.id,
        email,
        passwordHash,
        name: input.adminName.trim(),
        role: "hr",
      })
      .returning();
    admin = insertedAdmin;
  } catch (e: unknown) {
    if (org?.id) {
      await db().delete(orgs).where(eq(orgs.id, org.id));
    }
    const code = typeof e === "object" && e !== null && "code" in e ? String((e as { code?: string }).code) : "";
    if (code === "23505") {
      return NextResponse.json(
        {
          error: "Email already registered",
          code: "EMAIL_IN_USE",
          detail:
            "This email is already used. Sign in, or choose another email for your organization’s HR admin.",
        },
        { status: 409 }
      );
    }
    throw e;
  }

  if (!org || !admin) {
    return NextResponse.json({ error: "Failed to create organization" }, { status: 500 });
  }

  const token = await createSessionToken({
    sub: admin.id,
    orgId: admin.orgId,
    email: admin.email,
    name: admin.name,
    role: admin.role,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
    },
    user: {
      id: admin.id,
      orgId: admin.orgId,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    },
  });
}