import type { TargetStatus } from "./types";

export function getTargetStatus(
  actual: number,
  target: number,
  greenThreshold = 100,
): TargetStatus {
  const percentOfTarget = (actual / target) * 100;
  if (percentOfTarget >= greenThreshold) return "above";
  if (percentOfTarget < 70) return "well-below";
  return "slightly-below";
}

export const STATUS_STYLES: Record<
  TargetStatus,
  { fill: string; bar: string; text: string }
> = {
  above: {
    fill: "#10B981",
    bar: "bg-emerald-500",
    text: "text-emerald-700",
  },
  "slightly-below": {
    fill: "#F59E0B",
    bar: "bg-amber-400",
    text: "text-amber-700",
  },
  "well-below": {
    fill: "#EF4444",
    bar: "bg-red-500",
    text: "text-red-600",
  },
};
