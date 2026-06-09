"use client";

import { useMemo, useState } from "react";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { applyCorrelationBands, normalizeMarketTrend } from "@/lib/on-premise-trends";
import { formatCurrency } from "@/lib/format";
import type { MarketTrendAnalysis } from "@/lib/types";

interface DrinkTrendsAnalysisProps {
  trends: MarketTrendAnalysis[];
}

type ViewMode = "top" | "bottom";

function correlationColor(score: number): string {
  if (score >= 65) return "text-emerald-600 bg-emerald-50";
  if (score >= 30) return "text-amber-700 bg-amber-50";
  return "text-brand bg-brand/8";
}

function performanceColor(score: number): string {
  if (score >= 65) return "text-emerald-600";
  if (score >= 40) return "text-amber-700";
  return "text-red-500";
}

function MarketTrendCard({
  market,
  rank,
  view,
}: {
  market: MarketTrendAnalysis;
  rank: number;
  view: ViewMode;
}) {
  return (
    <div className="rounded-md border border-brand/8 bg-surface/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
            {rank}
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-foreground">{market.market}</h4>
            <p className="text-[10px] text-muted">
              {market.samples.toLocaleString()} samples ·{" "}
              {formatCurrency(market.result)} ROS ·{" "}
              {market.conversionRate.toFixed(2)} $/sample
            </p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <div
            className={`rounded-md px-2.5 py-1.5 text-center ${correlationColor(market.correlationScore)}`}
          >
            <p className="text-base font-bold leading-none">
              {market.correlationScore}%
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">
              Trend aligned
            </p>
          </div>
          <div className="rounded-md bg-white px-2.5 py-1.5 text-center ring-1 ring-brand/10">
            <p
              className={`text-base font-bold leading-none ${performanceColor(market.performanceScore)}`}
            >
              {market.performanceScore}
            </p>
            <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-muted">
              Performance
            </p>
          </div>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Trending Drinks
          </p>
          <div className="flex flex-col gap-1">
            {market.trendingDrinks.map((trend) => (
              <span
                key={trend.name}
                className="rounded bg-white px-2 py-1 text-[10px] text-brand/80 ring-1 ring-brand/10"
              >
                {trend.name} ({trend.popularity}%)
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Top Converting Brands
          </p>
          <div className="flex flex-col gap-1">
            {market.topPerformingBrands.slice(0, 3).map((brand, brandIndex) => (
              <span
                key={brand.brand}
                className="flex items-center justify-between gap-2 rounded bg-white px-2 py-1 text-[10px] text-brand/80 ring-1 ring-brand/10"
              >
                <span className="truncate">
                  #{brandIndex + 1} {brand.brand}
                </span>
                <span className="shrink-0 tabular-nums font-medium">
                  {brand.conversionRate.toFixed(2)} $/sample
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {view === "top" ? (
        <p className="text-[11px] leading-relaxed text-brand/80">{market.insight}</p>
      ) : (
        <div className="rounded-md border border-accent/20 bg-accent/5 px-3 py-2.5">
          <div className="mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-accent" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">
              AI Pivot Recommendation
            </p>
          </div>
          <p className="text-[11px] leading-relaxed text-brand/80">
            {market.aiRecommendation}
          </p>
        </div>
      )}
    </div>
  );
}

export function DrinkTrendsAnalysis({ trends }: DrinkTrendsAnalysisProps) {
  const [view, setView] = useState<ViewMode>("top");

  const sorted = useMemo(
    () =>
      applyCorrelationBands(
        trends.filter((item) => item?.market).map((item) => normalizeMarketTrend(item)),
      ).sort((a, b) => b.performanceScore - a.performanceScore),
    [trends],
  );

  const topMarkets = sorted.slice(0, 10);
  const bottomMarkets = [...sorted].reverse().slice(0, 10);
  const activeMarkets = view === "top" ? topMarkets : bottomMarkets;
  const leftMarkets = activeMarkets.slice(0, 5);
  const rightMarkets = activeMarkets.slice(5, 10);

  return (
    <section className="rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Local Drink Trends vs. Sampling Performance
          </h3>
        </div>
        <span className="shrink-0 rounded-full bg-surface px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Synthetic trend overlay
        </span>
      </div>

      <p className="mb-4 text-[11px] leading-relaxed text-brand/80">
        Markets are ranked by a combined score of trend alignment and ROS
        conversion. Toggle between top performers where sampling matches local
        demand, and markets that need a pivot.
      </p>

      <div className="mb-4 flex rounded-md border border-brand/15">
        <button
          type="button"
          onClick={() => setView("top")}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors first:rounded-l-md ${
            view === "top"
              ? "bg-brand text-white"
              : "text-brand/70 hover:bg-surface"
          }`}
        >
          <TrendingUp className="h-3.5 w-3.5" />
          Top 10 Performing Markets
        </button>
        <button
          type="button"
          onClick={() => setView("bottom")}
          className={`flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-colors last:rounded-r-md ${
            view === "bottom"
              ? "bg-brand text-white"
              : "text-brand/70 hover:bg-surface"
          }`}
        >
          <TrendingDown className="h-3.5 w-3.5" />
          Bottom 10 — Pivot Recommendations
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          {leftMarkets.map((market, index) => (
            <MarketTrendCard
              key={market.market}
              market={market}
              rank={index + 1}
              view={view}
            />
          ))}
        </div>
        <div className="space-y-3">
          {rightMarkets.map((market, index) => (
            <MarketTrendCard
              key={market.market}
              market={market}
              rank={index + 6}
              view={view}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
