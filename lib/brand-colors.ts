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

/** Bright rainbow palette for chart bars — independent of brand UI colors. */
export const CHART_STACK_COLORS = [
  "#E53935", // red
  "#FB8C00", // orange
  "#FDD835", // yellow
  "#43A047", // green
  "#1E88E5", // blue
  "#8E24AA", // purple
];

export const CHART_LINE_COLOR = "#37474F";
export const CHART_GRID_COLOR = "#E0E0E0";
export const CHART_AXIS_COLOR = "#616161";
