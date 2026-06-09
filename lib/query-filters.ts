import { ALL_BRANDS_LABEL } from "@/lib/brands";
import { normalizeActivationType } from "@/lib/settings";
import { formatDateParam } from "@/lib/dates";
import type { DashboardFilters } from "@/lib/types";

export function isBrandFiltered(filters: DashboardFilters): boolean {
  return filters.brand !== ALL_BRANDS_LABEL;
}

export function matchesBrandFilter(
  filters: DashboardFilters,
  productBrand: string | null | undefined,
): boolean {
  if (!isBrandFiltered(filters)) return true;
  return productBrand === filters.brand;
}

export function matchesRegionFilter(
  filters: DashboardFilters,
  region: string,
): boolean {
  if (filters.region.length === 0) return true;
  return filters.region.includes(region);
}

export function matchesMarketFilter(
  filters: DashboardFilters,
  market: string,
): boolean {
  if (filters.market.length === 0) return true;
  return filters.market.includes(market);
}

export function matchesDateFilter(
  filters: DashboardFilters,
  metricDate: string,
): boolean {
  const start = formatDateParam(filters.startDate);
  const end = formatDateParam(filters.endDate);
  return metricDate >= start && metricDate <= end;
}

export function matchesActivationTypeFilter(
  filters: DashboardFilters,
  activationType: string,
): boolean {
  if (filters.activationType.length === 0) return true;
  const rowType = normalizeActivationType(activationType);
  return filters.activationType.some(
    (selected) => normalizeActivationType(selected) === rowType,
  );
}

function activationTypeFilterValues(selectedTypes: string[]): string[] {
  const values = new Set<string>();
  for (const selected of selectedTypes) {
    const normalized = normalizeActivationType(selected);
    values.add(normalized);
    if (normalized === "HCT") values.add("HTC");
  }
  return [...values];
}

export function matchesContentRowFilters(
  filters: DashboardFilters,
  row: {
    metric_date: string;
    region: string;
    market: string;
    product_brand?: string | null;
  },
): boolean {
  if (!matchesDateFilter(filters, row.metric_date)) return false;
  if (!matchesRegionFilter(filters, row.region)) return false;
  if (!matchesMarketFilter(filters, row.market)) return false;
  if (!matchesBrandFilter(filters, row.product_brand)) return false;
  return true;
}

export function matchesActivationRowFilters(
  filters: DashboardFilters,
  row: {
    metric_date: string;
    region: string;
    market: string;
    product_brand?: string | null;
    activation_type: string;
  },
): boolean {
  if (!matchesDateFilter(filters, row.metric_date)) return false;
  if (!matchesRegionFilter(filters, row.region)) return false;
  if (!matchesMarketFilter(filters, row.market)) return false;
  if (!matchesBrandFilter(filters, row.product_brand)) return false;
  if (!matchesActivationTypeFilter(filters, row.activation_type)) return false;
  return true;
}

/** Apply shared dashboard filters to a Supabase program_metrics query. */
export function applyProgramMetricFilters<
  T extends {
    gte: (col: string, val: string) => T;
    lte: (col: string, val: string) => T;
    in: (col: string, vals: string[]) => T;
    eq: (col: string, val: string) => T;
  },
>(
  query: T,
  filters: DashboardFilters,
  options?: {
    applyDateFilter?: boolean;
    applyActivationType?: boolean;
    applyBrandFilter?: boolean;
  },
): T {
  const applyDateFilter = options?.applyDateFilter ?? true;
  const applyActivationType = options?.applyActivationType ?? true;
  const applyBrandFilter = options?.applyBrandFilter ?? true;

  if (applyDateFilter) {
    query = query
      .gte("metric_date", formatDateParam(filters.startDate))
      .lte("metric_date", formatDateParam(filters.endDate));
  }

  if (applyBrandFilter && isBrandFiltered(filters)) {
    query = query.eq("product_brand", filters.brand);
  }

  if (applyActivationType && filters.activationType.length > 0) {
    query = query.in("brand", activationTypeFilterValues(filters.activationType));
  }

  if (filters.region.length > 0) {
    query = query.in("region", filters.region);
  }

  if (filters.market.length > 0) {
    query = query.in("market", filters.market);
  }

  return query;
}
