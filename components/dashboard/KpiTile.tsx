import { TrendingDown, TrendingUp } from "lucide-react";
import { KPI_STATUS_STYLES } from "@/lib/target-status";
import type { KpiMetric } from "@/lib/types";
import { InstagramIcon, TikTokIcon } from "./SocialPlatformIcons";

/** Tile footprint is ~70% of the original KpiCards size. */
export const TILE_MIN_HEIGHT = 104;

const NEUTRAL_CONFIG = {
  bg: "bg-white",
  badge: "",
  label: "",
};

function getPercentOfTarget(actual: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((actual / target) * 100);
}

function PlatformIcons({ icons }: { icons: NonNullable<KpiMetric["icons"]> }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5 text-brand/55">
      {icons.includes("instagram") && (
        <InstagramIcon className="h-2.5 w-2.5 text-[#E4405F]" />
      )}
      {icons.includes("tiktok") && (
        <TikTokIcon className="h-2.5 w-2.5 text-foreground" />
      )}
    </span>
  );
}

interface KpiTileProps {
  kpi: KpiMetric;
}

export function KpiTile({ kpi }: KpiTileProps) {
  const showTarget = kpi.showTarget !== false;
  const showStatus = kpi.showStatus !== false;
  const config = showStatus ? KPI_STATUS_STYLES[kpi.status] : NEUTRAL_CONFIG;
  const positiveTone = kpi.valueTone === "positive";
  const cardBg = positiveTone ? "bg-emerald-50/60" : config.bg;
  const cardBorder = positiveTone ? "border-emerald-200" : "border-brand/8";
  const percentOfTarget = getPercentOfTarget(kpi.actual, kpi.target);

  return (
    <div
      className={`flex h-full flex-col rounded-md border ${cardBorder} ${cardBg} px-2.5 py-2 shadow-sm`}
      style={{ minHeight: TILE_MIN_HEIGHT }}
    >
      <div className="flex h-8 shrink-0 items-start justify-between gap-1">
        <p className="line-clamp-2 text-[11px] font-medium leading-snug text-brand/60">
          {kpi.label}
        </p>
        {kpi.icons && kpi.icons.length > 0 && (
          <PlatformIcons icons={kpi.icons} />
        )}
      </div>

      <p className="shrink-0 text-sm font-bold tabular-nums leading-none text-foreground">
        {kpi.value}
      </p>

      <div className="flex flex-1 flex-col gap-0.5 pt-1">
        {showTarget && (
          <p className="text-[8px] font-medium text-muted">
            {kpi.comparisonLabel ?? "Target"}: {kpi.targetLabel}{" "}
            <span className="font-semibold text-brand/70">
              ({percentOfTarget}%)
            </span>
          </p>
        )}

        {kpi.spendLines?.map((line) => (
          <p key={line.label} className="text-[8px] font-medium text-muted">
            {line.label}: {line.value}
          </p>
        ))}

        {kpi.change !== 0 && (
          <div
            className={`flex items-center gap-0.5 text-[8px] font-medium ${
              kpi.change >= 0 ? "text-emerald-600" : "text-red-500"
            }`}
          >
            {kpi.change >= 0 ? (
              <TrendingUp className="h-2.5 w-2.5" />
            ) : (
              <TrendingDown className="h-2.5 w-2.5" />
            )}
            <span>
              {kpi.change >= 0 ? "+" : ""}
              {kpi.change.toFixed(1)}% vs PY
            </span>
          </div>
        )}
      </div>

      <div className="shrink-0 pt-1">
        {showStatus ? (
          <span
            className={`inline-block w-full rounded px-1.5 py-0.5 text-center text-[7px] font-bold uppercase tracking-wide ${config.badge}`}
          >
            {config.label}
          </span>
        ) : (
          <div className="h-4" aria-hidden />
        )}
      </div>
    </div>
  );
}
