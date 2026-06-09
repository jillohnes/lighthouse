export type DrilldownSectionId = "activation-type" | "location-type";

export const DEFAULT_DRILLDOWN_ORDER: DrilldownSectionId[] = [
  "activation-type",
  "location-type",
];

const KPI_ORDER_KEY = "lighthouse-kpi-order";
const SECONDARY_KPI_ORDER_KEY = "lighthouse-secondary-kpi-order";
const DRILLDOWN_ORDER_KEY = "lighthouse-drilldown-order";
const LEGACY_CHART_ORDER_KEY = "lighthouse-chart-order";

export function loadKpiOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KPI_ORDER_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveKpiOrder(order: string[]) {
  localStorage.setItem(KPI_ORDER_KEY, JSON.stringify(order));
}

export function loadSecondaryKpiOrder(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SECONDARY_KPI_ORDER_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function saveSecondaryKpiOrder(order: string[]) {
  localStorage.setItem(SECONDARY_KPI_ORDER_KEY, JSON.stringify(order));
}

export function loadDrilldownOrder(): DrilldownSectionId[] {
  if (typeof window === "undefined") return DEFAULT_DRILLDOWN_ORDER;
  try {
    const raw =
      localStorage.getItem(DRILLDOWN_ORDER_KEY) ??
      localStorage.getItem(LEGACY_CHART_ORDER_KEY);
    if (!raw) return DEFAULT_DRILLDOWN_ORDER;
    const parsed = JSON.parse(raw) as string[];
    const valid = parsed.filter((id): id is DrilldownSectionId =>
      DEFAULT_DRILLDOWN_ORDER.includes(id as DrilldownSectionId),
    );
    return valid.length === DEFAULT_DRILLDOWN_ORDER.length
      ? valid
      : DEFAULT_DRILLDOWN_ORDER;
  } catch {
    return DEFAULT_DRILLDOWN_ORDER;
  }
}

export function saveDrilldownOrder(order: DrilldownSectionId[]) {
  localStorage.setItem(DRILLDOWN_ORDER_KEY, JSON.stringify(order));
}

export function mergeKpiOrder(
  stored: string[],
  labels: string[],
): string[] {
  const kept = stored.filter((label) => labels.includes(label));
  const added = labels.filter((label) => !kept.includes(label));
  return [...kept, ...added];
}
