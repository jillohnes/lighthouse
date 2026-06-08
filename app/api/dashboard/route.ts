import { NextRequest, NextResponse } from "next/server";
import { getDefaultFilters } from "@/lib/data";
import { getDashboardDataFromSupabase } from "@/lib/queries/dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { DashboardFilters } from "@/lib/types";

function parseList(param: string | null): string[] {
  if (!param) return [];
  return param.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseFilters(searchParams: URLSearchParams): DashboardFilters {
  const defaults = getDefaultFilters();

  return {
    activationType: parseList(searchParams.get("activationType")),
    region: parseList(searchParams.get("region")),
    market: parseList(searchParams.get("market")),
    startDate: searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : defaults.startDate,
    endDate: searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : defaults.endDate,
  };
}

export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams);

  try {
    if (isSupabaseConfigured()) {
      const data = await getDashboardDataFromSupabase(filters);
      if (data) {
        return NextResponse.json({ source: "supabase", data });
      }
    }

    return NextResponse.json({ source: "empty", data: null });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { source: "error", data: null, warning: "Failed to load dashboard data." },
      { status: 500 },
    );
  }
}
