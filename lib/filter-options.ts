import type { FilterOptions } from "./types";

export function getAvailableMarkets(
  selectedRegions: string[],
  options: FilterOptions,
): string[] {
  const allMarkets = options.markets.filter((m) => m !== "All Markets");
  if (selectedRegions.length === 0) return allMarkets;

  const marketSet = new Set<string>();
  for (const region of selectedRegions) {
    for (const market of options.marketsByRegion[region] ?? []) {
      marketSet.add(market);
    }
  }

  return [...marketSet].sort();
}
