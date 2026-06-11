"use client";

import { format } from "date-fns";
import { normalizeLocalDate } from "@/lib/dates";
import { Calendar, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

interface DateRangePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
  menuAlign?: "left" | "right";
}

export function DateRangePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
  menuAlign = "right",
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative min-w-0">
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full min-w-0 items-center gap-1.5 rounded-md border border-brand/15 bg-white px-2.5 text-sm font-medium text-foreground transition-colors hover:border-brand/30 focus:outline-none focus:ring-2 focus:ring-brand/10"
      >
        <Calendar className="h-3.5 w-3.5 shrink-0 text-brand/40" />
        <span className="min-w-0 flex-1 truncate text-left">
          {format(value, "MMM d, yyyy")}
        </span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-brand/40" />
      </button>
      {open && (
        <div
          className={`absolute top-full z-50 mt-1.5 rounded-lg border border-brand/10 bg-white p-3 shadow-lg ${
            menuAlign === "right" ? "right-0" : "left-0"
          }`}
        >
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              if (date) {
                onChange(normalizeLocalDate(date));
                setOpen(false);
              }
            }}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            classNames={{
              root: "text-sm text-brand",
              month_caption: "font-semibold text-brand mb-2",
              day: "rounded-md hover:bg-surface",
              selected: "bg-brand text-white hover:bg-brand-darker",
              today: "font-bold text-accent",
            }}
          />
        </div>
      )}
    </div>
  );
}
