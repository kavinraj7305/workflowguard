import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { orgs } from "@/db/schema";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null, org: null });
  }

  const [org] = await db()
    .select({ id: orgs.id, name: orgs.name, slug: orgs.slug })
    .from(orgs)
    .where(eq(orgs.id, session.orgId))
    .limit(1);

  return NextResponse.json({
    user: {
      id: session.sub,
      orgId: session.orgId,
      email: session.email,
      name: session.name,
      role: session.role,
    },
    org: org ?? null,
  });
}
