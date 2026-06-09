"use client";

import { useMemo, useState } from "react";
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
import { GripVertical, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import {
  CHART_AXIS_COLOR,
  CHART_GRID_COLOR,
  CHART_LINE_COLOR,
  CHART_STACK_COLORS,
} from "@/lib/brand-colors";
import { formatCurrency } from "@/lib/format";
import { STATUS_STYLES } from "@/lib/target-status";
import type { BreakdownRow, StackedMonthlyPerformance } from "@/lib/types";

const METRICS = ["Reach", "Impact", "Result"] as const;

interface PerformanceDrilldownProps {
  title: string;
  monthly: StackedMonthlyPerformance[];
  breakdown: BreakdownRow[];
  breakdownLabel: string;
  takeaway: string;
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement> & {
    draggable?: boolean;
  };
  dropZoneProps?: React.HTMLAttributes<HTMLDivElement>;
  compact?: boolean;
  showMetricToggle?: boolean;
  defaultMetric?: (typeof METRICS)[number];
  lineLabel?: string;
  valueFormatter?: (value: number) => string;
}

const METRIC_CONFIG = {
  Reach: {
    bar: "reach",
    line: "impact",
    barName: "Reach",
    lineName: "Total Impact",
    barFmt: (v: number) => `${v.toLocaleString()}`,
    lineFmt: (v: number) => `${v.toLocaleString()}`,
  },
  Impact: {
    bar: "impact",
    line: "result",
    barName: "Impact",
    lineName: "Total Result",
    barFmt: (v: number) => `${v.toLocaleString()}`,
    lineFmt: (v: number) => `${(v / 1000).toFixed(0)}K`,
  },
  Result: {
    bar: "result",
    line: "reach",
    barName: "Result",
    lineName: "Total Reach",
    barFmt: (v: number) => `${(v / 1000).toFixed(0)}K`,
    lineFmt: (v: number) => `${v.toLocaleString()}`,
  },
} as const;

export function PerformanceDrilldown({
  title,
  monthly,
  breakdown,
  breakdownLabel,
  takeaway,
  dragHandleProps,
  dropZoneProps,
  compact = false,
  showMetricToggle = true,
  defaultMetric = "Reach",
  lineLabel,
  valueFormatter,
}: PerformanceDrilldownProps) {
  const [activeMetric, setActiveMetric] =
    useState<(typeof METRICS)[number]>(defaultMetric);
  const config = METRIC_CONFIG[activeMetric];
  const barFmt = valueFormatter ?? config.barFmt;
  const lineFmt = valueFormatter ?? config.lineFmt;
  const showTargets = breakdown.some((row) => row.reachPercent !== undefined);
  const stackKeys = breakdown.map((row) => row.name);

  const chartData = useMemo(
    () =>
      monthly.map((row) => ({
        month: row.month,
        line: row.line[config.line],
        ...Object.fromEntries(
          stackKeys.map((key) => [key, row.segments[key]?.[config.bar] ?? 0]),
        ),
      })),
    [monthly, stackKeys, config.bar, config.line],
  );

  function formatCell(
    row: BreakdownRow,
    metric: "reach" | "impact" | "result",
    value: number,
  ) {
    const percent = row[`${metric}Percent`];
    const status = row[`${metric}Status`];

    if (!showTargets || percent === undefined || !status) {
      return (
        <span className="text-brand/80">
          {valueFormatter ? valueFormatter(value) : value.toLocaleString()}
        </span>
      );
    }

    const colors = STATUS_STYLES[status];
    return (
      <div className="leading-tight">
        <span className="text-brand/80">
          {valueFormatter ? valueFormatter(value) : value.toLocaleString()}
        </span>
        <span className={`ml-1 text-[9px] font-semibold ${colors.text}`}>
          {percent}%
        </span>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-brand/8 bg-white shadow-sm ${compact ? "p-4" : "p-5"}`}
      {...dropZoneProps}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {dragHandleProps && (
            <div
              role="button"
              tabIndex={0}
              aria-label={`Drag to reorder ${title}`}
              className="cursor-grab select-none rounded p-0.5 text-brand/40 hover:text-brand/70 active:cursor-grabbing"
              {...dragHandleProps}
            >
              <GripVertical className="h-4 w-4" />
            </div>
          )}
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            {title}
          </h3>
        </div>
        {showMetricToggle ? (
          <div className="flex shrink-0 rounded-md border border-brand/15">
            {METRICS.map((metric) => (
              <button
                key={metric}
                type="button"
                onClick={() => setActiveMetric(metric)}
                className={`px-2 py-1 text-[11px] font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                  activeMetric === metric
                    ? "bg-brand text-white"
                    : "text-brand/70 hover:bg-surface"
                }`}
              >
                {metric}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mb-2 flex items-start gap-2 rounded-md bg-surface/80 px-3 py-1.5">
        <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-accent" />
        <p className="text-[11px] leading-snug text-brand/80">{takeaway}</p>
      </div>

      <div className="space-y-2">
        <div className={`w-full ${compact ? "h-[300px]" : "h-[280px]"}`}>
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_GRID_COLOR}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="bar"
                tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
                axisLine={false}
                tickLine={false}
                tickFormatter={barFmt}
              />
              <YAxis
                yAxisId="line"
                orientation="right"
                tick={{ fontSize: 11, fill: CHART_AXIS_COLOR }}
                axisLine={false}
                tickLine={false}
                tickFormatter={lineFmt}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid rgba(123, 35, 64, 0.12)",
                  borderRadius: 8,
                }}
                formatter={(value, name) => {
                  if (name === "line") {
                    return [lineFmt(Number(value)), lineLabel ?? config.lineName];
                  }
                  return [barFmt(Number(value)), String(name)];
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
                iconType="circle"
                iconSize={7}
              />
              {stackKeys.map((key, index) => (
                <Bar
                  key={key}
                  yAxisId="bar"
                  dataKey={key}
                  name={key}
                  stackId="stack"
                  fill={CHART_STACK_COLORS[index % CHART_STACK_COLORS.length]}
                  radius={
                    index === stackKeys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]
                  }
                  barSize={compact ? 24 : 28}
                />
              ))}
              <Line
                yAxisId="line"
                type="monotone"
                dataKey="line"
                name={lineLabel ?? config.lineName}
                stroke={CHART_LINE_COLOR}
                strokeWidth={2}
                dot={{ r: 4, fill: CHART_LINE_COLOR, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="border-t border-brand/8 pt-2">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            {breakdownLabel}
          </p>
          <table className="w-full table-fixed text-[11px]">
            <thead>
              <tr className="border-b border-brand/10 text-left text-muted">
                <th className="pb-1 font-medium">Type</th>
                <th className="pb-1 font-medium">Reach</th>
                <th className="pb-1 font-medium">Impact</th>
                <th className="pb-1 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr key={row.name} className="border-b border-brand/5 last:border-0">
                  <td className="py-1 font-medium text-foreground">{row.name}</td>
                  <td className="py-1">
                    {formatCell(row, "reach", row.reach)}
                  </td>
                  <td className="py-1">
                    {formatCell(row, "impact", row.impact)}
                  </td>
                  <td className="py-1">
                    {showTargets ? (
                      formatCell(row, "result", row.result)
                    ) : (
                      <span
                        className={`inline-flex items-center gap-0.5 font-medium ${
                          row.change >= 0 ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {row.change >= 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        {row.result.toLocaleString()}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
