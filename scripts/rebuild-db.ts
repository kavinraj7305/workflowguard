import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

config({ path: ".env.local" });
config({ path: ".env" });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const sql = neon(databaseUrl);

const statements = [
  "drop table if exists ticket_activity_events cascade;",
  "drop table if exists ticket_focus_sessions cascade;",
  "drop table if exists tickets cascade;",
  "drop table if exists orgs cascade;",
  "drop table if exists engagement_events cascade;",
  "drop table if exists productivity_snapshots cascade;",
  "drop table if exists task_allowed_urls cascade;",
  "drop table if exists task_assignments cascade;",
  "drop table if exists tasks cascade;",
  "drop table if exists users cascade;",
  "drop type if exists user_role cascade;",
  "drop type if exists ticket_status cascade;",
  "drop type if exists ticket_type cascade;",
  "drop type if exists ticket_priority cascade;",
  "drop type if exists ticket_activity_type cascade;",
  "create type user_role as enum ('hr','manager','developer','tester');",
  "create type ticket_status as enum ('open','in_progress','testing','closed');",
  "create type ticket_type as enum ('task','bug');",
  "create type ticket_priority as enum ('low','medium','high','urgent');",
  "create type ticket_activity_type as enum ('session_start','session_end','page_view','resource_use','site_visit','idle_start','idle_end','heartbeat','focus_start','focus_pause','focus_resume','focus_stop');",
  "create table orgs (id uuid primary key default gen_random_uuid(), name text not null, slug text not null, created_at timestamptz not null default now());",
  "create unique index orgs_slug_unique on orgs (slug);",
  "create table users (id uuid primary key default gen_random_uuid(), org_id uuid not null references orgs(id) on delete cascade, email text not null, password_hash text not null, name text not null, role user_role not null, created_at timestamptz not null default now());",
  "create unique index users_email_unique on users (email);",
  "create table tickets (id uuid primary key default gen_random_uuid(), org_id uuid not null references orgs(id) on delete cascade, title text not null, description text not null default '', type ticket_type not null default 'task', status ticket_status not null default 'open', priority ticket_priority not null default 'medium', allowed_apps jsonb not null default '[]'::jsonb, blocked_url_patterns jsonb not null default '[]'::jsonb, created_by_id uuid not null references users(id) on delete restrict, assigned_developer_id uuid references users(id) on delete set null, tester_id uuid references users(id) on delete set null, screenshot_data text, screenshot_name text, screenshot_mime_type text, screenshot_uploaded_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), closed_at timestamptz);",
  "create table ticket_activity_events (id uuid primary key default gen_random_uuid(), ticket_id uuid not null references tickets(id) on delete cascade, user_id uuid not null references users(id) on delete cascade, event_type ticket_activity_type not null, path_or_url text, resource_name text, metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now());",
  "create table ticket_focus_sessions (id uuid primary key default gen_random_uuid(), ticket_id uuid not null references tickets(id) on delete cascade, user_id uuid not null references users(id) on delete cascade, mode text not null default 'pomodoro', started_at timestamptz not null default now(), paused_at timestamptz, completed_at timestamptz, planned_minutes integer not null default 25, break_minutes integer not null default 5);",
];

async function main() {
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log("Fresh schema applied.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});