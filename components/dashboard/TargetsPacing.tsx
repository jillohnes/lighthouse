"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import {
  ACTIVATION_SECTION_TITLES,
  ACTIVATION_TYPES,
  type ActivationType,
} from "@/lib/settings";
import { STATUS_STYLES } from "@/lib/target-status";
import type { TargetGauge, TargetMetricKey } from "@/lib/types";

interface TargetsPacingProps {
  targets: TargetGauge[];
  pacingPercent: number;
}

interface ProgressRowProps {
  label: string;
  actual: string;
  target: string;
  percentOfTarget: number;
  status: TargetGauge["status"];
  change?: number;
}

const METRIC_ORDER: TargetMetricKey[] = ["reach", "impact", "result"];

function ProgressRow({
  label,
  actual,
  target,
  percentOfTarget,
  status,
  change = 0,
}: ProgressRowProps) {
  const colors = STATUS_STYLES[status];
  const barWidth = Math.min(100, percentOfTarget);

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-medium text-brand/60">{label}</p>
        <p className={`shrink-0 text-[10px] font-semibold ${colors.text}`}>
          {percentOfTarget}% of target
        </p>
      </div>

      <div className="flex items-baseline justify-between gap-3">
        <p className="text-sm font-bold text-foreground">
          {actual}{" "}
          <span className="text-xs font-normal text-muted">/ {target}</span>
        </p>
        {change < 0 && (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-red-500">
            <TrendingDown className="h-3 w-3" />
            {change.toFixed(1)}%
          </span>
        )}
        {change > 0 && (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-medium text-emerald-600">
            <TrendingUp className="h-3 w-3" />
            +{change.toFixed(1)}%
          </span>
        )}
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colors.bar}`}
          style={{ width: `${barWidth}%` }}
        />
      </div>
    </div>
  );
}

function gaugeToRow(target: TargetGauge): ProgressRowProps {
  return {
    label: target.label,
    actual: target.actual,
    target: target.target,
    percentOfTarget: target.percentOfTarget,
    status: target.status,
    change: target.change,
  };
}

function getRowsForType(
  targets: TargetGauge[],
  type: ActivationType,
): ProgressRowProps[] {
  const byMetric = new Map(
    targets
      .filter((target) => target.activationType === type)
      .map((target) => [target.metricKey, gaugeToRow(target)]),
  );

  return METRIC_ORDER.map((metricKey) => {
    const row = byMetric.get(metricKey);
    if (row) return row;
    return {
      label: metricKey === "result" ? "Results" : metricKey.charAt(0).toUpperCase() + metricKey.slice(1),
      actual: "0",
      target: "—",
      percentOfTarget: 0,
      status: "well-below" as const,
    };
  });
}

export function TargetsPacing({ targets }: TargetsPacingProps) {
  return (
    <div className="rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <h3 className="mb-5 text-xs font-bold uppercase tracking-wider text-foreground">
        Targets & Pacing Summary
      </h3>

      <div className="grid grid-cols-3 gap-8">
        {ACTIVATION_TYPES.map((type) => (
          <section key={type} className="space-y-4">
            <h4 className="border-b border-brand/10 pb-2 text-[11px] font-bold uppercase tracking-wider text-brand">
              {ACTIVATION_SECTION_TITLES[type]}
            </h4>
            <div className="space-y-5">
              {getRowsForType(targets, type).map((row) => (
                <ProgressRow key={`${type}-${row.label}`} {...row} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
