import { NextResponse } from "next/server";
import { FILTER_OPTIONS } from "@/lib/data";
import { getFilterOptionsFromSupabase } from "@/lib/queries/filters";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export async function GET() {
  try {
    if (isSupabaseConfigured()) {
      const options = await getFilterOptionsFromSupabase();
      if (options) {
        return NextResponse.json({ source: "supabase", options });
      }
    }
    return NextResponse.json({ source: "mock", options: FILTER_OPTIONS });
  } catch (error) {
    console.error("Filters API error:", error);
    return NextResponse.json({ source: "mock", options: FILTER_OPTIONS });
  }
}
