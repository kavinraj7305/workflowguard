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

export const userRoleEnum = pgEnum("user_role", ["hr", "employee"]);

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "pending",
  "in_progress",
  "completed",
]);

export const classificationEnum = pgEnum("productivity_class", [
  "engaged",
  "distracted",
  "idle",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
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

export const tasks = pgTable("tasks", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  expectedMinutes: integer("expected_minutes").notNull(),
  createdById: uuid("created_by_id")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const taskAllowedUrls = pgTable("task_allowed_urls", {
  id: uuid("id").defaultRandom().primaryKey(),
  taskId: uuid("task_id")
    .notNull()
    .references(() => tasks.id, { onDelete: "cascade" }),
  urlPattern: text("url_pattern").notNull(),
});

export const taskAssignments = pgTable(
  "task_assignments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    employeeId: uuid("employee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    status: assignmentStatusEnum("status").notNull().default("pending"),
    dueAt: timestamp("due_at", { withTimezone: true }),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (t) => [
    uniqueIndex("task_assignments_task_employee_unique").on(
      t.taskId,
      t.employeeId
    ),
  ]
);

export const engagementEvents = pgTable("engagement_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => taskAssignments.id, { onDelete: "cascade" }),
  eventType: text("event_type").notNull(),
  pathOrUrl: text("path_or_url"),
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const productivitySnapshots = pgTable("productivity_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  assignmentId: uuid("assignment_id")
    .notNull()
    .references(() => taskAssignments.id, { onDelete: "cascade" }),
  score: integer("score").notNull(),
  classification: classificationEnum("classification").notNull(),
  details: jsonb("details").$type<Record<string, unknown>>().notNull(),
  computedAt: timestamp("computed_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const usersRelations = relations(users, ({ many }) => ({
  tasksCreated: many(tasks),
  assignments: many(taskAssignments),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [tasks.createdById],
    references: [users.id],
  }),
  allowedUrls: many(taskAllowedUrls),
  assignments: many(taskAssignments),
}));

export const taskAllowedUrlsRelations = relations(taskAllowedUrls, ({ one }) => ({
  task: one(tasks, {
    fields: [taskAllowedUrls.taskId],
    references: [tasks.id],
  }),
}));

export const taskAssignmentsRelations = relations(
  taskAssignments,
  ({ one, many }) => ({
    task: one(tasks, {
      fields: [taskAssignments.taskId],
      references: [tasks.id],
    }),
    employee: one(users, {
      fields: [taskAssignments.employeeId],
      references: [users.id],
    }),
    events: many(engagementEvents),
    snapshots: many(productivitySnapshots),
  })
);

export const engagementEventsRelations = relations(engagementEvents, ({ one }) => ({
  assignment: one(taskAssignments, {
    fields: [engagementEvents.assignmentId],
    references: [taskAssignments.id],
  }),
}));

export const productivitySnapshotsRelations = relations(
  productivitySnapshots,
  ({ one }) => ({
    assignment: one(taskAssignments, {
      fields: [productivitySnapshots.assignmentId],
      references: [taskAssignments.id],
    }),
  })
);
