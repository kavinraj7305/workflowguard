"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = { role: "user" | "assistant"; content: string };

type ToolStep = { name: string; result: unknown };

export default function AdminAiAssistantPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastTools, setLastTools] = useState<ToolStep[] | null>(null);
  const [banner, setBanner] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setLastTools(null);
    setBanner(null);
    const nextThread = [...messages, { role: "user" as const, content: text }];
    setMessages(nextThread);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextThread.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as {
        reply?: string;
        error?: string;
        toolTrace?: ToolStep[];
        usedOpenAi?: boolean;
      };
      if (!res.ok) {
        setMessages((prev) => [...prev, { role: "assistant", content: data.error ?? "Something went wrong." }]);
        return;
      }
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "" }]);
      if (data.toolTrace?.length) setLastTools(data.toolTrace);
      if (data.usedOpenAi === false) {
        setBanner("Running in on-device routing mode. Add OPENAI_API_KEY for GPT-powered answers on top of the same tools.");
      } else {
        setBanner(null);
      }
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error — try again." }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6" style={{ minHeight: "calc(100dvh - 10rem)" }}>
      <div>
        <p className="text-xs text-zinc-500">Copilot</p>
        <h2 className="mt-1 text-2xl font-semibold text-white">WorkFlowGuard assistant</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Ask about open bugs, who works here, ticket flow, or pending leave. The server calls your org data first —
          nothing generic or canned.
        </p>
      </div>

      {banner ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">{banner}</div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="admin-scroll flex-1 space-y-4 p-4">
          {messages.length === 0 ? (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-6 text-sm text-zinc-300">
              <p className="font-medium text-white">Try one of these:</p>
              <ul className="mt-3 list-inside list-disc space-y-1 text-zinc-400">
                <li>“List open bugs assigned to anyone.”</li>
                <li>“How many tickets are in testing?”</li>
                <li>“Show developers on the team.”</li>
                <li>“Any PTO waiting on me?”</li>
              </ul>
            </div>
          ) : null}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === "user"
                    ? "bg-indigo-600 text-white"
                    : "border border-white/10 bg-zinc-900/80 text-zinc-100 whitespace-pre-wrap"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}
          {loading ? (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-zinc-900/80 px-4 py-3 text-sm text-zinc-400">
                <span className="h-2 w-2 animate-pulse rounded-full bg-indigo-400" />
                Calling tools…
              </div>
            </div>
          ) : null}
          <div ref={bottomRef} />
        </div>

        {lastTools && lastTools.length > 0 ? (
          <div className="border-t border-white/10 px-4 py-3">
            <p className="text-xs font-medium text-zinc-500">Last tool calls</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {lastTools.map((t, i) => (
                <span
                  key={`${t.name}-${i}`}
                  className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-200"
                >
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded-xl border border-zinc-700/60 bg-zinc-900/60 px-4 py-3 text-sm text-white placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none"
              placeholder="Ask about bugs, people, tickets, or leave…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              type="button"
              disabled={loading}
              onClick={() => void send()}
              className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
