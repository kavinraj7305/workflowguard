import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireHr } from "@/lib/api/auth";
import { isMockMode } from "@/lib/mock-mode";
import { getMockEmployees } from "@/lib/mock-data";

export async function GET() {
  const hr = await requireHr();
  if (hr instanceof NextResponse) return hr;

  if (isMockMode()) {
    return NextResponse.json({ employees: getMockEmployees() });
  }

  const rows = await db()
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
    })
    .from(users)
    .where(eq(users.role, "employee"));

  return NextResponse.json({ employees: rows });
}
