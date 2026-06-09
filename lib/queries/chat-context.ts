import { buildAnalysis } from "@/lib/chat/synthesis";
import type { ChatContext } from "@/lib/chat/types";
import { formatDateParam } from "@/lib/dates";
import type { DashboardData, DashboardFilters } from "@/lib/types";

export type { ChatContext } from "@/lib/chat/types";

export function buildChatContext(
  data: DashboardData,
  filters: DashboardFilters,
): ChatContext {
  const layout = data.kpiTileLayout;

  const baseContext = {
    filters: {
      brand: filters.brand,
      activationType: filters.activationType,
      region: filters.region,
      market: filters.market,
      startDate: formatDateParam(filters.startDate),
      endDate: formatDateParam(filters.endDate),
    },
    summary: {
      totalActivations: data.totalActivations,
      markets: data.markets,
      pacingPercent: data.pacingPercent,
    },
    roas: {
      ttlRoi: layout.summary.ttlRoi.value,
      samplingRoi: layout.summary.samplingRoi.value,
      contentRoi: layout.summary.contentRoi.value,
      hctRoi: layout.hct.roi.value,
      brandExperienceRoi: layout.brandExperience.roi.value,
      digitalSamplingRoi: layout.digitalSampling.roi.value,
    },
    programTotals: {
      totalEngagements: data.byActivationType.breakdown
        .reduce((sum, row) => sum + row.reach, 0)
        .toLocaleString(),
      totalSamples: data.byActivationType.breakdown
        .reduce((sum, row) => sum + row.impact, 0)
        .toLocaleString(),
      totalResults: data.byActivationType.breakdown
        .reduce((sum, row) => sum + row.result, 0)
        .toLocaleString(),
      optIns: layout.digitalSampling.optIns.value,
      optInValue: layout.digitalSampling.optInValue.value,
    },
    activationBreakdown: data.byActivationType.breakdown.map((row) => ({
      name: row.name,
      reach: row.reach,
      impact: row.impact,
      result: row.result,
      reachPercent: row.reachPercent,
      impactPercent: row.impactPercent,
      resultPercent: row.resultPercent,
    })),
    locationBreakdown: data.byLocationType.breakdown.map((row) => ({
      name: row.name,
      reach: row.reach,
      impact: row.impact,
      result: row.result,
    })),
    monthlyActivationTotals: data.byActivationType.monthly.map((row) => ({
      month: row.month,
      reach: row.line.reach,
      impact: row.line.impact,
      result: row.line.result,
    })),
    topMarkets: data.mapMarkets.slice(0, 10).map((row) => ({
      market: row.market,
      reach: row.reach,
      impact: row.impact,
      result: row.result,
      roi: row.roi,
      status: row.status,
    })),
    topAmbassadors: data.topAmbassadors.slice(0, 8),
    content: {
      impressionsTakeaway: data.impressionsByMonth.takeaway,
      emvTakeaway: data.contentByMonth.takeaway,
    },
    insights: data.insights.map((insight) => ({
      title: insight.title,
      description: insight.description,
    })),
  };

  const analysis = buildAnalysis(baseContext);

  return {
    ...baseContext,
    analysis: {
      programNarrative: analysis.programNarrative,
      trendInsight: analysis.trendInsight,
      contentInsight: analysis.contentInsight,
      crossSignals: analysis.crossSignals,
      activationInsights: analysis.activationInsights,
      locationInsights: analysis.locationInsights,
      marketInsights: analysis.marketInsights,
      risks: analysis.risks,
      opportunities: analysis.opportunities,
      prebuiltInsights: analysis.prebuiltInsights,
    },
  };
}

export function serializeChatContext(context: ChatContext): string {
  return JSON.stringify(context, null, 2);
}
