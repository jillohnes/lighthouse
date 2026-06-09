"use client";

import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import type { ContentTopCreator } from "@/lib/types";

interface TopCreatorsTableProps {
  creators: ContentTopCreator[];
}

function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function TrendIcon({ direction }: { direction: ContentTopCreator["trendDirection"] }) {
  if (direction === "up") {
    return <ArrowUp className="h-3 w-3 text-emerald-600" />;
  }
  if (direction === "down") {
    return <ArrowDown className="h-3 w-3 text-red-500" />;
  }
  return <Minus className="h-3 w-3 text-slate-400" />;
}

export function TopCreatorsTable({ creators }: TopCreatorsTableProps) {
  return (
    <section className="rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        Top Performing Creators
      </p>
      <p className="mb-4 text-[11px] text-muted">
        Consistently trending over time — ranked by reach, impressions, and engagement
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-[11px]">
          <thead>
            <tr className="border-b border-brand/10 text-left text-muted">
              <th className="pb-2 pr-3 font-medium">#</th>
              <th className="pb-2 pr-3 font-medium">Creator</th>
              <th className="pb-2 pr-3 font-medium">Market</th>
              <th className="pb-2 pr-3 font-medium">Brand</th>
              <th className="pb-2 pr-3 text-right font-medium">Impressions</th>
              <th className="pb-2 pr-3 text-right font-medium">Reach</th>
              <th className="pb-2 pr-3 text-right font-medium">Avg Eng Rate</th>
              <th className="pb-2 pr-3 text-right font-medium">Months Active</th>
              <th className="pb-2 text-right font-medium">Trend</th>
            </tr>
          </thead>
          <tbody>
            {creators.map((creator, index) => (
              <tr
                key={`${creator.handle}-${creator.market}`}
                className="border-b border-brand/5 last:border-0"
              >
                <td className="py-2.5 pr-3 tabular-nums text-muted">{index + 1}</td>
                <td className="py-2.5 pr-3">
                  <p className="font-semibold text-foreground">{creator.creator}</p>
                  <p className="text-[10px] text-muted">@{creator.handle}</p>
                </td>
                <td className="py-2.5 pr-3 text-foreground">{creator.market}</td>
                <td className="py-2.5 pr-3 text-foreground">{creator.brand}</td>
                <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-foreground">
                  {formatNumber(creator.totalImpressions)}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-foreground">
                  {formatNumber(creator.totalReach)}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums font-medium text-foreground">
                  {(creator.avgEngRate * 100).toFixed(2)}%
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-muted">
                  {creator.monthsActive}
                </td>
                <td className="py-2.5 text-right">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    <span className="rounded-full bg-brand/8 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-brand">
                      {creator.trendScore}
                    </span>
                    <TrendIcon direction={creator.trendDirection} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
