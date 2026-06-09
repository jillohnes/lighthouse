import type {
  ActivationExcelRecord,
  DecodedActivation,
} from "@/lib/activation-metrics";
import { summarizeActivationTypeFromExcel } from "@/lib/activation-metrics";
import { prorateCampaignTarget } from "@/lib/campaign";
import { formatCurrency, formatNumber, formatReach } from "@/lib/format";
import {
  computeActivationTypeSummary,
  computeKpiMetrics,
  computeOptInMetrics,
  getTypeRows,
} from "@/lib/metric-comparison";
import type { ContentTotals } from "@/lib/queries/content";
import type { computeContentPerformanceMetrics } from "@/lib/queries/dashboard";
import type { ActivationType, ProgramSettings } from "@/lib/settings";
import { getTargetStatus, getBudgetStatus } from "@/lib/target-status";
import type { DashboardFilters, KpiMetric, KpiTileLayout } from "@/lib/types";

const ENG_RATE_TARGET = 0.03;
const ROAS_TARGET = 100;
const SPARKLINE = [62, 68, 71, 75, 79, 84, 87];

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

function neutral(
  label: string,
  value: string,
  actual: number,
): KpiMetric {
  return {
    label,
    value,
    change: 0,
    sparkline: SPARKLINE,
    actual,
    target: 0,
    targetLabel: "",
    status: "above",
    showTarget: false,
    showStatus: false,
  };
}

function metricTile(
  label: string,
  actual: number,
  target: number,
  formatValue: (value: number) => string,
): KpiMetric {
  return {
    label,
    value: formatValue(actual),
    change: 0,
    sparkline: SPARKLINE,
    actual,
    target,
    targetLabel: formatValue(target),
    status: getTargetStatus(actual, target),
  };
}

function roiTile(
  label: string,
  actual: number,
  target: number,
  spendLines?: { label: string; value: string }[],
): KpiMetric {
  return {
    label,
    value: `${actual.toFixed(1)}%`,
    change: 0,
    sparkline: SPARKLINE,
    actual,
    target,
    targetLabel: `${target.toFixed(1)}%`,
    status: getTargetStatus(actual, target),
    spendLines,
  };
}

type ContentPerformance = ReturnType<typeof computeContentPerformanceMetrics>;

export function buildKpiTileLayout(
  decoded: DecodedActivation[],
  excelRecords: ActivationExcelRecord[],
  contentTotals: ContentTotals,
  contentPerformance: ContentPerformance,
  settings: ProgramSettings,
  applicableTypes: ActivationType[],
  filters: DashboardFilters,
): KpiTileLayout {
  const kpiMetrics = computeKpiMetrics(
    decoded,
    settings,
    applicableTypes,
    filters,
  );
  const dsConfig = settings.activationTypes["Digital Sampling"];
  const optIns = computeOptInMetrics(decoded, dsConfig.emailOptInValue);
  const emailOptInValueTarget = dsConfig.emailOptIns * dsConfig.emailOptInValue;
  const hct = computeActivationTypeSummary(decoded, "HCT");
  const brandExperience = computeActivationTypeSummary(
    decoded,
    "Brand Experience",
  );
  const digitalSampling = computeActivationTypeSummary(
    decoded,
    "Digital Sampling",
  );

  const ttlRoiNumerator =
    kpiMetrics.results.actual +
    contentPerformance.organicEmv +
    contentPerformance.mediaEfficiency;
  const ttlRoi =
    kpiMetrics.spend.actual > 0
      ? (ttlRoiNumerator / kpiMetrics.spend.actual) * 100
      : 0;

  const contentBudget = contentPerformance.paidBoostTotal;
  const contentValue =
    contentPerformance.organicEmv + contentPerformance.mediaEfficiency;
  const contentRoi =
    contentBudget > 0 ? (contentValue / contentBudget) * 100 : 0;

  const organicEmvTarget = prorateCampaignTarget(
    settings.content.organicEmv,
    filters,
  );

  const hctFromExcel = summarizeActivationTypeFromExcel(excelRecords, "HCT");
  const beFromExcel = summarizeActivationTypeFromExcel(
    excelRecords,
    "Brand Experience",
  );
  const dsFromExcel = summarizeActivationTypeFromExcel(
    excelRecords,
    "Digital Sampling",
  );
  const useExcelMetrics = excelRecords.length > 0;

  const hctRows = getTypeRows(decoded, "HCT");
  const hctActivationCount = useExcelMetrics
    ? hctFromExcel.count
    : hctRows.length;
  const hctReach = useExcelMetrics ? hctFromExcel.reach : hct.reach;
  const hctImpact = useExcelMetrics ? hctFromExcel.impact : hct.impact;
  const hctSales = useExcelMetrics ? hctFromExcel.sales : hct.sales;
  const beReach = useExcelMetrics ? beFromExcel.reach : brandExperience.reach;
  const beImpact = useExcelMetrics ? beFromExcel.impact : brandExperience.impact;
  const beSales = useExcelMetrics ? beFromExcel.sales : brandExperience.sales;
  const dsReach = useExcelMetrics ? dsFromExcel.reach : digitalSampling.reach;
  const dsImpact = useExcelMetrics ? dsFromExcel.impact : digitalSampling.impact;
  const dsSales = useExcelMetrics ? dsFromExcel.sales : digitalSampling.sales;

  const hctConfig = settings.activationTypes.HCT;
  const hctEngagementsTarget = hctConfig.reach * hctActivationCount;
  const hctSamplesTarget = hctConfig.impact * hctActivationCount;
  const hctSalesTarget = hctConfig.result * hctActivationCount;
  const beConfig = settings.activationTypes["Brand Experience"];
  const beActivationCount = useExcelMetrics
    ? beFromExcel.count
    : getTypeRows(decoded, "Brand Experience").length;
  const beEngagementsTarget = beConfig.reach * beActivationCount;
  const beSamplesTarget = beConfig.impact * beActivationCount;
  const beSalesTarget = beConfig.result * beActivationCount;
  const dsScansTarget = dsConfig.reach;
  const dsRedemptionsTarget = dsConfig.impact;
  const dsSalesTarget = dsConfig.result;
  const dsRoasNumerator = dsSales + optIns.value;
  const dsRoas =
    digitalSampling.spend > 0
      ? (dsRoasNumerator / digitalSampling.spend) * 100
      : 0;

  const hctOnPremiseBudget = hct.spend;
  const hctRoasNumerator =
    hctSales +
    contentPerformance.organicEmv +
    contentPerformance.mediaEfficiency;
  const hctRoasDenominator = hctOnPremiseBudget + contentBudget;
  const hctRoas =
    hctRoasDenominator > 0
      ? (hctRoasNumerator / hctRoasDenominator) * 100
      : 0;

  return {
    summary: {
      ttlRoi: roiTile("TTL Program ROAS", ttlRoi, ROAS_TARGET, [
        {
          label: "Total Program Spend",
          value: formatCurrency(kpiMetrics.spend.actual),
        },
      ]),
      samplingRoi: roiTile("Total Sampling ROAS", dsRoas, ROAS_TARGET),
      contentRoi: roiTile("Content ROAS", contentRoi, ROAS_TARGET),
    },
    hct: {
      roi: roiTile("TTL HCT ROAS", hctRoas, ROAS_TARGET, [
        {
          label: "On Premise Spend",
          value: formatCurrency(hctOnPremiseBudget),
        },
        {
          label: "Content Spend",
          value: formatCurrency(contentBudget),
        },
      ]),
      totalEngagements: metricTile(
        "Total Engagements",
        hctReach,
        hctEngagementsTarget,
        formatNumber,
      ),
      totalSamples: metricTile(
        "Total Samples",
        hctImpact,
        hctSamplesTarget,
        formatNumber,
      ),
      rateOfSale: metricTile(
        "Rate of Sale",
        hctSales,
        hctSalesTarget,
        formatCurrency,
      ),
      organicImpressions: neutral(
        "Organic Impressions",
        formatReach(contentTotals.organicImpressions),
        contentTotals.organicImpressions,
      ),
      paidImpressions: neutral(
        "Paid Impressions",
        formatReach(contentTotals.paidReach),
        contentTotals.paidReach,
      ),
      engRate: {
        label: "Eng Rate",
        value: formatRatePercent(contentPerformance.avgEngagement),
        change: 0,
        sparkline: SPARKLINE,
        actual: contentPerformance.avgEngagement,
        target: ENG_RATE_TARGET,
        targetLabel: formatRatePercent(ENG_RATE_TARGET),
        status: getTargetStatus(
          contentPerformance.avgEngagement,
          ENG_RATE_TARGET,
        ),
        comparisonLabel: "Target",
      },
      avgCpc: {
        label: "Avg CPC",
        value: formatUnitCurrency(contentPerformance.avgCpc),
        change: 0,
        sparkline: SPARKLINE,
        actual: contentPerformance.avgCpc,
        target: contentPerformance.avgCpcBenchmark,
        targetLabel: formatUnitCurrency(contentPerformance.avgCpcBenchmark),
        status: getBudgetStatus(
          contentPerformance.avgCpc,
          contentPerformance.avgCpcBenchmark,
        ),
        comparisonLabel: "Benchmark",
      },
      emv: {
        label: "EMV",
        value: formatCurrency(contentPerformance.organicEmv),
        change: 0,
        sparkline: SPARKLINE,
        actual: contentPerformance.organicEmv,
        target: organicEmvTarget,
        targetLabel: formatCurrency(organicEmvTarget),
        status: getTargetStatus(
          contentPerformance.organicEmv,
          organicEmvTarget,
        ),
        comparisonLabel: "Target",
      },
      mediaEfficiency: {
        label: "Media Efficiency",
        value: formatSignedCurrency(contentPerformance.mediaEfficiency),
        change: 0,
        sparkline: SPARKLINE,
        actual: contentPerformance.mediaEfficiency,
        target: 0,
        targetLabel: "",
        status: "above",
        showTarget: false,
        showStatus: false,
        valueTone:
          contentPerformance.mediaEfficiency >= 0 ? "positive" : "negative",
      },
    },
    brandExperience: {
      roi: roiTile("Brand Experience ROAS", brandExperience.roi, ROAS_TARGET, [
        {
          label: "Sampling & Experience Spend",
          value: formatCurrency(brandExperience.spend),
        },
      ]),
      totalEngagements: metricTile(
        "Total Engagements",
        beReach,
        beEngagementsTarget,
        formatNumber,
      ),
      totalSamples: metricTile(
        "Total Samples",
        beImpact,
        beSamplesTarget,
        formatNumber,
      ),
      rateOfSale: metricTile(
        "Rate of Sale",
        beSales,
        beSalesTarget,
        formatCurrency,
      ),
    },
    digitalSampling: {
      roi: roiTile(
        "Digital Sampling ROAS",
        dsRoas,
        ROAS_TARGET,
        [
          {
            label: "Digital Sampling Spend",
            value: formatCurrency(digitalSampling.spend),
          },
        ],
      ),
      totalScans: metricTile(
        "Total Scans",
        dsReach,
        dsScansTarget,
        formatNumber,
      ),
      totalRedemptions: metricTile(
        "Total Redemptions",
        dsImpact,
        dsRedemptionsTarget,
        formatNumber,
      ),
      rateOfSale: metricTile(
        "Rate of Sale",
        dsSales,
        dsSalesTarget,
        formatCurrency,
      ),
      optIns: metricTile(
        "Email Opt Ins",
        optIns.count,
        dsConfig.emailOptIns,
        formatNumber,
      ),
      optInValue: metricTile(
        "Email Opt In Value",
        optIns.value,
        emailOptInValueTarget,
        formatCurrency,
      ),
    },
  };
}
