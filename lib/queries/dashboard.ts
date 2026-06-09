import {
  decodeActivation,
  loadActivationRowsForDashboard,
  loadFilteredActivationsAsProgramRows,
  type DecodedActivation,
} from "@/lib/activation-metrics";
import { formatDateParam, normalizeLocalDate, parseDateParam } from "@/lib/dates";
import { formatCurrency, formatNumber, formatReach } from "@/lib/format";
import {
  buildActivationBreakdown,
  buildLocationBreakdown,
  compareTypeMetric,
  computeKpiMetrics,
  computeOptInMetrics,
  formatMetricDisplay,
  getTypeRows,
} from "@/lib/metric-comparison";
import { getProgramSettings } from "@/lib/queries/settings";
import {
  ACTIVATION_TYPES,
  getApplicableTypes,
  type ActivationType,
  type ProgramSettings,
} from "@/lib/settings";
import {
  getBudgetStatus,
  getTargetStatus,
  TARGET_GREEN_THRESHOLD,
} from "@/lib/target-status";
import { prorateCampaignTarget } from "@/lib/campaign";
import {
  CONTENT_BRAND,
  type ContentMetricRecord,
} from "@/lib/content-metrics";
import {
  fetchContentMetricsSafe,
  fetchContentRecordsForCharts,
  getContentTotals,
  type ContentTotals,
} from "@/lib/queries/content";
import { getSupabaseAdmin, isSupabaseConfigured } from "@/lib/supabase/server";
import { fetchAllProgramMetrics } from "@/lib/queries/fetch-all";
import { generateChartTakeaway } from "@/lib/chart-takeaway";
import { getContentChartData } from "@/lib/queries/content-charts";
import { FALLBACK_CPM } from "@/lib/queries/content-performance";
import { buildKpiTileLayout } from "@/lib/queries/kpi-tiles";
import {
  buildAllMarkets,
  getTopAmbassadors,
} from "@/lib/queries/rankings";
import { applyProgramMetricFilters } from "@/lib/query-filters";
import type {
  DashboardData,
  DashboardFilters,
  KpiMetric,
  PerformanceDrilldownData,
  StackedMonthlyPerformance,
  TargetGauge,
} from "@/lib/types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const PROGRAM_MONTHS = MONTH_LABELS.slice(0, 6);
const MONTH_ORDER = Object.fromEntries(
  MONTH_LABELS.map((month, index) => [month, index]),
);

function getChartMonths(filters: DashboardFilters): string[] {
  const start = Math.max(0, Math.min(5, filters.startDate.getMonth()));
  const end = Math.max(0, Math.min(5, filters.endDate.getMonth()));
  return PROGRAM_MONTHS.slice(Math.min(start, end), Math.max(start, end) + 1);
}

function emptyMonthData(categories: string[]) {
  return {
    line: { reach: 0, impact: 0, result: 0 },
    segments: Object.fromEntries(
      categories.map((name) => [name, { reach: 0, impact: 0, result: 0 }]),
    ),
  };
}

function buildQuery(filters: DashboardFilters) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("program_metrics")
    .select("*")
    .neq("brand", CONTENT_BRAND);

  return applyProgramMetricFilters(query, filters);
}

const PACING_METRIC_LABELS = {
  reach: "Reach",
  impact: "Impact",
  result: "Results",
} as const;

function buildMetricGauges(
  rows: DecodedActivation[],
  settings: ProgramSettings,
): TargetGauge[] {
  const gauges: TargetGauge[] = [];

  for (const type of ACTIVATION_TYPES) {
    const typeRows = getTypeRows(rows, type);
    const config = settings.activationTypes[type];

    for (const metric of ["reach", "impact", "result"] as const) {
      const comparison = compareTypeMetric(
        typeRows,
        type,
        metric,
        config[metric],
      );

      gauges.push({
        label: PACING_METRIC_LABELS[metric],
        target: formatMetricDisplay(type, metric, comparison.target),
        actual: formatMetricDisplay(type, metric, comparison.actual),
        percent: Math.min(100, comparison.percentOfTarget),
        percentOfTarget: comparison.percentOfTarget,
        status: getTargetStatus(
          comparison.actual,
          comparison.target,
          TARGET_GREEN_THRESHOLD,
        ),
        change: 0,
        activationType: type,
        metricKey: metric,
      });
    }
  }

  return gauges;
}

function groupMonthlyStacked(
  rows: DecodedActivation[],
  groupField: "activation_type" | "location_type",
  categories: string[],
  filters: DashboardFilters,
): StackedMonthlyPerformance[] {
  const chartMonths = new Set(getChartMonths(filters));
  const byMonth = new Map<
    string,
    {
      line: { reach: number; impact: number; result: number };
      segments: Record<string, { reach: number; impact: number; result: number }>;
    }
  >();

  const rangeStart = normalizeLocalDate(filters.startDate);
  const rangeEnd = normalizeLocalDate(filters.endDate);

  for (const row of rows) {
    const date = parseDateParam(row.metric_date);
    const monthIndex = date.getMonth();

    if (monthIndex < 0 || monthIndex > 5) continue;
    if (date < rangeStart || date > rangeEnd) continue;

    const month = MONTH_LABELS[monthIndex];
    if (!chartMonths.has(month)) continue;

    const category = row[groupField];
    const monthData = byMonth.get(month) ?? emptyMonthData(categories);

    monthData.line.reach += row.reach;
    monthData.line.impact += row.impact;
    monthData.line.result += row.result;

    if (!monthData.segments[category]) {
      monthData.segments[category] = { reach: 0, impact: 0, result: 0 };
    }

    monthData.segments[category].reach += row.reach;
    monthData.segments[category].impact += row.impact;
    monthData.segments[category].result += row.result;
    byMonth.set(month, monthData);
  }

  return getChartMonths(filters).map((month) => {
    const data = byMonth.get(month) ?? emptyMonthData(categories);
    return {
      month,
      line: {
        reach: Math.round(data.line.reach),
        impact: Math.round(data.line.impact),
        result: Math.round(data.line.result),
      },
      segments: Object.fromEntries(
        Object.entries(data.segments).map(([name, values]) => [
          name,
          {
            reach: Math.round(values.reach),
            impact: Math.round(values.impact),
            result: Math.round(values.result),
          },
        ]),
      ),
    };
  });
}

function buildDrilldownData(
  rows: DecodedActivation[],
  groupField: "activation_type" | "location_type",
  breakdown: ReturnType<typeof groupBreakdown>,
  dimension: "activation" | "location",
  filters: DashboardFilters,
) {
  const categories = breakdown.map((row) => row.name);
  return {
    monthly: groupMonthlyStacked(rows, groupField, categories, filters),
    breakdown,
    takeaway: generateChartTakeaway(breakdown, dimension),
  };
}

export function buildPerformanceDrilldown(
  rows: DecodedActivation[],
  groupField: "activation_type" | "location_type",
  breakdown: ReturnType<typeof groupBreakdown>,
  dimension: "activation" | "location",
  filters: DashboardFilters,
): PerformanceDrilldownData {
  return buildDrilldownData(rows, groupField, breakdown, dimension, filters);
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

const ENG_RATE_TARGET = 0.03;

function formatRatePercent(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

function formatUnitCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatSignedCurrency(value: number): string {
  if (value < 0) return `-${formatCurrency(Math.abs(value))}`;
  return formatCurrency(value);
}

export function computeContentPerformanceMetrics(
  contentRows: ContentMetricRecord[],
  contentTotals: ContentTotals,
) {
  let stories = 0;
  let reels = 0;
  let engagementSum = 0;
  let engagementCount = 0;
  let ctrResultsSum = 0;
  let ctrBenchmarkSum = 0;
  let ctrCount = 0;
  let cpcResultsSum = 0;
  let cpcBenchmarkSum = 0;
  let cpcCount = 0;
  let paidBoostTotal = 0;
  let paidImpressionsTotal = 0;
  let totalClicks = 0;
  let mediaEfficiency = 0;
  let hasRowLevelEfficiency = false;

  for (const row of contentRows) {
    stories += row.stories_per_month;
    reels += row.reels_per_month;
    paidBoostTotal += row.paid_boosting_total;
    paidImpressionsTotal += row.paid_impressions;
    totalClicks += row.total_clicks;

    if (row.cpc_results > 0 && row.cpc_benchmark > 0 && row.total_clicks > 0) {
      mediaEfficiency +=
        (row.cpc_benchmark - row.cpc_results) * row.total_clicks;
      hasRowLevelEfficiency = true;
    }

    if (row.avg_eng_rate > 0) {
      engagementSum += row.avg_eng_rate;
      engagementCount += 1;
    }
    if (row.ctr_results > 0 && row.ctr_benchmark > 0) {
      ctrResultsSum += row.ctr_results;
      ctrBenchmarkSum += row.ctr_benchmark;
      ctrCount += 1;
    }
    if (row.cpc_results > 0 && row.cpc_benchmark > 0) {
      cpcResultsSum += row.cpc_results;
      cpcBenchmarkSum += row.cpc_benchmark;
      cpcCount += 1;
    }
  }

  const avgEngagement =
    engagementCount > 0 ? engagementSum / engagementCount : 0;
  const avgCtr = ctrCount > 0 ? ctrResultsSum / ctrCount : 0;
  const avgCtrBenchmark = ctrCount > 0 ? ctrBenchmarkSum / ctrCount : 0;
  const avgCpc = cpcCount > 0 ? cpcResultsSum / cpcCount : 0;
  const avgCpcBenchmark = cpcCount > 0 ? cpcBenchmarkSum / cpcCount : 0;

  if (!hasRowLevelEfficiency && totalClicks > 0 && cpcCount > 0) {
    mediaEfficiency = (avgCpcBenchmark - avgCpc) * totalClicks;
  }

  const cpm =
    paidImpressionsTotal > 0
      ? (paidBoostTotal / paidImpressionsTotal) * 1000
      : FALLBACK_CPM;
  const organicEmv = (contentTotals.organicImpressions * cpm) / 1000;

  return {
    stories,
    reels,
    avgEngagement,
    avgCtr,
    avgCtrBenchmark,
    avgCpc,
    avgCpcBenchmark,
    paidBoostTotal,
    organicEmv,
    mediaEfficiency,
  };
}

function buildSecondaryKpis(
  contentRows: ContentMetricRecord[],
  contentTotals: ContentTotals,
  settings: ProgramSettings,
  filters: DashboardFilters,
): KpiMetric[] {
  const sparkline = [62, 68, 71, 75, 79, 84, 87];
  const neutral = (
    label: string,
    value: string,
    actual: number,
    icons?: KpiMetric["icons"],
  ): KpiMetric => ({
    label,
    value,
    change: 0,
    sparkline,
    actual,
    target: 0,
    targetLabel: "",
    status: "above",
    showTarget: false,
    showStatus: false,
    icons,
  });

  const metrics = computeContentPerformanceMetrics(contentRows, contentTotals);
  const organicEmvTarget = prorateCampaignTarget(
    settings.content.organicEmv,
    filters,
  );

  return [
    neutral(
      "Number of Stories",
      formatNumber(metrics.stories),
      metrics.stories,
      ["instagram"],
    ),
    neutral(
      "Number of Reels",
      formatNumber(metrics.reels),
      metrics.reels,
      ["instagram", "tiktok"],
    ),
    {
      label: "Avg Eng Rate",
      value: formatRatePercent(metrics.avgEngagement),
      change: 0,
      sparkline,
      actual: metrics.avgEngagement,
      target: ENG_RATE_TARGET,
      targetLabel: formatRatePercent(ENG_RATE_TARGET),
      status: getTargetStatus(metrics.avgEngagement, ENG_RATE_TARGET),
      comparisonLabel: "Target",
    },
    neutral(
      "Organic Impressions",
      formatReach(contentTotals.organicImpressions),
      contentTotals.organicImpressions,
    ),
    {
      label: "Organic Earned Media Value (EMV)",
      value: formatCurrency(metrics.organicEmv),
      change: 0,
      sparkline,
      actual: metrics.organicEmv,
      target: organicEmvTarget,
      targetLabel: formatCurrency(organicEmvTarget),
      status: getTargetStatus(metrics.organicEmv, organicEmvTarget),
      comparisonLabel: "Target",
    },
    neutral(
      "Paid Impressions",
      formatReach(contentTotals.paidReach),
      contentTotals.paidReach,
    ),
    {
      label: "Avg CTR %",
      value: formatRatePercent(metrics.avgCtr, 2),
      change: 0,
      sparkline,
      actual: metrics.avgCtr,
      target: metrics.avgCtrBenchmark,
      targetLabel: formatRatePercent(metrics.avgCtrBenchmark, 2),
      status: getTargetStatus(metrics.avgCtr, metrics.avgCtrBenchmark),
      comparisonLabel: "Benchmark",
    },
    {
      label: "Avg CPC $",
      value: formatUnitCurrency(metrics.avgCpc),
      change: 0,
      sparkline,
      actual: metrics.avgCpc,
      target: metrics.avgCpcBenchmark,
      targetLabel: formatUnitCurrency(metrics.avgCpcBenchmark),
      status: getBudgetStatus(metrics.avgCpc, metrics.avgCpcBenchmark),
      comparisonLabel: "Benchmark",
    },
    {
      label: "Total Media Efficiency",
      value: formatSignedCurrency(metrics.mediaEfficiency),
      change: 0,
      sparkline,
      actual: metrics.mediaEfficiency,
      target: 0,
      targetLabel: "",
      status: "above",
      showTarget: false,
      showStatus: false,
      valueTone: metrics.mediaEfficiency >= 0 ? "positive" : "negative",
    },
  ];
}

async function fetchProgramMetricsSafe(
  filters: DashboardFilters,
): Promise<Awaited<ReturnType<typeof fetchAllProgramMetrics>>> {
  const excelRows = await loadFilteredActivationsAsProgramRows(filters);
  if (excelRows.length > 0) return excelRows;

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
  const [rows, contentTotals, contentRows, contentRecords, topAmbassadors, contentCharts] =
    await Promise.all([
      fetchProgramMetricsSafe(filters),
      getContentTotals(filters),
      fetchContentMetricsSafe(filters),
      fetchContentRecordsForCharts(filters),
      getTopAmbassadors(filters),
      getContentChartData(filters),
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
  const kpiMetrics = computeKpiMetrics(
    decoded,
    settings,
    applicableTypes,
    filters,
  );
  const contentPerformance = computeContentPerformanceMetrics(
    contentRecords,
    contentTotals,
  );
  const roiNumerator =
    kpiMetrics.results.actual +
    contentPerformance.organicEmv +
    contentPerformance.mediaEfficiency;
  const roiActual =
    kpiMetrics.spend.actual > 0
      ? (roiNumerator / kpiMetrics.spend.actual) * 100
      : 0;
  const optIns = computeOptInMetrics(
    decoded,
    settings.activationTypes["Digital Sampling"].emailOptInValue,
  );

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
      label: "ROI (Sales/Spend)",
      value: `${roiActual.toFixed(1)}%`,
      change: 0,
      sparkline,
      actual: roiActual,
      target: kpiMetrics.roi.target,
      targetLabel: `${kpiMetrics.roi.target.toFixed(1)}%`,
      status: getTargetStatus(roiActual, kpiMetrics.roi.target),
    },
    {
      label: "Number of Opt Ins",
      value: formatNumber(optIns.count),
      change: 0,
      sparkline,
      actual: optIns.count,
      target: 0,
      targetLabel: "",
      status: "above" as const,
      showTarget: false,
      showStatus: false,
    },
    {
      label: "Opt In Value",
      value: formatCurrency(optIns.value),
      change: 0,
      sparkline,
      actual: optIns.value,
      target: 0,
      targetLabel: "",
      status: "above" as const,
      showTarget: false,
      showStatus: false,
    },
  ];

  const activationBreakdown = buildActivationBreakdown(decoded, settings);
  const locationBreakdown = buildLocationBreakdown(decoded, settings);

  const targetGauges = buildMetricGauges(decoded, settings);

  const startMonth = filters.startDate.getMonth();
  const endMonth = filters.endDate.getMonth();
  const monthsInRange = Math.max(1, endMonth - startMonth + 1);
  const pacingPercent = Math.round((monthsInRange / 12) * 100);
  const secondaryKpis = buildSecondaryKpis(
    contentRecords,
    contentTotals,
    settings,
    filters,
  );
  const excelRecords = loadActivationRowsForDashboard(filters);
  const kpiTileLayout = buildKpiTileLayout(
    decoded,
    excelRecords,
    contentTotals,
    contentPerformance,
    settings,
    applicableTypes,
    filters,
  );

  return {
    kpiTileLayout,
    kpis,
    secondaryKpis,
    byActivationType: buildDrilldownData(
      decoded,
      "activation_type",
      activationBreakdown,
      "activation",
      filters,
    ),
    byLocationType: buildDrilldownData(
      decoded,
      "location_type",
      locationBreakdown,
      "location",
      filters,
    ),
    impressionsByMonth: contentCharts.impressionsByMonth,
    contentByMonth: contentCharts.contentByMonth,
    mapMarkets: buildAllMarkets(
      decoded,
      settings,
      applicableTypes,
      filters,
      contentRecords,
    ),
    topAmbassadors,
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
