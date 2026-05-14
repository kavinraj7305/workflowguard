import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orgs } from "@/db/schema";
import { requireHr } from "@/lib/api/auth";

export async function GET() {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  const rows = await db().select().from(orgs).where(eq(orgs.id, session.orgId)).limit(1);
  return NextResponse.json({ orgs: rows });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Not available in admin",
      detail:
        "New organizations are created from public onboarding at /setup (unique HR email). The admin portal only manages your current organization.",
    },
    { status: 403 }
  );
}