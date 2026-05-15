import { NextResponse } from "next/server";
import { z } from "zod";
import { requireHr } from "@/lib/api/auth";
import { runAdminAiTool, type ToolName } from "@/lib/admin/ai-tools";
import type { ChatMessage, ChatTool } from "@/lib/llm/openai-compatible";
import { chatCompletionRound, resolveChatLlm } from "@/lib/llm/openai-compatible";
import type { DailyReportPayload } from "@/lib/reports/daily";

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

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === "object" && x !== null;
}

function formatDailyReportForChat(data: DailyReportPayload): string {
  const day = data.periodUtc.start.slice(0, 10);
  const lines: string[] = [
    `Here’s your org snapshot for **${day}** (UTC day window).`,
    "",
    `• Tickets opened today: **${data.ticketsCreatedToday}**`,
    `• Tickets closed today: **${data.ticketsClosedToday}**`,
    `• Open bugs: **${data.openBugs}**`,
    `• Pending leave: **${data.pendingLeave}**`,
    "",
    `**Pipeline:** open ${data.pipeline.open}, in progress ${data.pipeline.in_progress}, testing ${data.pipeline.testing}, closed ${data.pipeline.closed} (**${data.pipeline.total}** total).`,
    "",
  ];
  if (data.highlights.length) {
    lines.push("**Highlights**");
    for (const h of data.highlights) lines.push(`• ${h}`);
  }
  return lines.join("\n");
}

function formatToolResultForFallback(name: ToolName, result: unknown): string {
  if (!isRecord(result)) return String(result);
  if ("error" in result) return `Something went wrong: ${String(result.error)}`;

  switch (name) {
    case "get_daily_report":
      return formatDailyReportForChat(result as DailyReportPayload);
    case "get_ticket_pipeline": {
      const p = result as {
        open: number;
        in_progress: number;
        testing: number;
        closed: number;
        total: number;
      };
      return [
        "**Ticket pipeline**",
        `Open: **${p.open}** · In progress: **${p.in_progress}** · Testing: **${p.testing}** · Closed: **${p.closed}** · Total: **${p.total}**`,
      ].join("\n");
    }
    case "list_open_bugs": {
      const bugs = (result as { openBugs?: { title: string; status: string; priority: string }[]; count?: number })
        .openBugs ?? [];
      const count = (result as { count?: number }).count ?? bugs.length;
      if (count === 0) return "No open bugs right now.";
      const lines = [`**Open bugs (${count})**`];
      for (const b of bugs.slice(0, 15)) {
        lines.push(`• **${b.title}** — ${b.status.replace("_", " ")}, ${b.priority} priority`);
      }
      if (bugs.length > 15) lines.push(`…and ${bugs.length - 15} more.`);
      return lines.join("\n");
    }
    case "list_employees": {
      const employees = (result as { employees?: { name: string; email: string; role: string; jobTitle: string | null; department: string | null }[] }).employees ?? [];
      const count = (result as { count?: number }).count ?? employees.length;
      if (count === 0) return "No people matched that filter.";
      const lines = [`**People (${count})**`];
      for (const e of employees.slice(0, 25)) {
        const extra = [e.jobTitle, e.department].filter(Boolean).join(" · ");
        lines.push(`• **${e.name}** (${e.role})${extra ? ` — ${extra}` : ""}`);
      }
      if (employees.length > 25) lines.push(`…and ${employees.length - 25} more.`);
      return lines.join("\n");
    }
    case "list_pending_leave": {
      const requests = (result as { requests?: { requesterName: string; startDate: string; endDate: string; kind: string }[] }).requests ?? [];
      const count = (result as { count?: number }).count ?? requests.length;
      if (count === 0) return "No leave requests pending approval.";
      const lines = [`**Pending leave (${count})**`];
      for (const r of requests.slice(0, 15)) {
        lines.push(`• **${r.requesterName}** — ${r.kind}, ${r.startDate} → ${r.endDate}`);
      }
      if (requests.length > 15) lines.push(`…and ${requests.length - 15} more.`);
      return lines.join("\n");
    }
    case "get_team_mood": {
      const members = (result as { members?: { name: string; role: string; ticketWorkload: number; moodLabel: string }[] }).members ?? [];
      if (members.length === 0) return "No team members found.";
      const lines = ["**Team mood** (from ticket workload)", ""];
      for (const m of members.slice(0, 30)) {
        lines.push(`• **${m.name}** (${m.role}): ${m.moodLabel} — ${m.ticketWorkload} ticket(s) on their plate`);
      }
      if (members.length > 30) lines.push(`…and ${members.length - 30} more.`);
      return lines.join("\n");
    }
    default:
      return "No summary available.";
  }
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
    const summary = formatToolResultForFallback("get_daily_report", trace[0]!.result);
    const shortGreeting =
      lastUser.trim().length <= 24 && /\b(hi|hello|hey)\b/i.test(lastUser.trim()) ? "Hi! " : "";
    return { reply: `${shortGreeting}${summary}`, toolTrace: trace };
  }

  const parts = trace.map((step) => formatToolResultForFallback(step.name, step.result));
  return { reply: parts.join("\n\n"), toolTrace: trace };
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
