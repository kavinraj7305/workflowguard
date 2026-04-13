import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAssignments } from "@/db/schema";
import { requireEmployee } from "@/lib/api/auth";
import { isMockMode } from "@/lib/mock-mode";
import { getMockWorkspaceAssignment, MOCK_IDS } from "@/lib/mock-data";

type Params = { params: Promise<{ assignmentId: string }> };

export async function POST(_request: Request, { params }: Params) {
  const session = await requireEmployee();
  if (session instanceof NextResponse) return session;

  const { assignmentId } = await params;

  if (isMockMode()) {
    const mockA = getMockWorkspaceAssignment(session.sub, assignmentId);
    if (!mockA) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({
      assignment: {
        id: MOCK_IDS.assignment,
        taskId: mockA.taskId,
        employeeId: session.sub,
        status: "completed",
        dueAt: null,
        assignedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      },
      mock: true,
    });
  }

  const updated = await db()
    .update(taskAssignments)
    .set({
      status: "completed",
      completedAt: new Date(),
    })
    .where(
      and(
        eq(taskAssignments.id, assignmentId),
        eq(taskAssignments.employeeId, session.sub)
      )
    )
    .returning();

  if (!updated.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ assignment: updated[0] });
}
