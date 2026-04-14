import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets } from "@/db/schema";
import { requireEmployee } from "@/lib/api/auth";

type Params = { params: Promise<{ ticketId: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireEmployee();
  if (session instanceof NextResponse) return session;

  const { ticketId } = await params;
  const ticket = await db()
    .select({ id: tickets.id, assignedDeveloperId: tickets.assignedDeveloperId, orgId: tickets.orgId })
    .from(tickets)
    .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, session.orgId)))
    .limit(1)
    .then((rows) => rows[0]);

  if (!ticket || ticket.assignedDeveloperId !== session.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await request.formData();
  const file = form.get("screenshot");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing screenshot" }, { status: 400 });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUrl = `data:${file.type || "application/octet-stream"};base64,${base64}`;

  const [updated] = await db()
    .update(tickets)
    .set({
      screenshotData: dataUrl,
      screenshotName: file.name,
      screenshotMimeType: file.type || "application/octet-stream",
      screenshotUploadedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tickets.id, ticketId))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Failed to save screenshot" }, { status: 500 });
  }

  return NextResponse.json({ ticket: updated });
}