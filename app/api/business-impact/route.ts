import { NextRequest, NextResponse } from "next/server";
import { parseFiltersFromSearchParams } from "@/lib/api-filters";
import { getBusinessImpactData } from "@/lib/queries/business-impact";

export async function GET(request: NextRequest) {
  const filters = parseFiltersFromSearchParams(request.nextUrl.searchParams);

  try {
    const data = await getBusinessImpactData(filters);
    if (data) {
      return NextResponse.json({ source: "business-impact", data });
    }

    return NextResponse.json({ source: "empty", data: null });
  } catch (error) {
    console.error("Business Impact API error:", error);
    return NextResponse.json(
      {
        source: "error",
        data: null,
        warning: "Failed to load business impact data.",
      },
      { status: 500 },
    );
  }
}
