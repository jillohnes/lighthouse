"use client";

import type { DrilldownSectionId } from "@/lib/dashboard-layout";
import type { BreakdownRow, StackedMonthlyPerformance } from "@/lib/types";
import { PerformanceDrilldown } from "./PerformanceDrilldown";
import { useIdReorder } from "./useReorder";

export interface DrilldownSectionData {
  title: string;
  monthly: StackedMonthlyPerformance[];
  breakdown: BreakdownRow[];
  breakdownLabel: string;
  takeaway: string;
}

interface DrilldownListProps {
  order: DrilldownSectionId[];
  onReorder: (next: DrilldownSectionId[]) => void;
  sections: Record<DrilldownSectionId, DrilldownSectionData>;
}

export function DrilldownList({ order, onReorder, sections }: DrilldownListProps) {
  const { getHandleProps, getDropZoneProps } = useIdReorder(order, onReorder);

  return (
    <div className="grid grid-cols-2 gap-5">
      {order.map((sectionId) => (
        <PerformanceDrilldown
          key={sectionId}
          {...sections[sectionId]}
          compact
          dragHandleProps={getHandleProps(sectionId)}
          dropZoneProps={getDropZoneProps(sectionId)}
        />
      ))}
    </div>
  );
}
