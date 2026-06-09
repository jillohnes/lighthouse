import {
  getContentProgramMonthLabel,
  type ContentMetricRecord,
} from "@/lib/content-metrics";
import { fetchContentRecordsForCharts } from "@/lib/queries/content";
import type {
  BreakdownRow,
  DashboardFilters,
  PerformanceDrilldownData,
  StackedMonthlyPerformance,
} from "@/lib/types";

const MONTH_LABELS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const PROGRAM_MONTHS = MONTH_LABELS.slice(0, 6);

function getChartMonths(filters: DashboardFilters): string[] {
  const start = Math.max(0, Math.min(5, filters.startDate.getMonth()));
  const end = Math.max(0, Math.min(5, filters.endDate.getMonth()));
  return PROGRAM_MONTHS.slice(Math.min(start, end), Math.max(start, end) + 1);
}

function buildImpressionsChart(
  rows: ContentMetricRecord[],
  filters: DashboardFilters,
): PerformanceDrilldownData {
  const chartMonths = new Set(getChartMonths(filters));
  const segmentNames = ["Organic Impressions", "Paid Impressions"];
  const byMonth = new Map<string, { organic: number; paid: number }>();
  const totals = { organic: 0, paid: 0 };

  for (const row of rows) {
    const month = getContentProgramMonthLabel(row.metric_date);
    if (!month || !chartMonths.has(month)) continue;

    const monthData = byMonth.get(month) ?? { organic: 0, paid: 0 };
    monthData.organic += row.organic_impressions;
    monthData.paid += row.paid_impressions;
    byMonth.set(month, monthData);

    totals.organic += row.organic_impressions;
    totals.paid += row.paid_impressions;
  }

  const monthly: StackedMonthlyPerformance[] = getChartMonths(filters).map((month) => {
    const data = byMonth.get(month) ?? { organic: 0, paid: 0 };
    const total = data.organic + data.paid;
    return {
      month,
      line: { reach: total, impact: total, result: 0 },
      segments: {
        "Organic Impressions": { reach: data.organic, impact: 0, result: 0 },
        "Paid Impressions": { reach: data.paid, impact: 0, result: 0 },
      },
    };
  });

  const breakdown: BreakdownRow[] = segmentNames.map((name) => {
    const value = name === "Organic Impressions" ? totals.organic : totals.paid;
    return {
      name,
      reach: value,
      impact: 0,
      result: value,
      change: 0,
    };
  });

  const totalImpressions = totals.organic + totals.paid;
  const organicShare =
    totalImpressions > 0 ? Math.round((totals.organic / totalImpressions) * 100) : 0;
  const takeaway =
    totalImpressions > 0
      ? `Organic impressions account for ${organicShare}% of total impressions (${totals.organic.toLocaleString()} organic vs ${totals.paid.toLocaleString()} paid) across the selected period.`
      : "No impression data is available for the selected filters.";

  return { monthly, breakdown, takeaway };
}

const FALLBACK_CPM = 10;
const SEGMENT_EMV = "Total EMV";
const SEGMENT_EFFICIENCY = "Total Media Efficiency";

function buildEmvEfficiencyChart(
  rows: ContentMetricRecord[],
  filters: DashboardFilters,
): PerformanceDrilldownData {
  const chartMonths = new Set(getChartMonths(filters));
  const byMonth = new Map<
    string,
    {
      organicImpressions: number;
      paidBoost: number;
      paidImpressions: number;
      mediaEfficiency: number;
    }
  >();
  const totals = {
    organicEmv: 0,
    mediaEfficiency: 0,
  };

  for (const row of rows) {
    const month = getContentProgramMonthLabel(row.metric_date);
    if (!month || !chartMonths.has(month)) continue;

    const monthData = byMonth.get(month) ?? {
      organicImpressions: 0,
      paidBoost: 0,
      paidImpressions: 0,
      mediaEfficiency: 0,
    };
    monthData.organicImpressions += row.organic_impressions;
    monthData.paidBoost += row.paid_boosting_total;
    monthData.paidImpressions += row.paid_impressions;

    if (row.cpc_results > 0 && row.cpc_benchmark > 0 && row.total_clicks > 0) {
      monthData.mediaEfficiency +=
        (row.cpc_benchmark - row.cpc_results) * row.total_clicks;
    }

    byMonth.set(month, monthData);
  }

  const months = getChartMonths(filters);
  const monthly: StackedMonthlyPerformance[] = months.map((month) => {
    const data = byMonth.get(month) ?? {
      organicImpressions: 0,
      paidBoost: 0,
      paidImpressions: 0,
      mediaEfficiency: 0,
    };
    const cpm =
      data.paidImpressions > 0
        ? (data.paidBoost / data.paidImpressions) * 1000
        : FALLBACK_CPM;
    const organicEmv = (data.organicImpressions * cpm) / 1000;
    const mediaEfficiency = data.mediaEfficiency;
    const total = organicEmv + mediaEfficiency;

    totals.organicEmv += organicEmv;
    totals.mediaEfficiency += mediaEfficiency;

    return {
      month,
      line: { reach: total, impact: total, result: total },
      segments: {
        [SEGMENT_EMV]: { reach: organicEmv, impact: organicEmv, result: organicEmv },
        [SEGMENT_EFFICIENCY]: {
          reach: mediaEfficiency,
          impact: mediaEfficiency,
          result: mediaEfficiency,
        },
      },
    };
  });

  const breakdown: BreakdownRow[] = [
    {
      name: SEGMENT_EMV,
      reach: totals.organicEmv,
      impact: totals.organicEmv,
      result: totals.organicEmv,
      change: 0,
    },
    {
      name: SEGMENT_EFFICIENCY,
      reach: totals.mediaEfficiency,
      impact: totals.mediaEfficiency,
      result: totals.mediaEfficiency,
      change: 0,
    },
  ];

  const totalValue = totals.organicEmv + totals.mediaEfficiency;
  const emvShare =
    totalValue > 0 ? Math.round((totals.organicEmv / totalValue) * 100) : 0;
  const takeaway =
    totalValue > 0
      ? `Total EMV accounts for ${emvShare}% of combined value (${Math.round(totals.organicEmv).toLocaleString()} EMV vs ${Math.round(totals.mediaEfficiency).toLocaleString()} media efficiency) across the selected period.`
      : "No EMV or media efficiency data is available for the selected filters.";

  return { monthly, breakdown, takeaway };
}

export async function getContentChartData(
  filters: DashboardFilters,
): Promise<{
  impressionsByMonth: PerformanceDrilldownData;
  contentByMonth: PerformanceDrilldownData;
}> {
  const rows = await fetchContentRecordsForCharts(filters);

  return {
    impressionsByMonth: buildImpressionsChart(rows, filters),
    contentByMonth: buildEmvEfficiencyChart(rows, filters),
  };
}
