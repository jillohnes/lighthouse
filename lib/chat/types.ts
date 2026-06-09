export interface ChatContext {
  filters: {
    brand: string;
    activationType: string[];
    region: string[];
    market: string[];
    startDate: string;
    endDate: string;
  };
  summary: {
    totalActivations: number;
    markets: number;
    pacingPercent: number;
  };
  roas: {
    ttlRoi: string;
    samplingRoi: string;
    contentRoi: string;
    hctRoi: string;
    brandExperienceRoi: string;
    digitalSamplingRoi: string;
  };
  programTotals: {
    totalEngagements: string;
    totalSamples: string;
    totalResults: string;
    optIns: string;
    optInValue: string;
  };
  activationBreakdown: {
    name: string;
    reach: number;
    impact: number;
    result: number;
    reachPercent?: number;
    impactPercent?: number;
    resultPercent?: number;
  }[];
  locationBreakdown: {
    name: string;
    reach: number;
    impact: number;
    result: number;
  }[];
  monthlyActivationTotals: {
    month: string;
    reach: number;
    impact: number;
    result: number;
  }[];
  topMarkets: {
    market: string;
    reach: number;
    impact: number;
    result: number;
    roi: number;
    status: string;
  }[];
  topAmbassadors: {
    name: string;
    market: string;
    organicImpressions: number;
    paidImpressions: number;
  }[];
  content: {
    impressionsTakeaway: string;
    emvTakeaway: string;
  };
  insights: { title: string; description: string }[];
  analysis: {
    programNarrative: string;
    trendInsight: string;
    contentInsight: string;
    crossSignals: string[];
    activationInsights: string[];
    locationInsights: string[];
    marketInsights: string[];
    risks: string[];
    opportunities: string[];
    prebuiltInsights: string[];
  };
}
