"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, MessageSquare, Sparkles } from "lucide-react";
import type { AiInsight, DashboardFilters } from "@/lib/types";
import { AiInsights } from "./AiInsights";
import { DashboardChat } from "./DashboardChat";

interface DashboardAiPanelProps {
  insights: AiInsight[];
  filters: DashboardFilters;
  chatDisabled?: boolean;
}

const PANEL_WIDTH = 320;
const COLLAPSED_WIDTH = 48;

type PanelTab = "insights" | "chat";

export function DashboardAiPanel({
  insights,
  filters,
  chatDisabled = false,
}: DashboardAiPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [tab, setTab] = useState<PanelTab>("chat");

  if (collapsed) {
    return (
      <div
        className="relative shrink-0 transition-[width] duration-300 ease-in-out"
        style={{ width: COLLAPSED_WIDTH }}
      >
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand AI panel"
          className="absolute -left-3 top-6 z-10 flex h-7 w-6 items-center justify-center rounded-l-md border border-brand/15 bg-white text-brand shadow-sm transition-colors hover:bg-surface"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex h-full min-h-[420px] w-full flex-col items-center gap-3 rounded-lg border border-brand/8 bg-white py-5 shadow-sm transition-colors hover:bg-brand-50"
        >
          <Sparkles className="h-4 w-4 text-accent" />
          <span
            className="text-[10px] font-bold uppercase tracking-widest text-brand/60"
            style={{ writingMode: "vertical-rl" }}
          >
            AI Assistant
          </span>
        </button>
      </div>
    );
  }

  return (
    <div
      className="relative shrink-0 transition-[width] duration-300 ease-in-out"
      style={{ width: PANEL_WIDTH }}
    >
      <button
        type="button"
        onClick={() => setCollapsed(true)}
        aria-label="Collapse AI panel"
        className="absolute -left-3 top-6 z-10 flex h-7 w-6 items-center justify-center rounded-l-md border border-brand/15 bg-white text-brand shadow-sm transition-colors hover:bg-surface"
      >
        <ChevronRight className="h-4 w-4" />
      </button>

      <div className="flex min-h-[420px] flex-col overflow-hidden rounded-lg border border-brand/8 bg-white shadow-sm">
        <div className="border-b border-brand/8 px-3 pt-3">
          <div className="mb-3 flex items-center gap-2 px-2">
            <Sparkles className="h-4 w-4 shrink-0 text-accent" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              AI Assistant
            </h3>
          </div>
          <div className="flex rounded-md border border-brand/15 bg-surface/50 p-0.5">
            <button
              type="button"
              onClick={() => setTab("chat")}
              className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                tab === "chat"
                  ? "bg-brand text-white"
                  : "text-brand/70 hover:text-brand"
              }`}
            >
              <MessageSquare className="h-3 w-3" />
              Chat
            </button>
            <button
              type="button"
              onClick={() => setTab("insights")}
              className={`flex flex-1 items-center justify-center gap-1 rounded px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                tab === "insights"
                  ? "bg-brand text-white"
                  : "text-brand/70 hover:text-brand"
              }`}
            >
              <Sparkles className="h-3 w-3" />
              Insights
            </button>
          </div>
        </div>

        {tab === "chat" ? (
          <DashboardChat filters={filters} disabled={chatDisabled} />
        ) : (
          <AiInsights insights={insights} embedded />
        )}
      </div>
    </div>
  );
}
