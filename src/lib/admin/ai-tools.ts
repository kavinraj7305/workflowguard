import { and, count, desc, eq, ne } from "drizzle-orm";
import { db } from "@/db";
import { employeeProfiles, leaveRequests, tickets, users } from "@/db/schema";

const roles = ["hr", "manager", "developer", "tester"] as const;

export type ToolName = "list_open_bugs" | "list_employees" | "get_ticket_pipeline" | "list_pending_leave";

export async function runAdminAiTool(orgId: string, name: ToolName, args: Record<string, unknown>) {
  switch (name) {
    case "list_open_bugs": {
      const rows = await db()
        .select({
          id: tickets.id,
          title: tickets.title,
          status: tickets.status,
          priority: tickets.priority,
          assignedDeveloperId: tickets.assignedDeveloperId,
        })
        .from(tickets)
        .where(and(eq(tickets.orgId, orgId), eq(tickets.type, "bug"), ne(tickets.status, "closed")))
        .orderBy(desc(tickets.updatedAt))
        .limit(40);
      return { openBugs: rows, count: rows.length };
    }
    case "list_employees": {
      const roleFilter = typeof args.role === "string" ? args.role : "all";
      const conditions = [eq(users.orgId, orgId)];
      if (roleFilter !== "all" && roles.includes(roleFilter as (typeof roles)[number])) {
        conditions.push(eq(users.role, roleFilter as (typeof roles)[number]));
      }
      const rows = await db()
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          jobTitle: employeeProfiles.jobTitle,
          department: employeeProfiles.department,
        })
        .from(users)
        .leftJoin(employeeProfiles, eq(employeeProfiles.userId, users.id))
        .where(and(...conditions))
        .orderBy(users.name);
      return { employees: rows, count: rows.length };
    }
    case "get_ticket_pipeline": {
      const rows = await db()
        .select({ status: tickets.status, c: count() })
        .from(tickets)
        .where(eq(tickets.orgId, orgId))
        .groupBy(tickets.status);
      const map: Record<string, number> = {};
      for (const r of rows) map[r.status] = r.c;
      return {
        open: map.open ?? 0,
        in_progress: map.in_progress ?? 0,
        testing: map.testing ?? 0,
        closed: map.closed ?? 0,
        total: Object.values(map).reduce((a, b) => a + b, 0),
      };
    }
    case "list_pending_leave": {
      const rows = await db()
        .select({
          id: leaveRequests.id,
          userId: leaveRequests.userId,
          startDate: leaveRequests.startDate,
          endDate: leaveRequests.endDate,
          kind: leaveRequests.kind,
          reason: leaveRequests.reason,
          status: leaveRequests.status,
          requesterName: users.name,
          requesterEmail: users.email,
        })
        .from(leaveRequests)
        .innerJoin(users, eq(users.id, leaveRequests.userId))
        .where(and(eq(leaveRequests.orgId, orgId), eq(leaveRequests.status, "pending")))
        .orderBy(desc(leaveRequests.createdAt))
        .limit(30);
      return { requests: rows, count: rows.length };
    }
    default:
      return { error: "unknown_tool" };
  }
}
