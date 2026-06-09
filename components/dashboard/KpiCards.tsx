"use client";

import { GripVertical, TrendingDown, TrendingUp } from "lucide-react";
import { KPI_STATUS_STYLES } from "@/lib/target-status";
import type { KpiMetric, KpiPlatformIcon } from "@/lib/types";
import { InstagramIcon, TikTokIcon } from "./SocialPlatformIcons";
import { useReorder } from "./useReorder";

type KpiGridColumns = 4 | 6 | 8 | 9;

const GRID_COLS: Record<KpiGridColumns, string> = {
  4: "grid-cols-4",
  6: "grid-cols-6",
  8: "grid-cols-8",
  9: "grid-cols-9",
};

interface KpiCardsProps {
  kpis: KpiMetric[];
  order: string[];
  onReorder: (order: string[]) => void;
  columns?: KpiGridColumns;
}

const NEUTRAL_CONFIG = {
  bg: "bg-white",
  badge: "",
  label: "",
};

function getPercentOfTarget(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((actual / target) * 100);
}

function PlatformIcons({ icons }: { icons: KpiPlatformIcon[] }) {
  if (!icons.length) return null;

  return (
    <span className="flex shrink-0 items-center gap-0.5 text-brand/55">
      {icons.includes("instagram") && (
        <InstagramIcon className="h-3.5 w-3.5 text-[#E4405F]" />
      )}
      {icons.includes("tiktok") && (
        <TikTokIcon className="h-3.5 w-3.5 text-foreground" />
      )}
    </span>
  );
}

export function KpiCards({
  kpis,
  order,
  onReorder,
  columns = 8,
}: KpiCardsProps) {
  const kpiByLabel = new Map(kpis.map((kpi) => [kpi.label, kpi]));
  const effectiveOrder =
    order.length > 0 ? order : kpis.map((kpi) => kpi.label);
  const orderedKpis = effectiveOrder
    .map((label) => kpiByLabel.get(label))
    .filter((kpi): kpi is KpiMetric => kpi !== undefined);

  const { getItemProps } = useReorder(effectiveOrder, onReorder);

  return (
    <div className={`grid ${GRID_COLS[columns]} items-stretch gap-3`}>
      {orderedKpis.map((kpi, index) => {
        const showTarget = kpi.showTarget !== false;
        const showStatus = kpi.showStatus !== false;
        const config = showStatus ? KPI_STATUS_STYLES[kpi.status] : NEUTRAL_CONFIG;
        const positiveTone = kpi.valueTone === "positive";
        const cardBg = positiveTone ? "bg-emerald-50/60" : config.bg;
        const cardBorder = positiveTone ? "border-emerald-200" : "border-brand/8";
        const percentOfTarget = getPercentOfTarget(kpi.actual, kpi.target);
        const dragProps = getItemProps(index);

        return (
          <div
            key={kpi.label}
            {...dragProps}
            className={`group relative flex h-full min-h-[148px] cursor-grab flex-col rounded-lg border ${cardBorder} ${cardBg} px-4 py-3 shadow-sm active:cursor-grabbing`}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute right-1.5 top-1.5 rounded p-0.5 text-brand/20 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <GripVertical className="h-3 w-3" />
            </div>

            <div className="flex h-9 shrink-0 items-start justify-between gap-1 pr-4">
              <p className="line-clamp-2 text-[11px] font-medium leading-tight text-brand/60">
                {kpi.label}
              </p>
              {kpi.icons && kpi.icons.length > 0 && (
                <PlatformIcons icons={kpi.icons} />
              )}
            </div>

            <p className="shrink-0 text-xl font-bold tabular-nums leading-none text-foreground">
              {kpi.value}
            </p>

            <div className="flex flex-1 flex-col gap-1 pt-1.5">
              {showTarget && (
                <p className="text-[10px] font-medium text-muted">
                  {kpi.comparisonLabel ?? "Target"}: {kpi.targetLabel}{" "}
                  <span className="font-semibold text-brand/70">
                    ({percentOfTarget}%)
                  </span>
                </p>
              )}

              {kpi.change !== 0 && (
                <div
                  className={`flex items-center gap-1 text-[11px] font-medium ${
                    kpi.change >= 0 ? "text-emerald-600" : "text-red-500"
                  }`}
                >
                  {kpi.change >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {kpi.change >= 0 ? "+" : ""}
                    {kpi.change.toFixed(1)}% vs PY
                  </span>
                </div>
              )}
            </div>

            <div className="shrink-0 pt-2">
              {showStatus ? (
                <span
                  className={`inline-block w-full rounded px-2 py-1 text-center text-[9px] font-bold uppercase tracking-wide ${config.badge}`}
                >
                  {config.label}
                </span>
              ) : (
                <div className="h-[22px]" aria-hidden />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
