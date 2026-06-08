import type { DecodedActivation } from "@/lib/activation-metrics";
import { formatCurrency, formatNumber, formatReach } from "@/lib/format";
import {
  BUDGET_MODES,
  METRIC_DISPLAY,
  TARGET_MODES,
  type ActivationType,
  type MetricKey,
  type ProgramSettings,
} from "@/lib/settings";
import { getTargetStatus } from "@/lib/target-status";
import type { BreakdownRow } from "@/lib/types";

/**
 * Excel import mapping (Activations sheet → program_metrics → decoded):
 *   Reach  → content_reach (×1000) → reach  (People Engaged / QR Code Scans)
 *   Impact → roi (×2.2)            → impact (People Sampled / Redemptions)
 *   Result → return_value           → sales  (Sales in dollars)
 *   spend  → budget per activation  → cost   (Activation spend)
 */

export function getTypeRows(rows: DecodedActivation[], type: ActivationType) {
  return rows.filter((row) => row.activation_type === type);
}

export function getMetricTotal(
  typeRows: DecodedActivation[],
  type: ActivationType,
  metric: MetricKey,
) {
  if (METRIC_DISPLAY[type][metric].format === "currency") {
    return typeRows.reduce((sum, row) => sum + row.sales, 0);
  }

  return typeRows.reduce((sum, row) => sum + row[metric], 0);
}

export function getMetricActual(
  typeRows: DecodedActivation[],
  type: ActivationType,
  metric: MetricKey,
) {
  const count = typeRows.length;
  if (!count) return 0;

  const total = getMetricTotal(typeRows, type, metric);
  return TARGET_MODES[type] === "per_activation" ? total / count : total;
}

export function formatMetricDisplay(
  type: ActivationType,
  metric: MetricKey,
  value: number,
) {
  const format = METRIC_DISPLAY[type][metric].format;

  switch (format) {
    case "number":
      return formatNumber(value);
    case "currency":
      return formatCurrency(value);
    case "compact":
      return metric === "impact" ? value.toFixed(1) : formatReach(value);
  }
}

export function compareTypeMetric(
  typeRows: DecodedActivation[],
  type: ActivationType,
  metric: MetricKey,
  target: number,
) {
  const actual = getMetricActual(typeRows, type, metric);
  const percentOfTarget = target > 0 ? Math.round((actual / target) * 100) : 0;

  return {
    actual,
    target,
    percentOfTarget,
    status: getTargetStatus(actual, target),
  };
}

function computeSalesTarget(
  rows: DecodedActivation[],
  settings: ProgramSettings,
  applicableTypes: ActivationType[],
) {
  let target = 0;

  for (const type of applicableTypes) {
    const typeRows = getTypeRows(rows, type);
    const config = settings.activationTypes[type];

    if (TARGET_MODES[type] === "per_activation") {
      target += config.result * typeRows.length;
    } else {
      target += config.result;
    }
  }

  return target;
}

export function computeProgramSummary(
  rows: DecodedActivation[],
  settings: ProgramSettings,
  applicableTypes: ActivationType[],
) {
  let reachTarget = 0;
  let reachActual = 0;
  let resultActual = 0;

  for (const type of applicableTypes) {
    const typeRows = getTypeRows(rows, type);
    const config = settings.activationTypes[type];
    const mode = TARGET_MODES[type];
    const count = typeRows.length;

    reachActual += getMetricTotal(typeRows, type, "reach");
    resultActual += getMetricTotal(typeRows, type, "result");

    if (mode === "per_activation") {
      reachTarget += config.reach * count;
    } else {
      reachTarget += config.reach;
    }
  }

  const resultTarget = computeSalesTarget(rows, settings, applicableTypes);

  const perActivationTypes = applicableTypes.filter(
    (type) => TARGET_MODES[type] === "per_activation",
  );
  const perActivationRows = rows.filter((row) =>
    perActivationTypes.includes(row.activation_type as ActivationType),
  );

  let impactActual = 0;
  let impactTarget = 0;

  if (perActivationRows.length > 0) {
    impactActual =
      perActivationRows.reduce((sum, row) => sum + row.impact, 0) /
      perActivationRows.length;

    let targetSum = 0;
    let weight = 0;
    for (const type of perActivationTypes) {
      const typeRows = getTypeRows(rows, type);
      if (typeRows.length > 0) {
        targetSum += settings.activationTypes[type].impact * typeRows.length;
        weight += typeRows.length;
      }
    }
    impactTarget = weight > 0 ? targetSum / weight : 0;
  } else if (applicableTypes.includes("Digital Sampling")) {
    const digitalRows = getTypeRows(rows, "Digital Sampling");
    impactActual = getMetricTotal(digitalRows, "Digital Sampling", "impact");
    impactTarget = settings.activationTypes["Digital Sampling"].impact;
  }

  return {
    reach: { actual: reachActual, target: reachTarget },
    impact: { actual: impactActual, target: impactTarget },
    result: { actual: resultActual, target: resultTarget },
  };
}

export function computeKpiMetrics(
  rows: DecodedActivation[],
  settings: ProgramSettings,
  applicableTypes: ActivationType[],
) {
  const summary = computeProgramSummary(rows, settings, applicableTypes);

  const totalImpact = rows.reduce((sum, row) => sum + row.impact, 0);
  let impactTarget = 0;
  for (const type of applicableTypes) {
    const typeRows = getTypeRows(rows, type);
    const config = settings.activationTypes[type];
    if (TARGET_MODES[type] === "per_activation") {
      impactTarget += config.impact * typeRows.length;
    } else {
      impactTarget += config.impact;
    }
  }

  const totalSpend = rows.reduce((sum, row) => sum + row.cost, 0);
  let spendTarget = 0;
  for (const type of applicableTypes) {
    const typeRows = getTypeRows(rows, type);
    const config = settings.activationTypes[type];
    if (BUDGET_MODES[type] === "avg_cost") {
      spendTarget += config.budget * typeRows.length;
    } else {
      spendTarget += config.budget;
    }
  }

  const totalSales = rows.reduce((sum, row) => sum + row.sales, 0);
  const salesTarget = computeSalesTarget(rows, settings, applicableTypes);

  const roi = totalSpend > 0 ? (totalSales / totalSpend) * 100 : 0;
  const roiTarget = spendTarget > 0 ? (salesTarget / spendTarget) * 100 : 0;

  return {
    reach: summary.reach,
    impact: { actual: totalImpact, target: impactTarget },
    results: { actual: totalSales, target: salesTarget },
    spend: { actual: totalSpend, target: spendTarget },
    sales: { actual: totalSales, target: salesTarget },
    roi: { actual: roi, target: roiTarget },
  };
}

export function buildActivationBreakdown(
  rows: DecodedActivation[],
  settings: ProgramSettings,
): BreakdownRow[] {
  const types = [
    ...new Set(rows.map((row) => row.activation_type)),
  ] as ActivationType[];

  return types
    .map((type) => {
      const typeRows = getTypeRows(rows, type);
      const config = settings.activationTypes[type];
      const reach = compareTypeMetric(typeRows, type, "reach", config.reach);
      const impact = compareTypeMetric(typeRows, type, "impact", config.impact);
      const result = compareTypeMetric(typeRows, type, "result", config.result);

      return {
        name: type,
        reach: Math.round(reach.actual),
        impact: Math.round(impact.actual),
        result: Math.round(result.actual),
        change: result.percentOfTarget - 100,
        reachTarget: config.reach,
        impactTarget: config.impact,
        resultTarget: config.result,
        reachStatus: reach.status,
        impactStatus: impact.status,
        resultStatus: result.status,
        reachPercent: reach.percentOfTarget,
        impactPercent: impact.percentOfTarget,
        resultPercent: result.percentOfTarget,
      };
    })
    .sort((a, b) => b.result - a.result);
}
