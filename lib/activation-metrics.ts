import type { ProgramMetricRow } from "@/lib/supabase/server";

/**
 * Decode Supabase row back to Excel metrics from import.xlsx:
 *   Reach  ← content_reach  (Excel Reach)
 *   Impact ← roi           (Excel Impact)
 *   sales  ← return_value  (Excel Result — sales dollars)
 *   cost   ← spend         (activation cost from settings budget)
 */
export function decodeActivation(row: ProgramMetricRow) {
  const sales = Number(row.return_value);

  return {
    activation_type: row.brand,
    region: row.region,
    market: row.market,
    metric_date: row.metric_date,
    location_type: row.venue_type ?? row.retailer_type ?? "Other",
    reach: Number(row.content_reach) / 1000,
    impact: Number(row.roi) / 2.2,
    result: sales,
    sales,
    cost: Number(row.spend),
    channel: row.channel,
  };
}

export type DecodedActivation = ReturnType<typeof decodeActivation>;
