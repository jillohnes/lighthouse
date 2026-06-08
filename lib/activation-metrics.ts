import type { ProgramMetricRow } from "@/lib/supabase/server";

/** Decode stored row back to original Excel metrics (Reach, Impact, Result). */
export function decodeActivation(row: ProgramMetricRow) {
  return {
    activation_type: row.brand,
    region: row.region,
    market: row.market,
    metric_date: row.metric_date,
    location_type: row.venue_type ?? row.retailer_type ?? "Other",
    reach: Number(row.content_reach) / 1000,
    impact: Number(row.roi) / 2.2,
    result: Number(row.spend) / 100,
    cost: Number(row.spend),
    channel: row.channel,
  };
}

export type DecodedActivation = ReturnType<typeof decodeActivation>;
