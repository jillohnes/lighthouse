import { isSupabaseConfigured } from "@/lib/supabase/server";

/** Use Supabase as the primary data source when credentials are available. */
export function preferSupabaseData(): boolean {
  return isSupabaseConfigured();
}

export const SUPABASE_ENV_WARNING =
  "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your Vercel project environment variables.";
