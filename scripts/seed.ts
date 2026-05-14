/**
 * Seed demo org + users + tickets + HR/payroll + activity so analytics and Copilot tools have data.
 * Idempotent: safe to run again — tops up tickets/activity if the demo org looks thin.
 *
 * Usage: npm run db:seed
 * Requires: npm run db:push (or migration applied) so new tables exist.
 */
import { and, count, eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  employeeProfiles,
  leaveRequests,
  orgs,
  payrollPayments,
  ticketActivityEvents,
  ticketFocusSessions,
  tickets,
  users,
} from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

const HR_EMAIL = "hr@demo.local";
const PASS = "demo-password-change-me";

async function ensureProfiles(orgId: string, people: { id: string; title: string; dept: string }[]) {
  for (const p of people) {
    const exists = await db()
      .select({ id: employeeProfiles.id })
      .from(employeeProfiles)
      .where(eq(employeeProfiles.userId, p.id))
      .limit(1)
      .then((r) => r[0]);
    if (exists) continue;
    await db().insert(employeeProfiles).values({
      orgId,
      userId: p.id,
      jobTitle: p.title,
      department: p.dept,
      hireDate: "2024-01-15",
      workLocation: "Remote",
    });
  }
}

async function enrichOrgData(args: {
  orgId: string;
  hrId: string;
  managerId: string;
  developerId: string;
  testerId: string;
}) {
  const { orgId, hrId, managerId, developerId, testerId } = args;

  const hero = await db()
    .select({ id: tickets.id })
    .from(tickets)
    .where(and(eq(tickets.orgId, orgId), eq(tickets.title, "Checkout flow throws on empty cart")))
    .limit(1)
    .then((r) => r[0]);

  if (!hero) {
    const batch = [
      {
        title: "Checkout flow throws on empty cart",
        description: "Regression in staging; blocks release candidate.",
        type: "bug" as const,
        status: "open" as const,
        priority: "urgent" as const,
        assignedDeveloperId: developerId,
        testerId,
      },
      {
        title: "Dark mode contrast in settings",
        description: "WCAG audit flagged several panels.",
        type: "bug" as const,
        status: "in_progress" as const,
        priority: "high" as const,
        assignedDeveloperId: developerId,
        testerId,
      },
      {
        title: "Instrument analytics beacon",
        description: "Ship behind feature flag; validate payload shape.",
        type: "task" as const,
        status: "testing" as const,
        priority: "medium" as const,
        assignedDeveloperId: developerId,
        testerId,
      },
      {
        title: "Manager dashboard filters",
        description: "Saved views + date presets for leadership review.",
        type: "task" as const,
        status: "open" as const,
        priority: "medium" as const,
        assignedDeveloperId: developerId,
        testerId: null as string | null,
      },
      {
        title: "Weekly deploy checklist",
        description: "Automate smoke steps post-deploy.",
        type: "task" as const,
        status: "closed" as const,
        priority: "low" as const,
        assignedDeveloperId: developerId,
        testerId,
      },
      {
        title: "API rate limit headers",
        description: "Expose Retry-After consistently.",
        type: "task" as const,
        status: "in_progress" as const,
        priority: "high" as const,
        assignedDeveloperId: developerId,
        testerId,
      },
    ];

    for (const t of batch) {
      await db().insert(tickets).values({
        orgId,
        title: t.title,
        description: t.description,
        type: t.type,
        status: t.status,
        priority: t.priority,
        createdById: hrId,
        assignedDeveloperId: t.assignedDeveloperId,
        testerId: t.testerId,
        allowedApps: ["dashboard", "profile", "analytics"],
        blockedUrlPatterns: [],
        closedAt: t.status === "closed" ? new Date() : null,
      });
    }
    console.log(`Added ${batch.length} demo tickets.`);
  }

  const allTicketIds = await db()
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.orgId, orgId))
    .limit(12)
    .then((rows) => rows.map((r) => r.id));

  const ticketIds = allTicketIds;
  if (!ticketIds.length) return;

  const [{ c: evCount } = { c: 0 }] = await db()
    .select({ c: count() })
    .from(ticketActivityEvents)
    .innerJoin(tickets, eq(ticketActivityEvents.ticketId, tickets.id))
    .where(eq(tickets.orgId, orgId));

  if (Number(evCount) === 0) {
    const now = Date.now();
    const types = ["heartbeat", "page_view", "focus_start", "session_start"] as const;
    let k = 0;
    for (let d = 0; d < 5; d++) {
      for (let i = 0; i < 3; i++) {
        const tid = ticketIds[k % ticketIds.length]!;
        k += 1;
        const createdAt = new Date(now - (d * 86400000 + i * 3600000));
        await db().insert(ticketActivityEvents).values({
          ticketId: tid,
          userId: developerId,
          eventType: types[i % types.length]!,
          pathOrUrl: "/workspace/dashboard",
          resourceName: "demo",
          metadata: { seed: true },
          createdAt,
        });
      }
    }
    console.log("Added demo activity events for analytics.");
  }

  const [{ c: fsCount } = { c: 0 }] = await db()
    .select({ c: count() })
    .from(ticketFocusSessions)
    .innerJoin(tickets, eq(ticketFocusSessions.ticketId, tickets.id))
    .where(eq(tickets.orgId, orgId));

  if (Number(fsCount) === 0) {
    const tid = ticketIds[0]!;
    const t1 = new Date(Date.now() - 2 * 86400000);
    const t2 = new Date(t1.getTime() + 25 * 60000);
    await db().insert(ticketFocusSessions).values({
      ticketId: tid,
      userId: developerId,
      startedAt: t1,
      completedAt: t2,
      plannedMinutes: 25,
      breakMinutes: 5,
    });
    console.log("Added demo focus session.");
  }

  await ensureProfiles(orgId, [
    { id: hrId, title: "Head of People", dept: "People" },
    { id: managerId, title: "Engineering Manager", dept: "Engineering" },
    { id: developerId, title: "Software Engineer", dept: "Engineering" },
    { id: testerId, title: "QA Engineer", dept: "Quality" },
  ]);

  const leaveSeed = await db()
    .select({ id: leaveRequests.id })
    .from(leaveRequests)
    .where(and(eq(leaveRequests.orgId, orgId), eq(leaveRequests.reason, "Family trip")))
    .limit(1)
    .then((r) => r[0]);

  if (!leaveSeed) {
    await db().insert(leaveRequests).values({
      orgId,
      userId: developerId,
      startDate: "2026-06-01",
      endDate: "2026-06-03",
      kind: "pto",
      reason: "Family trip",
      status: "pending",
    });
    await db().insert(leaveRequests).values({
      orgId,
      userId: testerId,
      startDate: "2026-05-20",
      endDate: "2026-05-21",
      kind: "sick",
      reason: "",
      status: "pending",
    });
    console.log("Added demo leave requests.");
  }

  const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  try {
    await db().insert(payrollPayments).values({
      orgId,
      userId: developerId,
      payPeriod: period,
      grossCents: 950_000,
      deductionsCents: 280_000,
      netCents: 670_000,
      status: "approved",
      notes: "Seed row — replace with real payroll.",
    });
    await db().insert(payrollPayments).values({
      orgId,
      userId: testerId,
      payPeriod: period,
      grossCents: 720_000,
      deductionsCents: 210_000,
      netCents: 510_000,
      status: "draft",
      notes: "Seed row",
    });
    console.log("Added demo payroll lines for current month.");
  } catch {
    /* unique pay period per user */
  }
}

async function main() {
  const passwordHash = await hashPassword(PASS);

  const existingHr = await db()
    .select({ id: users.id, orgId: users.orgId })
    .from(users)
    .where(eq(users.email, HR_EMAIL))
    .limit(1)
    .then((r) => r[0]);

  if (existingHr) {
    const orgId = existingHr.orgId;
    const hrId = existingHr.id;

    let developerId = await db()
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.orgId, orgId), eq(users.email, "dev@demo.local")))
      .limit(1)
      .then((r) => r[0]?.id);

    if (!developerId) {
      const [d] = await db()
        .insert(users)
        .values({
          orgId,
          email: "dev@demo.local",
          passwordHash,
          name: "Demo Developer",
          role: "developer",
        })
        .returning();
      developerId = d!.id;
    }

    let testerId = await db()
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.orgId, orgId), eq(users.email, "tester@demo.local")))
      .limit(1)
      .then((r) => r[0]?.id);

    if (!testerId) {
      const [t] = await db()
        .insert(users)
        .values({
          orgId,
          email: "tester@demo.local",
          passwordHash,
          name: "Demo Tester",
          role: "tester",
        })
        .returning();
      testerId = t!.id;
    }

    let managerId = await db()
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.orgId, orgId), eq(users.email, "manager@demo.local")))
      .limit(1)
      .then((r) => r[0]?.id);

    if (!managerId) {
      const [m] = await db()
        .insert(users)
        .values({
          orgId,
          email: "manager@demo.local",
          passwordHash,
          name: "Demo Manager",
          role: "manager",
        })
        .returning();
      managerId = m!.id;
    }

    await enrichOrgData({ orgId, hrId, managerId, developerId, testerId });
    console.log("Seed refresh complete for existing demo org.");
    console.log(`  HR:        ${HR_EMAIL} / ${PASS}`);
    console.log("  Developer: dev@demo.local");
    console.log("  Tester:    tester@demo.local");
    console.log("  Manager:   manager@demo.local");
    return;
  }

  const slug = `demo-seed-${crypto.randomUUID().slice(0, 8)}`;
  const [org] = await db()
    .insert(orgs)
    .values({
      name: "Demo Organization",
      slug,
    })
    .returning();

  if (!org) throw new Error("Failed to create org");

  const [hr] = await db()
    .insert(users)
    .values({
      orgId: org.id,
      email: HR_EMAIL,
      passwordHash,
      name: "Demo HR",
      role: "hr",
    })
    .returning();

  const [manager] = await db()
    .insert(users)
    .values({
      orgId: org.id,
      email: "manager@demo.local",
      passwordHash,
      name: "Demo Manager",
      role: "manager",
    })
    .returning();

  const [developer] = await db()
    .insert(users)
    .values({
      orgId: org.id,
      email: "dev@demo.local",
      passwordHash,
      name: "Demo Developer",
      role: "developer",
    })
    .returning();

  const [tester] = await db()
    .insert(users)
    .values({
      orgId: org.id,
      email: "tester@demo.local",
      passwordHash,
      name: "Demo Tester",
      role: "tester",
    })
    .returning();

  if (!hr || !manager || !developer || !tester) throw new Error("Failed to create users");

  await db().insert(tickets).values({
    orgId: org.id,
    title: "Sample workspace ticket",
    description: "Use this ticket to try the protected workspace and activity logging.",
    type: "task",
    status: "in_progress",
    priority: "medium",
    createdById: hr.id,
    assignedDeveloperId: developer.id,
    testerId: tester.id,
    allowedApps: ["dashboard", "profile", "analytics"],
    blockedUrlPatterns: [],
  });

  await enrichOrgData({
    orgId: org.id,
    hrId: hr.id,
    managerId: manager.id,
    developerId: developer.id,
    testerId: tester.id,
  });

  console.log("Seed complete (new org).");
  console.log(`  Org:       ${org.name}`);
  console.log(`  HR:        ${HR_EMAIL} / ${PASS}`);
  console.log("  Manager:   manager@demo.local");
  console.log("  Developer: dev@demo.local");
  console.log("  Tester:    tester@demo.local");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
