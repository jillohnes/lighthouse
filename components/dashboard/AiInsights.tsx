"use client";

import { useState } from "react";
import {
  ArrowRight,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { AiInsight } from "@/lib/types";

interface AiInsightsProps {
  insights: AiInsight[];
}

const ICON_MAP = {
  trending: { icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50" },
  warning: { icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-50" },
  star: { icon: Sparkles, color: "text-purple-600", bg: "bg-purple-50" },
};

const PANEL_WIDTH = 320;
const COLLAPSED_WIDTH = 48;

export function AiInsights({ insights }: AiInsightsProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="relative shrink-0 transition-[width] duration-300 ease-in-out"
      style={{ width: collapsed ? COLLAPSED_WIDTH : PANEL_WIDTH }}
    >
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        aria-label={collapsed ? "Expand AI Insights panel" : "Collapse AI Insights panel"}
        className="absolute -left-3 top-6 z-10 flex h-7 w-6 items-center justify-center rounded-l-md border border-[#4A2C1A]/15 bg-white text-[#4A2C1A] shadow-sm transition-colors hover:bg-[#F5F0E8]"
      >
        {collapsed ? (
          <ChevronLeft className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>

      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          aria-label="Expand AI Insights panel"
          className="flex h-full min-h-[320px] w-full flex-col items-center gap-3 rounded-lg border border-[#4A2C1A]/8 bg-white py-5 shadow-sm transition-colors hover:bg-[#FDFBF7]"
        >
          <Sparkles className="h-4 w-4 text-[#B5455C]" />
          <span
            className="text-[10px] font-bold uppercase tracking-widest text-[#4A2C1A]/60"
            style={{ writingMode: "vertical-rl" }}
          >
            AI Insights
          </span>
          <span className="mt-auto rounded-full bg-[#B5455C] px-1.5 py-0.5 text-[9px] font-bold text-white">
            {insights.length}
          </span>
        </button>
      ) : (
        <div className="flex min-h-[320px] flex-col overflow-hidden rounded-lg border border-[#4A2C1A]/8 bg-white shadow-sm">
          <div className="flex items-center gap-2 border-b border-[#4A2C1A]/8 px-5 py-4">
            <Sparkles className="h-4 w-4 shrink-0 text-[#B5455C]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B2314]">
              AI Insights & Recommendations
            </h3>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {insights.map((insight) => {
              const config = ICON_MAP[insight.icon];
              const Icon = config.icon;
              return (
                <div
                  key={insight.id}
                  className="rounded-lg border border-[#4A2C1A]/8 p-4 transition-shadow hover:shadow-md"
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-[#3B2314]">
                        {insight.title}
                      </h4>
                      <p className="mt-1 text-xs leading-relaxed text-[#4A2C1A]/70">
                        {insight.description}
                      </p>
                      <button
                        type="button"
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[#4A2C1A] hover:text-[#B5455C]"
                      >
                        View Details
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t border-[#4A2C1A]/8 p-4">
            <button
              type="button"
              className="w-full rounded-md bg-[#4A2C1A] py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#3B2314]"
            >
              View All Insights
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
