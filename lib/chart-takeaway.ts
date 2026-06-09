import type { BreakdownRow } from "@/lib/types";

export function generateChartTakeaway(
  breakdown: BreakdownRow[],
  dimension: "activation" | "location",
): string {
  if (!breakdown.length) {
    return "No performance data is available for the selected filters.";
  }

  const sorted = [...breakdown].sort((a, b) => b.result - a.result);
  const leader = sorted[0];
  const totalReach = breakdown.reduce((sum, row) => sum + row.reach, 0);
  const totalResult = breakdown.reduce((sum, row) => sum + row.result, 0);
  const reachShare =
    totalReach > 0 ? Math.round((leader.reach / totalReach) * 100) : 0;
  const resultShare =
    totalResult > 0 ? Math.round((leader.result / totalResult) * 100) : 0;

  const dimensionLabel =
    dimension === "activation" ? "activation type" : "location type";
  const belowTarget = breakdown.filter(
    (row) => row.resultPercent !== undefined && row.resultPercent < 98,
  );

  if (reachShare >= 60) {
    return `${leader.name} accounts for ${reachShare}% of reach and ${resultShare}% of results, making it the primary driver across ${dimensionLabel}s in this view.`;
  }

  if (belowTarget.length > 0 && belowTarget.length < breakdown.length) {
    const laggards = belowTarget.map((row) => row.name).join(" and ");
    return `${leader.name} is outperforming on results, while ${laggards} ${belowTarget.length === 1 ? "is" : "are"} still tracking below target and may need a tactical shift.`;
  }

  if (leader.resultPercent !== undefined && leader.resultPercent >= 100) {
    return `${leader.name} is leading on results at ${leader.resultPercent}% of target, with performance spread relatively evenly across ${dimensionLabel}s.`;
  }

  return `${leader.name} is the top-performing ${dimensionLabel} on results, contributing ${resultShare}% of total sales impact in the selected period.`;
}
