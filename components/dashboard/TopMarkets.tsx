"use client";

import type { MarketStatus, TopMarketRow } from "@/lib/types";

interface TopMarketsProps {
  markets: TopMarketRow[];
}

const STATUS_CONFIG: Record<
  MarketStatus,
  {
    label: string;
    dot: string;
    border: string;
    bg: string;
    value: string;
  }
> = {
  "on-track": {
    label: "On Track",
    dot: "bg-emerald-500",
    border: "border-emerald-200",
    bg: "bg-emerald-50/60",
    value: "text-emerald-600",
  },
  watch: {
    label: "Watch",
    dot: "bg-amber-400",
    border: "border-amber-200",
    bg: "bg-amber-50/60",
    value: "text-amber-600",
  },
  "at-risk": {
    label: "At Risk",
    dot: "bg-red-500",
    border: "border-red-200",
    bg: "bg-red-50/60",
    value: "text-red-600",
  },
};

function MarketCard({ market }: { market: TopMarketRow }) {
  const config = STATUS_CONFIG[market.status];

  return (
    <div
      className={`rounded-lg border px-3 py-2.5 ${config.border} ${config.bg}`}
    >
      <div className="mb-2 flex items-center gap-1.5">
        <span className={`h-2 w-2 shrink-0 rounded-full ${config.dot}`} />
        <p className="truncate text-sm font-semibold text-foreground">
          {market.market}
        </p>
      </div>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="font-medium uppercase tracking-wide text-brand/45">
            ROI
          </span>
          <span className={`font-bold ${config.value}`}>
            {market.roi.toFixed(0)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-2 text-[11px]">
          <span className="font-medium uppercase tracking-wide text-brand/45">
            vs Plan
          </span>
          <span className={`font-bold ${config.value}`}>
            {market.roiVsPlan}%
          </span>
        </div>
      </div>
    </div>
  );
}

export function TopMarkets({ markets }: TopMarketsProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-brand/8 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 bg-[#1e293b] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-white">
            10-Market Status Matrix
          </h3>
          <p className="text-[11px] text-slate-400">ROI by Market (vs plan)</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-300">
          {(Object.keys(STATUS_CONFIG) as MarketStatus[]).map((status) => (
            <span key={status} className="flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${STATUS_CONFIG[status].dot}`}
              />
              {STATUS_CONFIG[status].label}
            </span>
          ))}
        </div>
      </div>

      {markets.length === 0 ? (
        <p className="px-4 py-10 text-center text-xs text-brand/50">
          No market data for the selected filters.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
          {markets.map((market) => (
            <MarketCard key={market.market} market={market} />
          ))}
        </div>
      )}
    </div>
  );
}
