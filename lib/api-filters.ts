import { ALL_BRANDS_LABEL, BRAND_OPTIONS, type BrandFilter } from "@/lib/brands";
import { getDefaultFilters } from "@/lib/data";
import { parseDateParam } from "@/lib/dates";
import type { DashboardFilters } from "@/lib/types";

export function parseList(param: string | null): string[] {
  if (!param) return [];
  return param.split(",").map((s) => s.trim()).filter(Boolean);
}

export function parseFiltersFromSearchParams(
  searchParams: URLSearchParams,
): DashboardFilters {
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

export function parseFiltersFromBody(body: {
  brand?: string;
  activationType?: string[];
  region?: string[];
  market?: string[];
  startDate?: string;
  endDate?: string;
}): DashboardFilters {
  const defaults = getDefaultFilters();

  const brand: BrandFilter =
    body.brand && BRAND_OPTIONS.includes(body.brand as BrandFilter)
      ? (body.brand as BrandFilter)
      : ALL_BRANDS_LABEL;

  return {
    brand,
    activationType: body.activationType ?? [],
    region: body.region ?? [],
    market: body.market ?? [],
    startDate: body.startDate ? parseDateParam(body.startDate) : defaults.startDate,
    endDate: body.endDate ? parseDateParam(body.endDate) : defaults.endDate,
  };
}
