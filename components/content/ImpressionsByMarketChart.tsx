"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_AXIS_COLOR, CHART_GRID_COLOR, CHART_LIGHT_BLUE, CHART_MAROON } from "@/lib/brand-colors";
import type { ContentMarketImpressions } from "@/lib/types";

interface ImpressionsByMarketChartProps {
  data: ContentMarketImpressions[];
}

export function ImpressionsByMarketChart({ data }: ImpressionsByMarketChartProps) {
  const chartData = data.slice(0, 12).map((row) => ({
    market: row.market,
    organic: row.organic,
    paid: row.paid,
  }));

  return (
    <section className="flex h-full flex-col rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
        Impressions by Market
      </p>
      <p className="mb-3 text-[11px] text-muted">
        Organic and paid impressions across your markets
      </p>
      <div className="h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="market"
              tick={{ fontSize: 9, fill: CHART_AXIS_COLOR }}
              axisLine={false}
              tickLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
              height={52}
            />
            <YAxis
              tick={{ fontSize: 9, fill: CHART_AXIS_COLOR }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                Number(value) >= 1_000_000
                  ? `${(Number(value) / 1_000_000).toFixed(1)}M`
                  : Number(value) >= 1_000
                    ? `${(Number(value) / 1_000).toFixed(0)}K`
                    : String(value)
              }
            />
            <Tooltip
              formatter={(value, name) => [
                Number(value ?? 0).toLocaleString(),
                name === "organic" ? "Organic" : "Paid",
              ]}
              contentStyle={{ fontSize: 11 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10 }}
              formatter={(value) => (value === "organic" ? "Organic" : "Paid")}
            />
            <Bar dataKey="organic" stackId="impressions" fill={CHART_LIGHT_BLUE} radius={[0, 0, 0, 0]} />
            <Bar dataKey="paid" stackId="impressions" fill={CHART_MAROON} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
