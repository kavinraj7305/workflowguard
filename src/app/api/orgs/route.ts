import { NextResponse } from "next/server";
import { z } from "zod";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { orgs } from "@/db/schema";
import { requireHr } from "@/lib/api/auth";

const createSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2).optional(),
});

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "workspace";
}

export async function GET() {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  const rows = await db().select().from(orgs).orderBy(desc(orgs.createdAt));
  return NextResponse.json({ orgs: rows });
}

export async function POST(request: Request) {
  const session = await requireHr();
  if (session instanceof NextResponse) return session;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const input = parsed.data;
  const baseSlug = input.slug?.trim() || slugify(input.name);
  const uniqueSlug = `${baseSlug}-${crypto.randomUUID().slice(0, 8)}`;

  const [org] = await db()
    .insert(orgs)
    .values({
      name: input.name.trim(),
      slug: uniqueSlug,
    })
    .returning();

  if (!org) {
    return NextResponse.json({ error: "Failed to create org" }, { status: 500 });
  }

  return NextResponse.json({ org });
}