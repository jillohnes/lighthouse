import { CONTENT_BRAND, loadContentMetrics } from "@/lib/content-metrics";
import { fetchAllContentFilterRows } from "@/lib/queries/content";
import { fetchAllProgramMetrics } from "@/lib/queries/fetch-all";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { FilterOptions } from "@/lib/types";

function buildMarketsByRegion(
  rows: Array<{ region: string; market: string }>,
): Record<string, string[]> {
  const marketsByRegionMap = new Map<string, Set<string>>();

  for (const row of rows) {
    if (!row.region || !row.market) continue;
    if (!marketsByRegionMap.has(row.region)) {
      marketsByRegionMap.set(row.region, new Set());
    }
    marketsByRegionMap.get(row.region)!.add(row.market);
  }

  return Object.fromEntries(
    [...marketsByRegionMap.entries()].map(([region, regionMarkets]) => [
      region,
      [...regionMarkets].sort(),
    ]),
  );
}

export async function getFilterOptionsFromSupabase(): Promise<FilterOptions | null> {
  let programRows: Array<{
    brand: string;
    region: string;
    market: string;
    metric_date: string;
  }> = [];

  try {
    const supabase = getSupabaseAdmin();
    programRows = await fetchAllProgramMetrics(() =>
      supabase
        .from("program_metrics")
        .select("brand, region, market, metric_date"),
    );
  } catch (error) {
    console.error("Failed to load program filter options:", error);
  }

  const supabaseContentRows = await fetchAllContentFilterRows();
  const contentRows = (supabaseContentRows.length
    ? supabaseContentRows
    : loadContentMetrics()
  ).map((row) => ({
    brand: "",
    region: row.region,
    market: row.market,
    metric_date: row.metric_date,
  }));

  const rows = [...programRows, ...contentRows];
  if (!rows.length) return null;

  const activationTypes = [
    ...new Set(
      programRows
        .map((r) => r.brand)
        .filter((brand) => brand && brand !== CONTENT_BRAND),
    ),
  ].sort();
  const regions = [...new Set(rows.map((r) => r.region).filter(Boolean))].sort();
  const markets = [...new Set(rows.map((r) => r.market).filter(Boolean))].sort();
  const dates = rows.map((r) => r.metric_date).sort();

  return {
    activationTypes: ["All Activation Types", ...activationTypes],
    regions: ["All Regions", ...regions],
    markets: ["All Markets", ...markets],
    marketsByRegion: buildMarketsByRegion(rows),
    dateRange: { min: dates[0], max: dates[dates.length - 1] },
  };
}
