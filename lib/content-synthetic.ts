import { PRODUCT_BRANDS } from "@/lib/brands";
import { MARKET_COORDINATES } from "@/lib/market-coordinates";

export type SentimentLabel = "positive" | "neutral" | "negative";

export type BrandSentimentMarket = {
  market: string;
  positive: number;
  neutral: number;
  negative: number;
  dominant: SentimentLabel;
};

export type BrandSentiment = {
  brand: string;
  markets: BrandSentimentMarket[];
  totals: { positive: number; neutral: number; negative: number };
};

const BRAND_GRADIENTS: Record<string, string> = {
  Baileys: "linear-gradient(135deg, #5c3d2e 0%, #c49a5a 100%)",
  "Buchanan's": "linear-gradient(135deg, #1e3a5f 0%, #d4af37 100%)",
  Bulleit: "linear-gradient(135deg, #8B4513 0%, #f59e0b 100%)",
  "Captain Morgan": "linear-gradient(135deg, #7B2340 0%, #fb8c00 100%)",
  Casamigos: "linear-gradient(135deg, #111827 0%, #d4a574 100%)",
  "Crown Royal": "linear-gradient(135deg, #4c1d95 0%, #fbbf24 100%)",
  Deleon: "linear-gradient(135deg, #1f2937 0%, #c0c0c0 100%)",
  DonJulio: "linear-gradient(135deg, #7B2340 0%, #f5efe6 100%)",
  "Don Julio": "linear-gradient(135deg, #7B2340 0%, #f5efe6 100%)",
  Ciroc: "linear-gradient(135deg, #1f2937 0%, #c0c0c0 100%)",
  Guinness: "linear-gradient(135deg, #111827 0%, #f8fafc 100%)",
  "Johnnie Walker": "linear-gradient(135deg, #7f1d1d 0%, #f59e0b 100%)",
  "Ketel One": "linear-gradient(135deg, #0f172a 0%, #38bdf8 100%)",
  "Mr Black": "linear-gradient(135deg, #1e1b4b 0%, #f97316 100%)",
  Smirnoff: "linear-gradient(135deg, #7B2340 0%, #e2e8f0 100%)",
  Tanqueray: "linear-gradient(135deg, #14532d 0%, #86efac 100%)",
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function dominantSentiment(
  positive: number,
  neutral: number,
  negative: number,
): SentimentLabel {
  if (positive >= neutral && positive >= negative) return "positive";
  if (negative >= neutral && negative >= positive) return "negative";
  return "neutral";
}

export function buildSyntheticBrandSentiment(
  markets: string[],
  brands: string[] = [...PRODUCT_BRANDS],
): BrandSentiment[] {
  return brands.map((brand) => {
    const marketRows = markets
      .filter((market) => MARKET_COORDINATES[market])
      .map((market) => {
        const seed = hashString(`${brand}:${market}`);
        const positive = 38 + (seed % 34);
        const negative = 6 + ((seed >>> 4) % 14);
        const neutral = Math.max(8, 100 - positive - negative);

        return {
          market,
          positive,
          neutral,
          negative,
          dominant: dominantSentiment(positive, neutral, negative),
        };
      });

    const totals = marketRows.reduce(
      (acc, row) => ({
        positive: acc.positive + row.positive,
        neutral: acc.neutral + row.neutral,
        negative: acc.negative + row.negative,
      }),
      { positive: 0, neutral: 0, negative: 0 },
    );

    const count = marketRows.length || 1;
    return {
      brand,
      markets: marketRows,
      totals: {
        positive: Math.round(totals.positive / count),
        neutral: Math.round(totals.neutral / count),
        negative: Math.round(totals.negative / count),
      },
    };
  });
}

const MIN_IMPRESSIONS_TOTAL = 4_500_000;
const MAX_IMPRESSIONS_TOTAL = 62_000_000;
const MIN_ORGANIC_SHARE = 0.18;
const MAX_ORGANIC_SHARE = 0.78;

export function buildSyntheticImpressionsByMarket(
  markets: string[],
): { market: string; organic: number; paid: number; total: number }[] {
  return markets
    .map((market) => {
      const seed = hashString(`imp:${market}`);
      const totalSpread = (seed % 10_000) / 10_000;
      const organicSpread = ((seed >>> 10) % 10_000) / 10_000;

      const total = Math.round(
        MIN_IMPRESSIONS_TOTAL +
          totalSpread * (MAX_IMPRESSIONS_TOTAL - MIN_IMPRESSIONS_TOTAL),
      );
      const organicShare =
        MIN_ORGANIC_SHARE +
        organicSpread * (MAX_ORGANIC_SHARE - MIN_ORGANIC_SHARE);
      const organic = Math.max(0, Math.round(total * organicShare));
      const paid = Math.max(0, total - organic);

      return { market, organic, paid, total };
    })
    .sort((a, b) => b.total - a.total);
}

const MIN_ENG_RATE_PCT = 2.3;
const MAX_ENG_RATE_PCT = 8.4;

export function buildSyntheticEngRateByMarket(
  markets: string[],
): { market: string; avgEngRate: number }[] {
  return markets
    .map((market) => {
      const seed = hashString(`eng:${market}`);
      const spread = (seed % 10_000) / 10_000;
      const pct = MIN_ENG_RATE_PCT + spread * (MAX_ENG_RATE_PCT - MIN_ENG_RATE_PCT);
      const rounded = Math.round(pct * 100) / 100;
      return { market, avgEngRate: rounded / 100 };
    })
    .sort((a, b) => b.avgEngRate - a.avgEngRate);
}

export function getPostGradient(brand: string): string {
  return (
    BRAND_GRADIENTS[brand] ??
    "linear-gradient(135deg, #7B2340 0%, #c49a5a 100%)"
  );
}

export type ShowcasePost = {
  imageUrl: string;
  brand: string;
  platform: "instagram" | "tiktok";
};

/** Curated reel stills — brand labels match the imagery in each tile. */
export const SHOWCASE_POSTS: ShowcasePost[] = [
  {
    imageUrl: "/content-posts/post-01-guinness.png",
    brand: "Guinness",
    platform: "tiktok",
  },
  {
    imageUrl: "/content-posts/post-02-baileys-brunch.png",
    brand: "Baileys",
    platform: "tiktok",
  },
  {
    imageUrl: "/content-posts/post-03-casamigos.png",
    brand: "Casamigos",
    platform: "tiktok",
  },
  {
    imageUrl: "/content-posts/post-04-ketel-one.png",
    brand: "Ketel One",
    platform: "tiktok",
  },
  {
    imageUrl: "/content-posts/post-05-donjulio.png",
    brand: "Don Julio",
    platform: "instagram",
  },
  {
    imageUrl: "/content-posts/post-06-smirnoff.png",
    brand: "Smirnoff",
    platform: "tiktok",
  },
  {
    imageUrl: "/content-posts/post-07-smirnoff-summer.png",
    brand: "Smirnoff",
    platform: "instagram",
  },
  {
    imageUrl: "/content-posts/post-08-baileys-rooftop.png",
    brand: "Baileys",
    platform: "tiktok",
  },
  {
    imageUrl: "/content-posts/post-09-baileys-coffee.png",
    brand: "Baileys",
    platform: "instagram",
  },
  {
    imageUrl: "/content-posts/post-10-ciroc.png",
    brand: "Ciroc",
    platform: "instagram",
  },
];

export function getShowcasePost(rankIndex: number): ShowcasePost | null {
  return SHOWCASE_POSTS[rankIndex] ?? null;
}

export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  negative: "#ef4444",
  neutral: "#eab308",
  positive: "#22c55e",
};
