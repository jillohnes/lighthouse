"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { getDefaultFilters } from "@/lib/data";
import { formatDateParam, normalizeLocalDate, parseDateParam } from "@/lib/dates";
import type { DashboardData, DashboardFilters, FilterOptions } from "@/lib/types";
import { AppShell } from "@/components/AppShell";
import { AiInsights } from "./AiInsights";
import { FilterBar } from "./FilterBar";
import { KpiCards } from "./KpiCards";
import { PerformanceDrilldown } from "./PerformanceDrilldown";
import { TargetsPacing } from "./TargetsPacing";

const SUB_NAV_TABS = [
  "Overview",
  "By Activation Type",
  "By Location Type",
  "Targets & Pacing",
  "Historical Performance",
];

function buildQueryString(filters: DashboardFilters): string {
  const params = new URLSearchParams({
    startDate: formatDateParam(filters.startDate),
    endDate: formatDateParam(filters.endDate),
  });
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
  const [activeTab, setActiveTab] = useState("Overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <header className="shrink-0 border-b border-[#4A2C1A]/10 bg-[#F5F0E8] px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <h2 className="shrink-0 text-xl font-bold text-[#3B2314]">
              Trade Program Dashboard
            </h2>

            <FilterBar
              filters={filters}
              onChange={updateFilter}
              onBatchChange={applyFilterUpdates}
            />

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-[#4A2C1A]/20 px-3 py-2 text-sm font-medium text-[#4A2C1A] hover:bg-white"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-md border border-[#4A2C1A]/20 px-3 py-2 text-sm font-medium text-[#4A2C1A] hover:bg-white"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </div>

          {error && !loading && (
            <p className="mt-2 text-xs text-amber-700">{error}</p>
          )}

          <div className="mt-4 flex gap-2">
            {SUB_NAV_TABS.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[#4A2C1A] text-white"
                    : "border border-[#4A2C1A]/20 bg-white text-[#4A2C1A] hover:bg-[#F5F0E8]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center text-sm text-[#4A2C1A]/60">
              Loading dashboard...
            </div>
          ) : data ? (
            <>
              <div className="mb-5">
                <KpiCards kpis={data.kpis} />
              </div>

              <div className="flex items-start gap-5">
                <div className="min-w-0 flex-1 space-y-5">
                  <PerformanceDrilldown
                    title="Performance by Activation Type"
                    monthly={data.byActivationType.monthly}
                    breakdown={data.byActivationType.breakdown}
                    breakdownLabel="By Activation Type"
                  />
                  <PerformanceDrilldown
                    title="Performance by Location Type"
                    monthly={data.byLocationType.monthly}
                    breakdown={data.byLocationType.breakdown}
                    breakdownLabel="By Location Type"
                  />
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
            <div className="flex h-64 items-center justify-center text-sm text-[#4A2C1A]/60">
              {error ?? "No data available."}
            </div>
          )}
        </main>
    </AppShell>
  );
}
