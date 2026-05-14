import { NextResponse } from "next/server";
import { z } from "zod";
import { requireHr } from "@/lib/api/auth";
import { runAdminAiTool, type ToolName } from "@/lib/admin/ai-tools";
import type { ChatMessage, ChatTool } from "@/lib/llm/openai-compatible";
import { chatCompletionRound, resolveChatLlm } from "@/lib/llm/openai-compatible";

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "tool"]),
  content: z.string().nullable().optional(),
  tool_call_id: z.string().optional(),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

const TOOLS: ChatTool[] = [
  {
    type: "function",
    function: {
      name: "list_open_bugs",
      description:
        "List bug-type tickets that are not closed. Use when the user asks about bugs, defects, or open engineering issues.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
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
    type: "function",
    function: {
      name: "get_ticket_pipeline",
      description: "Counts of tickets by workflow status for the org (open, in progress, testing, closed).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "list_pending_leave",
      description: "Time-off requests waiting for approval (pending only).",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_team_mood",
      description:
        "Workload-based mood labels (Calm / Busy / Overloaded) for each person derived from ticket assignments.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "get_daily_report",
      description:
        "UTC-day summary: tickets opened/closed today, open bugs, pending leave, pipeline counts, and short highlights from live data.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
];

function safeJsonParse(s: string): Record<string, unknown> {
  try {
    return JSON.parse(s) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function isToolName(name: string): name is ToolName {
  return (
    name === "list_open_bugs" ||
    name === "list_employees" ||
    name === "get_ticket_pipeline" ||
    name === "list_pending_leave" ||
    name === "get_team_mood" ||
    name === "get_daily_report"
  );
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
  const wantsMood = /\b(mood|morale|stress|workload|overloaded|burnout)\b/i.test(lower);
  const wantsReport = /\b(report|summary|today|daily|what happened)\b/i.test(lower);

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
  if (wantsMood) await run("get_team_mood");
  if (wantsReport) await run("get_daily_report");

  if (trace.length === 0) {
    await run("get_daily_report");
    const parts = [
      "Here is your UTC-day operations snapshot from the database:",
      JSON.stringify(trace[0]?.result ?? {}, null, 2),
      "",
      "Tip: ask about bugs, team mood, leave, or pipeline. Set GROQ_API_KEY (free tier) for Llama-powered answers.",
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
  lines.push("Data is from your org. Add **GROQ_API_KEY** (recommended, free) or OPENAI_API_KEY for natural language on top of these tools.");

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

  const llm = resolveChatLlm();

  const lastUser = [...parsed.data.messages].reverse().find((m) => m.role === "user");
  const lastUserText = (lastUser?.content ?? "").trim();
  if (!lastUserText) {
    return NextResponse.json({ error: "Missing user message" }, { status: 400 });
  }

  const toolTrace: { name: string; result: unknown }[] = [];

  if (!llm) {
    const out = await fallbackAssistant(session.orgId, lastUserText);
    return NextResponse.json({
      reply: out.reply,
      toolTrace: out.toolTrace,
      usedLlm: false,
      llmProvider: null as string | null,
    });
  }

  const system: ChatMessage = {
    role: "system",
    content:
      "You are WorkFlowGuard Copilot for HR and managers. You only answer using tool results about their current organization. Be concise and practical. After tools return data, summarize in plain English and mention counts. Never invent employees or tickets.",
  };

  const convo: ChatMessage[] = [
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
      completion = await chatCompletionRound({
        url: llm.url,
        apiKey: llm.key,
        model: llm.model,
        messages: convo,
        tools: TOOLS,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "LLM error";
      const out = await fallbackAssistant(session.orgId, lastUserText);
      return NextResponse.json({
        reply: `${out.reply}\n\n_(LLM unavailable: ${msg})_`,
        toolTrace: [...toolTrace, ...out.toolTrace],
        usedLlm: false,
        llmProvider: llm.provider,
      });
    }

    if (completion.tool_calls?.length) {
      convo.push({
        role: "assistant",
        content: completion.content,
        tool_calls: completion.tool_calls,
      });

      for (const tc of completion.tool_calls) {
        const name = tc.function.name;
        const args = safeJsonParse(tc.function.arguments || "{}");
        const result = isToolName(name) ? await runAdminAiTool(session.orgId, name, args) : { error: "unknown_tool", name };
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
    return NextResponse.json({
      reply: text,
      toolTrace,
      usedLlm: true,
      llmProvider: llm.provider,
      model: llm.model,
    });
  }

  return NextResponse.json({ error: "Too many tool rounds" }, { status: 500 });
}
