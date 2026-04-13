import { NextResponse } from "next/server";
import { z } from "zod";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAllowedUrls, tasks } from "@/db/schema";
import { requireHr } from "@/lib/api/auth";
import { isMockMode } from "@/lib/mock-mode";
import { getMockTaskRow, getMockTasksForApi } from "@/lib/mock-data";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().default(""),
  expectedMinutes: z.number().int().positive(),
  allowedUrlPatterns: z.array(z.string().min(1)).min(1),
});

export async function GET() {
  const hr = await requireHr();
  if (hr instanceof NextResponse) return hr;

  if (isMockMode()) {
    return NextResponse.json({ tasks: getMockTasksForApi() });
  }

  const taskRows = await db()
    .select()
    .from(tasks)
    .orderBy(desc(tasks.createdAt));

  const urlsByTask = await db().select().from(taskAllowedUrls);
  const map = new Map<string, string[]>();
  for (const u of urlsByTask) {
    const list = map.get(u.taskId) ?? [];
    list.push(u.urlPattern);
    map.set(u.taskId, list);
  }

  const out = taskRows.map((t) => ({
    ...t,
    allowedUrlPatterns: map.get(t.id) ?? [],
  }));

  return NextResponse.json({ tasks: out });
}

export async function POST(request: Request) {
  const hr = await requireHr();
  if (hr instanceof NextResponse) return hr;

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

  const { title, description, expectedMinutes, allowedUrlPatterns } =
    parsed.data;

  if (isMockMode()) {
    const base = getMockTaskRow();
    return NextResponse.json({
      task: {
        ...base,
        id: crypto.randomUUID(),
        title,
        description,
        expectedMinutes,
        createdById: hr.sub,
        createdAt: new Date(),
        allowedUrlPatterns,
      },
    });
  }

  const [task] = await db()
    .insert(tasks)
    .values({
      title,
      description,
      expectedMinutes,
      createdById: hr.sub,
    })
    .returning();

  if (!task) {
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }

  await db().insert(taskAllowedUrls).values(
    allowedUrlPatterns.map((urlPattern) => ({
      taskId: task.id,
      urlPattern,
    }))
  );

  return NextResponse.json({
    task: {
      ...task,
      allowedUrlPatterns,
    },
  });
}
