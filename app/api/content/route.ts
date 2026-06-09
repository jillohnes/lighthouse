import { NextRequest, NextResponse } from "next/server";
import { parseFiltersFromSearchParams } from "@/lib/api-filters";
import { getContentDashboardData } from "@/lib/queries/content-dashboard";

export async function GET(request: NextRequest) {
  const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams);

  try {
    const data = await getContentDashboardData(filters);
    if (data) {
      return NextResponse.json({ source: "content", data });
    }

    return NextResponse.json({ source: "empty", data: null });
  } catch (error) {
    console.error("Content API error:", error);
    return NextResponse.json(
      { source: "error", data: null, warning: "Failed to load content data." },
      { status: 500 },
    );
  }
}
