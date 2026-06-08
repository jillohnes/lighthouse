"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { KpiMetric, TargetStatus } from "@/lib/types";

interface KpiCardsProps {
  kpis: KpiMetric[];
}

const STATUS_CONFIG: Record<
  TargetStatus,
  {
    bg: string;
    badge: string;
    label: string;
  }
> = {
  above: {
    bg: "bg-emerald-50/70",
    badge: "bg-emerald-500 text-white",
    label: "Above Target",
  },
  "slightly-below": {
    bg: "bg-amber-50/70",
    badge: "bg-amber-400 text-white",
    label: "Below Target",
  },
  "well-below": {
    bg: "bg-red-50/70",
    badge: "bg-red-500 text-white",
    label: "Well Below Target",
  },
};

const NEUTRAL_CONFIG = {
  bg: "bg-white",
  badge: "",
  label: "",
};

function getPercentOfTarget(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((actual / target) * 100);
}

export function KpiCards({ kpis }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-8 gap-3">
      {kpis.map((kpi) => {
        const showTarget = kpi.showTarget !== false;
        const showStatus = kpi.showStatus !== false;
        const config = showStatus ? STATUS_CONFIG[kpi.status] : NEUTRAL_CONFIG;
        const percentOfTarget = getPercentOfTarget(kpi.actual, kpi.target);

        return (
          <div
            key={kpi.label}
            className={`flex flex-col rounded-lg border border-[#4A2C1A]/8 ${config.bg} px-4 py-3 shadow-sm`}
          >
            <p className="text-[11px] font-medium text-[#4A2C1A]/60">{kpi.label}</p>

            <p className="mt-1 text-xl font-bold text-[#3B2314]">{kpi.value}</p>

            {showTarget && (
              <p className="mt-0.5 text-[10px] font-medium text-[#4A2C1A]/50">
                Target: {kpi.targetLabel}{" "}
                <span className="font-semibold text-[#4A2C1A]/70">
                  ({percentOfTarget}%)
                </span>
              </p>
            )}

            {kpi.change !== 0 && (
              <div
                className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${
                  kpi.change >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {kpi.change >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>
                  {kpi.change >= 0 ? "+" : ""}
                  {kpi.change.toFixed(1)}% vs PY
                </span>
              </div>
            )}

            {showStatus && (
              <div className="mt-auto pt-3">
                <span
                  className={`inline-block w-full rounded px-2 py-1 text-center text-[9px] font-bold uppercase tracking-wide ${config.badge}`}
                >
                  {config.label}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
