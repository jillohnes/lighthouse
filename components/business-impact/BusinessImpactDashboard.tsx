"use client";

import { useCallback, useEffect, useState } from "react";
import { getDefaultFilters } from "@/lib/data";
import { formatDateParam, normalizeLocalDate, parseDateParam } from "@/lib/dates";
import type { BusinessImpactData, DashboardFilters, FilterOptions } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { ActivityDepletionChart } from "./ActivityDepletionChart";
import { DepletionCorrelationAnalysis } from "./DepletionCorrelationAnalysis";

function buildQueryString(filters: DashboardFilters): string {
  const params = new URLSearchParams({
    startDate: formatDateParam(filters.startDate),
    endDate: formatDateParam(filters.endDate),
  });
  if (filters.brand !== "All Brands") {
    params.set("brand", filters.brand);
  }
  if (filters.activationType.length) {
    params.set("activationType", filters.activationType.join(","));
  }
  if (filters.region.length) {
    params.set("region", filters.region.join(","));
  }
  if (filters.market.length) {
    params.set("market", filters.market.join(","));
  }
  return params.toString();
}

export function BusinessImpactDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(getDefaultFilters);
  const [data, setData] = useState<BusinessImpactData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (currentFilters: DashboardFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/business-impact?${buildQueryString(currentFilters)}`);
      const json = await res.json();
      if (!json.data) {
        setData(null);
        setError(
          "No business impact data found for the selected filters. Try widening your date range or filters.",
        );
      } else {
        setData(json.data);
      }
    } catch {
      setData(null);
      setError("Failed to load business impact data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetch("/api/filters")
      .then((res) => res.json())
      .then((json: { options?: FilterOptions }) => {
        if (json.options?.dateRange) {
          setFilters((prev) => ({
            ...prev,
            startDate: parseDateParam(json.options!.dateRange.min),
            endDate: parseDateParam(json.options!.dateRange.max),
          }));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  function applyFilterUpdates(updates: Partial<DashboardFilters>) {
    setFilters((prev) => {
      const next = { ...prev, ...updates };
      if (updates.startDate) {
        next.startDate = normalizeLocalDate(updates.startDate);
      }
      if (updates.endDate) {
        next.endDate = normalizeLocalDate(updates.endDate);
      }
      if (next.startDate > next.endDate) {
        next.endDate = next.startDate;
      }
      return next;
    });
  }

  function updateFilter<K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K],
  ) {
    applyFilterUpdates({ [key]: value } as Partial<DashboardFilters>);
  }

  return (
    <AppShell activeNav="Business Impact">
      <header className="min-w-0 shrink-0 border-b border-brand/10 bg-surface px-6 py-4">
        <div className="mb-3">
          <h2 className="text-xl font-bold text-foreground">Business Impact</h2>
          <p className="text-xs text-muted">
            Track sampling and content activity against modeled depletion, and see which
            brand-market combinations are driving the strongest correlation.
          </p>
        </div>
        <FilterBar
          filters={filters}
          onChange={updateFilter}
          onBatchChange={applyFilterUpdates}
        />
        {error && !loading && (
          <p className="mt-2 text-xs text-amber-700">{error}</p>
        )}
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-sm text-brand/60">
            Loading business impact data...
          </div>
        ) : data ? (
          <div className="space-y-5">
            <ActivityDepletionChart
              data={data.monthlyActivity}
              takeaway={data.takeaway}
            />
            <DepletionCorrelationAnalysis
              correlations={data.correlations}
              selectedBrand={data.selectedBrand}
            />
          </div>
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-brand/60">
            {error ?? "No data available."}
          </div>
        )}
      </main>
    </AppShell>
  );
}
