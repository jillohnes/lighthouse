import { format } from "date-fns";
import { decodeActivation, type DecodedActivation } from "@/lib/activation-metrics";
import { formatCurrency, formatNumber, formatReach } from "@/lib/format";
import { getProgramSettings } from "@/lib/queries/settings";
import {
  BUDGET_LABELS,
  BUDGET_MODES,
  METRIC_DISPLAY,
  TARGET_MODES,
  getApplicableTypes,
  getMetricLabel,
  type ActivationType,
  type MetricKey,
  type ProgramSettings,
  type TargetMode,
} from "@/lib/settings";
import { getBudgetStatus, getTargetStatus } from "@/lib/target-status";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { fetchAllProgramMetrics } from "@/lib/queries/fetch-all";
import type { DashboardData, DashboardFilters, TargetGauge } from "@/lib/types";

const GAUGE_GREEN_THRESHOLD = 98;
const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const DEFAULT_TARGETS: Record<string, number> = {
  activations: 15_000,
  reach: 3_500_000,
  impact: 500_000,
  result: 4_500_000,
  markets: 25,
  location_types: 7,
  avg_impact: 28,
};

function buildQuery(filters: DashboardFilters) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("program_metrics")
    .select("*")
    .gte("metric_date", format(filters.startDate, "yyyy-MM-dd"))
    .lte("metric_date", format(filters.endDate, "yyyy-MM-dd"));

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

function getTypeRows(rows: DecodedActivation[], type: ActivationType) {
  return rows.filter((row) => row.activation_type === type);
}

function getMetricTotal(
  typeRows: DecodedActivation[],
  type: ActivationType,
  metric: MetricKey,
) {
  if (METRIC_DISPLAY[type][metric].format === "currency") {
    return typeRows.reduce((sum, row) => sum + row.cost, 0);
  }

  return typeRows.reduce((sum, row) => sum + row[metric], 0);
}

function formatMetricDisplay(
  type: ActivationType,
  metric: MetricKey,
  value: number,
) {
  const format = METRIC_DISPLAY[type][metric].format;

  switch (format) {
    case "number":
      return formatNumber(value);
    case "currency":
      return formatCurrency(value);
    case "compact":
      return metric === "impact" ? value.toFixed(1) : formatReach(value);
  }
}

function compareMetric(
  mode: TargetMode,
  total: number,
  count: number,
  target: number,
) {
  const actual = mode === "per_activation" ? total / count : total;
  const percentOfTarget = target > 0 ? Math.round((actual / target) * 100) : 0;

  return { actual, target, percentOfTarget };
}

function computeSummaryTargets(
  rows: DecodedActivation[],
  settings: ProgramSettings,
  applicableTypes: ActivationType[],
) {
  let reachTarget = 0;
  let resultTarget = 0;

  for (const type of applicableTypes) {
    const typeRows = getTypeRows(rows, type);
    const config = settings.activationTypes[type];
    const mode = TARGET_MODES[type];
    const count = typeRows.length;

    if (mode === "per_activation") {
      reachTarget += config.reach * count;
      resultTarget += config.result * count;
    } else {
      reachTarget += config.reach;
      resultTarget += config.result;
    }
  }

  return { reach: reachTarget, result: resultTarget };
}

function computeImpactSummary(
  rows: DecodedActivation[],
  settings: ProgramSettings,
  applicableTypes: ActivationType[],
) {
  const perActivationTypes = applicableTypes.filter(
    (type) => TARGET_MODES[type] === "per_activation",
  );
  const perActivationRows = rows.filter((row) =>
    perActivationTypes.includes(row.activation_type as ActivationType),
  );

  if (perActivationRows.length > 0) {
    const actual =
      perActivationRows.reduce((sum, row) => sum + row.impact, 0) /
      perActivationRows.length;

    let targetSum = 0;
    let weight = 0;
    for (const type of perActivationTypes) {
      const typeRows = getTypeRows(rows, type);
      if (typeRows.length > 0) {
        targetSum += settings.activationTypes[type].impact * typeRows.length;
        weight += typeRows.length;
      }
    }

    return { actual, target: weight > 0 ? targetSum / weight : 0 };
  }

  const digitalRows = getTypeRows(rows, "Digital Sampling");
  if (
    digitalRows.length > 0 &&
    applicableTypes.includes("Digital Sampling")
  ) {
    return {
      actual: digitalRows.reduce((sum, row) => sum + row.impact, 0),
      target: settings.activationTypes["Digital Sampling"].impact,
    };
  }

  return { actual: 0, target: 0 };
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
    const mode = TARGET_MODES[type];
    const count = typeRows.length;

    for (const metric of ["reach", "impact", "result"] as const) {
      const total = getMetricTotal(typeRows, type, metric);
      const { actual, target, percentOfTarget } = compareMetric(
        mode,
        total,
        count,
        config[metric],
      );

      const label = getMetricLabel(type, metric);

      gauges.push({
        label,
        target: formatMetricDisplay(type, metric, target),
        actual: formatMetricDisplay(type, metric, actual),
        percent: Math.min(100, percentOfTarget),
        percentOfTarget,
        status: getTargetStatus(actual, target, GAUGE_GREEN_THRESHOLD),
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

export async function getDashboardDataFromSupabase(
  filters: DashboardFilters,
): Promise<DashboardData | null> {
  const rows = await fetchAllProgramMetrics(() => buildQuery(filters));

  if (!rows.length) return null;

  const decoded = rows.map(decodeActivation);
  const settings = await getProgramSettings();
  const applicableTypes = getApplicableTypes(filters.activationType);
  const summaryTargets = computeSummaryTargets(decoded, settings, applicableTypes);
  const impactSummary = computeImpactSummary(decoded, settings, applicableTypes);

  const totalReach = decoded.reduce((s, r) => s + r.reach, 0);
  const totalResult = decoded.reduce((s, r) => s + r.result, 0);
  const marketsCount = new Set(decoded.map((r) => r.market)).size;
  const locationTypesCount = new Set(decoded.map((r) => r.location_type)).size;
  const activationTypesCount = new Set(decoded.map((r) => r.activation_type)).size;

  const sparkline = [62, 68, 71, 75, 79, 84, 87];

  const kpis = [
    {
      label: "Total Activations",
      value: decoded.length.toLocaleString(),
      change: 0,
      sparkline,
      actual: decoded.length,
      target: DEFAULT_TARGETS.activations,
      targetLabel: DEFAULT_TARGETS.activations.toLocaleString(),
      status: getTargetStatus(decoded.length, DEFAULT_TARGETS.activations),
    },
    {
      label: "Total Reach",
      value: formatReach(totalReach),
      change: 12.4,
      sparkline: sparkline.map((v) => v + 3),
      actual: totalReach,
      target: summaryTargets.reach,
      targetLabel: formatReach(summaryTargets.reach),
      status: getTargetStatus(totalReach, summaryTargets.reach),
    },
    {
      label: "Avg Impact",
      value: impactSummary.actual.toFixed(1),
      change: 4.2,
      sparkline: sparkline.map((v) => Math.min(v + 8, 100)),
      actual: impactSummary.actual,
      target: impactSummary.target,
      targetLabel: impactSummary.target.toFixed(1),
      status: getTargetStatus(impactSummary.actual, impactSummary.target),
    },
    {
      label: "Total Result",
      value: formatReach(totalResult),
      change: 15.8,
      sparkline,
      actual: totalResult,
      target: summaryTargets.result,
      targetLabel: formatReach(summaryTargets.result),
      status: getTargetStatus(totalResult, summaryTargets.result),
    },
    {
      label: "Markets",
      value: String(marketsCount),
      change: 0,
      sparkline: [5, 6, 6, 7, 7, 8, marketsCount],
      actual: marketsCount,
      target: DEFAULT_TARGETS.markets,
      targetLabel: String(DEFAULT_TARGETS.markets),
      status: getTargetStatus(marketsCount, DEFAULT_TARGETS.markets),
    },
    {
      label: "Location Types",
      value: String(locationTypesCount),
      change: 0,
      sparkline: [4, 5, 5, 6, 6, 7, locationTypesCount],
      actual: locationTypesCount,
      target: DEFAULT_TARGETS.location_types,
      targetLabel: String(DEFAULT_TARGETS.location_types),
      status: getTargetStatus(locationTypesCount, DEFAULT_TARGETS.location_types),
    },
    {
      label: "Activation Types",
      value: String(activationTypesCount),
      change: 0,
      sparkline: [2, 2, 3, 3, 3, 3, activationTypesCount],
      actual: activationTypesCount,
      target: 3,
      targetLabel: "3",
      status: getTargetStatus(activationTypesCount, 3),
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
      breakdown: groupBreakdown(decoded, "activation_type"),
    },
    byLocationType: {
      monthly: groupMonthly(digital.length ? digital : decoded),
      breakdown: groupBreakdown(decoded, "location_type"),
    },
    targets: targetGauges,
    pacingPercent,
    insights: generateInsights(decoded, filters),
    totalActivations: decoded.length,
    markets: marketsCount,
  };
}
