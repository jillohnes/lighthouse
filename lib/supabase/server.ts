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
