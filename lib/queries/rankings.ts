import type { DecodedActivation } from "@/lib/activation-metrics";
import { prorateRoiTarget } from "@/lib/campaign";
import type { ContentMetricRecord } from "@/lib/content-metrics";
import {
  computeSalesTarget,
  computeSpendTarget,
} from "@/lib/metric-comparison";
import {
  fetchContentAmbassadorRows,
  fetchContentRecordsForCharts,
} from "@/lib/queries/content";
import type { ActivationType, ProgramSettings } from "@/lib/settings";
import {
  TARGET_GREEN_THRESHOLD,
  TARGET_YELLOW_THRESHOLD,
} from "@/lib/target-status";
import type {
  DashboardFilters,
  MarketStatus,
  TopAmbassadorRow,
  TopMarketRow,
} from "@/lib/types";

const TOP_N = 10;

function getMarketStatus(roiVsPlan: number): MarketStatus {
  if (roiVsPlan >= TARGET_GREEN_THRESHOLD) return "on-track";
  if (roiVsPlan >= TARGET_YELLOW_THRESHOLD) return "watch";
  return "at-risk";
}

export function buildTopMarkets(
  rows: DecodedActivation[],
  settings: ProgramSettings,
  applicableTypes: ActivationType[],
  filters: DashboardFilters,
): TopMarketRow[] {
  const byMarket = new Map<
    string,
    {
      reach: number;
      impact: number;
      result: number;
      spend: number;
    }
  >();

  for (const row of rows) {
    if (!row.market) continue;
    const existing = byMarket.get(row.market) ?? {
      reach: 0,
      impact: 0,
      result: 0,
      spend: 0,
    };
    existing.reach += row.reach;
    existing.impact += row.impact;
    existing.result += row.sales;
    existing.spend += row.cost;
    byMarket.set(row.market, existing);
  }

  return Array.from(byMarket.entries())
    .map(([market, totals]) => {
      const marketRows = rows.filter((row) => row.market === market);
      const salesTarget = computeSalesTarget(
        marketRows,
        settings,
        applicableTypes,
      );
      const spendTarget = computeSpendTarget(
        marketRows,
        settings,
        applicableTypes,
      );
      const roi = totals.spend > 0 ? (totals.result / totals.spend) * 100 : 0;
      const fullRoiPlan =
        spendTarget > 0 ? (salesTarget / spendTarget) * 100 : 0;
      const roiPlan = prorateRoiTarget(fullRoiPlan, filters);
      const roiVsPlan =
        roiPlan > 0 ? Math.round((roi / roiPlan) * 100) : 0;

      return {
        market,
        reach: Math.round(totals.reach),
        impact: Math.round(totals.impact),
        result: Math.round(totals.result),
        roi,
        roiPlan,
        roiVsPlan,
        status: getMarketStatus(roiVsPlan),
      };
    })
    .sort((a, b) => b.result - a.result)
    .slice(0, TOP_N);
}

function buildTopAmbassadorsFromContent(
  rows: ContentMetricRecord[],
): TopAmbassadorRow[] {
  const byRep = new Map<
    string,
    {
      organic: number;
      paid: number;
      marketTotals: Map<string, number>;
    }
  >();

  for (const row of rows) {
    if (!row.hct_rep) continue;
    const existing = byRep.get(row.hct_rep) ?? {
      organic: 0,
      paid: 0,
      marketTotals: new Map<string, number>(),
    };
    existing.organic += row.organic_impressions;
    existing.paid += row.paid_impressions;
    const marketTotal =
      (existing.marketTotals.get(row.market) ?? 0) +
      row.organic_impressions +
      row.paid_impressions;
    existing.marketTotals.set(row.market, marketTotal);
    byRep.set(row.hct_rep, existing);
  }

  return Array.from(byRep.entries())
    .map(([name, totals]) => {
      let market = "";
      let maxImpressions = 0;
      for (const [marketName, impressions] of totals.marketTotals) {
        if (impressions > maxImpressions) {
          maxImpressions = impressions;
          market = marketName;
        }
      }
      return {
        name,
        market,
        organicImpressions: totals.organic,
        paidImpressions: totals.paid,
      };
    })
    .sort(
      (a, b) =>
        b.organicImpressions +
        b.paidImpressions -
        (a.organicImpressions + a.paidImpressions),
    )
    .slice(0, TOP_N);
}

export async function getTopAmbassadors(
  filters: DashboardFilters,
): Promise<TopAmbassadorRow[]> {
  const supabaseRows = await fetchContentAmbassadorRows(filters);
  if (supabaseRows.length > 0) {
    return buildTopAmbassadorsFromContent(
      supabaseRows.map((row) => ({
        metric_date: row.metric_date,
        region: row.region,
        market: row.market,
        product_brand: "",
        hct_rep: row.hct_rep,
        handle: "",
        instagram_followers: 0,
        tiktok_followers: 0,
        avg_eng_rate: 0,
        avg_viewability: 0,
        stories_per_month: 0,
        reels_per_month: 0,
        organic_reach_instagram: 0,
        organic_reach_tiktok: 0,
        organic_impressions: row.organic_impressions,
        paid_media: row.paid_impressions > 0,
        paid_boosting_total: 0,
        paid_impressions: row.paid_impressions,
        ctr_benchmark: 0,
        ctr_results: 0,
        total_clicks: 0,
        cpc_benchmark: 0,
        cpc_results: 0,
        cpc_delta: 0,
      })),
    );
  }

  return buildTopAmbassadorsFromContent(
    await fetchContentRecordsForCharts(filters),
  );
}
