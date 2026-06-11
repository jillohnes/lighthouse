"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

interface FilterMultiSelectProps {
  label: string;
  value: string[];
  options: string[];
  allLabel: string;
  menuAlign?: "left" | "right";
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
  menuAlign = "left",
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
    <div ref={containerRef} className="relative min-w-0">
      <label className="sr-only">{label}</label>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-brand/15 bg-white py-0 pl-3 pr-2 text-sm font-medium text-foreground transition-colors hover:border-brand/30 focus:border-brand/40 focus:outline-none focus:ring-2 focus:ring-brand/10"
      >
        <span className="truncate">{getDisplayText(value, allLabel)}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-brand/40 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className={`absolute top-full z-50 mt-1 max-h-64 w-max min-w-full max-w-[min(100vw-2rem,280px)] overflow-y-auto rounded-md border border-brand/15 bg-white py-1 shadow-lg ${
            menuAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          <button
            type="button"
            onClick={selectAll}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-surface"
          >
            <span
              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                isAllSelected
                  ? "border-brand bg-brand text-white"
                  : "border-brand/30"
              }`}
            >
              {isAllSelected && <Check className="h-3 w-3" />}
            </span>
            {allLabel}
          </button>

          <div className="my-1 h-px bg-brand/10" />

          {options.map((option) => {
            const selected = value.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggleOption(option)}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-surface"
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    selected
                      ? "border-brand bg-brand text-white"
                      : "border-brand/30"
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
