import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAssignments, tasks } from "@/db/schema";
import { getSession } from "@/lib/auth/session";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { isMockMode } from "@/lib/mock-mode";
import { getMockWorkspaceAssignment } from "@/lib/mock-data";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const session = await getSession();
  if (!session || session.role !== "employee") {
    redirect("/login");
  }

  if (isMockMode()) {
    const mock = getMockWorkspaceAssignment(session.sub, assignmentId);
    if (!mock) {
      notFound();
    }
    return (
      <WorkspaceShell assignmentId={assignmentId} taskTitle={mock.task.title}>
        {children}
      </WorkspaceShell>
    );
  }

  const row = await db()
    .select({
      assignment: taskAssignments,
      task: tasks,
    })
    .from(taskAssignments)
    .innerJoin(tasks, eq(taskAssignments.taskId, tasks.id))
    .where(
      and(
        eq(taskAssignments.id, assignmentId),
        eq(taskAssignments.employeeId, session.sub)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (!row) {
    notFound();
  }

  return (
    <WorkspaceShell assignmentId={assignmentId} taskTitle={row.task.title}>
      {children}
    </WorkspaceShell>
  );
}
