import { decodeActivation, type DecodedActivation } from "@/lib/activation-metrics";
import { formatDateParam } from "@/lib/dates";
import { formatCurrency, formatNumber, formatReach } from "@/lib/format";
import {
  buildActivationBreakdown,
  compareTypeMetric,
  computeKpiMetrics,
  formatMetricDisplay,
  getTypeRows,
} from "@/lib/metric-comparison";
import { getProgramSettings } from "@/lib/queries/settings";
import {
  BUDGET_LABELS,
  BUDGET_MODES,
  getApplicableTypes,
  getMetricLabel,
  type ActivationType,
  type ProgramSettings,
} from "@/lib/settings";
import { getBudgetStatus, getTargetStatus } from "@/lib/target-status";
import { CONTENT_BRAND } from "@/lib/content-metrics";
import {
  fetchContentMetricsSafe,
  getContentTotals,
} from "@/lib/queries/content";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { fetchAllProgramMetrics } from "@/lib/queries/fetch-all";
import type { DashboardData, DashboardFilters, TargetGauge } from "@/lib/types";

const GAUGE_GREEN_THRESHOLD = 98;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function buildQuery(filters: DashboardFilters) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("program_metrics")
    .select("*")
    .neq("brand", CONTENT_BRAND)
    .gte("metric_date", formatDateParam(filters.startDate))
    .lte("metric_date", formatDateParam(filters.endDate));

  if (filters.activationType.length > 0) {
    query = query.in("brand", filters.activationType);
  }
  if (filters.region.length > 0) {
    query = query.in("region", filters.region);
  }
  if (filters.market.length > 0) {
    query = query.in("market", filters.market);
  }

  return query;
}

function buildMetricGauges(
  rows: DecodedActivation[],
  settings: ProgramSettings,
  applicableTypes: ActivationType[],
): TargetGauge[] {
  const gauges: TargetGauge[] = [];

  for (const type of applicableTypes) {
    const typeRows = getTypeRows(rows, type);
    if (!typeRows.length) continue;

    const config = settings.activationTypes[type];

    for (const metric of ["reach", "impact", "result"] as const) {
      const comparison = compareTypeMetric(
        typeRows,
        type,
        metric,
        config[metric],
      );

      gauges.push({
        label: getMetricLabel(type, metric),
        target: formatMetricDisplay(type, metric, comparison.target),
        actual: formatMetricDisplay(type, metric, comparison.actual),
        percent: Math.min(100, comparison.percentOfTarget),
        percentOfTarget: comparison.percentOfTarget,
        status: getTargetStatus(
          comparison.actual,
          comparison.target,
          GAUGE_GREEN_THRESHOLD,
        ),
        change: 0,
      });
    }
  }

  return gauges;
}

function buildBudgetGauges(
  rows: DecodedActivation[],
  settings: ProgramSettings,
  applicableTypes: ActivationType[],
): TargetGauge[] {
  const gauges: TargetGauge[] = [];

  for (const type of applicableTypes) {
    const typeRows = rows.filter((r) => r.activation_type === type);
    if (!typeRows.length) continue;

    const config = settings.activationTypes[type];
    const mode = BUDGET_MODES[type];
    const totalCost = typeRows.reduce((sum, row) => sum + row.cost, 0);
    const actual = mode === "total_cost" ? totalCost : totalCost / typeRows.length;
    const target = config.budget;
    const percentOfTarget =
      target > 0 ? Math.round((actual / target) * 100) : 0;

    gauges.push({
      label: `${type} ${BUDGET_LABELS[type]}`,
      target: formatCurrency(target),
      actual: formatCurrency(actual),
      percent: Math.min(100, percentOfTarget),
      percentOfTarget,
      status: getBudgetStatus(actual, target),
      change: 0,
    });
  }

  return gauges;
}

function groupMonthly(rows: DecodedActivation[]) {
  const byMonth = new Map<string, { reach: number; impact: number; result: number; count: number }>();

  for (const row of rows) {
    const month = MONTH_LABELS[new Date(row.metric_date).getMonth()];
    const existing = byMonth.get(month) ?? { reach: 0, impact: 0, result: 0, count: 0 };
    existing.reach += row.reach;
    existing.impact += row.impact;
    existing.result += row.result;
    existing.count += 1;
    byMonth.set(month, existing);
  }

  return Array.from(byMonth.entries()).map(([month, data]) => ({
    month,
    reach: Math.round(data.reach),
    impact: Math.round(data.impact),
    result: Math.round(data.result),
  }));
}

function groupBreakdown(
  rows: DecodedActivation[],
  field: "activation_type" | "location_type",
) {
  const groups = new Map<string, { reach: number; impact: number; result: number; count: number }>();

  for (const row of rows) {
    const name = row[field];
    const existing = groups.get(name) ?? { reach: 0, impact: 0, result: 0, count: 0 };
    existing.reach += row.reach;
    existing.impact += row.impact;
    existing.result += row.result;
    existing.count += 1;
    groups.set(name, existing);
  }

  const avgResult =
    rows.length > 0 ? rows.reduce((s, r) => s + r.result, 0) / rows.length : 0;

  return Array.from(groups.entries())
    .map(([name, data]) => ({
      name,
      reach: Math.round(data.reach),
      impact: Math.round(data.impact / data.count),
      result: Math.round(data.result),
      change: avgResult > 0 ? Math.round(((data.result / data.count - avgResult) / avgResult) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.result - a.result);
}

function generateInsights(rows: DecodedActivation[], filters: DashboardFilters) {
  const byLocation = groupBreakdown(rows, "location_type");
  const byType = groupBreakdown(rows, "activation_type");
  const topLocation = byLocation[0];
  const topType = byType[0];
  const totalReach = rows.reduce((s, r) => s + r.reach, 0);

  const insights = [
    {
      id: "1",
      icon: "trending" as const,
      title: `${topLocation?.name ?? "Top locations"} Leading Performance`,
      description: `${topLocation?.name ?? "Top venue types"} drive the highest result totals with ${topLocation?.result.toLocaleString() ?? 0} aggregate result score across activations.`,
    },
    {
      id: "2",
      icon: "star" as const,
      title: `${topType?.name ?? "Top type"} Strongest Activation Type`,
      description: `${topType?.name ?? "Leading activation type"} accounts for ${topType?.result.toLocaleString() ?? 0} in total result with ${Math.round(topType?.reach ?? 0).toLocaleString()} reach.`,
    },
    {
      id: "3",
      icon: "trending" as const,
      title: "Reach Building Momentum",
      description: `Total reach of ${formatReach(totalReach)} across ${rows.length.toLocaleString()} activations in the selected period.`,
    },
    {
      id: "4",
      icon: "warning" as const,
      title: "Review Underperforming Segments",
      description: `Location types below average result may benefit from reallocating teams and adjusting activation formats${filters.region.length === 1 ? ` in ${filters.region[0]}` : filters.region.length > 1 ? ` across ${filters.region.length} regions` : ""}.`,
    },
  ];

  return insights;
}

async function fetchProgramMetricsSafe(
  filters: DashboardFilters,
): Promise<Awaited<ReturnType<typeof fetchAllProgramMetrics>>> {
  if (!isSupabaseConfigured()) return [];

  try {
    return await fetchAllProgramMetrics(() => buildQuery(filters));
  } catch (error) {
    console.error("Failed to load program metrics:", error);
    return [];
  }
}

export async function getDashboardData(
  filters: DashboardFilters,
): Promise<DashboardData | null> {
  const [rows, contentTotals, contentRows] = await Promise.all([
    fetchProgramMetricsSafe(filters),
    getContentTotals(filters),
    fetchContentMetricsSafe(filters),
  ]);

  const hasActivations = rows.length > 0;
  const hasContent =
    contentRows.length > 0 ||
    contentTotals.organicImpressions > 0 ||
    contentTotals.paidReach > 0;

  if (!hasActivations && !hasContent) return null;

  const decoded = hasActivations ? rows.map(decodeActivation) : [];
  const settings = await getProgramSettings();
  const applicableTypes = getApplicableTypes(filters.activationType);
  const kpiMetrics = computeKpiMetrics(decoded, settings, applicableTypes);

  const sparkline = [62, 68, 71, 75, 79, 84, 87];

  const kpis = [
    {
      label: "Total Spend",
      value: formatCurrency(kpiMetrics.spend.actual),
      change: 0,
      sparkline,
      actual: kpiMetrics.spend.actual,
      target: 0,
      targetLabel: "",
      status: "above" as const,
      showTarget: false,
      showStatus: false,
    },
    {
      label: "Total Activations",
      value: decoded.length.toLocaleString(),
      change: 0,
      sparkline,
      actual: decoded.length,
      target: 0,
      targetLabel: "",
      status: "above" as const,
      showTarget: false,
      showStatus: false,
    },
    {
      label: "Total Reach (People Engaged)",
      value: formatNumber(kpiMetrics.reach.actual),
      change: 12.4,
      sparkline: sparkline.map((v) => v + 3),
      actual: kpiMetrics.reach.actual,
      target: kpiMetrics.reach.target,
      targetLabel: formatNumber(kpiMetrics.reach.target),
      status: getTargetStatus(
        kpiMetrics.reach.actual,
        kpiMetrics.reach.target,
      ),
    },
    {
      label: "Total Impact (Samples)",
      value: formatNumber(kpiMetrics.impact.actual),
      change: 4.2,
      sparkline: sparkline.map((v) => Math.min(v + 8, 100)),
      actual: kpiMetrics.impact.actual,
      target: kpiMetrics.impact.target,
      targetLabel: formatNumber(kpiMetrics.impact.target),
      status: getTargetStatus(
        kpiMetrics.impact.actual,
        kpiMetrics.impact.target,
      ),
    },
    {
      label: "Total Results (Sales Impact)",
      value: formatCurrency(kpiMetrics.results.actual),
      change: 15.8,
      sparkline,
      actual: kpiMetrics.results.actual,
      target: kpiMetrics.results.target,
      targetLabel: formatCurrency(kpiMetrics.results.target),
      status: getTargetStatus(
        kpiMetrics.results.actual,
        kpiMetrics.results.target,
      ),
    },
    {
      label: "Organic Impressions",
      value: formatReach(contentTotals.organicImpressions),
      change: 0,
      sparkline,
      actual: contentTotals.organicImpressions,
      target: 0,
      targetLabel: "",
      status: "above" as const,
      showTarget: false,
      showStatus: false,
    },
    {
      label: "Paid Reach",
      value: formatReach(contentTotals.paidReach),
      change: 0,
      sparkline,
      actual: contentTotals.paidReach,
      target: 0,
      targetLabel: "",
      status: "above" as const,
      showTarget: false,
      showStatus: false,
    },
    {
      label: "ROI (Sales/Spend)",
      value: `${kpiMetrics.roi.actual.toFixed(1)}%`,
      change: 0,
      sparkline,
      actual: kpiMetrics.roi.actual,
      target: 100,
      targetLabel: "100%",
      status: getTargetStatus(kpiMetrics.roi.actual, 100),
    },
  ];

  const inPerson = decoded.filter((r) => r.channel === "on_premise");
  const digital = decoded.filter((r) => r.channel === "off_premise");

  const targetGauges: TargetGauge[] = [
    ...buildMetricGauges(decoded, settings, applicableTypes),
    ...buildBudgetGauges(decoded, settings, applicableTypes),
  ];

  const startMonth = filters.startDate.getMonth();
  const endMonth = filters.endDate.getMonth();
  const monthsInRange = Math.max(1, endMonth - startMonth + 1);
  const pacingPercent = Math.round((monthsInRange / 12) * 100);

  return {
    kpis,
    byActivationType: {
      monthly: groupMonthly(inPerson.length ? inPerson : decoded),
      breakdown: buildActivationBreakdown(decoded, settings),
    },
    byLocationType: {
      monthly: groupMonthly(digital.length ? digital : decoded),
      breakdown: groupBreakdown(decoded, "location_type"),
    },
    targets: targetGauges,
    pacingPercent,
    insights: generateInsights(decoded, filters),
    totalActivations: decoded.length,
    markets: new Set([
      ...decoded.map((r) => r.market),
      ...contentRows.map((row) => row.market),
    ]).size,
  };
}

/** @deprecated Use getDashboardData */
export async function getDashboardDataFromSupabase(
  filters: DashboardFilters,
): Promise<DashboardData | null> {
  return getDashboardData(filters);
}
