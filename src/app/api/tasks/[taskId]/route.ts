import { NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { taskAllowedUrls, tasks } from "@/db/schema";
import { requireHr } from "@/lib/api/auth";
import { isMockMode } from "@/lib/mock-mode";
import { getMockTaskRow, MOCK_IDS } from "@/lib/mock-data";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  expectedMinutes: z.number().int().positive().optional(),
  allowedUrlPatterns: z.array(z.string().min(1)).min(1).optional(),
});

type Params = { params: Promise<{ taskId: string }> };

export async function GET(_request: Request, { params }: Params) {
  const hr = await requireHr();
  if (hr instanceof NextResponse) return hr;

  const { taskId } = await params;
  if (isMockMode() && taskId === MOCK_IDS.task) {
    const t = getMockTaskRow();
    return NextResponse.json({
      task: {
        ...t,
        createdAt: t.createdAt.toISOString(),
        allowedUrlPatterns: ["dashboard", "profile", "analytics"],
      },
    });
  }
  if (isMockMode()) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const task = await db()
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)
    .then((r) => r[0]);

  if (!task) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const urls = await db()
    .select({ pattern: taskAllowedUrls.urlPattern })
    .from(taskAllowedUrls)
    .where(eq(taskAllowedUrls.taskId, taskId));

  return NextResponse.json({
    task: {
      ...task,
      allowedUrlPatterns: urls.map((u) => u.pattern),
    },
  });
}

export async function PATCH(request: Request, { params }: Params) {
  const hr = await requireHr();
  if (hr instanceof NextResponse) return hr;

  const { taskId } = await params;
  if (isMockMode()) {
    if (taskId !== MOCK_IDS.task) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    let json: unknown;
    try {
      json = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    const base = getMockTaskRow();
    const d = parsed.data;
    return NextResponse.json({
      task: {
        ...base,
        title: d.title ?? base.title,
        description: d.description ?? base.description,
        expectedMinutes: d.expectedMinutes ?? base.expectedMinutes,
        createdAt: base.createdAt.toISOString(),
        allowedUrlPatterns: d.allowedUrlPatterns ?? [
          "dashboard",
          "profile",
          "analytics",
        ],
      },
      mock: true,
    });
  }

  const existing = await db()
    .select({ id: tasks.id })
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)
    .then((r) => r[0]);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const data = parsed.data;
  if (data.title !== undefined || data.description !== undefined || data.expectedMinutes !== undefined) {
    await db()
      .update(tasks)
      .set({
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.expectedMinutes !== undefined
          ? { expectedMinutes: data.expectedMinutes }
          : {}),
      })
      .where(eq(tasks.id, taskId));
  }

  if (data.allowedUrlPatterns) {
    await db()
      .delete(taskAllowedUrls)
      .where(eq(taskAllowedUrls.taskId, taskId));
    await db().insert(taskAllowedUrls).values(
      data.allowedUrlPatterns.map((urlPattern) => ({
        taskId,
        urlPattern,
      }))
    );
  }

  const task = await db()
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1)
    .then((r) => r[0]);

  const urls = await db()
    .select({ pattern: taskAllowedUrls.urlPattern })
    .from(taskAllowedUrls)
    .where(eq(taskAllowedUrls.taskId, taskId));

  return NextResponse.json({
    task: {
      ...task,
      allowedUrlPatterns: urls.map((u) => u.pattern),
    },
  });
}

export async function DELETE(_request: Request, { params }: Params) {
  const hr = await requireHr();
  if (hr instanceof NextResponse) return hr;

  const { taskId } = await params;
  if (isMockMode()) {
    if (taskId !== MOCK_IDS.task) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, mock: true });
  }

  const deleted = await db()
    .delete(tasks)
    .where(eq(tasks.id, taskId))
    .returning({ id: tasks.id });

  if (!deleted.length) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
