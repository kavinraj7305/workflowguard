/**
 * Seed demo HR + employee + task. Run after `npm run db:push`.
 * Usage: npm run db:seed
 */
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  taskAllowedUrls,
  taskAssignments,
  tasks,
  users,
} from "../src/db/schema";
import { hashPassword } from "../src/lib/auth/password";

async function main() {
  const hrEmail = "hr@demo.local";
  const empEmail = "employee@demo.local";
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

  const hrHash = await hashPassword(password);
  const empHash = await hashPassword(password);

  const [hr] = await db()
    .insert(users)
    .values({
      email: hrEmail,
      passwordHash: hrHash,
      name: "Demo HR",
      role: "hr",
    })
    .returning();

  const [emp] = await db()
    .insert(users)
    .values({
      email: empEmail,
      passwordHash: empHash,
      name: "Demo Employee",
      role: "employee",
    })
    .returning();

  if (!hr || !emp) throw new Error("Failed to create users");

  const [task] = await db()
    .insert(tasks)
    .values({
      title: "Fill customer data",
      description: "Complete the CRM intake for assigned accounts in the workspace.",
      expectedMinutes: 45,
      createdById: hr.id,
    })
    .returning();

  if (!task) throw new Error("Failed to create task");

  const patterns = ["dashboard", "profile", "analytics"];
  await db().insert(taskAllowedUrls).values(
    patterns.map((urlPattern) => ({
      taskId: task.id,
      urlPattern,
    }))
  );

  await db().insert(taskAssignments).values({
    taskId: task.id,
    employeeId: emp.id,
    status: "pending",
  });

  console.log("Seed complete.");
  console.log(`  HR:       ${hrEmail} / ${password}`);
  console.log(`  Employee: ${empEmail} / ${password}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
