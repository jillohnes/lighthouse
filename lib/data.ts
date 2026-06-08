import { format } from "date-fns";
import type {
  AiInsight,
  Brand,
  BreakdownRow,
  DashboardData,
  DashboardFilters,
  KpiMetric,
  Market,
  MonthlyPerformance,
  Region,
  TargetGauge,
} from "./types";
import { getTargetStatus } from "./target-status";

const KPI_TARGETS = {
  spend: 3_500_000,
  returnValue: 3_000_000,
  roi: 90,
  samples: 25_000,
  reach: 15_000_000,
  activePrograms: 15,
  markets: 10,
} as const;

const GAUGE_GREEN_THRESHOLD = 98;

const BRAND_COUNT = 14;
const BRAND_SHARE = 1 / BRAND_COUNT;

const BRAND_MULTIPLIERS: Record<Brand, number> = {
  "All Brands": 1,
  Baileys: BRAND_SHARE * 1.2,
  "Buchanan's": BRAND_SHARE * 0.9,
  Bulleit: BRAND_SHARE * 1.1,
  "Captain Morgan": BRAND_SHARE * 1.3,
  Casamigos: BRAND_SHARE * 1.4,
  "Crown Royal": BRAND_SHARE * 1.2,
  Deleon: BRAND_SHARE * 0.8,
  DonJulio: BRAND_SHARE * 1.5,
  Guinness: BRAND_SHARE * 1.0,
  "Johnnie Walker": BRAND_SHARE * 1.4,
  "Ketel One": BRAND_SHARE * 0.9,
  "Mr Black": BRAND_SHARE * 0.7,
  Smirnoff: BRAND_SHARE * 1.1,
  Tanqueray: BRAND_SHARE * 1.0,
};

const REGION_MULTIPLIERS: Record<Region, number> = {
  "All Regions": 1,
  Northeast: 0.28,
  Southeast: 0.22,
  Midwest: 0.26,
  West: 0.24,
};

const MARKET_MULTIPLIERS: Record<Market, number> = {
  "All Markets": 1,
  Boston: 0.14,
  "New York": 0.18,
  Miami: 0.12,
  Atlanta: 0.1,
  Chicago: 0.15,
  Denver: 0.09,
  "Los Angeles": 0.13,
  Seattle: 0.09,
};

const BASE_MONTHLY: MonthlyPerformance[] = [
  { month: "Dec", spend: 520, roi: 72 },
  { month: "Jan", spend: 610, roi: 78 },
  { month: "Feb", spend: 580, roi: 81 },
  { month: "Mar", spend: 640, roi: 85 },
  { month: "Apr", spend: 690, roi: 88 },
  { month: "May", spend: 720, roi: 91 },
];

const ON_PREMISE_BREAKDOWN: BreakdownRow[] = [
  { name: "Bars & Nightlife", spend: 1.2, roi: 92, change: 8.4 },
  { name: "Restaurants", spend: 0.9, roi: 85, change: 5.2 },
  { name: "Hotels", spend: 0.6, roi: 78, change: -2.1 },
  { name: "Sports & Events", spend: 0.5, roi: 95, change: 12.3 },
  { name: "Other", spend: 0.3, roi: 71, change: 1.8 },
];

const OFF_PREMISE_BREAKDOWN: BreakdownRow[] = [
  { name: "Grocery", spend: 1.1, roi: 88, change: 6.7 },
  { name: "Liquor", spend: 0.8, roi: 91, change: 9.1 },
  { name: "Mass", spend: 0.5, roi: 76, change: -1.4 },
  { name: "Convenience", spend: 0.4, roi: 82, change: 3.5 },
  { name: "Other", spend: 0.2, roi: 69, change: 0.9 },
];

const BASE_INSIGHTS: AiInsight[] = [
  {
    id: "1",
    icon: "trending",
    title: "Increase Investment in High ROI Venues",
    description:
      "Bars & Nightlife and Sports & Events are outperforming targets by 12%+. Consider reallocating 15% of spend from underperforming hotel activations.",
  },
  {
    id: "2",
    icon: "warning",
    title: "Off Premise Mass Channel Underperforming",
    description:
      "Mass retail ROI is 8% below target in the Midwest. Review shelf placement and promotional timing for Q3 programs.",
  },
  {
    id: "3",
    icon: "star",
    title: "Content Reach Exceeding Benchmarks",
    description:
      "TTL content reach is 22% above PY driven by influencer partnerships in Southeast markets. Scale similar activations.",
  },
  {
    id: "4",
    icon: "trending",
    title: "Sample Efficiency Improving",
    description:
      "Cost per sample decreased 14% vs PY while conversion rates held steady. Current sampling strategy is highly efficient.",
  },
];

function getMultiplier(filters: DashboardFilters): number {
  const brand = BRAND_MULTIPLIERS[filters.brand];
  const region = filters.region === "All Regions" ? 1 : REGION_MULTIPLIERS[filters.region];
  const market = filters.market === "All Markets" ? 1 : MARKET_MULTIPLIERS[filters.market];

  if (filters.brand !== "All Brands" && filters.region !== "All Regions") {
    return brand * region * 0.85;
  }
  if (filters.brand !== "All Brands" && filters.market !== "All Markets") {
    return brand * market * 0.9;
  }
  if (filters.region !== "All Regions" && filters.market !== "All Markets") {
    return region * market * 1.1;
  }
  if (filters.brand !== "All Brands") return brand;
  if (filters.market !== "All Markets") return market;
  if (filters.region !== "All Regions") return region;
  return 1;
}

function getDateRangeFactor(filters: DashboardFilters): number {
  const months = Math.max(
    1,
    (filters.endDate.getFullYear() - filters.startDate.getFullYear()) * 12 +
      (filters.endDate.getMonth() - filters.startDate.getMonth()) +
      1,
  );
  return Math.min(months / 6, 1);
}

function filterMonthlyData(
  data: MonthlyPerformance[],
  filters: DashboardFilters,
  multiplier: number,
): MonthlyPerformance[] {
  const startMonth = filters.startDate.getMonth();
  const endMonth = filters.endDate.getMonth();
  const monthOrder = ["Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"];

  return data
    .filter((d) => {
      const idx = monthOrder.indexOf(d.month);
      return idx >= startMonth && idx <= endMonth;
    })
    .map((d) => ({
      ...d,
      spend: Math.round(d.spend * multiplier),
      roi: Math.round(d.roi * (0.95 + multiplier * 0.05)),
    }));
}

function scaleBreakdown(rows: BreakdownRow[], multiplier: number): BreakdownRow[] {
  return rows.map((row) => ({
    ...row,
    spend: Math.round(row.spend * multiplier * 10) / 10,
    roi: Math.round(row.roi * (0.96 + multiplier * 0.04)),
    change: Math.round(row.change * (0.9 + multiplier * 0.1) * 10) / 10,
  }));
}

function formatCurrency(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}MM`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function formatReach(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}MM`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toFixed(0);
}

export function getDefaultFilters(): DashboardFilters {
  return {
    brand: "All Brands",
    region: "All Regions",
    market: "All Markets",
    startDate: new Date(2024, 0, 1),
    endDate: new Date(2024, 5, 30),
  };
}

export function getDashboardData(filters: DashboardFilters): DashboardData {
  const multiplier = getMultiplier(filters);
  const dateFactor = getDateRangeFactor(filters);
  const combined = multiplier * dateFactor;

  const spend = 3_700_000 * combined;
  const returnValue = spend * (0.82 + multiplier * 0.05);
  const roi = (returnValue / spend) * 100;
  const samples = 27_400 * combined;
  const reach = 18_200_000 * combined;

  const sparkBase = [62, 68, 71, 75, 79, 84, 87];
  const sparkline = sparkBase.map((v) => Math.round(v * (0.9 + combined * 0.1)));

  const activePrograms = Math.max(1, Math.round(12 * multiplier));
  const marketsCount =
    filters.market !== "All Markets"
      ? 1
      : filters.region !== "All Regions"
        ? Math.max(1, Math.round(8 * REGION_MULTIPLIERS[filters.region]))
        : Math.max(1, Math.round(8 * multiplier));

  const kpis: KpiMetric[] = [
    {
      label: "Spend to Date",
      value: formatCurrency(spend),
      change: 12.4 * multiplier,
      sparkline,
      actual: spend,
      target: KPI_TARGETS.spend,
      targetLabel: formatCurrency(KPI_TARGETS.spend),
      status: getTargetStatus(spend, KPI_TARGETS.spend),
    },
    {
      label: "Return Value",
      value: formatCurrency(returnValue),
      change: 15.8 * multiplier,
      sparkline: sparkline.map((v) => v + 3),
      actual: returnValue,
      target: KPI_TARGETS.returnValue,
      targetLabel: formatCurrency(KPI_TARGETS.returnValue),
      status: getTargetStatus(returnValue, KPI_TARGETS.returnValue),
    },
    {
      label: "ROI to Date",
      value: `${roi.toFixed(1)}%`,
      change: 4.2 * multiplier,
      sparkline: sparkline.map((v) => Math.min(v + 8, 100)),
      actual: roi,
      target: KPI_TARGETS.roi,
      targetLabel: `${KPI_TARGETS.roi}%`,
      status: getTargetStatus(roi, KPI_TARGETS.roi),
    },
    {
      label: "TTL Samples",
      value: formatReach(samples),
      change: 9.6 * multiplier,
      sparkline,
      actual: samples,
      target: KPI_TARGETS.samples,
      targetLabel: formatReach(KPI_TARGETS.samples),
      status: getTargetStatus(samples, KPI_TARGETS.samples),
    },
    {
      label: "TTL Content Reach",
      value: formatReach(reach),
      change: 22.1 * multiplier,
      sparkline: sparkline.map((v) => v + 5),
      actual: reach,
      target: KPI_TARGETS.reach,
      targetLabel: formatReach(KPI_TARGETS.reach),
      status: getTargetStatus(reach, KPI_TARGETS.reach),
    },
    {
      label: "Active Programs",
      value: String(activePrograms),
      change: 0,
      sparkline: [8, 9, 10, 10, 11, 12, activePrograms],
      actual: activePrograms,
      target: KPI_TARGETS.activePrograms,
      targetLabel: String(KPI_TARGETS.activePrograms),
      status: getTargetStatus(activePrograms, KPI_TARGETS.activePrograms),
    },
    {
      label: "Markets",
      value: String(marketsCount),
      change: 0,
      sparkline: [5, 6, 6, 7, 7, 8, marketsCount],
      actual: marketsCount,
      target: KPI_TARGETS.markets,
      targetLabel: String(KPI_TARGETS.markets),
      status: getTargetStatus(marketsCount, KPI_TARGETS.markets),
    },
  ];

  const onPremiseActual = Math.round(87 * (0.95 + multiplier * 0.05));
  const onPremiseTarget = 90;
  const offPremiseActual = Math.round(82 * (0.96 + multiplier * 0.04));
  const offPremiseTarget = 85;
  const spendTarget = 4_500_000;
  const spendPercentOfTarget = Math.round((spend / spendTarget) * 100);

  const targets: TargetGauge[] = [
    {
      label: "On Premise ROI Target",
      target: "90%",
      actual: `${onPremiseActual}%`,
      percent: onPremiseActual,
      percentOfTarget: Math.round((onPremiseActual / onPremiseTarget) * 100),
      status: getTargetStatus(onPremiseActual, onPremiseTarget, GAUGE_GREEN_THRESHOLD),
      change: -2.1,
    },
    {
      label: "Off Premise ROI Target",
      target: "85%",
      actual: `${offPremiseActual}%`,
      percent: offPremiseActual,
      percentOfTarget: Math.round((offPremiseActual / offPremiseTarget) * 100),
      status: getTargetStatus(offPremiseActual, offPremiseTarget, GAUGE_GREEN_THRESHOLD),
      change: -1.8,
    },
    {
      label: "Total Spend Target",
      target: "$4.5MM",
      actual: formatCurrency(spend),
      percent: spendPercentOfTarget,
      percentOfTarget: spendPercentOfTarget,
      status: getTargetStatus(spend, spendTarget, GAUGE_GREEN_THRESHOLD),
      change: 12.4 * multiplier,
    },
  ];

  const insights = BASE_INSIGHTS.map((insight) => {
    if (filters.brand !== "All Brands") {
      return {
        ...insight,
        description: insight.description.replace(
          "underperforming",
          `underperforming for ${filters.brand}`,
        ),
      };
    }
    if (filters.region !== "All Regions") {
      return {
        ...insight,
        description: insight.description.replace(
          "Midwest",
          filters.region,
        ),
      };
    }
    return insight;
  });

  return {
    kpis,
    onPremise: {
      monthly: filterMonthlyData(BASE_MONTHLY, filters, multiplier),
      breakdown: scaleBreakdown(ON_PREMISE_BREAKDOWN, multiplier),
    },
    offPremise: {
      monthly: filterMonthlyData(BASE_MONTHLY, filters, multiplier * 0.92),
      breakdown: scaleBreakdown(OFF_PREMISE_BREAKDOWN, multiplier * 0.92),
    },
    targets,
    pacingPercent: Math.round(82 * dateFactor),
    insights,
    activePrograms: Math.max(1, Math.round(12 * multiplier)),
    markets:
      filters.market !== "All Markets"
        ? 1
        : Math.max(1, Math.round(8 * (filters.region !== "All Regions" ? REGION_MULTIPLIERS[filters.region] : multiplier))),
  };
}

export const FILTER_OPTIONS = {
  brands: [
    "All Brands",
    "Baileys",
    "Buchanan's",
    "Bulleit",
    "Captain Morgan",
    "Casamigos",
    "Crown Royal",
    "Deleon",
    "DonJulio",
    "Guinness",
    "Johnnie Walker",
    "Ketel One",
    "Mr Black",
    "Smirnoff",
    "Tanqueray",
  ] as Brand[],
  regions: ["All Regions", "Northeast", "Southeast", "Midwest", "West"] as Region[],
  markets: [
    "All Markets",
    "Boston",
    "New York",
    "Miami",
    "Atlanta",
    "Chicago",
    "Denver",
    "Los Angeles",
    "Seattle",
  ] as Market[],
};

export function formatFilterDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}
