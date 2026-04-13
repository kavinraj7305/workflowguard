import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { engagementEvents, taskAllowedUrls, taskAssignments } from "@/db/schema";
import { pathMatchesAllowed } from "@/lib/url-match";
import { requireEmployee } from "@/lib/api/auth";
import { isMockMode } from "@/lib/mock-mode";
import {
  getMockUrlPatternsForTask,
  getMockWorkspaceAssignment,
} from "@/lib/mock-data";

const bodySchema = z.object({
  eventType: z.enum([
    "heartbeat",
    "page_view",
    "idle_start",
    "idle_end",
    "navigation",
    "task_complete",
  ]),
  pathOrUrl: z.string().optional(),
  payload: z.record(z.string(), z.any()).optional(),
});

type Params = { params: Promise<{ assignmentId: string }> };

export async function POST(request: Request, { params }: Params) {
  const session = await requireEmployee();
  if (session instanceof NextResponse) return session;

  const { assignmentId } = await params;

  if (isMockMode()) {
    const mockA = getMockWorkspaceAssignment(session.sub, assignmentId);
    if (!mockA) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    const patternList = getMockUrlPatternsForTask(mockA.taskId);
    const path = parsed.data.pathOrUrl ?? "";
    const onTask = pathMatchesAllowed(path, patternList);
    return NextResponse.json({
      event: {
        id: crypto.randomUUID(),
        assignmentId,
        eventType: parsed.data.eventType,
        pathOrUrl: parsed.data.pathOrUrl ?? null,
        payload: { ...(parsed.data.payload ?? {}), onTask },
        createdAt: new Date().toISOString(),
      },
      onTask,
      mock: true,
    });
  }

  const assignment = await db()
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

  if (!assignment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const patterns = await db()
    .select({ pattern: taskAllowedUrls.urlPattern })
    .from(taskAllowedUrls)
    .where(eq(taskAllowedUrls.taskId, assignment.taskId));

  const patternList = patterns.map((p) => p.pattern);
  const path = parsed.data.pathOrUrl ?? "";
  const onTask = pathMatchesAllowed(path, patternList);

  if (parsed.data.eventType === "task_complete") {
    await db()
      .update(taskAssignments)
      .set({
        status: "completed",
        completedAt: new Date(),
      })
      .where(eq(taskAssignments.id, assignmentId));
  } else if (parsed.data.eventType === "heartbeat" || parsed.data.eventType === "page_view") {
    await db()
      .update(taskAssignments)
      .set({ status: "in_progress" })
      .where(eq(taskAssignments.id, assignmentId));
  }

  const [event] = await db()
    .insert(engagementEvents)
    .values({
      assignmentId,
      eventType: parsed.data.eventType,
      pathOrUrl: parsed.data.pathOrUrl ?? null,
      payload: {
        ...(parsed.data.payload ?? {}),
        onTask,
      },
    })
    .returning();

  return NextResponse.json({ event, onTask });
}
