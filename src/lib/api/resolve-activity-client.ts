import { NextResponse } from "next/server";
import { parseBearerAuth, verifyExtensionToken } from "@/lib/auth/extension-token";
import { getDeveloperTicket } from "@/lib/workflow-access";
import { requireEmployee } from "@/lib/api/auth";

export type ActivityClient = {
  sub: string;
  orgId: string;
  ticket: NonNullable<Awaited<ReturnType<typeof getDeveloperTicket>>>;
};

/** Cookie session (developer on ticket) or Bearer extension JWT for the same ticket. */
export async function resolveActivityClient(
  request: Request,
  ticketId: string
): Promise<ActivityClient | NextResponse> {
  const bearer = parseBearerAuth(request);
  if (bearer) {
    const ext = await verifyExtensionToken(bearer);
    if (!ext) {
      return NextResponse.json({ error: "Invalid extension token" }, { status: 401 });
    }
    if (ext.ticketId !== ticketId) {
      return NextResponse.json({ error: "Token does not match this ticket" }, { status: 403 });
    }
    const ticket = await getDeveloperTicket(ticketId, ext.orgId, ext.sub);
    if (!ticket) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return { sub: ext.sub, orgId: ext.orgId, ticket };
  }

  const session = await requireEmployee();
  if (session instanceof NextResponse) return session;
  if (session.role !== "developer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const ticket = await getDeveloperTicket(ticketId, session.orgId, session.sub);
  if (!ticket) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return { sub: session.sub, orgId: session.orgId, ticket };
}
