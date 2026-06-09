"use client";

import { useEffect, useMemo, useState } from "react";
import { SENTIMENT_COLORS } from "@/lib/content-synthetic";
import type { ContentBrandSentiment, ContentSentimentMarket } from "@/lib/types";

interface BrandSentimentMapProps {
  sentimentByBrand: ContentBrandSentiment[];
}

function SentimentBar({
  negative,
  neutral,
  positive,
}: {
  negative: number;
  neutral: number;
  positive: number;
}) {
  return (
    <div
      className="flex h-2 min-w-0 flex-1 overflow-hidden rounded-full"
      title={`${negative}% negative · ${neutral}% neutral · ${positive}% positive`}
    >
      <div
        className="h-full"
        style={{ width: `${negative}%`, backgroundColor: SENTIMENT_COLORS.negative }}
      />
      <div
        className="h-full"
        style={{ width: `${neutral}%`, backgroundColor: SENTIMENT_COLORS.neutral }}
      />
      <div
        className="h-full"
        style={{ width: `${positive}%`, backgroundColor: SENTIMENT_COLORS.positive }}
      />
    </div>
  );
}

function SentimentRankList({
  markets,
  startRank,
}: {
  markets: ContentSentimentMarket[];
  startRank: number;
}) {
  return (
    <ol className="space-y-1">
      {markets.map((row, index) => {
        const rank = startRank + index;
        return (
          <li key={row.market}>
            <div className="flex items-center gap-2 px-0.5 py-0.5">
              <span className="w-5 shrink-0 tabular-nums text-[10px] font-medium text-brand/40">
                {rank}
              </span>
              <span className="w-20 shrink-0 truncate text-[10px] font-medium text-foreground sm:w-24">
                {row.market}
              </span>
              <SentimentBar
                negative={row.negative}
                neutral={row.neutral}
                positive={row.positive}
              />
              <span className="w-9 shrink-0 text-right text-[9px] tabular-nums font-semibold text-emerald-600">
                {row.positive}%
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function BrandSentimentMap({ sentimentByBrand }: BrandSentimentMapProps) {
  const [selectedBrand, setSelectedBrand] = useState(
    sentimentByBrand[0]?.brand ?? "",
  );

  useEffect(() => {
    if (!sentimentByBrand.some((row) => row.brand === selectedBrand)) {
      setSelectedBrand(sentimentByBrand[0]?.brand ?? "");
    }
  }, [sentimentByBrand, selectedBrand]);

  const activeBrand = sentimentByBrand.find((row) => row.brand === selectedBrand);

  const rankedMarkets = useMemo(() => {
    if (!activeBrand) return [];
    return [...activeBrand.markets].sort((a, b) => b.positive - a.positive);
  }, [activeBrand]);

  const midpoint = Math.ceil(rankedMarkets.length / 2);
  const leftColumn = rankedMarkets.slice(0, midpoint);
  const rightColumn = rankedMarkets.slice(midpoint);

  return (
    <section className="rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Sentiment by Brand
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Synthetic audience sentiment by market — illustrative for demo
          </p>
        </div>
        <select
          value={selectedBrand}
          onChange={(event) => setSelectedBrand(event.target.value)}
          className="rounded border border-brand/15 bg-white px-2 py-1 text-[11px] text-foreground"
        >
          {sentimentByBrand.map((row) => (
            <option key={row.brand} value={row.brand}>
              {row.brand}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-2.5 w-40 shrink-0 overflow-hidden rounded-full sm:w-48">
          <div className="flex-1" style={{ backgroundColor: SENTIMENT_COLORS.negative }} />
          <div className="flex-1" style={{ backgroundColor: SENTIMENT_COLORS.neutral }} />
          <div className="flex-1" style={{ backgroundColor: SENTIMENT_COLORS.positive }} />
        </div>
        <div className="flex flex-wrap gap-3 text-[9px] text-muted">
          <span>Negative</span>
          <span>Neutral</span>
          <span>Positive</span>
        </div>
        {activeBrand && (
          <span className="text-[10px] tabular-nums text-foreground sm:ml-auto">
            Avg: {activeBrand.totals.negative}% neg · {activeBrand.totals.neutral}% neu ·{" "}
            {activeBrand.totals.positive}% pos
          </span>
        )}
      </div>

      {rankedMarkets.length === 0 ? (
        <p className="text-[11px] text-muted">No market data for the selected brand.</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-8">
          <SentimentRankList markets={leftColumn} startRank={1} />
          <SentimentRankList markets={rightColumn} startRank={midpoint + 1} />
        </div>
      )}
    </section>
  );
}
