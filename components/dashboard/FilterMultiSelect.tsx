"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface FilterMultiSelectProps {
  label: string;
  value: string[];
  options: string[];
  allLabel: string;
  onChange: (value: string[]) => void;
}

function getDisplayText(value: string[], allLabel: string): string {
  if (value.length === 0) return allLabel;
  if (value.length === 1) return value[0];
  if (value.length === 2) return value.join(", ");
  return `${value.length} selected`;
}

export function FilterMultiSelect({
  label,
  value,
  options,
  allLabel,
  onChange,
}: FilterMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function toggleOption(option: string) {
    if (value.includes(option)) {
      onChange(value.filter((v) => v !== option));
    } else {
      onChange([...value, option]);
    }
  }

  function selectAll() {
    onChange([]);
  }

  const isAllSelected = value.length === 0;

  return (
    <div ref={containerRef} className="relative">
      <label className="sr-only">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 min-w-[150px] items-center justify-between gap-2 rounded-md border border-[#4A2C1A]/15 bg-white py-0 pl-3 pr-2 text-sm font-medium text-[#3B2314] transition-colors hover:border-[#4A2C1A]/30 focus:border-[#4A2C1A]/40 focus:outline-none focus:ring-2 focus:ring-[#4A2C1A]/10"
      >
        <span className="truncate">{getDisplayText(value, allLabel)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#4A2C1A]/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 max-h-64 min-w-full overflow-y-auto rounded-md border border-[#4A2C1A]/15 bg-white py-1 shadow-lg">
          <button
            type="button"
            onClick={selectAll}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#3B2314] hover:bg-[#F5F0E8]"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                isAllSelected
                  ? "border-[#4A2C1A] bg-[#4A2C1A] text-white"
                  : "border-[#4A2C1A]/30"
              }`}
            >
              {isAllSelected && <Check className="h-3 w-3" />}
            </span>
            {allLabel}
          </button>

          <div className="my-1 h-px bg-[#4A2C1A]/10" />

          {options.map((option) => {
            const selected = value.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#3B2314] hover:bg-[#F5F0E8]"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    selected
                      ? "border-[#4A2C1A] bg-[#4A2C1A] text-white"
                      : "border-[#4A2C1A]/30"
                  }`}
                >
                  {selected && <Check className="h-3 w-3" />}
                </span>
                {option}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
