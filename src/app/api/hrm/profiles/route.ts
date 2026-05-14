import { NextResponse } from "next/server";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { employeeProfiles, users } from "@/db/schema";
import { requireHr } from "@/lib/api/auth";

const upsertSchema = z.object({
  userId: z.string().uuid(),
  jobTitle: z.string().max(200).optional(),
  department: z.string().max(200).optional(),
  hireDate: z.string().max(32).nullable().optional(),
  workLocation: z.string().max(200).optional(),
});

export async function GET() {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  const rows = await db()
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      profileId: employeeProfiles.id,
      jobTitle: employeeProfiles.jobTitle,
      department: employeeProfiles.department,
      hireDate: employeeProfiles.hireDate,
      workLocation: employeeProfiles.workLocation,
      profileUpdatedAt: employeeProfiles.updatedAt,
    })
    .from(users)
    .leftJoin(employeeProfiles, eq(employeeProfiles.userId, users.id))
    .where(eq(users.orgId, session.orgId))
    .orderBy(desc(users.createdAt));

  const withProfile = rows.filter((r) => r.profileId);
  const coverage = rows.length ? Math.round((withProfile.length / rows.length) * 100) : 100;

  return NextResponse.json({ people: rows, profileCoveragePercent: coverage });
}

export async function PUT(request: Request) {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = upsertSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const row = await db()
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.id, parsed.data.userId), eq(users.orgId, session.orgId)))
    .limit(1)
    .then((r) => r[0]);

  if (!row) {
    return NextResponse.json({ error: "User not in organization" }, { status: 404 });
  }

  const existing = await db()
    .select({ id: employeeProfiles.id })
    .from(employeeProfiles)
    .where(eq(employeeProfiles.userId, parsed.data.userId))
    .limit(1)
    .then((r) => r[0]);

  const jobTitle = parsed.data.jobTitle?.trim() ?? "";
  const department = parsed.data.department?.trim() ?? "";
  const workLocation = parsed.data.workLocation?.trim() ?? "";
  const hireDate = parsed.data.hireDate === undefined ? undefined : parsed.data.hireDate;

  if (existing) {
    await db()
      .update(employeeProfiles)
      .set({
        jobTitle,
        department,
        workLocation,
        ...(hireDate !== undefined ? { hireDate: hireDate || null } : {}),
        updatedAt: new Date(),
      })
      .where(eq(employeeProfiles.userId, parsed.data.userId));
  } else {
    await db().insert(employeeProfiles).values({
      orgId: session.orgId,
      userId: parsed.data.userId,
      jobTitle,
      department,
      workLocation,
      hireDate: hireDate === undefined ? null : hireDate || null,
    });
  }

  return NextResponse.json({ ok: true });
}
