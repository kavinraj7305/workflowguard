import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { tickets, users } from "@/db/schema";

export async function getDeveloperTicket(ticketId: string, orgId: string, userId: string) {
  return db()
    .select({
      ticket: tickets,
      creatorName: users.name,
    })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(
      and(
        eq(tickets.id, ticketId),
        eq(tickets.orgId, orgId),
        eq(tickets.assignedDeveloperId, userId)
      )
    )
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export async function getTicketById(ticketId: string, orgId: string) {
  return db()
    .select({
      ticket: tickets,
      creatorName: users.name,
    })
    .from(tickets)
    .innerJoin(users, eq(tickets.createdById, users.id))
    .where(and(eq(tickets.id, ticketId), eq(tickets.orgId, orgId)))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}