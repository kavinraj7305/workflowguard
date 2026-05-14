import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { orgs, users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";

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

/** Public: whether the one-time org bootstrap has already created at least one user. */
export async function GET() {
  const existing = await db().select({ id: users.id }).from(users).limit(1);
  return NextResponse.json({ setupComplete: existing.length > 0 });
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

  const existing = await db().select({ id: users.id }).from(users).limit(1);
  if (existing.length > 0) {
    return NextResponse.json(
      {
        error: "Setup already completed",
        detail:
          "This database already has at least one user (from a previous onboarding or seed). Sign in with that account, or use a fresh database if you need to run first-time setup again.",
      },
      { status: 409 }
    );
  }

  const input = parsed.data;
  const slugBase = input.orgSlug?.trim() || slugify(input.orgName);
  const orgSlug = `${slugBase}-${crypto.randomUUID().slice(0, 8)}`;
  const passwordHash = await hashPassword(input.adminPassword);

  const [org] = await db()
    .insert(orgs)
    .values({
      name: input.orgName.trim(),
      slug: orgSlug,
    })
    .returning();

  if (!org) {
    return NextResponse.json({ error: "Failed to create org" }, { status: 500 });
  }

  const [admin] = await db()
    .insert(users)
    .values({
      orgId: org.id,
      email: input.adminEmail.toLowerCase(),
      passwordHash,
      name: input.adminName.trim(),
      role: "hr",
    })
    .returning();

  if (!admin) {
    return NextResponse.json({ error: "Failed to create admin" }, { status: 500 });
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