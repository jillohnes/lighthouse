"use client";

import { format } from "date-fns";
import { Calendar, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DayPicker } from "react-day-picker";

interface DateRangePickerProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DateRangePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
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
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(!open)}
        className="flex h-9 min-w-[132px] items-center gap-2 whitespace-nowrap rounded-md border border-[#4A2C1A]/15 bg-white px-3 text-sm font-medium text-[#3B2314] transition-colors hover:border-[#4A2C1A]/30 focus:outline-none focus:ring-2 focus:ring-[#4A2C1A]/10"
      >
        <Calendar className="h-3.5 w-3.5 shrink-0 text-[#4A2C1A]/40" />
        <span className="flex-1 text-left">{format(value, "MMM d, yyyy")}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[#4A2C1A]/40" />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 rounded-lg border border-[#4A2C1A]/10 bg-white p-3 shadow-lg">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={(date) => {
              if (date) {
                onChange(date);
                setOpen(false);
              }
            }}
            disabled={[
              ...(minDate ? [{ before: minDate }] : []),
              ...(maxDate ? [{ after: maxDate }] : []),
            ]}
            classNames={{
              root: "text-sm text-[#4A2C1A]",
              month_caption: "font-semibold text-[#4A2C1A] mb-2",
              day: "rounded-md hover:bg-[#F5F0E8]",
              selected: "bg-[#4A2C1A] text-white hover:bg-[#3B2314]",
              today: "font-bold text-[#B5455C]",
            }}
          />
        </div>
      )}
    </div>
  );
}
