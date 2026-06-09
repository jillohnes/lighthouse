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
        const negative = 6 + ((seed >> 4) % 14);
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

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=480&h=854&q=80`;

/** Brand-appropriate cocktail and social-setting imagery for demo posts. */
const BRAND_POST_IMAGES: Record<string, string[]> = {
  Baileys: [
    IMG("photo-1517487881594-169fbfc8b328"), // irish coffee
    IMG("photo-1578662996442-48f60103fc96"), // creamy dessert cocktail
  ],
  "Buchanan's": [
    IMG("photo-1569529465847-d9e42e968f5f"), // scotch on the rocks
    IMG("photo-1527283130329-9b2a0243f228"), // whisky bar
  ],
  Bulleit: [
    IMG("photo-1470337458703-ead1ab518547"), // bourbon old fashioned
    IMG("photo-1574096079939-0f9a2b332c7c"), // whiskey lounge
  ],
  "Captain Morgan": [
    IMG("photo-1546171753-4d782cedbd6f"), // rum cocktail
    IMG("photo-1551538826-0214b1bb4bde"), // tropical party drinks
  ],
  Casamigos: [
    IMG("photo-1556855810-b55b0b5b7310"), // margarita
    IMG("photo-1551024709-8f23befc6f87"), // tequila social setting
  ],
  "Crown Royal": [
    IMG("photo-1574096079939-0f9a2b332c7c"), // whiskey lounge
    IMG("photo-1516594798947-95f2526f3568"), // upscale bar night
  ],
  Deleon: [
    IMG("photo-1551024709-8f23befc6f87"), // tequila bar
    IMG("photo-1556855810-b55b0b5b7310"), // premium margarita
  ],
  DonJulio: [
    IMG("photo-1556855810-b55b0b5b7310"), // margarita
    IMG("photo-1546171753-4d782cedbd6f"), // paloma-style citrus cocktail
  ],
  Guinness: [
    IMG("photo-1608270582010-0e885a3af208"), // stout pint
    IMG("photo-1436076863939-06870fe779c2"), // pub social setting
  ],
  "Johnnie Walker": [
    IMG("photo-1527283130329-9b2a0243f228"), // scotch whisky bar
    IMG("photo-1569529465847-d9e42e968f5f"), // neat pour
  ],
  "Ketel One": [
    IMG("photo-1514362542647-f74a85b2c5d1"), // vodka martini
    IMG("photo-1536935338788-8889b310654c"), // modern cocktail bar
  ],
  "Mr Black": [
    IMG("photo-1510594002179-0a16d1d3d1b5"), // espresso martini
    IMG("photo-1495474472287-4d71bcdd2085"), // coffee cocktail bar
  ],
  Smirnoff: [
    IMG("photo-1551538826-0214b1bb4bde"), // house party cocktails
    IMG("photo-1514362542647-f74a85b2c5d1"), // vodka mixed drink
  ],
  Tanqueray: [
    IMG("photo-1566417713940-b7a4a922f107"), // gin & tonic
    IMG("photo-1536935338788-8889b310654c"), // rooftop gin cocktails
  ],
};

const DEFAULT_POST_IMAGES = [
  IMG("photo-1514362542647-f74a85b2c5d1"),
  IMG("photo-1470337458703-ead1ab518547"),
];

export function getPostImageUrl(brand: string, postId: string): string {
  const urls = BRAND_POST_IMAGES[brand] ?? DEFAULT_POST_IMAGES;
  const index = hashString(`img:${postId}`) % urls.length;
  return urls[index]!;
}

export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  negative: "#ef4444",
  neutral: "#eab308",
  positive: "#22c55e",
};
