"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ACTIVATION_TYPE_CHART_COLORS,
  CHART_AXIS_COLOR,
  CHART_GRID_COLOR,
  CHART_LIGHT_BLUE,
  CHART_MAROON,
  CHART_ORANGE,
} from "@/lib/brand-colors";
import type { BusinessImpactMonthlyPoint } from "@/lib/types";

interface ActivityDepletionChartProps {
  data: BusinessImpactMonthlyPoint[];
  takeaway: string;
}

const SERIES = {
  hctSampling: {
    label: "HCT Sampling",
    color: ACTIVATION_TYPE_CHART_COLORS.HCT,
  },
  brandLedSampling: {
    label: "Brand-Led Sampling",
    color: ACTIVATION_TYPE_CHART_COLORS["Brand Experience"],
  },
  digitalSampling: {
    label: "Digital Sampling",
    color: ACTIVATION_TYPE_CHART_COLORS["Digital Sampling"],
  },
  organicImpressionsK: {
    label: "Organic Impressions (K)",
    color: CHART_LIGHT_BLUE,
  },
  paidImpressionsK: {
    label: "Paid Impressions (K)",
    color: CHART_MAROON,
  },
  depletionCases: {
    label: "Depletion (cases)",
    color: CHART_ORANGE,
  },
} as const;

function formatK(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

export function ActivityDepletionChart({
  data,
  takeaway,
}: ActivityDepletionChartProps) {
  const chartData = data.map((row) => ({
    month: row.month,
    hctSampling: row.hctSampling,
    brandLedSampling: row.brandLedSampling,
    digitalSampling: row.digitalSampling,
    organicImpressionsK: Math.round(row.organicImpressions / 1000),
    paidImpressionsK: Math.round(row.paidImpressions / 1000),
    depletionCases: row.depletionCases,
  }));

  return (
    <section className="rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Activity vs. Depletion by Month
          </p>
          <p className="mt-1 text-[11px] text-muted">
            Stacked sampling and stacked impressions by month with modeled depletion overlay
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">
          Modeled depletion overlay
        </span>
      </div>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 10, fill: CHART_AXIS_COLOR }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 9, fill: CHART_AXIS_COLOR }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatK(Number(value))}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 9, fill: CHART_AXIS_COLOR }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => Number(value).toLocaleString()}
            />
            <Tooltip
              formatter={(value, name) => {
                const key = String(name) as keyof typeof SERIES;
                const label = SERIES[key]?.label ?? String(name);
                const numeric = Number(value ?? 0);
                if (key === "organicImpressionsK" || key === "paidImpressionsK") {
                  return [`${numeric.toLocaleString()}K`, label];
                }
                return [numeric.toLocaleString(), label];
              }}
              contentStyle={{ fontSize: 11 }}
            />
            <Legend
              wrapperStyle={{ fontSize: 10 }}
              formatter={(value) =>
                SERIES[value as keyof typeof SERIES]?.label ?? String(value)
              }
            />

            <Bar
              yAxisId="left"
              dataKey="hctSampling"
              name="hctSampling"
              stackId="sampling"
              fill={SERIES.hctSampling.color}
              barSize={28}
            />
            <Bar
              yAxisId="left"
              dataKey="brandLedSampling"
              name="brandLedSampling"
              stackId="sampling"
              fill={SERIES.brandLedSampling.color}
              barSize={28}
            />
            <Bar
              yAxisId="left"
              dataKey="digitalSampling"
              name="digitalSampling"
              stackId="sampling"
              fill={SERIES.digitalSampling.color}
              radius={[3, 3, 0, 0]}
              barSize={28}
            />
            <Bar
              yAxisId="left"
              dataKey="organicImpressionsK"
              name="organicImpressionsK"
              stackId="impressions"
              fill={SERIES.organicImpressionsK.color}
              barSize={28}
            />
            <Bar
              yAxisId="left"
              dataKey="paidImpressionsK"
              name="paidImpressionsK"
              stackId="impressions"
              fill={SERIES.paidImpressionsK.color}
              radius={[3, 3, 0, 0]}
              barSize={28}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="depletionCases"
              name="depletionCases"
              stroke={SERIES.depletionCases.color}
              strokeWidth={2.5}
              dot={{ r: 3, fill: SERIES.depletionCases.color }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-muted">{takeaway}</p>
    </section>
  );
}
