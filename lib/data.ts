import { format } from "date-fns";
import { ALL_BRANDS_LABEL, BRAND_OPTIONS } from "@/lib/brands";
import type { DashboardFilters, FilterOptions } from "./types";

export function getDefaultFilters(): DashboardFilters {
  return {
    brand: ALL_BRANDS_LABEL,
    activationType: [],
    region: [],
    market: [],
    startDate: new Date(2027, 0, 1),
    endDate: new Date(2027, 5, 30),
  };
}

export const FILTER_OPTIONS: FilterOptions = {
  brands: [...BRAND_OPTIONS],
  activationTypes: ["All Activation Types", "HCT", "Digital Sampling", "Brand Experience"],
  regions: ["All Regions", "Central", "East", "MidWest", "South", "West"],
  markets: [
    "All Markets",
    "Austin", "Baltimore", "Boston", "Charlotte", "Chicago", "Columbus",
    "Dallas", "Denver", "Detroit", "El Paso", "Fort Worth", "Houston",
    "Indianapolis", "Jacksonville", "Las Vegas", "Los Angeles", "Louisville",
    "Milwaukee", "Nashville", "New York", "Oklahoma City", "Philadelphia",
    "Phoenix", "Portland", "San Antonio", "San Diego", "San Francisco",
    "San Jose", "Seattle", "Washington",
  ],
  marketsByRegion: {
    Central: ["Austin", "Dallas", "El Paso", "Fort Worth", "Houston", "Oklahoma City", "San Antonio"],
    East: ["Baltimore", "Boston", "New York", "Philadelphia", "Washington"],
    MidWest: ["Chicago", "Columbus", "Detroit", "Indianapolis", "Milwaukee"],
    South: ["Charlotte", "Jacksonville", "Louisville", "Nashville"],
    West: ["Denver", "Las Vegas", "Los Angeles", "Phoenix", "Portland", "San Diego", "San Francisco", "San Jose", "Seattle"],
  },
  dateRange: { min: "2027-01-01", max: "2027-06-30" },
};

export function formatFilterDate(date: Date): string {
  return format(date, "MMM d, yyyy");
}
