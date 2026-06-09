import type { ContentMetricRecord } from "@/lib/content-metrics";
import { getContentProgramMonthLabel } from "@/lib/content-metrics";
import {
  buildSyntheticBrandSentiment,
  buildSyntheticEngRateByMarket,
  getPostGradient,
  getPostImageUrl,
} from "@/lib/content-synthetic";
import { fetchContentRecordsForCharts } from "@/lib/queries/content";
import type {
  ContentDashboardData,
  ContentTopCreator,
  ContentTopPost,
  DashboardFilters,
} from "@/lib/types";

function groupImpressionsByMarket(rows: ContentMetricRecord[]) {
  const byMarket = new Map<string, { organic: number; paid: number }>();

  for (const row of rows) {
    const existing = byMarket.get(row.market) ?? { organic: 0, paid: 0 };
    existing.organic += row.organic_impressions;
    existing.paid += row.paid_impressions;
    byMarket.set(row.market, existing);
  }

  return Array.from(byMarket.entries())
    .map(([market, values]) => ({
      market,
      organic: Math.round(values.organic),
      paid: Math.round(values.paid),
      total: Math.round(values.organic + values.paid),
    }))
    .sort((a, b) => b.total - a.total);
}

function postScore(row: ContentMetricRecord): number {
  const impressions = row.organic_impressions + row.paid_impressions;
  return impressions * (1 + row.avg_eng_rate * 12);
}

function buildTopPosts(rows: ContentMetricRecord[]): ContentTopPost[] {
  return [...rows]
    .sort((a, b) => postScore(b) - postScore(a))
    .slice(0, 10)
    .map((row, index) => {
      const organic = Math.round(row.organic_impressions);
      const paid = Math.round(row.paid_impressions);
      const platform =
        row.organic_reach_tiktok >= row.organic_reach_instagram
          ? "tiktok"
          : "instagram";

      const id = `${row.handle}-${row.metric_date}-${index}`;
      return {
        id,
        title: `${row.product_brand} ${row.content_type} — ${row.market}`,
        creator: row.hct_rep,
        handle: row.handle,
        market: row.market,
        brand: row.product_brand,
        contentType: row.content_type,
        organicImpressions: organic,
        paidImpressions: paid,
        engRate: row.avg_eng_rate,
        ctr: row.ctr_results,
        imageGradient: getPostGradient(row.product_brand),
        imageUrl: getPostImageUrl(row.product_brand, id),
        platform,
      };
    });
}

function buildTopCreators(rows: ContentMetricRecord[]): ContentTopCreator[] {
  const byHandle = new Map<
    string,
    {
      creator: string;
      handle: string;
      market: string;
      brand: string;
      impressions: number;
      reach: number;
      engSum: number;
      engCount: number;
      monthlyImpressions: Map<string, number>;
    }
  >();

  for (const row of rows) {
    const key = row.handle || row.hct_rep;
    const existing = byHandle.get(key) ?? {
      creator: row.hct_rep,
      handle: row.handle,
      market: row.market,
      brand: row.product_brand,
      impressions: 0,
      reach: 0,
      engSum: 0,
      engCount: 0,
      monthlyImpressions: new Map<string, number>(),
    };

    const impressions = row.organic_impressions + row.paid_impressions;
    const reach = row.organic_reach_instagram + row.organic_reach_tiktok;
    existing.impressions += impressions;
    existing.reach += reach;
    existing.engSum += row.avg_eng_rate;
    existing.engCount += 1;

    const month = getContentProgramMonthLabel(row.metric_date) ?? row.metric_date;
    existing.monthlyImpressions.set(
      month,
      (existing.monthlyImpressions.get(month) ?? 0) + impressions,
    );

    byHandle.set(key, existing);
  }

  return Array.from(byHandle.values())
    .map((creator) => {
      const monthly = [...creator.monthlyImpressions.entries()].sort((a, b) =>
        a[0].localeCompare(b[0]),
      );
      const monthValues = monthly.map(([, value]) => value);
      const midpoint = Math.ceil(monthValues.length / 2);
      const early =
        monthValues.slice(0, midpoint).reduce((s, v) => s + v, 0) /
        Math.max(1, midpoint);
      const late =
        monthValues.slice(midpoint).reduce((s, v) => s + v, 0) /
        Math.max(1, monthValues.length - midpoint);
      const growth = early > 0 ? (late - early) / early : 0;

      let trendDirection: ContentTopCreator["trendDirection"] = "stable";
      if (growth > 0.12) trendDirection = "up";
      if (growth < -0.08) trendDirection = "down";

      const trendScore = Math.round(
        Math.min(
          100,
          (creator.engSum / Math.max(1, creator.engCount)) * 1200 +
            Math.max(0, growth) * 40 +
            monthly.length * 4,
        ),
      );

      return {
        creator: creator.creator,
        handle: creator.handle,
        market: creator.market,
        brand: creator.brand,
        totalImpressions: Math.round(creator.impressions),
        totalReach: Math.round(creator.reach),
        avgEngRate: creator.engCount ? creator.engSum / creator.engCount : 0,
        trendScore,
        monthsActive: monthly.length,
        trendDirection,
      };
    })
    .sort((a, b) => b.trendScore - a.trendScore)
    .slice(0, 10);
}

export async function getContentDashboardData(
  filters: DashboardFilters,
): Promise<ContentDashboardData | null> {
  const rows = await fetchContentRecordsForCharts(filters);
  if (!rows.length) return null;

  const markets = [...new Set(rows.map((row) => row.market))].sort();
  const brands = [...new Set(rows.map((row) => row.product_brand).filter(Boolean))].sort();

  return {
    impressionsByMarket: groupImpressionsByMarket(rows),
    engRateByMarket: buildSyntheticEngRateByMarket(markets),
    sentimentByBrand: buildSyntheticBrandSentiment(
      markets,
      brands.length ? brands : undefined,
    ),
    topPosts: buildTopPosts(rows),
    topCreators: buildTopCreators(rows),
  };
}
