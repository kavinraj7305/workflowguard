import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// Load .env.local first, then .env (so `npm run db:push` finds DATABASE_URL)
config({ path: ".env.local" });
config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Neon: use "Direct" connection URL for drizzle-kit if push fails with pooler; app can keep pooled URL.
    url:
      process.env.DIRECT_URL?.trim() ||
      process.env.DATABASE_URL_UNPOOLED?.trim() ||
      process.env.DATABASE_URL!,
  },
});
