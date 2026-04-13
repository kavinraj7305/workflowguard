/**
 * Applies generated Drizzle SQL to Neon using the Neon HTTP driver (same as the app).
 * Usage: npm run db:apply
 */
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: join(process.cwd(), ".env") });

const raw = process.env.DATABASE_URL?.trim();
if (!raw || !raw.startsWith("postgres")) {
  console.error("Set DATABASE_URL in .env");
  process.exit(1);
}

const sql = neon(raw);

const drizzleDir = join(process.cwd(), "drizzle");
const files = readdirSync(drizzleDir).filter((f) => f.endsWith(".sql") && /^\d+_/.test(f));
if (!files.length) {
  console.error("No drizzle/*.sql migration found. Run: npx drizzle-kit generate");
  process.exit(1);
}
files.sort();
const latest = files[files.length - 1]!;
const fileSql = readFileSync(join(drizzleDir, latest), "utf8");

const statements = fileSql
  .split(/;\s*-->\s*statement-breakpoint\s*/gi)
  .map((s) => s.trim())
  .filter(Boolean)
  .map((s) => (s.endsWith(";") ? s : `${s};`));

async function main() {
  for (const st of statements) {
    await sql.query(st);
  }
  console.log(`Applied ${latest} (${statements.length} statements).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
