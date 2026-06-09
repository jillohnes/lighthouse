"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { getDefaultFilters } from "@/lib/data";
import { formatCurrency } from "@/lib/format";
import { formatDateParam, normalizeLocalDate, parseDateParam } from "@/lib/dates";
import {
  DEFAULT_DRILLDOWN_ORDER,
  loadDrilldownOrder,
  saveDrilldownOrder,
  type DrilldownSectionId,
} from "@/lib/dashboard-layout";
import type { DashboardData, DashboardFilters, FilterOptions } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { AiInsights } from "./AiInsights";
import { DrilldownList, type DrilldownSectionData } from "./DrilldownList";
import { PerformanceDrilldown } from "./PerformanceDrilldown";
import { FilterBar } from "./FilterBar";
import { KpiTileGrid } from "./KpiTileGrid";
import { TargetsPacing } from "./TargetsPacing";
import { TopAmbassadors } from "./TopAmbassadors";

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

export function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(getDefaultFilters);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drilldownOrder, setDrilldownOrder] = useState<DrilldownSectionId[]>(
    DEFAULT_DRILLDOWN_ORDER,
  );

  const fetchData = useCallback(async (currentFilters: DashboardFilters) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard?${buildQueryString(currentFilters)}`);
      const json = await res.json();
      if (!json.data) {
        setData(null);
        setError("No data found for the selected filters. Try widening your date range or filters.");
      } else {
        setData(json.data);
      }
    } catch {
      setData(null);
      setError("Failed to load dashboard data.");
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

  useEffect(() => {
    setDrilldownOrder(loadDrilldownOrder());
  }, []);

  useEffect(() => {
    saveDrilldownOrder(drilldownOrder);
  }, [drilldownOrder]);

  const drilldownSections = useMemo(() => {
    if (!data) return null;
    return {
      "activation-type": {
        title: "Performance by Activation Type",
        monthly: data.byActivationType.monthly,
        breakdown: data.byActivationType.breakdown,
        breakdownLabel: "By Activation Type",
        takeaway: data.byActivationType.takeaway,
      },
      "location-type": {
        title: "Performance by Location Type",
        monthly: data.byLocationType.monthly,
        breakdown: data.byLocationType.breakdown,
        breakdownLabel: "By Location Type",
        takeaway: data.byLocationType.takeaway,
      },
    } satisfies Record<DrilldownSectionId, DrilldownSectionData>;
  }, [data]);

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
    <AppShell activeNav="Dashboard">
        <header className="shrink-0 border-b border-brand/10 bg-surface px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <div className="min-w-0 flex-1">
              <FilterBar
                filters={filters}
                onChange={updateFilter}
                onBatchChange={applyFilterUpdates}
              />
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-brand/20 px-3 py-2 text-sm font-medium text-brand hover:bg-white"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-brand/20 px-3 py-2 text-sm font-medium text-brand hover:bg-white"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {error && !loading && (
            <p className="mt-2 text-xs text-amber-700">{error}</p>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-brand/60">
              Loading dashboard...
            </div>
          ) : data ? (
            <>
              <div className="mb-5">
                <KpiTileGrid
                  layout={data.kpiTileLayout}
                  markets={data.mapMarkets}
                  selectedMarket={filters.market[0] ?? null}
                  onSelectMarket={(market) =>
                    applyFilterUpdates({ market: market ? [market] : [] })
                  }
                />
              </div>

              <div className="flex items-start gap-5">
                <div className="min-w-0 flex-1 space-y-5">
                  {drilldownSections && (
                    <DrilldownList
                      order={drilldownOrder}
                      onReorder={setDrilldownOrder}
                      sections={drilldownSections}
                    />
                  )}
                  <div className="grid grid-cols-2 gap-5">
                    <PerformanceDrilldown
                      title="Organic and Paid Impressions by Month"
                      monthly={data.impressionsByMonth.monthly}
                      breakdown={data.impressionsByMonth.breakdown}
                      breakdownLabel="By Impression Type"
                      takeaway={data.impressionsByMonth.takeaway}
                      compact
                      showMetricToggle={false}
                      axisLabel="Impressions"
                      lineLabel="Total Impressions"
                    />
                    <PerformanceDrilldown
                      title="Total EMV and Media Efficiency by Month"
                      monthly={data.contentByMonth.monthly}
                      breakdown={data.contentByMonth.breakdown}
                      breakdownLabel="By Value Type"
                      takeaway={data.contentByMonth.takeaway}
                      compact
                      showMetricToggle={false}
                      axisLabel="Value"
                      lineLabel="Total Value"
                      valueFormatter={formatCurrency}
                    />
                  </div>
                  <TopAmbassadors ambassadors={data.topAmbassadors} />
                  <TargetsPacing
                    targets={data.targets}
                    pacingPercent={data.pacingPercent}
                  />
                </div>

                <div className="sticky top-0">
                  <AiInsights insights={data.insights} />
                </div>
              </div>
            </>
          ) : (
            <div className="flex h-64 items-center justify-center text-sm text-brand/60">
              {error ?? "No data available."}
            </div>
          )}
        </main>
    </AppShell>
  );
}
