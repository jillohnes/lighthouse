import type { BrandFilter } from "@/lib/brands";

export interface DashboardFilters {
  brand: BrandFilter;
  activationType: string[];
  region: string[];
  market: string[];
  startDate: Date;
  endDate: Date;
}

export interface FilterOptions {
  brands: BrandFilter[];
  activationTypes: string[];
  regions: string[];
  markets: string[];
  marketsByRegion: Record<string, string[]>;
  dateRange: { min: string; max: string };
}

export type TargetStatus = "above" | "slightly-below" | "well-below";
export type KpiPlatformIcon = "instagram" | "tiktok";

export interface KpiMetric {
  label: string;
  value: string;
  change: number;
  sparkline: number[];
  actual: number;
  target: number;
  targetLabel: string;
  status: TargetStatus;
  showTarget?: boolean;
  showStatus?: boolean;
  icons?: KpiPlatformIcon[];
  comparisonLabel?: string;
  valueTone?: "positive" | "negative";
  spendLines?: { label: string; value: string }[];
}

export interface MonthlyPerformance {
  month: string;
  reach: number;
  impact: number;
  result: number;
}

export interface StackedMonthlyPerformance {
  month: string;
  line: { reach: number; impact: number; result: number };
  segments: Record<string, { reach: number; impact: number; result: number }>;
}

export interface PerformanceDrilldownData {
  monthly: StackedMonthlyPerformance[];
  breakdown: BreakdownRow[];
  takeaway: string;
}

export interface BreakdownRow {
  name: string;
  reach: number;
  impact: number;
  result: number;
  change: number;
  reachTarget?: number;
  impactTarget?: number;
  resultTarget?: number;
  reachStatus?: TargetStatus;
  impactStatus?: TargetStatus;
  resultStatus?: TargetStatus;
  reachPercent?: number;
  impactPercent?: number;
  resultPercent?: number;
}

export type TargetMetricKey = "reach" | "impact" | "result";

export interface TargetGauge {
  label: string;
  target: string;
  actual: string;
  percent: number;
  percentOfTarget: number;
  status: TargetStatus;
  change: number;
  activationType: import("@/lib/settings").ActivationType;
  metricKey: TargetMetricKey;
}

export interface AiInsight {
  id: string;
  icon: "trending" | "warning" | "star";
  title: string;
  description: string;
}

export type TopMarketMetric = "reach" | "impact" | "result" | "roi";
export type MarketStatus = "on-track" | "watch" | "at-risk";

export interface TopMarketRow {
  market: string;
  reach: number;
  impact: number;
  result: number;
  roi: number;
  roiPlan: number;
  roiVsPlan: number;
  status: MarketStatus;
  activationRoas: {
    HCT: number | null;
    "Brand Experience": number | null;
    "Digital Sampling": number | null;
  };
}

export interface TopAmbassadorRow {
  name: string;
  market: string;
  organicImpressions: number;
  paidImpressions: number;
}

export interface KpiTileLayout {
  summary: {
    ttlRoi: KpiMetric;
    samplingRoi: KpiMetric;
    contentRoi: KpiMetric;
  };
  hct: {
    roi: KpiMetric;
    totalEngagements: KpiMetric;
    totalSamples: KpiMetric;
    rateOfSale: KpiMetric;
    organicImpressions: KpiMetric;
    paidImpressions: KpiMetric;
    engRate: KpiMetric;
    avgCpc: KpiMetric;
    emv: KpiMetric;
    mediaEfficiency: KpiMetric;
  };
  brandExperience: {
    roi: KpiMetric;
    totalEngagements: KpiMetric;
    totalSamples: KpiMetric;
    rateOfSale: KpiMetric;
  };
  digitalSampling: {
    roi: KpiMetric;
    totalScans: KpiMetric;
    totalRedemptions: KpiMetric;
    rateOfSale: KpiMetric;
    optIns: KpiMetric;
    optInValue: KpiMetric;
  };
}

export interface BrandSampleRow {
  brand: string;
  samples: number;
  reach: number;
  result: number;
  conversionRate: number;
}

export interface MarketConversionRow {
  market: string;
  samples: number;
  result: number;
  conversionRate: number;
  topBrands: BrandSampleRow[];
}

export interface DrinkTrend {
  name: string;
  category: string;
  popularity: number;
}

export interface MarketTrendAnalysis {
  market: string;
  trendingDrinks: DrinkTrend[];
  topPerformingBrands: BrandSampleRow[];
  samples: number;
  result: number;
  conversionRate: number;
  correlationScore: number;
  performanceScore: number;
  insight: string;
  aiRecommendation: string;
}

export interface SamplingTypeDetail {
  type: string;
  title: string;
  brandsSampled: BrandSampleRow[];
  marketConversion: MarketConversionRow[];
}

export interface ContentMarketImpressions {
  market: string;
  organic: number;
  paid: number;
  total: number;
}

export interface ContentMarketEngRate {
  market: string;
  avgEngRate: number;
}

export interface ContentSentimentMarket {
  market: string;
  positive: number;
  neutral: number;
  negative: number;
  dominant: "positive" | "neutral" | "negative";
}

export interface ContentBrandSentiment {
  brand: string;
  markets: ContentSentimentMarket[];
  totals: { positive: number; neutral: number; negative: number };
}

export interface ContentTopPost {
  id: string;
  title: string;
  creator: string;
  handle: string;
  market: string;
  brand: string;
  contentType: string;
  organicImpressions: number;
  paidImpressions: number;
  engRate: number;
  ctr: number;
  imageGradient: string;
  imageUrl: string;
  platform: "instagram" | "tiktok";
}

export interface ContentTopCreator {
  creator: string;
  handle: string;
  market: string;
  brand: string;
  totalImpressions: number;
  totalReach: number;
  avgEngRate: number;
  trendScore: number;
  monthsActive: number;
  trendDirection: "up" | "stable" | "down";
}

export interface ContentDashboardData {
  impressionsByMarket: ContentMarketImpressions[];
  engRateByMarket: ContentMarketEngRate[];
  sentimentByBrand: ContentBrandSentiment[];
  topPosts: ContentTopPost[];
  topCreators: ContentTopCreator[];
}

export interface OnPremiseData {
  byActivationType: PerformanceDrilldownData;
  byLocationType: PerformanceDrilldownData;
  samplingTypes: SamplingTypeDetail[];
  trendAnalysis: MarketTrendAnalysis[];
}

export interface DashboardData {
  kpiTileLayout: KpiTileLayout;
  /** @deprecated Use kpiTileLayout */
  kpis: KpiMetric[];
  /** @deprecated Use kpiTileLayout */
  secondaryKpis: KpiMetric[];
  byActivationType: PerformanceDrilldownData;
  byLocationType: PerformanceDrilldownData;
  impressionsByMonth: PerformanceDrilldownData;
  contentByMonth: PerformanceDrilldownData;
  mapMarkets: TopMarketRow[];
  topAmbassadors: TopAmbassadorRow[];
  targets: TargetGauge[];
  pacingPercent: number;
  insights: AiInsight[];
  totalActivations: number;
  markets: number;
}
