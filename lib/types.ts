export type Brand =
  | "All Brands"
  | "Baileys"
  | "Buchanan's"
  | "Bulleit"
  | "Captain Morgan"
  | "Casamigos"
  | "Crown Royal"
  | "Deleon"
  | "DonJulio"
  | "Guinness"
  | "Johnnie Walker"
  | "Ketel One"
  | "Mr Black"
  | "Smirnoff"
  | "Tanqueray";
export type Region = "All Regions" | "Northeast" | "Southeast" | "Midwest" | "West";
export type Market =
  | "All Markets"
  | "Boston"
  | "New York"
  | "Miami"
  | "Atlanta"
  | "Chicago"
  | "Denver"
  | "Los Angeles"
  | "Seattle";

export interface DashboardFilters {
  brand: Brand;
  region: Region;
  market: Market;
  startDate: Date;
  endDate: Date;
}

export type TargetStatus = "above" | "slightly-below" | "well-below";

export interface KpiMetric {
  label: string;
  value: string;
  change: number;
  sparkline: number[];
  actual: number;
  target: number;
  targetLabel: string;
  status: TargetStatus;
}

export interface MonthlyPerformance {
  month: string;
  spend: number;
  roi: number;
}

export interface BreakdownRow {
  name: string;
  spend: number;
  roi: number;
  change: number;
}

export interface TargetGauge {
  label: string;
  target: string;
  actual: string;
  percent: number;
  percentOfTarget: number;
  status: TargetStatus;
  change: number;
}

export interface AiInsight {
  id: string;
  icon: "trending" | "warning" | "star";
  title: string;
  description: string;
}

export interface DashboardData {
  kpis: KpiMetric[];
  onPremise: {
    monthly: MonthlyPerformance[];
    breakdown: BreakdownRow[];
  };
  offPremise: {
    monthly: MonthlyPerformance[];
    breakdown: BreakdownRow[];
  };
  targets: TargetGauge[];
  pacingPercent: number;
  insights: AiInsight[];
  activePrograms: number;
  markets: number;
}
