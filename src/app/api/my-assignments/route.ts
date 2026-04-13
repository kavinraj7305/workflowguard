import { NextResponse } from "next/server";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  taskAllowedUrls,
  taskAssignments,
  tasks,
} from "@/db/schema";
import { requireEmployee } from "@/lib/api/auth";
import { isMockMode } from "@/lib/mock-mode";
import { getMockAssignmentsForEmployee } from "@/lib/mock-data";

export async function GET() {
  const session = await requireEmployee();
  if (session instanceof NextResponse) return session;

  if (isMockMode()) {
    return NextResponse.json({
      assignments: getMockAssignmentsForEmployee(session.sub),
    });
  }

  const rows = await db()
    .select({
      assignment: taskAssignments,
      task: tasks,
    })
    .from(taskAssignments)
    .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
    .where(eq(taskAssignments.employeeId, session.sub))
    .orderBy(desc(taskAssignments.assignedAt));

  const taskIds = [...new Set(rows.map((r) => r.task.id))];
  const urlsByTask = new Map<string, string[]>();
  if (taskIds.length > 0) {
    const allUrls = await db()
      .select()
      .from(taskAllowedUrls)
      .where(inArray(taskAllowedUrls.taskId, taskIds));
    for (const u of allUrls) {
      const list = urlsByTask.get(u.taskId) ?? [];
      list.push(u.urlPattern);
      urlsByTask.set(u.taskId, list);
    }
  }

  const assignments = rows.map((r) => ({
    ...r.assignment,
    task: {
      ...r.task,
      allowedUrlPatterns: urlsByTask.get(r.task.id) ?? [],
    },
  }));

  return NextResponse.json({ assignments });
}
