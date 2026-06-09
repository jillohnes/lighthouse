import {
  CONTENT_BRAND,
  getContentTotalsFromExcel,
  loadContentRowsForCharts,
  sumContentTotals,
  type ContentMetricRecord,
} from "@/lib/content-metrics";
import { applyProgramMetricFilters } from "@/lib/query-filters";
import { fetchAllRowsPaginated } from "@/lib/queries/fetch-all";
import {
  getSupabaseAdmin,
  isSupabaseConfigured,
  type ProgramMetricRow,
} from "@/lib/supabase/server";
import type { DashboardFilters } from "@/lib/types";

export type ContentTotals = {
  organicImpressions: number;
  paidReach: number;
};

type ContentProgramSelect = Pick<
  ProgramMetricRow,
  | "content_reach"
  | "return_value"
  | "region"
  | "market"
  | "metric_date"
  | "retailer_type"
  | "venue_type"
  | "product_brand"
>;

function buildContentQuery(
  filters: DashboardFilters,
  options?: { applyDateFilter?: boolean },
) {
  const supabase = getSupabaseAdmin();
  const applyDateFilter = options?.applyDateFilter ?? true;
  let query = supabase
    .from("program_metrics")
    .select(
      "content_reach, return_value, region, market, metric_date, retailer_type, venue_type, product_brand",
    )
    .eq("brand", CONTENT_BRAND);

  return applyProgramMetricFilters(query, filters, {
    applyDateFilter,
    applyActivationType: false,
  });
}

function mapProgramRowToContentRecord(row: ContentProgramSelect): ContentMetricRecord {
  return {
    metric_date: row.metric_date,
    region: row.region,
    market: row.market,
    product_brand: String(row.product_brand ?? "").trim(),
    hct_rep: String(row.retailer_type ?? "").trim(),
    handle: String(row.venue_type ?? "").trim(),
    content_type: "Post",
    instagram_followers: 0,
    tiktok_followers: 0,
    avg_eng_rate: 0,
    avg_viewability: 0,
    stories_per_month: 0,
    reels_per_month: 0,
    organic_reach_instagram: 0,
    organic_reach_tiktok: 0,
    organic_impressions: Number(row.content_reach) || 0,
    paid_media: Number(row.return_value) > 0,
    paid_boosting_total: 0,
    paid_impressions: Number(row.return_value) || 0,
    ctr_benchmark: 0,
    ctr_results: 0,
    total_clicks: 0,
    cpc_benchmark: 0,
    cpc_results: 0,
    cpc_delta: 0,
  };
}

async function fetchContentProgramRecords(
  filters: DashboardFilters,
  applyDateFilter = true,
): Promise<ContentMetricRecord[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const rows = await fetchAllRowsPaginated<ContentProgramSelect>(() =>
      buildContentQuery(filters, { applyDateFilter }),
    );
    return rows.map(mapProgramRowToContentRecord);
  } catch (error) {
    console.error("Failed to load content program rows:", error);
    return [];
  }
}

export async function fetchContentRecordsForCharts(
  filters: DashboardFilters,
): Promise<ContentMetricRecord[]> {
  const excelRows = loadContentRowsForCharts(filters);
  if (excelRows.length > 0) return excelRows;

  const datedRows = await fetchContentProgramRecords(filters, true);
  if (datedRows.length > 0) return datedRows;

  return fetchContentProgramRecords(filters, false);
}

type ContentProgramRow = Pick<
  ProgramMetricRow,
  "content_reach" | "return_value" | "region" | "market" | "metric_date"
>;

function sumContentRows(rows: ContentProgramRow[]): ContentTotals {
  return rows.reduce(
    (totals, row) => ({
      organicImpressions:
        totals.organicImpressions + Number(row.content_reach),
      paidReach: totals.paidReach + Number(row.return_value),
    }),
    { organicImpressions: 0, paidReach: 0 },
  );
}

export async function fetchContentMetricsSafe(
  filters: DashboardFilters,
): Promise<ContentProgramRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    return await fetchAllRowsPaginated(() => buildContentQuery(filters));
  } catch (error) {
    console.error("Failed to load content metrics from Supabase:", error);
    return [];
  }
}

export async function fetchAllContentFilterRows(): Promise<
  Pick<ProgramMetricRow, "region" | "market" | "metric_date">[]
> {
  if (!isSupabaseConfigured()) return [];

  try {
    return await fetchAllRowsPaginated(() =>
      getSupabaseAdmin()
        .from("program_metrics")
        .select("region, market, metric_date")
        .eq("brand", CONTENT_BRAND),
    );
  } catch (error) {
    console.error("Failed to load content filter options from Supabase:", error);
    return [];
  }
}

export async function getContentTotals(
  filters: DashboardFilters,
): Promise<ContentTotals> {
  const excelRows = loadContentRowsForCharts(filters);
  if (excelRows.length > 0) {
    return sumContentTotals(excelRows);
  }

  const rows = await fetchContentMetricsSafe(filters);
  if (rows.length > 0) {
    return sumContentRows(rows);
  }

  return getContentTotalsFromExcel(filters);
}

export async function hasContentData(filters: DashboardFilters): Promise<boolean> {
  const rows = await fetchContentMetricsSafe(filters);
  if (rows.length > 0) return true;
  const totals = getContentTotalsFromExcel(filters);
  return totals.organicImpressions > 0 || totals.paidReach > 0;
}

export type ContentAmbassadorRow = {
  metric_date: string;
  region: string;
  market: string;
  hct_rep: string;
  organic_impressions: number;
  paid_impressions: number;
};

function buildAmbassadorQuery(filters: DashboardFilters) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("program_metrics")
    .select("content_reach, return_value, region, market, metric_date, retailer_type")
    .eq("brand", CONTENT_BRAND);

  return applyProgramMetricFilters(query, filters, {
    applyActivationType: false,
  });
}

export async function fetchContentAmbassadorRows(
  filters: DashboardFilters,
): Promise<ContentAmbassadorRow[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const rows = await fetchAllRowsPaginated(() => buildAmbassadorQuery(filters));
    return rows.map((row) => ({
      metric_date: row.metric_date,
      region: row.region,
      market: row.market,
      hct_rep: String(row.retailer_type ?? "").trim(),
      organic_impressions: Number(row.content_reach) || 0,
      paid_impressions: Number(row.return_value) || 0,
    }));
  } catch (error) {
    console.error("Failed to load ambassador content rows:", error);
    return [];
  }
}
