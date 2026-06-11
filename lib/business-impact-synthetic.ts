import type { ActivationExcelRecord } from "@/lib/activation-metrics";
import type { ContentMetricRecord } from "@/lib/content-metrics";
import type { BrandMarketDepletionCorrelation } from "@/lib/types";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function buildSyntheticDepletionCases(
  brand: string,
  month: string,
  activityTotal: number,
): number {
  const seed = hashString(`depl:${brand}:${month}`);
  const base = 800 + (seed % 2200);
  const activityBoost = Math.round(activityTotal * 0.0008);
  const drift = ((seed >>> 6) % 21) - 10;
  return Math.max(400, base + activityBoost + drift);
}

type MarketActivity = {
  brand: string;
  market: string;
  hctSamples: number;
  brandLedSamples: number;
  digitalSamples: number;
  organicImpressions: number;
  paidImpressions: number;
};

function summarizeActivity(
  activations: ActivationExcelRecord[],
  contentRows: ContentMetricRecord[],
): MarketActivity[] {
  const byKey = new Map<string, MarketActivity>();

  function getEntry(brand: string, market: string): MarketActivity {
    const key = `${brand}::${market}`;
    const existing = byKey.get(key);
    if (existing) return existing;

    const entry: MarketActivity = {
      brand,
      market,
      hctSamples: 0,
      brandLedSamples: 0,
      digitalSamples: 0,
      organicImpressions: 0,
      paidImpressions: 0,
    };
    byKey.set(key, entry);
    return entry;
  }

  for (const row of activations) {
    const brand = row.product_brand || "Unknown";
    const entry = getEntry(brand, row.market);
    const type = row.activation_type;

    if (type === "HCT") {
      entry.hctSamples += row.impact;
    } else if (type === "Brand Experience") {
      entry.brandLedSamples += row.impact;
    } else if (type === "Digital Sampling") {
      entry.digitalSamples += row.impact;
    }
  }

  for (const row of contentRows) {
    const brand = row.product_brand || "Unknown";
    const entry = getEntry(brand, row.market);
    entry.organicImpressions += row.organic_impressions;
    entry.paidImpressions += row.paid_impressions;
  }

  return Array.from(byKey.values()).filter(
    (entry) =>
      entry.hctSamples +
        entry.brandLedSamples +
        entry.digitalSamples +
        entry.organicImpressions +
        entry.paidImpressions >
      0,
  );
}

function activityTotal(entry: MarketActivity): number {
  return (
    entry.hctSamples +
    entry.brandLedSamples +
    entry.digitalSamples +
    Math.round(entry.organicImpressions / 1000) +
    Math.round(entry.paidImpressions / 1000)
  );
}

function buildCorrelationInsight(
  entry: MarketActivity,
  correlationScore: number,
  depletionIndex: number,
): string {
  const drivers: string[] = [];
  if (entry.hctSamples > 0) drivers.push("HCT sampling");
  if (entry.brandLedSamples > 0) drivers.push("brand-led sampling");
  if (entry.digitalSamples > 0) drivers.push("digital sampling");
  if (entry.organicImpressions > 0) drivers.push("organic impressions");
  if (entry.paidImpressions > 0) drivers.push("paid impressions");

  const driverText =
    drivers.length > 0 ? drivers.slice(0, 3).join(", ") : "program activity";

  if (correlationScore >= 65) {
    return `${entry.brand} in ${entry.market} shows strong alignment (${correlationScore}%) between ${driverText} and modeled depletion (${depletionIndex.toLocaleString()} cases index) — activity is reinforcing off-premise velocity.`;
  }

  if (correlationScore >= 35) {
    return `${entry.brand} in ${entry.market} has moderate depletion correlation (${correlationScore}%) — ${driverText} is contributing, but depletion index (${depletionIndex.toLocaleString()}) suggests room to tighten market focus.`;
  }

  return `${entry.brand} in ${entry.market} is under-indexed on depletion (${correlationScore}% correlation) despite ${driverText} — modeled depletion (${depletionIndex.toLocaleString()}) is not keeping pace with activity mix.`;
}

export function buildBrandMarketCorrelations(
  activations: ActivationExcelRecord[],
  contentRows: ContentMetricRecord[],
  selectedBrand?: string,
): BrandMarketDepletionCorrelation[] {
  const entries = summarizeActivity(activations, contentRows).filter((entry) =>
    selectedBrand && selectedBrand !== "All Brands"
      ? entry.brand === selectedBrand
      : true,
  );

  if (!entries.length) return [];

  const activityValues = entries.map((entry) => activityTotal(entry));
  const maxActivity = Math.max(...activityValues, 1);

  const raw = entries.map((entry) => {
    const total = activityTotal(entry);
    const activityNorm = total / maxActivity;
    const depletionIndex = buildSyntheticDepletionCases(
      entry.brand,
      entry.market,
      total,
    );
    const depletionNorm = depletionIndex / 4500;
    const alignment = 1 - Math.min(1, Math.abs(activityNorm - depletionNorm));
    const seed = hashString(`corr:${entry.brand}:${entry.market}`);
    const jitter = ((seed % 11) - 5) / 100;
    const correlationScore = Math.round(
      Math.min(88, Math.max(12, alignment * 78 + 12 + jitter * 100)),
    );

    return {
      brand: entry.brand,
      market: entry.market,
      activityScore: Math.round(total),
      depletionIndex,
      correlationScore,
      activityBreakdown: {
        hctSamples: Math.round(entry.hctSamples),
        brandLedSamples: Math.round(entry.brandLedSamples),
        digitalSamples: Math.round(entry.digitalSamples),
        organicImpressions: Math.round(entry.organicImpressions),
        paidImpressions: Math.round(entry.paidImpressions),
      },
      insight: buildCorrelationInsight(entry, correlationScore, depletionIndex),
    };
  });

  const ranked = [...raw].sort((a, b) => b.correlationScore - a.correlationScore);
  const topNames = new Set(ranked.slice(0, 8).map((row) => `${row.brand}::${row.market}`));
  const bottomNames = new Set(
    ranked.slice(-8).map((row) => `${row.brand}::${row.market}`),
  );

  const TOP_BAND = [84, 81, 78, 75, 72, 69, 67, 65];
  const BOTTOM_BAND = [28, 25, 22, 19, 17, 15, 13, 11];

  return raw
    .map((entry) => {
      const key = `${entry.brand}::${entry.market}`;
      const topIndex = ranked
        .slice(0, 8)
        .findIndex((row) => `${row.brand}::${row.market}` === key);
      const bottomIndex = ranked
        .slice(-8)
        .findIndex((row) => `${row.brand}::${row.market}` === key);

      let correlationScore = entry.correlationScore;
      if (topIndex >= 0) {
        correlationScore = TOP_BAND[topIndex] ?? 65;
      } else if (bottomIndex >= 0) {
        correlationScore = BOTTOM_BAND[bottomIndex] ?? 12;
      } else if (!topNames.has(key) && !bottomNames.has(key)) {
        correlationScore = Math.min(58, Math.max(34, correlationScore));
      }

      return {
        ...entry,
        correlationScore,
        insight: buildCorrelationInsight(
          {
            brand: entry.brand,
            market: entry.market,
            hctSamples: entry.activityBreakdown.hctSamples,
            brandLedSamples: entry.activityBreakdown.brandLedSamples,
            digitalSamples: entry.activityBreakdown.digitalSamples,
            organicImpressions: entry.activityBreakdown.organicImpressions,
            paidImpressions: entry.activityBreakdown.paidImpressions,
          },
          correlationScore,
          entry.depletionIndex,
        ),
      };
    })
    .sort((a, b) => b.correlationScore - a.correlationScore);
}
