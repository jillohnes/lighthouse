"use client";

import { FILTER_OPTIONS } from "@/lib/data";
import type { Brand, DashboardFilters, Market, Region } from "@/lib/types";
import { DateRangePicker } from "./DateRangePicker";
import { FilterField } from "./FilterField";
import { FilterSelect } from "./FilterSelect";

interface FilterBarProps {
  filters: DashboardFilters;
  onChange: <K extends keyof DashboardFilters>(
    key: K,
    value: DashboardFilters[K],
  ) => void;
}

export function FilterBar({ filters, onChange }: FilterBarProps) {
  return (
    <div className="flex items-end gap-3 rounded-lg border border-[#4A2C1A]/10 bg-white px-4 py-2.5 shadow-sm">
      <FilterField label="Brand">
        <FilterSelect
          label="Brand"
          value={filters.brand}
          options={FILTER_OPTIONS.brands}
          onChange={(v) => onChange("brand", v as Brand)}
        />
      </FilterField>

      <FilterField label="Region">
        <FilterSelect
          label="Region"
          value={filters.region}
          options={FILTER_OPTIONS.regions}
          onChange={(v) => onChange("region", v as Region)}
        />
      </FilterField>

      <FilterField label="Market">
        <FilterSelect
          label="Market"
          value={filters.market}
          options={FILTER_OPTIONS.markets}
          onChange={(v) => onChange("market", v as Market)}
        />
      </FilterField>

      <div className="mb-2.5 h-5 w-px bg-[#4A2C1A]/10" />

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
