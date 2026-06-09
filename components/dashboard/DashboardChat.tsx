"use client";

import { useRef, useState } from "react";
import { Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import { formatDateParam } from "@/lib/dates";
import type { ChatMessage } from "@/lib/chat/assistant";
import type { DashboardFilters } from "@/lib/types";

const STARTER_PROMPTS = [
  "Which market is performing best?",
  "What is our TTL ROAS?",
  "How are activation types comparing?",
  "Summarize reach and samples this period.",
];

interface DashboardChatProps {
  filters: DashboardFilters;
  disabled?: boolean;
}

export function DashboardChat({ filters, disabled = false }: DashboardChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Ask me anything about your program. I'll connect ROAS, markets, activation types, samples, content, and trends to explain what's happening and why — not just single stats.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<"openai" | "local" | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading || disabled) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.slice(-8),
          filters: {
            brand: filters.brand,
            activationType: filters.activationType,
            region: filters.region,
            market: filters.market,
            startDate: formatDateParam(filters.startDate),
            endDate: formatDateParam(filters.endDate),
          },
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Chat request failed.");
      }

      setSource(json.source ?? null);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: json.answer },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: "smooth",
        });
      });
    }
  }

  return (
    <div className="flex min-h-[420px] flex-col">
      <div
        ref={scrollRef}
        className="flex-1 space-y-3 overflow-y-auto px-4 py-3"
      >
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[92%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs leading-relaxed ${
                message.role === "user"
                  ? "bg-brand text-white"
                  : "border border-brand/10 bg-surface/70 text-brand/85"
              }`}
            >
              {message.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Scanning dashboard data...
          </div>
        )}
      </div>

      {messages.length === 1 && !loading && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-2">
          {STARTER_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => sendMessage(prompt)}
              disabled={disabled}
              className="rounded-full border border-brand/15 bg-white px-2.5 py-1 text-[10px] text-brand/75 transition-colors hover:bg-surface disabled:opacity-50"
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="border-t border-brand/8 p-3">
        {source === "local" && (
          <p className="mb-2 flex items-center gap-1 text-[9px] text-muted">
            <Sparkles className="h-3 w-3" />
            Using built-in analysis. Add OPENAI_API_KEY for full AI responses.
          </p>
        )}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendMessage(input);
          }}
          className="flex items-end gap-2"
        >
          <div className="relative min-w-0 flex-1">
            <MessageSquare className="pointer-events-none absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted" />
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage(input);
                }
              }}
              rows={2}
              disabled={disabled || loading}
              placeholder="Ask about ROAS, markets, samples..."
              className="w-full resize-none rounded-md border border-brand/15 bg-white py-2 pl-8 pr-3 text-xs text-foreground outline-none ring-brand/20 placeholder:text-muted focus:ring-2 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={disabled || loading || !input.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand text-white transition-colors hover:bg-brand-darker disabled:opacity-50"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
