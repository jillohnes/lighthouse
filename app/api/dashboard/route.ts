import { NextRequest, NextResponse } from "next/server";
import { getDashboardData, getDefaultFilters } from "@/lib/data";
import { getDashboardDataFromSupabase } from "@/lib/queries/dashboard";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Brand, DashboardFilters, Market, Region } from "@/lib/types";

function parseFilters(searchParams: URLSearchParams): DashboardFilters {
  const defaults = getDefaultFilters();

  return {
    brand: (searchParams.get("brand") as Brand) || defaults.brand,
    region: (searchParams.get("region") as Region) || defaults.region,
    market: (searchParams.get("market") as Market) || defaults.market,
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

    return NextResponse.json({
      source: "mock",
      data: getDashboardData(filters),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({
      source: "mock",
      data: getDashboardData(filters),
      warning: "Fell back to mock data due to a database error.",
    });
  }
}
