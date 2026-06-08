"use client";

import { ChevronDown } from "lucide-react";

interface FilterSelectProps<T extends string> {
  label: string;
  value: T;
  options: T[];
  onChange: (value: T) => void;
}

export function FilterSelect<T extends string>({
  label,
  value,
  options,
  onChange,
}: FilterSelectProps<T>) {
  return (
    <div className="relative">
      <label className="sr-only">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="h-9 min-w-[150px] appearance-none rounded-md border border-[#4A2C1A]/15 bg-white py-0 pl-3 pr-8 text-sm font-medium text-[#3B2314] transition-colors hover:border-[#4A2C1A]/30 focus:border-[#4A2C1A]/40 focus:outline-none focus:ring-2 focus:ring-[#4A2C1A]/10"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#4A2C1A]/40" />
    </div>
  );
}
