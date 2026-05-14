import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { createExtensionToken } from "@/lib/auth/extension-token";
import { getDeveloperTicket } from "@/lib/workflow-access";

const bodySchema = z.object({
  ticketId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  const { ticketId } = parsed.data;
  const row = await getDeveloperTicket(ticketId, session.orgId, session.sub);
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const token = await createExtensionToken({
    sub: session.sub,
    orgId: session.orgId,
    ticketId,
  });

  return NextResponse.json({
    token,
    ticketId,
    expiresInHours: 8,
  });
}
