import {
  filterActivationMetrics,
  loadActivationExcelRecords,
  type ActivationExcelRecord,
} from "@/lib/activation-metrics";
import {
  buildBrandMarketCorrelations,
  buildSyntheticDepletionCases,
} from "@/lib/business-impact-synthetic";
import {
  getContentProgramMonthLabel,
  loadContentRowsForCharts,
  type ContentMetricRecord,
} from "@/lib/content-metrics";
import { normalizeLocalDate, parseDateParam } from "@/lib/dates";
import { fetchContentRecordsForCharts } from "@/lib/queries/content";
import type {
  BusinessImpactData,
  BusinessImpactMonthlyPoint,
  DashboardFilters,
} from "@/lib/types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
const PROGRAM_MONTHS = MONTH_LABELS;

function getChartMonths(filters: DashboardFilters): string[] {
  const start = Math.max(0, Math.min(5, filters.startDate.getMonth()));
  const end = Math.max(0, Math.min(5, filters.endDate.getMonth()));
  return PROGRAM_MONTHS.slice(Math.min(start, end), Math.max(start, end) + 1);
}

function filterContentRows(
  rows: ContentMetricRecord[],
  filters: DashboardFilters,
): ContentMetricRecord[] {
  const excelRows = loadContentRowsForCharts(filters);
  return excelRows.length ? excelRows : rows;
}

async function loadActivations(
  filters: DashboardFilters,
): Promise<ActivationExcelRecord[]> {
  const rows = loadActivationExcelRecords();
  return filterActivationMetrics(rows, filters);
}

function activationMonth(record: ActivationExcelRecord): string | null {
  const date = parseDateParam(record.metric_date);
  const monthIndex = date.getMonth();
  if (monthIndex < 0 || monthIndex > 5) return null;
  return MONTH_LABELS[monthIndex] ?? null;
}

function buildMonthlyActivity(
  activations: ActivationExcelRecord[],
  contentRows: ContentMetricRecord[],
  filters: DashboardFilters,
): BusinessImpactMonthlyPoint[] {
  const chartMonths = new Set(getChartMonths(filters));
  const rangeStart = normalizeLocalDate(filters.startDate);
  const rangeEnd = normalizeLocalDate(filters.endDate);
  const brandLabel =
    filters.brand !== "All Brands" ? filters.brand : "All Brands";

  const byMonth = new Map<
    string,
    {
      hctSampling: number;
      brandLedSampling: number;
      digitalSampling: number;
      organicImpressions: number;
      paidImpressions: number;
    }
  >();

  for (const row of activations) {
    const date = parseDateParam(row.metric_date);
    if (date < rangeStart || date > rangeEnd) continue;

    const month = activationMonth(row);
    if (!month || !chartMonths.has(month)) continue;

    const monthData = byMonth.get(month) ?? {
      hctSampling: 0,
      brandLedSampling: 0,
      digitalSampling: 0,
      organicImpressions: 0,
      paidImpressions: 0,
    };

    if (row.activation_type === "HCT") {
      monthData.hctSampling += row.impact;
    } else if (row.activation_type === "Brand Experience") {
      monthData.brandLedSampling += row.impact;
    } else if (row.activation_type === "Digital Sampling") {
      monthData.digitalSampling += row.impact;
    }

    byMonth.set(month, monthData);
  }

  for (const row of contentRows) {
    const month = getContentProgramMonthLabel(row.metric_date);
    if (!month || !chartMonths.has(month)) continue;

    const monthData = byMonth.get(month) ?? {
      hctSampling: 0,
      brandLedSampling: 0,
      digitalSampling: 0,
      organicImpressions: 0,
      paidImpressions: 0,
    };

    monthData.organicImpressions += row.organic_impressions;
    monthData.paidImpressions += row.paid_impressions;
    byMonth.set(month, monthData);
  }

  return getChartMonths(filters).map((month) => {
    const data = byMonth.get(month) ?? {
      hctSampling: 0,
      brandLedSampling: 0,
      digitalSampling: 0,
      organicImpressions: 0,
      paidImpressions: 0,
    };

    const activityTotal =
      data.hctSampling +
      data.brandLedSampling +
      data.digitalSampling +
      Math.round(data.organicImpressions / 1000) +
      Math.round(data.paidImpressions / 1000);

    return {
      month,
      hctSampling: Math.round(data.hctSampling),
      brandLedSampling: Math.round(data.brandLedSampling),
      digitalSampling: Math.round(data.digitalSampling),
      organicImpressions: Math.round(data.organicImpressions),
      paidImpressions: Math.round(data.paidImpressions),
      depletionCases: buildSyntheticDepletionCases(brandLabel, month, activityTotal),
    };
  });
}

function buildTakeaway(
  monthly: BusinessImpactMonthlyPoint[],
  brand: string,
): string {
  if (!monthly.length) {
    return "No activity data is available for the selected filters.";
  }

  const totals = monthly.reduce(
    (acc, row) => ({
      hct: acc.hct + row.hctSampling,
      brandLed: acc.brandLed + row.brandLedSampling,
      digital: acc.digital + row.digitalSampling,
      organic: acc.organic + row.organicImpressions,
      paid: acc.paid + row.paidImpressions,
      depletion: acc.depletion + row.depletionCases,
    }),
    { hct: 0, brandLed: 0, digital: 0, organic: 0, paid: 0, depletion: 0 },
  );

  const peak = [...monthly].sort(
    (a, b) => b.depletionCases - a.depletionCases,
  )[0];

  const brandLabel = brand !== "All Brands" ? brand : "the portfolio";
  return `For ${brandLabel}, HCT (${totals.hct.toLocaleString()}), brand-led (${totals.brandLed.toLocaleString()}), and digital (${totals.digital.toLocaleString()}) sampling combined with ${totals.organic.toLocaleString()} organic and ${totals.paid.toLocaleString()} paid impressions track against ${totals.depletion.toLocaleString()} modeled depletion cases — peak depletion in ${peak?.month ?? "—"}.`;
}

export async function getBusinessImpactData(
  filters: DashboardFilters,
): Promise<BusinessImpactData | null> {
  const activations = await loadActivations(filters);
  const contentFromApi = await fetchContentRecordsForCharts(filters);
  const contentRows = filterContentRows(contentFromApi, filters);

  if (!activations.length && !contentRows.length) return null;

  const monthlyActivity = buildMonthlyActivity(
    activations,
    contentRows,
    filters,
  );
  const correlations = buildBrandMarketCorrelations(
    activations,
    contentRows,
    filters.brand,
  );

  return {
    selectedBrand: filters.brand,
    monthlyActivity,
    takeaway: buildTakeaway(monthlyActivity, filters.brand),
    correlations,
    strongCorrelations: correlations.filter((row) => row.correlationScore >= 65),
    weakCorrelations: correlations.filter((row) => row.correlationScore < 35),
  };
}
