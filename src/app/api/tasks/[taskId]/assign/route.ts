import { NextResponse } from "next/server";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAssignments, tasks, users } from "@/db/schema";
import { requireHr } from "@/lib/api/auth";
import { isMockMode } from "@/lib/mock-mode";
import { MOCK_IDS } from "@/lib/mock-data";

const bodySchema = z.object({
  employeeId: z.string().uuid(),
  dueAt: z.string().datetime().optional().nullable(),
});

type Params = { params: Promise<{ taskId: string }> };

export async function POST(request: Request, { params }: Params) {
  const hr = await requireHr();
  if (hr instanceof NextResponse) return hr;

  const { taskId } = await params;
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
    if (taskId !== MOCK_IDS.task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (parsed.data.employeeId !== MOCK_IDS.employeeUser) {
      return NextResponse.json({ error: "Invalid employee" }, { status: 400 });
    }
    return NextResponse.json({
      assignment: {
        id: MOCK_IDS.assignment,
        taskId,
        employeeId: parsed.data.employeeId,
        status: "pending",
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : null,
        assignedAt: new Date().toISOString(),
        completedAt: null,
      },
      mock: true,
    });
  }

  const task = await db()
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)
    .then((r) => r[0]);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
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

  const emp = await db()
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, parsed.data.employeeId))
    .limit(1)
    .then((r) => r[0]);

  if (!emp || emp.role !== "employee") {
    return NextResponse.json({ error: "Invalid employee" }, { status: 400 });
  }

  const dueAt = parsed.data.dueAt ? new Date(parsed.data.dueAt) : null;

  const dup = await db()
    .select({ id: taskAssignments.id })
    .from(taskAssignments)
    .where(
      and(
        eq(taskAssignments.taskId, taskId),
        eq(taskAssignments.employeeId, emp.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (dup) {
    return NextResponse.json(
      { error: "Already assigned to this employee" },
      { status: 409 }
    );
  }

  const [assignment] = await db()
    .insert(taskAssignments)
    .values({
      taskId,
      employeeId: emp.id,
      status: "pending",
      dueAt,
    })
    .returning();

  return NextResponse.json({ assignment });
}
