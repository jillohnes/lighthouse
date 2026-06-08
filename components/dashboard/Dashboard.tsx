"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Share2 } from "lucide-react";
import { getDefaultFilters } from "@/lib/data";
import type { DashboardData, DashboardFilters } from "@/lib/types";
import { AiInsights } from "./AiInsights";
import { FilterBar } from "./FilterBar";
import { KpiCards } from "./KpiCards";
import { PerformanceDrilldown } from "./PerformanceDrilldown";
import { Sidebar } from "./Sidebar";
import { TargetsPacing } from "./TargetsPacing";

const SUB_NAV_TABS = [
  "Overview",
  "On Premise",
  "Off Premise",
  "Targets & Pacing",
  "Historical Performance",
];

function buildQueryString(filters: DashboardFilters): string {
  const params = new URLSearchParams({
    brand: filters.brand,
    region: filters.region,
    market: filters.market,
    startDate: filters.startDate.toISOString().slice(0, 10),
    endDate: filters.endDate.toISOString().slice(0, 10),
  });
  return params.toString();
}

export function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilters>(getDefaultFilters);
  const [activeTab, setActiveTab] = useState("Overview");
  const [data, setData] = useState<DashboardData | null>(null);
  const [dataSource, setDataSource] = useState<"mock" | "supabase">("mock");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (currentFilters: DashboardFilters) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?${buildQueryString(currentFilters)}`);
      const json = await res.json();
      setData(json.data);
      setDataSource(json.source);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(filters);
  }, [filters, fetchData]);

  function updateFilter<K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K],
  ) {
    setFilters((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "startDate" && (value as Date) > next.endDate) {
        next.endDate = value as Date;
      }
      if (key === "endDate" && (value as Date) < next.startDate) {
        next.startDate = value as Date;
      }
      return next;
    });
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F5F0E8]">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-[#4A2C1A]/10 bg-[#F5F0E8] px-6 py-4">
          <div className="flex items-center justify-between gap-6">
            <h2 className="shrink-0 text-xl font-bold text-[#3B2314]">
              Trade Program Dashboard
            </h2>

            <FilterBar filters={filters} onChange={updateFilter} />

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

          {dataSource === "mock" && !loading && (
            <p className="mt-2 text-xs text-amber-700">
              Showing sample data — connect Supabase and import your Excel file to see live data.
            </p>
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
          {loading || !data ? (
            <div className="flex h-64 items-center justify-center text-sm text-[#4A2C1A]/60">
              Loading dashboard...
            </div>
          ) : (
            <>
              <div className="mb-5">
                <KpiCards kpis={data.kpis} />
              </div>

              <div className="flex items-start gap-5">
                <div className="min-w-0 flex-1 space-y-5">
                  <PerformanceDrilldown
                    title="On Premise Performance Drill Down"
                    monthly={data.onPremise.monthly}
                    breakdown={data.onPremise.breakdown}
                    breakdownLabel="By Venue Type"
                  />
                  <PerformanceDrilldown
                    title="Off Premise Performance Drill Down"
                    monthly={data.offPremise.monthly}
                    breakdown={data.offPremise.breakdown}
                    breakdownLabel="By Retailer Type"
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
          )}
        </main>
      </div>
    </div>
  );
}
