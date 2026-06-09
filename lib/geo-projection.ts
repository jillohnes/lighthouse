/** Lightweight Albers-style projection fit for continental US maps. */

export const MAP_VIEWBOX = { width: 960, height: 600 };

const CONUS_BOUNDS = {
  minLon: -124.8,
  maxLon: -66.9,
  minLat: 24.4,
  maxLat: 49.4,
};

export function projectLonLat(
  lon: number,
  lat: number,
  width = MAP_VIEWBOX.width,
  height = MAP_VIEWBOX.height,
): [number, number] | null {
  if (
    lon < CONUS_BOUNDS.minLon - 5 ||
    lon > CONUS_BOUNDS.maxLon + 5 ||
    lat < CONUS_BOUNDS.minLat - 2 ||
    lat > CONUS_BOUNDS.maxLat + 3
  ) {
    return null;
  }

  const x =
    ((lon - CONUS_BOUNDS.minLon) / (CONUS_BOUNDS.maxLon - CONUS_BOUNDS.minLon)) *
    width;
  const y =
    ((CONUS_BOUNDS.maxLat - lat) / (CONUS_BOUNDS.maxLat - CONUS_BOUNDS.minLat)) *
    height;

  return [x, y];
}

export function ringToSvgPath(
  ring: [number, number][],
  width = MAP_VIEWBOX.width,
  height = MAP_VIEWBOX.height,
): string {
  const parts: string[] = [];

  for (let i = 0; i < ring.length; i++) {
    const [lon, lat] = ring[i];
    const projected = projectLonLat(lon, lat, width, height);
    if (!projected) continue;
    const [x, y] = projected;
    parts.push(`${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  }

  return parts.length ? `${parts.join(" ")} Z` : "";
}
