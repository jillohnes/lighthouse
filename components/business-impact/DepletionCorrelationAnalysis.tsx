"use client";

import { useMemo, useState } from "react";
import { Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import type { BrandMarketDepletionCorrelation } from "@/lib/types";

interface DepletionCorrelationAnalysisProps {
  correlations: BrandMarketDepletionCorrelation[];
  selectedBrand: string;
}

type ViewMode = "strong" | "weak";

function correlationColor(score: number): string {
  if (score >= 65) return "text-emerald-600 bg-emerald-50";
  if (score >= 35) return "text-amber-700 bg-amber-50";
  return "text-brand bg-brand/8";
}

function CorrelationCard({
  row,
  rank,
}: {
  row: BrandMarketDepletionCorrelation;
  rank: number;
}) {
  return (
    <div className="rounded-md border border-brand/8 bg-surface/40 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand">
            {rank}
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-foreground">
              {row.brand} · {row.market}
            </h4>
            <p className="text-[10px] text-muted">
              Activity score {row.activityScore.toLocaleString()} · Depletion index{" "}
              {row.depletionIndex.toLocaleString()}
            </p>
          </div>
        </div>
        <div
          className={`shrink-0 rounded-md px-2.5 py-1.5 text-center ${correlationColor(row.correlationScore)}`}
        >
          <p className="text-base font-bold leading-none">{row.correlationScore}%</p>
          <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide">
            Correlation
          </p>
        </div>
      </div>

      <div className="mb-3 grid grid-cols-5 gap-2 text-[9px]">
        <div className="rounded bg-white px-2 py-1 ring-1 ring-brand/10">
          <p className="text-muted">HCT</p>
          <p className="font-semibold tabular-nums text-foreground">
            {row.activityBreakdown.hctSamples.toLocaleString()}
          </p>
        </div>
        <div className="rounded bg-white px-2 py-1 ring-1 ring-brand/10">
          <p className="text-muted">Brand-Led</p>
          <p className="font-semibold tabular-nums text-foreground">
            {row.activityBreakdown.brandLedSamples.toLocaleString()}
          </p>
        </div>
        <div className="rounded bg-white px-2 py-1 ring-1 ring-brand/10">
          <p className="text-muted">Digital</p>
          <p className="font-semibold tabular-nums text-foreground">
            {row.activityBreakdown.digitalSamples.toLocaleString()}
          </p>
        </div>
        <div className="rounded bg-white px-2 py-1 ring-1 ring-brand/10">
          <p className="text-muted">Organic</p>
          <p className="font-semibold tabular-nums text-foreground">
            {row.activityBreakdown.organicImpressions.toLocaleString()}
          </p>
        </div>
        <div className="rounded bg-white px-2 py-1 ring-1 ring-brand/10">
          <p className="text-muted">Paid</p>
          <p className="font-semibold tabular-nums text-foreground">
            {row.activityBreakdown.paidImpressions.toLocaleString()}
          </p>
        </div>
      </div>

      <p className="text-[11px] leading-relaxed text-brand/75">{row.insight}</p>
    </div>
  );
}

export function DepletionCorrelationAnalysis({
  correlations,
  selectedBrand,
}: DepletionCorrelationAnalysisProps) {
  const [view, setView] = useState<ViewMode>("strong");

  const strong = useMemo(
    () => correlations.filter((row) => row.correlationScore >= 65).slice(0, 10),
    [correlations],
  );
  const weak = useMemo(
    () =>
      [...correlations]
        .filter((row) => row.correlationScore < 35)
        .sort((a, b) => a.correlationScore - b.correlationScore)
        .slice(0, 10),
    [correlations],
  );

  const visible = view === "strong" ? strong : weak;

  return (
    <section className="rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Activity & Depletion Correlation
          </p>
          <p className="mt-1 text-[11px] text-muted">
            By brand and market — where program activity aligns with modeled depletion strength
            {selectedBrand !== "All Brands" ? ` for ${selectedBrand}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-md bg-surface p-0.5 ring-1 ring-brand/10">
          <button
            type="button"
            onClick={() => setView("strong")}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-semibold ${
              view === "strong"
                ? "bg-white text-emerald-700 shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <TrendingUp className="h-3 w-3" />
            Strong ({strong.length})
          </button>
          <button
            type="button"
            onClick={() => setView("weak")}
            className={`inline-flex items-center gap-1 rounded px-2.5 py-1 text-[10px] font-semibold ${
              view === "weak"
                ? "bg-white text-brand shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <TrendingDown className="h-3 w-3" />
            Weak ({weak.length})
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted">
          No {view} correlation markets found for the selected filters.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {visible.map((row, index) => (
            <CorrelationCard key={`${row.brand}-${row.market}`} row={row} rank={index + 1} />
          ))}
        </div>
      )}

      <div className="mt-4 flex items-start gap-2 rounded-md border border-brand/8 bg-surface/50 px-3 py-2.5">
        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand" />
        <p className="text-[11px] leading-relaxed text-muted">
          Correlation scores compare combined sampling and impression activity against modeled
          off-premise depletion by brand and market. Use the brand filter above to isolate a
          portfolio and identify where activity is — or is not — translating into depletion velocity.
        </p>
      </div>
    </section>
  );
}
