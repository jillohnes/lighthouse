import {
  CONTENT_BRAND,
  getContentTotalsFromExcel,
} from "@/lib/content-metrics";
import { formatDateParam } from "@/lib/dates";
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

function buildContentQuery(filters: DashboardFilters) {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("program_metrics")
    .select("content_reach, return_value, region, market, metric_date")
    .eq("brand", CONTENT_BRAND)
    .gte("metric_date", formatDateParam(filters.startDate))
    .lte("metric_date", formatDateParam(filters.endDate));

  if (filters.region.length > 0) {
    query = query.in("region", filters.region);
  }
  if (filters.market.length > 0) {
    query = query.in("market", filters.market);
  }

  return query;
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
