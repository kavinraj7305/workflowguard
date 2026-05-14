/**
 * Optional seed: demo org, HR, developer, and one ticket. Run after `npm run db:push`.
 * Usage: npm run db:seed
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { orgs, tickets, users } from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const hrEmail = "hr@demo.local";
  const password = "demo-password-change-me";

  const existingHr = await db()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, hrEmail))
    .limit(1);

  if (existingHr.length) {
    console.log("Seed already applied (hr@demo.local exists). Skipping.");
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

  const hrHash = await hashPassword(password);
  const devHash = await hashPassword(password);

  const [hr] = await db()
    .insert(users)
    .values({
      orgId: org.id,
      email: hrEmail,
      passwordHash: hrHash,
      name: "Demo HR",
      role: "hr",
    })
    .returning();

  const [developer] = await db()
    .insert(users)
    .values({
      orgId: org.id,
      email: "dev@demo.local",
      passwordHash: devHash,
      name: "Demo Developer",
      role: "developer",
    })
    .returning();

  if (!hr || !developer) throw new Error("Failed to create users");

  await db().insert(tickets).values({
    orgId: org.id,
    title: "Sample workspace ticket",
    description: "Use this ticket to try the protected workspace and activity logging.",
    type: "task",
    priority: "medium",
    createdById: hr.id,
    assignedDeveloperId: developer.id,
    allowedApps: ["dashboard", "profile", "analytics"],
    blockedUrlPatterns: [],
  });

  console.log("Seed complete.");
  console.log(`  Org:       ${org.name}`);
  console.log(`  HR:        ${hrEmail} / ${password}`);
  console.log(`  Developer: dev@demo.local / ${password}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
