import { format } from "date-fns";
import { formatCurrency, formatReach } from "@/lib/format";
import { getTargetStatus } from "@/lib/target-status";
import {
  getSupabaseAdmin,
  type KpiTargetRow,
  type ProgramMetricRow,
} from "@/lib/supabase/server";
import type { DashboardData, DashboardFilters } from "@/lib/types";

const GAUGE_GREEN_THRESHOLD = 98;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DEFAULT_TARGETS: Record<string, number> = {
  spend: 3_500_000,
  return_value: 3_000_000,
  roi: 90,
  samples: 25_000,
  content_reach: 15_000_000,
  active_programs: 15,
  markets: 10,
  on_premise_roi: 90,
  off_premise_roi: 85,
  total_spend: 4_500_000,
};

const BASE_INSIGHTS = [
  {
    id: "1",
    icon: "trending" as const,
    title: "Increase Investment in High ROI Venues",
    description:
      "Bars & Nightlife and Sports & Events are outperforming targets by 12%+. Consider reallocating 15% of spend from underperforming hotel activations.",
  },
  {
    id: "2",
    icon: "warning" as const,
    title: "Off Premise Mass Channel Underperforming",
    description:
      "Mass retail ROI is 8% below target in the Midwest. Review shelf placement and promotional timing for Q3 programs.",
  },
  {
    id: "3",
    icon: "star" as const,
    title: "Content Reach Exceeding Benchmarks",
    description:
      "TTL content reach is 22% above PY driven by influencer partnerships in Southeast markets. Scale similar activations.",
  },
  {
    id: "4",
    icon: "trending" as const,
    title: "Sample Efficiency Improving",
    description:
      "Cost per sample decreased 14% vs PY while conversion rates held steady. Current sampling strategy is highly efficient.",
  },
];

function buildQuery(filters: DashboardFilters) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("program_metrics")
    .select("*")
    .gte("metric_date", format(filters.startDate, "yyyy-MM-dd"))
    .lte("metric_date", format(filters.endDate, "yyyy-MM-dd"));

  if (filters.brand !== "All Brands") {
    query = query.eq("brand", filters.brand);
  }
  if (filters.region !== "All Regions") {
    query = query.eq("region", filters.region);
  }
  if (filters.market !== "All Markets") {
    query = query.eq("market", filters.market);
  }

  return query;
}

async function loadTargets(): Promise<Record<string, number>> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("kpi_targets").select("*");

  if (error || !data?.length) return DEFAULT_TARGETS;

  const targets = { ...DEFAULT_TARGETS };
  for (const row of data as KpiTargetRow[]) {
    targets[row.metric_key] = Number(row.target_value);
  }
  return targets;
}

function avgField(rows: ProgramMetricRow[], field: keyof ProgramMetricRow): number {
  const values = rows
    .map((r) => Number(r[field]))
    .filter((v) => !Number.isNaN(v));
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function groupMonthly(rows: ProgramMetricRow[]) {
  const byMonth = new Map<string, { spend: number; roi: number; count: number }>();

  for (const row of rows) {
    const month = MONTH_LABELS[new Date(row.metric_date).getMonth()];
    const existing = byMonth.get(month) ?? { spend: 0, roi: 0, count: 0 };
    existing.spend += Number(row.spend);
    existing.roi += Number(row.roi);
    existing.count += 1;
    byMonth.set(month, existing);
  }

  return Array.from(byMonth.entries()).map(([month, data]) => ({
    month,
    spend: Math.round(data.spend / 1000),
    roi: Math.round(data.roi / data.count),
  }));
}

function groupBreakdown(
  rows: ProgramMetricRow[],
  field: "venue_type" | "retailer_type",
) {
  const groups = new Map<string, { spend: number; roi: number; count: number; py: number }>();

  for (const row of rows) {
    const name = row[field];
    if (!name) continue;
    const existing = groups.get(name) ?? { spend: 0, roi: 0, count: 0, py: 0 };
    existing.spend += Number(row.spend);
    existing.roi += Number(row.roi);
    existing.py += Number(row.py_roi_change ?? 0);
    existing.count += 1;
    groups.set(name, existing);
  }

  return Array.from(groups.entries()).map(([name, data]) => ({
    name,
    spend: Math.round((data.spend / 1_000_000) * 10) / 10,
    roi: Math.round(data.roi / data.count),
    change: Math.round((data.py / data.count) * 10) / 10,
  }));
}

export async function getDashboardDataFromSupabase(
  filters: DashboardFilters,
): Promise<DashboardData | null> {
  const { data: rows, error } = await buildQuery(filters);

  if (error) throw error;
  if (!rows?.length) return null;

  const metrics = rows as ProgramMetricRow[];
  const targets = await loadTargets();

  const onPremise = metrics.filter((r) => r.channel === "on_premise");
  const offPremise = metrics.filter((r) => r.channel === "off_premise");

  const spend = metrics.reduce((sum, r) => sum + Number(r.spend), 0);
  const returnValue = metrics.reduce((sum, r) => sum + Number(r.return_value), 0);
  const samples = metrics.reduce((sum, r) => sum + Number(r.samples), 0);
  const reach = metrics.reduce((sum, r) => sum + Number(r.content_reach), 0);
  const roi = spend > 0 ? (returnValue / spend) * 100 : 0;
  const pySpendChange = avgField(metrics, "py_spend_change");
  const marketsCount = new Set(metrics.map((r) => r.market)).size;
  const activePrograms = Math.max(1, Math.round(marketsCount * 1.5));

  const sparkline = [62, 68, 71, 75, 79, 84, 87];

  const kpis = [
    {
      label: "Spend to Date",
      value: formatCurrency(spend),
      change: pySpendChange,
      sparkline,
      actual: spend,
      target: targets.spend,
      targetLabel: formatCurrency(targets.spend),
      status: getTargetStatus(spend, targets.spend),
    },
    {
      label: "Return Value",
      value: formatCurrency(returnValue),
      change: pySpendChange + 3,
      sparkline: sparkline.map((v) => v + 3),
      actual: returnValue,
      target: targets.return_value,
      targetLabel: formatCurrency(targets.return_value),
      status: getTargetStatus(returnValue, targets.return_value),
    },
    {
      label: "ROI to Date",
      value: `${roi.toFixed(1)}%`,
      change: avgField(metrics, "py_roi_change"),
      sparkline: sparkline.map((v) => Math.min(v + 8, 100)),
      actual: roi,
      target: targets.roi,
      targetLabel: `${targets.roi}%`,
      status: getTargetStatus(roi, targets.roi),
    },
    {
      label: "TTL Samples",
      value: formatReach(samples),
      change: pySpendChange - 2,
      sparkline,
      actual: samples,
      target: targets.samples,
      targetLabel: formatReach(targets.samples),
      status: getTargetStatus(samples, targets.samples),
    },
    {
      label: "TTL Content Reach",
      value: formatReach(reach),
      change: pySpendChange + 10,
      sparkline: sparkline.map((v) => v + 5),
      actual: reach,
      target: targets.content_reach,
      targetLabel: formatReach(targets.content_reach),
      status: getTargetStatus(reach, targets.content_reach),
    },
    {
      label: "Active Programs",
      value: String(activePrograms),
      change: 0,
      sparkline: [8, 9, 10, 10, 11, 12, activePrograms],
      actual: activePrograms,
      target: targets.active_programs,
      targetLabel: String(targets.active_programs),
      status: getTargetStatus(activePrograms, targets.active_programs),
    },
    {
      label: "Markets",
      value: String(marketsCount),
      change: 0,
      sparkline: [5, 6, 6, 7, 7, 8, marketsCount],
      actual: marketsCount,
      target: targets.markets,
      targetLabel: String(targets.markets),
      status: getTargetStatus(marketsCount, targets.markets),
    },
  ];

  const onPremiseRoi =
    onPremise.length > 0
      ? onPremise.reduce((sum, r) => sum + Number(r.roi), 0) / onPremise.length
      : 0;
  const offPremiseRoi =
    offPremise.length > 0
      ? offPremise.reduce((sum, r) => sum + Number(r.roi), 0) / offPremise.length
      : 0;

  const onPremiseActual = Math.round(onPremiseRoi);
  const offPremiseActual = Math.round(offPremiseRoi);
  const spendPercentOfTarget = Math.round((spend / targets.total_spend) * 100);

  const targetGauges = [
    {
      label: "On Premise ROI Target",
      target: `${targets.on_premise_roi}%`,
      actual: `${onPremiseActual}%`,
      percent: onPremiseActual,
      percentOfTarget: Math.round((onPremiseActual / targets.on_premise_roi) * 100),
      status: getTargetStatus(onPremiseActual, targets.on_premise_roi, GAUGE_GREEN_THRESHOLD),
      change: avgField(onPremise, "py_roi_change"),
    },
    {
      label: "Off Premise ROI Target",
      target: `${targets.off_premise_roi}%`,
      actual: `${offPremiseActual}%`,
      percent: offPremiseActual,
      percentOfTarget: Math.round((offPremiseActual / targets.off_premise_roi) * 100),
      status: getTargetStatus(offPremiseActual, targets.off_premise_roi, GAUGE_GREEN_THRESHOLD),
      change: avgField(offPremise, "py_roi_change"),
    },
    {
      label: "Total Spend Target",
      target: formatCurrency(targets.total_spend),
      actual: formatCurrency(spend),
      percent: spendPercentOfTarget,
      percentOfTarget: spendPercentOfTarget,
      status: getTargetStatus(spend, targets.total_spend, GAUGE_GREEN_THRESHOLD),
      change: pySpendChange,
    },
  ];

  const startMonth = filters.startDate.getMonth();
  const endMonth = filters.endDate.getMonth();
  const monthsInRange = Math.max(1, endMonth - startMonth + 1);
  const pacingPercent = Math.round((monthsInRange / 12) * 100);

  const insights = BASE_INSIGHTS.map((insight) => {
    if (filters.brand !== "All Brands") {
      return {
        ...insight,
        description: insight.description.replace(
          "underperforming",
          `underperforming for ${filters.brand}`,
        ),
      };
    }
    if (filters.region !== "All Regions") {
      return {
        ...insight,
        description: insight.description.replace("Midwest", filters.region),
      };
    }
    return insight;
  });

  return {
    kpis,
    onPremise: {
      monthly: groupMonthly(onPremise),
      breakdown: groupBreakdown(onPremise, "venue_type"),
    },
    offPremise: {
      monthly: groupMonthly(offPremise),
      breakdown: groupBreakdown(offPremise, "retailer_type"),
    },
    targets: targetGauges,
    pacingPercent,
    insights,
    activePrograms,
    markets: marketsCount,
  };
}
