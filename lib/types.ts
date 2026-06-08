export interface DashboardFilters {
  activationType: string[];
  region: string[];
  market: string[];
  startDate: Date;
  endDate: Date;
}

export interface FilterOptions {
  activationTypes: string[];
  regions: string[];
  markets: string[];
  marketsByRegion: Record<string, string[]>;
  dateRange: { min: string; max: string };
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
  reach: number;
  impact: number;
  result: number;
}

export interface BreakdownRow {
  name: string;
  reach: number;
  impact: number;
  result: number;
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
  byActivationType: {
    monthly: MonthlyPerformance[];
    breakdown: BreakdownRow[];
  };
  byLocationType: {
    monthly: MonthlyPerformance[];
    breakdown: BreakdownRow[];
  };
  targets: TargetGauge[];
  pacingPercent: number;
  insights: AiInsight[];
  totalActivations: number;
  markets: number;
}
