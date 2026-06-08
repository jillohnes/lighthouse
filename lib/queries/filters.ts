import { fetchAllProgramMetrics } from "@/lib/queries/fetch-all";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { FilterOptions } from "@/lib/types";

export async function getFilterOptionsFromSupabase(): Promise<FilterOptions | null> {
  const supabase = getSupabaseAdmin();
  const rows = await fetchAllProgramMetrics(() =>
    supabase.from("program_metrics").select("brand, region, market, metric_date"),
  );

  if (!rows.length) return null;

  const activationTypes = [...new Set(rows.map((r) => r.brand))].sort();
  const regions = [...new Set(rows.map((r) => r.region))].sort();
  const markets = [...new Set(rows.map((r) => r.market))].sort();
  const dates = rows.map((r) => r.metric_date).sort();

  const marketsByRegionMap = new Map<string, Set<string>>();
  for (const row of rows) {
    if (!row.region || !row.market) continue;
    if (!marketsByRegionMap.has(row.region)) {
      marketsByRegionMap.set(row.region, new Set());
    }
    marketsByRegionMap.get(row.region)!.add(row.market);
  }

  const marketsByRegion = Object.fromEntries(
    [...marketsByRegionMap.entries()].map(([region, regionMarkets]) => [
      region,
      [...regionMarkets].sort(),
    ]),
  );

  return {
    activationTypes: ["All Activation Types", ...activationTypes],
    regions: ["All Regions", ...regions],
    markets: ["All Markets", ...markets],
    marketsByRegion,
    dateRange: { min: dates[0], max: dates[dates.length - 1] },
  };
}
