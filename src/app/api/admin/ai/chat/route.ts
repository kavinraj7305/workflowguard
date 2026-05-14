import { NextResponse } from "next/server";
import { z } from "zod";
import { requireHr } from "@/lib/api/auth";
import { runAdminAiTool, type ToolName } from "@/lib/admin/ai-tools";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "tool"]),
  content: z.string().nullable().optional(),
  tool_call_id: z.string().optional(),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "list_open_bugs",
      description:
        "List bug-type tickets that are not closed. Use when the user asks about bugs, defects, or open engineering issues.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_employees",
      description:
        "List people in the organization with role and optional HR profile fields (job title, department). Filter by role when asked.",
      parameters: {
        type: "object",
        properties: {
          role: {
            type: "string",
            enum: ["all", "hr", "manager", "developer", "tester"],
            description: "Restrict to a role, or all for everyone.",
          },
        },
        additionalProperties: false,
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "get_ticket_pipeline",
      description: "Counts of tickets by workflow status for the org (open, in progress, testing, closed).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "list_pending_leave",
      description: "Time-off requests waiting for approval (pending only).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

type OaiMessage =
  | { role: "system" | "user" | "assistant"; content?: string | null; tool_calls?: unknown }
  | {
      role: "tool";
      tool_call_id: string;
      content: string;
    };

function safeJsonParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

async function openAiRound(
  apiKey: string,
  messages: OaiMessage[],
  model: string
): Promise<{
  content: string | null;
  tool_calls?: { id: string; function: { name: string; arguments: string } }[];
}> {
  const res = await fetch(OPENAI_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: messages as unknown[],
      tools: TOOLS,
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 400) || `OpenAI ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: {
      message?: {
        content?: string | null;
        tool_calls?: { id: string; function: { name: string; arguments: string } }[];
      };
    }[];
  };

  const msg = data.choices?.[0]?.message;
  return {
    content: msg?.content ?? null,
    tool_calls: msg?.tool_calls,
  };
}

async function fallbackAssistant(orgId: string, lastUser: string) {
  const lower = lastUser.toLowerCase();
  const trace: { name: ToolName; result: unknown }[] = [];

  const run = async (name: ToolName, args: Record<string, unknown> = {}) => {
    const result = await runAdminAiTool(orgId, name, args);
    trace.push({ name, result });
    return result;
  };

  const wantsBugs = /\b(bug|bugs|defect|regression)\b/i.test(lower);
  const wantsPeople = /\b(team|employee|people|roster|staff|who works|headcount)\b/i.test(lower);
  const wantsPipeline = /\b(pipeline|status|throughput|wip|work in progress|how many ticket)\b/i.test(lower);
  const wantsLeave = /\b(leave|pto|vacation|time off|out of office|ooo)\b/i.test(lower);

  if (wantsBugs) await run("list_open_bugs");
  if (wantsPeople) {
    let role = "all";
    if (/\bdeveloper(s)?\b/i.test(lower)) role = "developer";
    else if (/\btester|qa\b/i.test(lower)) role = "tester";
    else if (/\bmanager(s)?\b/i.test(lower)) role = "manager";
    else if (/\bhr\b/i.test(lower)) role = "hr";
    await run("list_employees", { role });
  }
  if (wantsPipeline) await run("get_ticket_pipeline");
  if (wantsLeave) await run("list_pending_leave");

  if (trace.length === 0) {
    const p = await run("get_ticket_pipeline", {});
    const parts = [
      "Quick ticket counts for your org:",
      JSON.stringify(p, null, 2),
      "",
      "Try: “List open bugs”, “Who is on the team?”, “Pending leave”. With OPENAI_API_KEY set, answers are phrased in plain language on top of these tools.",
    ];
    return { reply: parts.join("\n"), toolTrace: trace };
  }

  const lines: string[] = [];
  for (const step of trace) {
    lines.push(`**${step.name}**`);
    lines.push("```json");
    lines.push(JSON.stringify(step.result, null, 2));
    lines.push("```");
    lines.push("");
  }
  lines.push("Sourced from your live org data. Add OPENAI_API_KEY for a conversational layer.");

  return { reply: lines.join("\n"), toolTrace: trace };
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

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini";

  const lastUser = [...parsed.data.messages].reverse().find((m) => m.role === "user");
  const lastUserText = (lastUser?.content ?? "").trim();
  if (!lastUserText) {
    return NextResponse.json({ error: "Missing user message" }, { status: 400 });
  }

  const toolTrace: { name: string; result: unknown }[] = [];

  if (!apiKey) {
    const out = await fallbackAssistant(session.orgId, lastUserText);
    return NextResponse.json({
      reply: out.reply,
      toolTrace: out.toolTrace,
      usedOpenAi: false,
    });
  }

  const system: OaiMessage = {
    role: "system",
    content:
      "You are WorkFlowGuard Copilot for HR and managers. You only answer using tool results about their current organization. Be concise and practical. After tools return data, summarize in plain English and mention counts. Never invent employees or tickets.",
  };

  const convo: OaiMessage[] = [
    system,
    ...parsed.data.messages
      .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "tool")
      .map((m) => {
        if (m.role === "tool" && m.tool_call_id) {
          return { role: "tool" as const, tool_call_id: m.tool_call_id, content: m.content ?? "" };
        }
        return { role: m.role as "user" | "assistant", content: m.content ?? "" };
      }),
  ];

  let round = 0;
  while (round < 6) {
    round += 1;
    let completion: {
      content: string | null;
      tool_calls?: { id: string; function: { name: string; arguments: string } }[];
    };
    try {
      completion = await openAiRound(apiKey, convo, model);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "OpenAI error";
      const out = await fallbackAssistant(session.orgId, lastUserText);
      return NextResponse.json({
        reply: `${out.reply}\n\n_(OpenAI unavailable: ${msg})_`,
        toolTrace: [...toolTrace, ...out.toolTrace],
        usedOpenAi: false,
      });
    }

    if (completion.tool_calls?.length) {
      convo.push({
        role: "assistant",
        content: completion.content,
        tool_calls: completion.tool_calls,
      });

      for (const tc of completion.tool_calls) {
        const name = tc.function.name as ToolName;
        const args = safeJsonParse(tc.function.arguments || "{}");
        let result: unknown;
        if (
          name === "list_open_bugs" ||
          name === "list_employees" ||
          name === "get_ticket_pipeline" ||
          name === "list_pending_leave"
        ) {
          result = await runAdminAiTool(session.orgId, name, args);
        } else {
          result = { error: "unknown_tool", name };
        }
        toolTrace.push({ name, result });
        convo.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    const text = completion.content?.trim() || "Done.";
    return NextResponse.json({ reply: text, toolTrace, usedOpenAi: true, model });
  }

  return NextResponse.json({ error: "Too many tool rounds" }, { status: 500 });
}
