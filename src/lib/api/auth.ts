import { NextResponse } from "next/server";
import { getSession, type SessionPayload } from "@/lib/auth/session";

export async function requireSession(): Promise<
  SessionPayload | NextResponse
> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return session;
}

export async function requireHr(): Promise<SessionPayload | NextResponse> {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;
  if (s.role !== "hr") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return s;
}

export async function requireEmployee(): Promise<SessionPayload | NextResponse> {
  const s = await requireSession();
  if (s instanceof NextResponse) return s;
  if (s.role !== "employee") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return s;
}
