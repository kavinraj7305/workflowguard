import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  engagementEvents,
  productivitySnapshots,
  taskAllowedUrls,
  taskAssignments,
} from "@/db/schema";
import { computeProductivity } from "@/lib/productivity";
import { requireEmployee } from "@/lib/api/auth";
import { isMockMode } from "@/lib/mock-mode";
import { getMockWorkspaceAssignment } from "@/lib/mock-data";

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
      snapshot: {
        id: crypto.randomUUID(),
        assignmentId,
        score: 88,
        classification: "engaged",
        details: {
          spanSec: 420,
          idleSec: 45,
          idleRatio: 0.11,
          onTaskHeartbeats: 11,
          offTaskHeartbeats: 1,
          deviationRatio: 0.08,
          completed: true,
          mock: true,
        },
        computedAt: new Date().toISOString(),
      },
      mock: true,
    });
  }

  const row = await db()
    .select({
      assignment: taskAssignments,
      taskId: taskAssignments.taskId,
    })
    .from(taskAssignments)
    .where(
      and(
        eq(taskAssignments.id, assignmentId),
        eq(taskAssignments.employeeId, session.sub)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const patterns = await db()
    .select({ pattern: taskAllowedUrls.urlPattern })
    .from(taskAllowedUrls)
    .where(eq(taskAllowedUrls.taskId, row.taskId));

  const events = await db()
    .select()
    .from(engagementEvents)
    .where(eq(engagementEvents.assignmentId, assignmentId));

  const result = computeProductivity(
    events,
    patterns.map((p) => p.pattern)
  );

  const [snap] = await db()
    .insert(productivitySnapshots)
    .values({
      assignmentId,
      score: result.score,
      classification: result.classification,
      details: result.details,
    })
    .returning();

  return NextResponse.json({ snapshot: snap });
}
