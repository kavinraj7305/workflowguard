import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { verifyPassword } from "@/lib/auth/password";
import { createSessionToken, setSessionCookie } from "@/lib/auth/session";
import { isMockMode } from "@/lib/mock-mode";
import { resolveMockLogin } from "@/lib/mock-data";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

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
  const { email, password } = parsed.data;

  if (isMockMode()) {
    const mockUser = resolveMockLogin(email, password);
    if (!mockUser) {
      return NextResponse.json(
        { error: "Invalid credentials (mock demo: hr@demo.local or employee@demo.local / demo)" },
        { status: 401 }
      );
    }
    const token = await createSessionToken({
      sub: mockUser.id,
      email: mockUser.email,
      name: mockUser.name,
      role: mockUser.role,
    });
    await setSessionCookie(token);
    return NextResponse.json({
      user: {
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      },
    });
  }

  const row = await db()
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1)
    .then((r) => r[0]);

  if (!row || !(await verifyPassword(password, row.passwordHash))) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await createSessionToken({
    sub: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
  });
  await setSessionCookie(token);

  return NextResponse.json({
    user: {
      id: row.id,
      email: row.email,
      name: row.name,
      role: row.role,
    },
  });
}
