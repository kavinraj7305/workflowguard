import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { getDeveloperTicket } from "@/lib/workflow-access";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const session = await getSession();
  if (!session || session.role !== "developer") {
    redirect("/login");
  }

  const row = await getDeveloperTicket(assignmentId, session.orgId, session.sub);

  if (!row) {
    notFound();
  }

  return (
    <WorkspaceShell
      ticketId={assignmentId}
      ticketTitle={row.ticket.title}
      allowedApps={row.ticket.allowedApps}
      blockedUrlPatterns={row.ticket.blockedUrlPatterns}
    >
      {children}
    </WorkspaceShell>
  );
}
