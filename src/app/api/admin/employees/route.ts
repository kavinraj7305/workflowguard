import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth/password";
import { requireHr } from "@/lib/api/auth";
import { isMockMode } from "@/lib/mock-mode";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
});

export async function POST(request: Request) {
  const hr = await requireHr();
  if (hr instanceof NextResponse) return hr;

  if (isMockMode()) {
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
    return NextResponse.json({
      employee: {
        id: crypto.randomUUID(),
        email: parsed.data.email.toLowerCase(),
        name: parsed.data.name,
      },
      mock: true,
    });
  }

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

  const email = parsed.data.email.toLowerCase();
  const existing = await db()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)
    .then((r) => r[0]);
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [created] = await db()
    .insert(users)
    .values({
      email,
      passwordHash,
      name: parsed.data.name,
      role: "employee",
    })
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
    });

  return NextResponse.json({ employee: created });
}
