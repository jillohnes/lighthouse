import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ProgramMetricRow = {
  id: string;
  brand: string;
  region: string;
  market: string;
  metric_date: string;
  channel: "on_premise" | "off_premise";
  venue_type: string | null;
  retailer_type: string | null;
  spend: number;
  return_value: number;
  roi: number;
  samples: number;
  content_reach: number;
  py_spend_change: number | null;
  py_roi_change: number | null;
};

export type ContentMetricRow = {
  id: string;
  metric_date: string;
  region: string;
  market: string;
  hct_rep: string;
  handle: string;
  instagram_followers: number;
  tiktok_followers: number;
  avg_eng_rate: number;
  avg_viewability: number;
  stories_per_month: number;
  reels_per_month: number;
  organic_reach_instagram: number;
  organic_reach_tiktok: number;
  organic_impressions: number;
  paid_media: boolean;
  paid_boosting_total: number;
  paid_impressions: number;
  ctr_benchmark: number;
  ctr_results: number;
  total_clicks: number;
  cpc_benchmark: number;
  cpc_results: number;
  cpc_delta: number;
};

export type KpiTargetRow = {
  metric_key: string;
  target_value: number;
  label: string;
};

let supabaseAdmin: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local",
    );
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );
  }

  return supabaseAdmin;
}
