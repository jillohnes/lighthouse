/** Brand palette — core maroon is column 4, top swatch. */
export const BRAND = {
  maroon: "#7B2340",
  maroonDark: "#5C1F30",
  maroonDarker: "#4A1525",
  maroonLight: "#F8E8EC",
  brown: "#5C3D2E",
  terracotta: "#C4623A",
  magenta: "#B8336A",
  cream: "#F5EFE6",
  gold: "#C49A5A",
  black: "#1A1A1A",
  text: "#2D1A1F",
  muted: "#6B5258",
} as const;

export const CHART_LIGHT_BLUE = "#4FC3F7";
export const CHART_DARK_BLUE = "#1565C0";
export const CHART_PURPLE = "#8E24AA";
export const CHART_ORANGE = "#FB8C00";
export const CHART_DARK_GREY = "#616161";
export const CHART_YELLOW = "#FDD835";
export const CHART_MAROON = BRAND.maroon;

/** Bright palette for chart bars — green/orange/yellow swapped to light blue/purple. */
export const CHART_STACK_COLORS = [
  "#E53935", // red
  CHART_PURPLE,
  "#7B1FA2", // deep purple
  CHART_LIGHT_BLUE,
  "#1E88E5", // blue
  CHART_PURPLE,
];

/** Fixed colors for activation-type drilldown charts. */
export const ACTIVATION_TYPE_CHART_COLORS: Record<string, string> = {
  HCT: CHART_LIGHT_BLUE,
  HTC: CHART_LIGHT_BLUE,
  "Digital Sampling": "#1E88E5",
  "Brand Experience": CHART_PURPLE,
};

/** Fixed colors for location-type drilldown charts. */
export const LOCATION_TYPE_CHART_COLORS: Record<string, string> = {
  "Bars & Nightlife": CHART_LIGHT_BLUE,
  "Casinos & Clubs": CHART_DARK_BLUE,
  Restaurants: CHART_ORANGE,
  "Entertainment & Sports": CHART_MAROON,
  "Hotels & Hospitality": CHART_PURPLE,
  Travel: CHART_DARK_GREY,
  Other: CHART_YELLOW,
};

export const CHART_LINE_COLOR = "#37474F";
export const CHART_GRID_COLOR = "#E0E0E0";
export const CHART_AXIS_COLOR = "#616161";
