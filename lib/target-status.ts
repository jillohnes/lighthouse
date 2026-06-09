import type { TargetStatus } from "./types";

export const TARGET_GREEN_THRESHOLD = 95;
export const TARGET_YELLOW_THRESHOLD = 70;

export function getTargetStatus(
  actual: number,
  target: number,
  greenThreshold = TARGET_GREEN_THRESHOLD,
): TargetStatus {
  if (target <= 0) return "above";
  const percentOfTarget = (actual / target) * 100;
  if (percentOfTarget >= greenThreshold) return "above";
  if (percentOfTarget < TARGET_YELLOW_THRESHOLD) return "well-below";
  return "slightly-below";
}

export function getBudgetStatus(actual: number, target: number): TargetStatus {
  if (target <= 0) return "above";
  const percentOfTarget = (actual / target) * 100;
  if (percentOfTarget <= 100) return "above";
  if (percentOfTarget > 130) return "well-below";
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

export const KPI_STATUS_STYLES: Record<
  TargetStatus,
  { bg: string; badge: string; label: string }
> = {
  above: {
    bg: "bg-emerald-50/70",
    badge: "bg-emerald-500 text-white",
    label: "Above Target",
  },
  "slightly-below": {
    bg: "bg-amber-50/70",
    badge: "bg-amber-400 text-white",
    label: "Below Target",
  },
  "well-below": {
    bg: "bg-red-50/70",
    badge: "bg-red-500 text-white",
    label: "Well Below Target",
  },
};
