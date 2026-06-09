import type { ContentMetricRecord } from "@/lib/content-metrics";

export const FALLBACK_CPM = 10;

/** EMV + media efficiency for a subset of content rows (e.g. one market). */
export function computeContentValueForRows(
  contentRows: ContentMetricRecord[],
  fallbackCpm = FALLBACK_CPM,
): {
  organicEmv: number;
  mediaEfficiency: number;
  paidBoostTotal: number;
} {
  let paidBoostTotal = 0;
  let paidImpressionsTotal = 0;
  let totalClicks = 0;
  let mediaEfficiency = 0;
  let hasRowLevelEfficiency = false;
  let cpcResultsSum = 0;
  let cpcBenchmarkSum = 0;
  let cpcCount = 0;
  const organicImpressions = contentRows.reduce(
    (sum, row) => sum + row.organic_impressions,
    0,
  );

  for (const row of contentRows) {
    paidBoostTotal += row.paid_boosting_total;
    paidImpressionsTotal += row.paid_impressions;
    totalClicks += row.total_clicks;

    if (row.cpc_results > 0 && row.cpc_benchmark > 0 && row.total_clicks > 0) {
      mediaEfficiency +=
        (row.cpc_benchmark - row.cpc_results) * row.total_clicks;
      hasRowLevelEfficiency = true;
    }

    if (row.cpc_results > 0 && row.cpc_benchmark > 0) {
      cpcResultsSum += row.cpc_results;
      cpcBenchmarkSum += row.cpc_benchmark;
      cpcCount += 1;
    }
  }

  const avgCpc = cpcCount > 0 ? cpcResultsSum / cpcCount : 0;
  const avgCpcBenchmark = cpcCount > 0 ? cpcBenchmarkSum / cpcCount : 0;

  if (!hasRowLevelEfficiency && totalClicks > 0 && cpcCount > 0) {
    mediaEfficiency = (avgCpcBenchmark - avgCpc) * totalClicks;
  }

  const cpm =
    paidImpressionsTotal > 0
      ? (paidBoostTotal / paidImpressionsTotal) * 1000
      : fallbackCpm;
  const organicEmv = (organicImpressions * cpm) / 1000;

  return { organicEmv, mediaEfficiency, paidBoostTotal };
}

export function resolveGlobalCpm(
  contentRecords: ContentMetricRecord[],
): number {
  let paidBoostTotal = 0;
  let paidImpressionsTotal = 0;

  for (const row of contentRecords) {
    paidBoostTotal += row.paid_boosting_total;
    paidImpressionsTotal += row.paid_impressions;
  }

  return paidImpressionsTotal > 0
    ? (paidBoostTotal / paidImpressionsTotal) * 1000
    : FALLBACK_CPM;
}
