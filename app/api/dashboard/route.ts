import { NextRequest, NextResponse } from "next/server";
import { ALL_BRANDS_LABEL, BRAND_OPTIONS, type BrandFilter } from "@/lib/brands";
import { getDefaultFilters } from "@/lib/data";
import { parseDateParam } from "@/lib/dates";
import { getDashboardData } from "@/lib/queries/dashboard";
import type { DashboardFilters } from "@/lib/types";

function parseList(param: string | null): string[] {
  if (!param) return [];
  return param.split(",").map((s) => s.trim()).filter(Boolean);
}

function parseFilters(searchParams: URLSearchParams): DashboardFilters {
  const defaults = getDefaultFilters();

  const brandParam = searchParams.get("brand");
  const brand: BrandFilter =
    brandParam && BRAND_OPTIONS.includes(brandParam as BrandFilter)
      ? (brandParam as BrandFilter)
      : ALL_BRANDS_LABEL;

  return {
    brand,
    activationType: parseList(searchParams.get("activationType")),
    region: parseList(searchParams.get("region")),
    market: parseList(searchParams.get("market")),
    startDate: searchParams.get("startDate")
      ? parseDateParam(searchParams.get("startDate")!)
      : defaults.startDate,
    endDate: searchParams.get("endDate")
      ? parseDateParam(searchParams.get("endDate")!)
      : defaults.endDate,
  };
}

export async function GET(request: NextRequest) {
  const filters = parseFilters(request.nextUrl.searchParams);

  try {
    const data = await getDashboardData(filters);
    if (data) {
      return NextResponse.json({ source: "dashboard", data });
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
