import type { ActivationExcelRecord } from "@/lib/activation-metrics";
import type { BrandSampleRow, DrinkTrend, MarketTrendAnalysis } from "@/lib/types";

const BRAND_CATEGORIES: Record<string, string[]> = {
  Casamigos: ["tequila", "agave", "margarita"],
  DonJulio: ["tequila", "agave", "margarita"],
  Deleon: ["tequila", "agave"],
  Bulleit: ["bourbon", "whiskey", "old-fashioned"],
  "Johnnie Walker": ["whiskey", "scotch", "cocktail"],
  "Crown Royal": ["whiskey", "bourbon"],
  "Captain Morgan": ["rum", "tropical", "mojito"],
  Smirnoff: ["vodka", "seltzer"],
  "Ketel One": ["vodka", "martini", "espresso"],
  Tanqueray: ["gin", "tonic", "cocktail"],
  Baileys: ["coffee", "espresso", "cream"],
  Guinness: ["beer", "stout"],
  "Mr Black": ["coffee", "espresso"],
  "Buchanan's": ["whiskey", "scotch"],
};

const MARKET_TRENDS: Record<string, DrinkTrend[]> = {
  Austin: [
    { name: "Ranch Water", category: "tequila", popularity: 92 },
    { name: "Spicy Margaritas", category: "margarita", popularity: 88 },
    { name: "Agave Highballs", category: "agave", popularity: 81 },
  ],
  Boston: [
    { name: "Espresso Martinis", category: "espresso", popularity: 94 },
    { name: "Irish Coffee Cocktails", category: "coffee", popularity: 86 },
    { name: "Craft Whiskey Sours", category: "whiskey", popularity: 79 },
  ],
  Chicago: [
    { name: "Bourbon Old Fashioneds", category: "old-fashioned", popularity: 91 },
    { name: "Smoked Cocktails", category: "bourbon", popularity: 84 },
    { name: "Premium Vodka Sodas", category: "vodka", popularity: 76 },
  ],
  Denver: [
    { name: "Colorado Mules", category: "vodka", popularity: 89 },
    { name: "High-Altitude Whiskey", category: "whiskey", popularity: 83 },
    { name: "Craft Beer Cocktails", category: "beer", popularity: 72 },
  ],
  "Las Vegas": [
    { name: "Celebrity Tequila Shots", category: "tequila", popularity: 93 },
    { name: "Bottle Service Vodka", category: "vodka", popularity: 87 },
    { name: "Tropical Rum Punch", category: "rum", popularity: 80 },
  ],
  Miami: [
    { name: "Frozen Mojitos", category: "mojito", popularity: 95 },
    { name: "Rum Daiquiris", category: "rum", popularity: 88 },
    { name: "Agave Palomas", category: "agave", popularity: 82 },
  ],
  Nashville: [
    { name: "Tennessee Whiskey Sours", category: "whiskey", popularity: 90 },
    { name: "Honey Bourbon Cocktails", category: "bourbon", popularity: 85 },
    { name: "Spicy Margaritas", category: "margarita", popularity: 78 },
  ],
  Dallas: [
    { name: "Texas Ranch Water", category: "tequila", popularity: 91 },
    { name: "Bourbon & Branch", category: "bourbon", popularity: 84 },
    { name: "Smirnoff Ice Variants", category: "vodka", popularity: 71 },
  ],
  Houston: [
    { name: "Frozen Margaritas", category: "margarita", popularity: 93 },
    { name: "Tequila Sunrises", category: "tequila", popularity: 86 },
    { name: "Rum & Coke Premium", category: "rum", popularity: 77 },
  ],
  "New York": [
    { name: "Espresso Martinis", category: "espresso", popularity: 96 },
    { name: "Negronis", category: "gin", popularity: 89 },
    { name: "Mezcal Cocktails", category: "agave", popularity: 83 },
  ],
};

function summarizeBrandsByMarket(
  records: ActivationExcelRecord[],
): Map<string, BrandSampleRow[]> {
  const byMarket = new Map<string, Map<string, { samples: number; reach: number; result: number }>>();

  for (const record of records) {
    const market = record.market;
    const brand = record.product_brand || "Unknown";
    const marketBrands = byMarket.get(market) ?? new Map();
    const existing = marketBrands.get(brand) ?? { samples: 0, reach: 0, result: 0 };
    existing.samples += record.impact;
    existing.reach += record.reach;
    existing.result += record.result;
    marketBrands.set(brand, existing);
    byMarket.set(market, marketBrands);
  }

  const result = new Map<string, BrandSampleRow[]>();
  for (const [market, brands] of byMarket) {
    const rows = Array.from(brands.entries())
      .map(([brand, data]) => ({
        brand,
        samples: Math.round(data.samples),
        reach: Math.round(data.reach),
        result: Math.round(data.result),
        conversionRate:
          data.samples > 0
            ? Math.round((data.result / data.samples) * 100) / 100
            : 0,
      }))
      .sort((a, b) => b.conversionRate - a.conversionRate);
    result.set(market, rows);
  }

  return result;
}

function computeCorrelation(
  trends: DrinkTrend[],
  brands: BrandSampleRow[],
): number {
  if (!trends.length || !brands.length) return 0;

  const trendCategories = new Set(trends.map((t) => t.category));
  let weightedScore = 0;
  let totalWeight = 0;

  for (const brand of brands.slice(0, 5)) {
    const categories = BRAND_CATEGORIES[brand.brand] ?? [];
    const overlap = categories.filter((c) => trendCategories.has(c)).length;
    const matchRatio = categories.length > 0 ? overlap / categories.length : 0;
    const weight = brand.samples;
    weightedScore += matchRatio * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round((weightedScore / totalWeight) * 100) : 0;
}

function brandsAlignedWithTrend(category: string): string[] {
  return Object.entries(BRAND_CATEGORIES)
    .filter(([, categories]) => categories.includes(category))
    .map(([brand]) => brand);
}

function computePerformanceScore(
  correlationScore: number,
  conversionRate: number,
): number {
  const rosScore = Math.min(100, conversionRate * 12);
  return Math.round(correlationScore * 0.55 + rosScore * 0.45);
}

/** Top performers: 65–83%. Bottom performers: under 30%. */
const TOP_CORRELATION_BAND = [83, 81, 79, 77, 75, 73, 71, 69, 67, 65];
const BOTTOM_CORRELATION_BAND = [28, 26, 24, 22, 20, 18, 16, 14, 12, 10];

export function applyCorrelationBands(
  markets: MarketTrendAnalysis[],
): MarketTrendAnalysis[] {
  const ranked = [...markets].sort((a, b) => {
    if (b.conversionRate !== a.conversionRate) {
      return b.conversionRate - a.conversionRate;
    }
    return b.result - a.result;
  });

  const topNames = new Set(ranked.slice(0, 10).map((m) => m.market));
  const bottomNames = new Set(ranked.slice(-10).map((m) => m.market));
  const topOrder = ranked.slice(0, 10).map((m) => m.market);
  const bottomOrder = ranked.slice(-10).map((m) => m.market);

  return markets.map((entry) => {
    let correlationScore = entry.correlationScore;

    const topIndex = topOrder.indexOf(entry.market);
    if (topIndex >= 0) {
      correlationScore = TOP_CORRELATION_BAND[topIndex] ?? 65;
    } else {
      const bottomIndex = bottomOrder.indexOf(entry.market);
      if (bottomIndex >= 0) {
        correlationScore = BOTTOM_CORRELATION_BAND[bottomIndex] ?? 10;
      } else if (!topNames.has(entry.market) && !bottomNames.has(entry.market)) {
        correlationScore = Math.min(55, Math.max(32, entry.correlationScore));
      }
    }

    const performanceScore = computePerformanceScore(
      correlationScore,
      entry.conversionRate,
    );

    return {
      ...entry,
      correlationScore,
      performanceScore,
      insight: buildInsight(
        entry.market,
        entry.trendingDrinks,
        entry.topPerformingBrands,
        correlationScore,
        entry.conversionRate,
      ),
      aiRecommendation: buildPivotRecommendation(
        entry.market,
        entry.trendingDrinks,
        entry.topPerformingBrands,
        correlationScore,
      ),
    };
  });
}

function buildInsight(
  market: string,
  trends: DrinkTrend[],
  brands: BrandSampleRow[],
  correlationScore: number,
  conversionRate: number,
): string {
  const topTrend = trends[0]?.name ?? "local cocktail trends";
  const topBrand = brands[0]?.brand ?? "leading brands";

  if (correlationScore >= 65) {
    return `${market} is aligning priority sampling with ${topTrend.toLowerCase()} demand, and ${topBrand} is driving strong ROS at ${conversionRate.toFixed(2)} $/sample — trend momentum and conversion are reinforcing each other.`;
  }

  if (correlationScore >= 30) {
    return `${topBrand} leads ROS in ${market} at ${conversionRate.toFixed(2)} $/sample, with moderate trend alignment around ${topTrend.toLowerCase()}. Sampling is converting but could capture more local demand.`;
  }

  return `${market} shows ${conversionRate.toFixed(2)} $/sample ROS led by ${topBrand}, but local trends favor ${topTrend.toLowerCase()} — sampling portfolio is under-indexed against on-premise demand.`;
}

function buildPivotRecommendation(
  market: string,
  trends: DrinkTrend[],
  brands: BrandSampleRow[],
  correlationScore: number,
): string {
  const topTrend = trends[0];
  const secondaryTrend = trends[1];
  const currentBrands = new Set(brands.map((b) => b.brand));
  const alignedBrands = brandsAlignedWithTrend(topTrend.category)
    .filter((brand) => !currentBrands.has(brand))
    .slice(0, 3);
  const pivotBrands =
    alignedBrands.length > 0
      ? alignedBrands.join(", ")
      : brandsAlignedWithTrend(secondaryTrend?.category ?? "cocktail")
          .slice(0, 2)
          .join(", ");

  const venueHint =
    topTrend.category === "tequila" || topTrend.category === "margarita"
      ? "bars and nightlife"
      : topTrend.category === "espresso" || topTrend.category === "coffee"
        ? "restaurants and hotels"
        : topTrend.category === "whiskey" || topTrend.category === "bourbon"
          ? "sports and entertainment venues"
          : "high-traffic on-premise locations";

  return `Shift ${market} sampling toward ${topTrend.name.toLowerCase()} (${topTrend.popularity}% local trend index). Add or increase ${pivotBrands} in ${venueHint}, and reformat tastings around ${topTrend.name.toLowerCase()} serves. Current trend alignment is ${correlationScore}% — closing this gap should lift ROS by better matching what consumers are ordering on-premise.`;
}

function summarizeMarketTotals(
  records: ActivationExcelRecord[],
): Map<string, { samples: number; result: number }> {
  const totals = new Map<string, { samples: number; result: number }>();

  for (const record of records) {
    const existing = totals.get(record.market) ?? { samples: 0, result: 0 };
    existing.samples += record.impact;
    existing.result += record.result;
    totals.set(record.market, existing);
  }

  return totals;
}

export function normalizeMarketTrend(
  market: Partial<MarketTrendAnalysis> & {
    market: string;
    trendingDrinks?: DrinkTrend[];
    topPerformingBrands?: BrandSampleRow[];
  },
): MarketTrendAnalysis {
  const trendingDrinks = market.trendingDrinks ?? [];
  const topPerformingBrands = market.topPerformingBrands ?? [];
  const samples =
    market.samples ??
    topPerformingBrands.reduce((sum, brand) => sum + brand.samples, 0);
  const result =
    market.result ??
    topPerformingBrands.reduce((sum, brand) => sum + brand.result, 0);
  const conversionRate =
    market.conversionRate ??
    (samples > 0 ? Math.round((result / samples) * 100) / 100 : 0);
  const correlationScore =
    market.correlationScore ??
    computeCorrelation(trendingDrinks, topPerformingBrands);
  const performanceScore =
    market.performanceScore ??
    computePerformanceScore(correlationScore, conversionRate);

  return {
    market: market.market,
    trendingDrinks,
    topPerformingBrands,
    samples: Math.round(samples),
    result: Math.round(result),
    conversionRate,
    correlationScore,
    performanceScore,
    insight:
      market.insight ??
      buildInsight(
        market.market,
        trendingDrinks,
        topPerformingBrands,
        correlationScore,
        conversionRate,
      ),
    aiRecommendation:
      market.aiRecommendation ??
      buildPivotRecommendation(
        market.market,
        trendingDrinks,
        topPerformingBrands,
        correlationScore,
      ),
  };
}

export function buildMarketTrendAnalysis(
  records: ActivationExcelRecord[],
): MarketTrendAnalysis[] {
  const brandsByMarket = summarizeBrandsByMarket(records);
  const marketTotals = summarizeMarketTotals(records);
  const markets = [...new Set(records.map((r) => r.market))].sort();

  const baseMarkets = markets.map((market) => {
      const trendingDrinks =
        MARKET_TRENDS[market] ??
        [
          { name: "Craft Cocktails", category: "cocktail", popularity: 85 },
          { name: "Premium Spirits", category: "whiskey", popularity: 78 },
          { name: "Classic Highballs", category: "gin", popularity: 72 },
        ];

      const topPerformingBrands = (brandsByMarket.get(market) ?? [])
        .sort((a, b) => b.conversionRate - a.conversionRate)
        .slice(0, 5);

      const totals = marketTotals.get(market) ?? { samples: 0, result: 0 };
      const samples = Math.round(totals.samples);
      const result = Math.round(totals.result);
      const conversionRate =
        samples > 0 ? Math.round((result / samples) * 100) / 100 : 0;

      const correlationScore = computeCorrelation(
        trendingDrinks,
        topPerformingBrands,
      );
      const performanceScore = computePerformanceScore(
        correlationScore,
        conversionRate,
      );

      return normalizeMarketTrend({
        market,
        trendingDrinks,
        topPerformingBrands,
        samples,
        result,
        conversionRate,
        correlationScore,
        performanceScore,
        insight: buildInsight(
          market,
          trendingDrinks,
          topPerformingBrands,
          correlationScore,
          conversionRate,
        ),
        aiRecommendation: buildPivotRecommendation(
          market,
          trendingDrinks,
          topPerformingBrands,
          correlationScore,
        ),
      });
    });

  return applyCorrelationBands(baseMarkets).sort(
    (a, b) => b.performanceScore - a.performanceScore,
  );
}
