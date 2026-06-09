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
  ACTIVATION_TYPE_CHART_COLORS,
  CHART_AXIS_COLOR,
  CHART_GRID_COLOR,
  CHART_LINE_COLOR,
  CHART_STACK_COLORS,
  LOCATION_TYPE_CHART_COLORS,
} from "@/lib/brand-colors";
import { formatCurrency, formatReach } from "@/lib/format";
import { ACTIVATION_TYPES } from "@/lib/settings";
import { STATUS_STYLES } from "@/lib/target-status";
import type { BreakdownRow, StackedMonthlyPerformance } from "@/lib/types";

const METRICS = ["Engagements", "Samples", "ROS"] as const;

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
  axisLabel?: string;
  valueFormatter?: (value: number) => string;
}

const METRIC_TOGGLE_CONFIG = {
  Engagements: {
    key: "reach" as const,
    axisLabel: "Ppl Engaged",
    lineName: "Total Ppl Engaged",
    format: (v: number) => v.toLocaleString(),
  },
  Samples: {
    key: "impact" as const,
    axisLabel: "Samples",
    lineName: "Total Samples",
    format: (v: number) => v.toLocaleString(),
  },
  ROS: {
    key: "result" as const,
    axisLabel: "ROS",
    lineName: "Total ROS",
    format: (v: number) => formatCurrency(v),
  },
} as const;

/** Legacy dual-axis mapping for charts without metric toggles. */
const LEGACY_METRIC_CONFIG = {
  Engagements: {
    bar: "reach",
    line: "impact",
    lineName: "Total Impact",
    barFmt: (v: number) => `${v.toLocaleString()}`,
    lineFmt: (v: number) => `${v.toLocaleString()}`,
  },
  Samples: {
    bar: "impact",
    line: "result",
    lineName: "Total Result",
    barFmt: (v: number) => `${v.toLocaleString()}`,
    lineFmt: (v: number) => `${(v / 1000).toFixed(0)}K`,
  },
  ROS: {
    bar: "result",
    line: "reach",
    lineName: "Total Reach",
    barFmt: (v: number) => `${(v / 1000).toFixed(0)}K`,
    lineFmt: (v: number) => `${v.toLocaleString()}`,
  },
} as const;

function getStackColor(
  key: string,
  index: number,
  breakdownLabel: string,
): string {
  if (breakdownLabel === "By Activation Type") {
    return (
      ACTIVATION_TYPE_CHART_COLORS[key] ??
      CHART_STACK_COLORS[index % CHART_STACK_COLORS.length]
    );
  }

  if (breakdownLabel === "By Location Type") {
    return (
      LOCATION_TYPE_CHART_COLORS[key] ??
      CHART_STACK_COLORS[index % CHART_STACK_COLORS.length]
    );
  }

  return CHART_STACK_COLORS[index % CHART_STACK_COLORS.length];
}

type ChartTooltipEntry = {
  name: string;
  value: number;
  dataKey: string;
  color: string;
};

type ChartTooltipProps = {
  active?: boolean;
  payload?: ChartTooltipEntry[];
  label?: string;
  stackKeys: string[];
  barFormat: (value: number) => string;
  lineFormat: (value: number) => string;
  metricLabel?: string;
  totalLabel: string;
};

function ChartTooltip({
  active,
  payload,
  label,
  stackKeys,
  barFormat,
  lineFormat,
  metricLabel,
  totalLabel,
}: ChartTooltipProps) {
  if (!active || !payload?.length || !label) return null;

  const byKey = new Map(payload.map((entry) => [entry.dataKey, entry]));
  const segments = stackKeys
    .map((key) => byKey.get(key))
    .filter((entry): entry is ChartTooltipEntry => entry != null);
  const lineEntry = byKey.get("line");

  return (
    <div className="rounded-md border border-brand/12 bg-white px-2.5 py-2 text-xs shadow-md">
      <p className="font-semibold text-foreground">{label}</p>
      {metricLabel ? (
        <p className="text-[10px] text-muted">{metricLabel}</p>
      ) : null}
      <div className="mt-1.5 space-y-1">
        {segments.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-1.5">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="flex min-w-0 flex-1 items-center justify-between gap-2 text-brand/80">
              <span className="truncate font-medium text-foreground">
                {entry.name}
              </span>
              <span className="shrink-0 font-semibold tabular-nums text-foreground">
                {barFormat(Number(entry.value))}
              </span>
            </span>
          </div>
        ))}
      </div>
      {lineEntry ? (
        <div className="mt-1.5 flex items-center justify-between gap-2 border-t border-brand/10 pt-1.5 font-semibold text-foreground">
          <span>{totalLabel}</span>
          <span className="tabular-nums">{lineFormat(Number(lineEntry.value))}</span>
        </div>
      ) : null}
    </div>
  );
}

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
  defaultMetric = "Engagements",
  lineLabel,
  axisLabel,
  valueFormatter,
}: PerformanceDrilldownProps) {
  const [activeMetric, setActiveMetric] =
    useState<(typeof METRICS)[number]>(defaultMetric);
  const toggleConfig = METRIC_TOGGLE_CONFIG[activeMetric];
  const legacyConfig = LEGACY_METRIC_CONFIG[activeMetric];
  const barFmt = showMetricToggle
    ? toggleConfig.format
    : (valueFormatter ?? legacyConfig.barFmt);
  const lineFmt = showMetricToggle
    ? toggleConfig.format
    : (valueFormatter ?? legacyConfig.lineFmt);
  const yAxisLabel = showMetricToggle ? toggleConfig.axisLabel : axisLabel;
  const axisTickFmt = showMetricToggle
    ? activeMetric === "ROS"
      ? formatCurrency
      : formatReach
    : valueFormatter
      ? formatCurrency
      : formatReach;
  const showTargets = breakdown.some((row) => row.reachPercent !== undefined);
  const stackKeys = breakdown.map((row) => row.name);
  const tooltipKeys = useMemo(() => {
    if (breakdownLabel === "By Activation Type") {
      return ACTIVATION_TYPES.filter((type) => stackKeys.includes(type));
    }
    return [...stackKeys].sort((a, b) => a.localeCompare(b));
  }, [breakdownLabel, stackKeys]);
  const totalLabel =
    lineLabel ??
    (showMetricToggle ? toggleConfig.lineName : legacyConfig.lineName);

  const chartData = useMemo(() => {
    if (showMetricToggle) {
      return monthly.map((row) => ({
        month: row.month,
        line: row.line[toggleConfig.key],
        ...Object.fromEntries(
          stackKeys.map((key) => [
            key,
            row.segments[key]?.[toggleConfig.key] ?? 0,
          ]),
        ),
      }));
    }

    return monthly.map((row) => ({
      month: row.month,
      line: row.line.reach,
      ...Object.fromEntries(
        stackKeys.map((key) => [key, row.segments[key]?.reach ?? 0]),
      ),
    }));
  }, [monthly, stackKeys, showMetricToggle, toggleConfig.key]);

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
      className={`min-w-0 overflow-hidden rounded-lg border border-brand/8 bg-white shadow-sm ${compact ? "p-4" : "p-5"}`}
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
        <div
          className={`mx-auto flex ${compact ? "h-[280px] w-[88%]" : "h-[280px] w-full"}`}
        >
          {yAxisLabel ? (
            <div className="flex w-4 shrink-0 items-center justify-center self-stretch pb-8 pt-4">
              <span
                className="text-[9px] font-semibold"
                style={{
                  writingMode: "vertical-lr",
                  transform: "rotate(180deg)",
                  color: CHART_AXIS_COLOR,
                }}
              >
                {yAxisLabel}
              </span>
            </div>
          ) : null}
          <div className="min-h-0 min-w-0 flex-1">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart
              data={chartData}
              barCategoryGap={compact ? "2%" : "10%"}
              margin={{
                top: 4,
                right: 8,
                left: 0,
                bottom: 4,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_GRID_COLOR}
                vertical={false}
              />
              <XAxis
                dataKey="month"
                tick={{ fontSize: compact ? 10 : 11, fill: CHART_AXIS_COLOR }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                width={44}
                tick={{ fontSize: 8, fill: CHART_AXIS_COLOR }}
                axisLine={false}
                tickLine={false}
                tickFormatter={axisTickFmt}
              />
              <Tooltip
                shared
                cursor={{ fill: "rgba(123, 35, 64, 0.06)" }}
                content={(props) => (
                  <ChartTooltip
                    active={props.active}
                    payload={props.payload as unknown as ChartTooltipEntry[] | undefined}
                    label={props.label != null ? String(props.label) : undefined}
                    stackKeys={tooltipKeys}
                    barFormat={barFmt}
                    lineFormat={lineFmt}
                    metricLabel={yAxisLabel}
                    totalLabel={totalLabel}
                  />
                )}
              />
              <Legend
                wrapperStyle={{
                  fontSize: compact ? 9 : 10,
                  paddingTop: 2,
                  lineHeight: "12px",
                }}
                iconType="circle"
                iconSize={compact ? 6 : 7}
              />
              {stackKeys.map((key, index) => (
                <Bar
                  key={key}
                  yAxisId="left"
                  dataKey={key}
                  name={key}
                  stackId="stack"
                  fill={getStackColor(key, index, breakdownLabel)}
                  radius={
                    index === stackKeys.length - 1 ? [3, 3, 0, 0] : [0, 0, 0, 0]
                  }
                  barSize={compact ? 38 : 28}
                />
              ))}
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="line"
                name={
                  lineLabel ??
                  (showMetricToggle
                    ? toggleConfig.lineName
                    : legacyConfig.lineName)
                }
                stroke={CHART_LINE_COLOR}
                strokeWidth={2}
                dot={{ r: 4, fill: CHART_LINE_COLOR, strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
          </div>
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
