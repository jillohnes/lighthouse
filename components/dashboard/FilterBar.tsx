"use client";

import { useEffect, useMemo, useState } from "react";
import { FILTER_OPTIONS } from "@/lib/data";
import { getAvailableMarkets } from "@/lib/filter-options";
import type { DashboardFilters, FilterOptions } from "@/lib/types";
import { DateRangePicker } from "./DateRangePicker";
import { FilterField } from "./FilterField";
import { FilterMultiSelect } from "./FilterMultiSelect";
import { FilterSelect } from "./FilterSelect";

interface FilterBarProps {
  filters: DashboardFilters;
  onChange: <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K],
  ) => void;
  onBatchChange: (updates: Partial<DashboardFilters>) => void;
}

export function FilterBar({ filters, onChange, onBatchChange }: FilterBarProps) {
  const [options, setOptions] = useState<FilterOptions>(FILTER_OPTIONS);

  useEffect(() => {
    fetch("/api/filters")
      .then((res) => res.json())
      .then((json) => {
        if (json.options) setOptions(json.options);
      })
      .catch(() => setOptions(FILTER_OPTIONS));
  }, []);

  const availableMarkets = useMemo(
    () => getAvailableMarkets(filters.region, options),
    [filters.region, options],
  );

  function handleRegionChange(regions: string[]) {
    const allowed = getAvailableMarkets(regions, options);
    const prunedMarkets = filters.market.filter((m) => allowed.includes(m));
    const updates: Partial<DashboardFilters> = { region: regions };
    if (prunedMarkets.length !== filters.market.length) {
      updates.market = prunedMarkets;
    }
    onBatchChange(updates);
  }

  return (
    <div className="flex items-end gap-3 rounded-lg border border-brand/10 bg-white px-4 py-2.5 shadow-sm">
      <FilterField label="Brand">
        <FilterSelect
          label="Brand"
          value={filters.brand}
          options={options.brands}
          onChange={(v) => onChange("brand", v)}
        />
      </FilterField>

      <FilterField label="Activation Type">
        <FilterMultiSelect
          label="Activation Type"
          value={filters.activationType}
          options={options.activationTypes.filter((o) => o !== "All Activation Types")}
          allLabel="All Activation Types"
          onChange={(v) => onChange("activationType", v)}
        />
      </FilterField>

      <FilterField label="Region">
        <FilterMultiSelect
          label="Region"
          value={filters.region}
          options={options.regions.filter((o) => o !== "All Regions")}
          allLabel="All Regions"
          onChange={handleRegionChange}
        />
      </FilterField>

      <FilterField label="Market">
        <FilterMultiSelect
          label="Market"
          value={filters.market}
          options={availableMarkets}
          allLabel="All Markets"
          onChange={(v) => onChange("market", v)}
        />
      </FilterField>

      <div className="mb-2.5 h-5 w-px bg-brand/10" />

      <FilterField label="From">
        <DateRangePicker
          label="Start date"
          value={filters.startDate}
          onChange={(d) => onChange("startDate", d)}
          maxDate={filters.endDate}
        />
      </FilterField>

      <FilterField label="To">
        <DateRangePicker
          label="End date"
          value={filters.endDate}
          onChange={(d) => onChange("endDate", d)}
          minDate={filters.startDate}
        />
      </FilterField>
    </div>
  );
}
