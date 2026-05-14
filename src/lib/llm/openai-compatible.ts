/**
 * OpenAI-compatible chat completions (used with Groq, OpenAI, and similar providers).
 */
export type ChatTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ChatMessage =
  | { role: "system" | "user" | "assistant"; content?: string | null; tool_calls?: unknown }
  | { role: "tool"; tool_call_id: string; content: string };

export async function chatCompletionRound(args: {
  url: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  tools: ChatTool[];
}): Promise<{
  content: string | null;
  tool_calls?: { id: string; function: { name: string; arguments: string } }[];
}> {
  const { url, apiKey, model, messages, tools } = args;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      messages: messages as unknown[],
      tools,
      tool_choice: "auto",
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(t.slice(0, 400) || `LLM ${res.status}`);
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

export function resolveChatLlm():
  | { url: string; key: string; model: string; provider: "groq" | "openai" }
  | null {
  const groq = process.env.GROQ_API_KEY?.trim();
  if (groq) {
    return {
      url: "https://api.groq.com/openai/v1/chat/completions",
      key: groq,
      model: process.env.GROQ_MODEL?.trim() || "llama-3.3-70b-versatile",
      provider: "groq",
    };
  }
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    return {
      url: "https://api.openai.com/v1/chat/completions",
      key: openai,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      provider: "openai",
    };
  }
  return null;
}
