"use client";

import type { ContentMarketEngRate } from "@/lib/types";

interface EngRateByMarketChartProps {
  data: ContentMarketEngRate[];
}

function EngRateRankList({
  markets,
  startRank,
}: {
  markets: ContentMarketEngRate[];
  startRank: number;
}) {
  return (
    <ol className="space-y-0.5">
      {markets.map((row, index) => {
        const rank = startRank + index;
        const pct = row.avgEngRate * 100;

        return (
          <li key={row.market}>
            <div className="flex items-center gap-2 rounded px-1 py-1 text-[11px] leading-tight hover:bg-brand/5">
              <span className="w-5 shrink-0 tabular-nums text-[10px] font-medium text-brand/40">
                {rank}
              </span>
              <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                {row.market}
              </span>
              <span className="shrink-0 tabular-nums font-semibold text-foreground">
                {pct.toFixed(1)}%
              </span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function EngRateByMarketChart({ data }: EngRateByMarketChartProps) {
  const ranked = [...data].sort((a, b) => b.avgEngRate - a.avgEngRate);
  const midpoint = Math.ceil(ranked.length / 2);
  const leftColumn = ranked.slice(0, midpoint);
  const rightColumn = ranked.slice(midpoint);

  return (
    <section className="flex h-full flex-col rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        Engagement Rate by Market
      </p>
      <p className="mb-3 text-[11px] text-muted">
        Ranked by avg engagement — demo data (2.3%–8.4%)
      </p>

      {ranked.length === 0 ? (
        <p className="text-[11px] text-muted">No engagement data for the selected filters.</p>
      ) : (
        <div className="grid min-h-0 flex-1 grid-cols-2 gap-x-4 overflow-y-auto">
          <EngRateRankList markets={leftColumn} startRank={1} />
          <EngRateRankList markets={rightColumn} startRank={midpoint + 1} />
        </div>
      )}
    </section>
  );
}
