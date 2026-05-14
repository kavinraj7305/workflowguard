import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", [
  "hr",
  "manager",
  "developer",
  "tester",
]);

export const ticketStatusEnum = pgEnum("ticket_status", ["open", "in_progress", "testing", "closed"]);

export const ticketTypeEnum = pgEnum("ticket_type", ["task", "bug"]);

export const ticketPriorityEnum = pgEnum("ticket_priority", ["low", "medium", "high", "urgent"]);

export const payrollPaymentStatusEnum = pgEnum("payroll_payment_status", ["draft", "approved", "paid"]);

export const leaveRequestStatusEnum = pgEnum("leave_request_status", ["pending", "approved", "rejected"]);

export const orgs = pgTable(
  "orgs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("orgs_slug_unique").on(t.slug)]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    name: text("name").notNull(),
    role: userRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)]
);

export const tickets = pgTable("tickets", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgs.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  type: ticketTypeEnum("type").notNull().default("task"),
  status: ticketStatusEnum("status").notNull().default("open"),
  priority: ticketPriorityEnum("priority").notNull().default("medium"),
  allowedApps: jsonb("allowed_apps")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  blockedUrlPatterns: jsonb("blocked_url_patterns")
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'::jsonb`),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  assignedDeveloperId: uuid("assigned_developer_id").references(() => users.id, {
    onDelete: "set null",
  }),
  testerId: uuid("tester_id").references(() => users.id, {
    onDelete: "set null",
  }),
  screenshotData: text("screenshot_data"),
  screenshotName: text("screenshot_name"),
  screenshotMimeType: text("screenshot_mime_type"),
  screenshotUploadedAt: timestamp("screenshot_uploaded_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  closedAt: timestamp("closed_at", { withTimezone: true }),
});

export const ticketActivityTypeEnum = pgEnum("ticket_activity_type", [
  "session_start",
  "session_end",
  "page_view",
  "resource_use",
  "site_visit",
  "idle_start",
  "idle_end",
  "heartbeat",
  "focus_start",
  "focus_pause",
  "focus_resume",
  "focus_stop",
]);

export const ticketActivityEvents = pgTable("ticket_activity_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  eventType: ticketActivityTypeEnum("event_type").notNull(),
  pathOrUrl: text("path_or_url"),
  resourceName: text("resource_name"),
  metadata: jsonb("metadata").$type<Record<string, unknown>>().notNull().default(sql`'{}'::jsonb`),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const ticketFocusSessions = pgTable("ticket_focus_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  ticketId: uuid("ticket_id")
    .notNull()
    .references(() => tickets.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  mode: text("mode").notNull().default("pomodoro"),
  startedAt: timestamp("started_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  pausedAt: timestamp("paused_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  plannedMinutes: integer("planned_minutes").notNull().default(25),
  breakMinutes: integer("break_minutes").notNull().default(5),
});

/** HR record per login user (one row per user). */
export const employeeProfiles = pgTable(
  "employee_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    jobTitle: text("job_title").notNull().default(""),
    department: text("department").notNull().default(""),
    hireDate: text("hire_date"),
    workLocation: text("work_location").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (t) => [uniqueIndex("employee_profiles_user_id_unique").on(t.userId)]
);

/** Simplified payroll line per person per pay period (amounts in cents). */
export const payrollPayments = pgTable(
  "payroll_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => orgs.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    payPeriod: text("pay_period").notNull(),
    grossCents: integer("gross_cents").notNull(),
    deductionsCents: integer("deductions_cents").notNull().default(0),
    netCents: integer("net_cents").notNull(),
    status: payrollPaymentStatusEnum("status").notNull().default("draft"),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("payroll_payments_org_user_period_unique").on(t.orgId, t.userId, t.payPeriod)]
);

export const leaveRequests = pgTable("leave_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  orgId: uuid("org_id")
    .notNull()
    .references(() => orgs.id, { onDelete: "cascade" }),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  kind: text("kind").notNull().default("pto"),
  reason: text("reason").notNull().default(""),
  status: leaveRequestStatusEnum("status").notNull().default("pending"),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
  decidedById: uuid("decided_by_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const orgsRelations = relations(orgs, ({ many }) => ({
  users: many(users),
  tickets: many(tickets),
  employeeProfiles: many(employeeProfiles),
  payrollPayments: many(payrollPayments),
  leaveRequests: many(leaveRequests),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  org: one(orgs, {
    fields: [users.orgId],
    references: [orgs.id],
  }),
  createdTickets: many(tickets),
  assignedTickets: many(tickets),
  testerTickets: many(tickets),
  employeeProfile: one(employeeProfiles, {
    fields: [users.id],
    references: [employeeProfiles.userId],
  }),
  payrollPayments: many(payrollPayments),
  leaveRequests: many(leaveRequests),
}));

export const employeeProfilesRelations = relations(employeeProfiles, ({ one }) => ({
  org: one(orgs, {
    fields: [employeeProfiles.orgId],
    references: [orgs.id],
  }),
  user: one(users, {
    fields: [employeeProfiles.userId],
    references: [users.id],
  }),
}));

export const payrollPaymentsRelations = relations(payrollPayments, ({ one }) => ({
  org: one(orgs, {
    fields: [payrollPayments.orgId],
    references: [orgs.id],
  }),
  user: one(users, {
    fields: [payrollPayments.userId],
    references: [users.id],
  }),
}));

export const leaveRequestsRelations = relations(leaveRequests, ({ one }) => ({
  org: one(orgs, {
    fields: [leaveRequests.orgId],
    references: [orgs.id],
  }),
  user: one(users, {
    fields: [leaveRequests.userId],
    references: [users.id],
  }),
  decidedBy: one(users, {
    fields: [leaveRequests.decidedById],
    references: [users.id],
  }),
}));

export const ticketsRelations = relations(tickets, ({ one }) => ({
  org: one(orgs, {
    fields: [tickets.orgId],
    references: [orgs.id],
  }),
  createdBy: one(users, {
    fields: [tickets.createdById],
    references: [users.id],
  }),
  assignedDeveloper: one(users, {
    fields: [tickets.assignedDeveloperId],
    references: [users.id],
  }),
  tester: one(users, {
    fields: [tickets.testerId],
    references: [users.id],
  })
}));

export const ticketActivityEventsRelations = relations(ticketActivityEvents, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketActivityEvents.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketActivityEvents.userId],
    references: [users.id],
  }),
}));

export const ticketFocusSessionsRelations = relations(ticketFocusSessions, ({ one }) => ({
  ticket: one(tickets, {
    fields: [ticketFocusSessions.ticketId],
    references: [tickets.id],
  }),
  user: one(users, {
    fields: [ticketFocusSessions.userId],
    references: [users.id],
  }),
}));
