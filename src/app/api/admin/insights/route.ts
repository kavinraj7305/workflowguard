import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  productivitySnapshots,
  taskAssignments,
  tasks,
  users,
} from "@/db/schema";
import { requireHr } from "@/lib/api/auth";
import { isMockMode } from "@/lib/mock-mode";
import { getMockInsights } from "@/lib/mock-data";

export async function GET() {
  const hr = await requireHr();
  if (hr instanceof NextResponse) return hr;

  if (isMockMode()) {
    return NextResponse.json(getMockInsights());
  }

  const allTasks = await db().select().from(tasks);

  const completedAssignments = await db()
    .select()
    .from(taskAssignments)
    .where(eq(taskAssignments.status, "completed"));

  const byTaskMs = new Map<string, number[]>();
  for (const a of completedAssignments) {
    if (!a.completedAt) continue;
    const ms = a.completedAt.getTime() - a.assignedAt.getTime();
    const list = byTaskMs.get(a.taskId) ?? [];
    list.push(ms);
    byTaskMs.set(a.taskId, list);
  }

  const bottlenecks = allTasks
    .map((t) => {
      const durations = byTaskMs.get(t.id) ?? [];
      if (durations.length === 0) return null;
      const avgMs =
        durations.reduce((a, b) => a + b, 0) / durations.length;
      const expectedMs = t.expectedMinutes * 60 * 1000;
      const slowRatio = expectedMs > 0 ? avgMs / expectedMs : 0;
      return {
        taskId: t.id,
        title: t.title,
        sampleSize: durations.length,
        avgMinutes: Math.round(avgMs / 60000),
        expectedMinutes: t.expectedMinutes,
        slowRatio,
        isBottleneck: slowRatio > 1.2,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => b.slowRatio - a.slowRatio);

  const assignmentsWithPeople = await db()
    .select({
      assignment: taskAssignments,
      employeeName: users.name,
      employeeEmail: users.email,
      taskTitle: tasks.title,
      taskExpectedMinutes: tasks.expectedMinutes,
    })
    .from(taskAssignments)
    .innerJoin(users, eq(taskAssignments.employeeId, users.id))
    .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
    .orderBy(desc(taskAssignments.assignedAt))
    .limit(50);

  const assignmentIds = assignmentsWithPeople.map((a) => a.assignment.id);
  const snapsForList =
    assignmentIds.length === 0
      ? []
      : await db()
          .select()
          .from(productivitySnapshots)
          .where(inArray(productivitySnapshots.assignmentId, assignmentIds))
          .orderBy(desc(productivitySnapshots.computedAt));

  const latestByAssignment = new Map<string, (typeof snapsForList)[0]>();
  for (const s of snapsForList) {
    if (!latestByAssignment.has(s.assignmentId)) {
      latestByAssignment.set(s.assignmentId, s);
    }
  }

  const recent = assignmentsWithPeople.map((row) => ({
    ...row.assignment,
    employeeName: row.employeeName,
    employeeEmail: row.employeeEmail,
    taskTitle: row.taskTitle,
    taskExpectedMinutes: row.taskExpectedMinutes,
    latestSnapshot: latestByAssignment.get(row.assignment.id) ?? null,
  }));

  return NextResponse.json({
    bottlenecks,
    recentAssignments: recent,
  });
}
