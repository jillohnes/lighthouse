"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { MouseEvent } from "react";
import {
  MAP_VIEWBOX,
  projectLonLat,
  ringToSvgPath,
} from "@/lib/geo-projection";
import { MARKET_COORDINATES } from "@/lib/market-coordinates";
import { decodeStateGeometries } from "@/lib/topojson";
import type { TopMarketRow } from "@/lib/types";

const STATUS_FILL: Record<TopMarketRow["status"], string> = {
  "on-track": "#22c55e",
  watch: "#f59e0b",
  "at-risk": "#ef4444",
};

const STATUS_LABEL: Record<TopMarketRow["status"], string> = {
  "on-track": "On track",
  watch: "Watch",
  "at-risk": "At risk",
};

const STATUS_TEXT: Record<TopMarketRow["status"], string> = {
  "on-track": "text-emerald-600",
  watch: "text-amber-600",
  "at-risk": "text-red-600",
};

interface MarketMapPanelProps {
  markets: TopMarketRow[];
  selectedMarket?: string | null;
  onSelectMarket?: (market: string) => void;
}

type StatePath = { id: string; d: string };

const RANKINGS_PER_COLUMN = 15;

const ACTIVATION_ROAS_LABELS = [
  ["HCT", "HCT"] as const,
  ["Brand Experience", "Brand Experience"] as const,
  ["Digital Sampling", "Digital Sampling"] as const,
];

type MapTooltip = {
  market: string;
  x: number;
  y: number;
};

function MarketRankList({
  markets,
  startRank,
  selectedMarket,
  onSelectMarket,
}: {
  markets: TopMarketRow[];
  startRank: number;
  selectedMarket?: string | null;
  onSelectMarket?: (market: string) => void;
}) {
  return (
    <ol className="flex h-full min-h-0 flex-col">
      {markets.map((market, index) => {
        const isSelected = selectedMarket === market.market;
        const rank = startRank + index;

        return (
          <li key={market.market} className="flex min-h-0 flex-1 items-center">
            <button
              type="button"
              onClick={() => onSelectMarket?.(market.market)}
              className={`flex w-full items-center gap-1 rounded px-0.5 py-0.5 text-left text-[9px] leading-none transition-colors ${
                isSelected
                  ? "bg-brand/10 font-semibold text-brand"
                  : "text-foreground hover:bg-brand/5"
              }`}
            >
              <span className="w-3 shrink-0 tabular-nums text-brand/40">
                {rank}
              </span>
              <span
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_FILL[market.status] }}
              />
              <span className="min-w-0 flex-1 truncate">{market.market}</span>
              <span
                className={`shrink-0 tabular-nums font-semibold ${STATUS_TEXT[market.status]}`}
              >
                {market.roiVsPlan}%
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

export function MarketMapPanel({
  markets,
  selectedMarket,
  onSelectMarket,
}: MarketMapPanelProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [statePaths, setStatePaths] = useState<StatePath[]>([]);
  const [tooltip, setTooltip] = useState<MapTooltip | null>(null);

  function updateTooltipPosition(event: MouseEvent, market: string) {
    const container = mapContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    setTooltip({
      market,
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  useEffect(() => {
    fetch("/us-states-topo.json")
      .then((res) => res.json())
      .then((topology) => {
        const states = decodeStateGeometries(topology);
        setStatePaths(
          states
            .map((state) => ({
              id: state.id,
              d: state.rings
                .map((ring) => ringToSvgPath(ring))
                .filter(Boolean)
                .join(" "),
            }))
            .filter((state) => state.d.length > 0),
        );
      })
      .catch(() => setStatePaths([]));
  }, []);

  const markers = useMemo(() => {
    return markets
      .map((row) => {
        const coords = MARKET_COORDINATES[row.market];
        if (!coords) return null;
        const projected = projectLonLat(coords.lon, coords.lat);
        if (!projected) return null;
        const [x, y] = projected;
        return { ...row, x, y };
      })
      .filter((row): row is TopMarketRow & { x: number; y: number } => row !== null);
  }, [markets]);

  const rankedMarkets = useMemo(
    () => [...markets].sort((a, b) => b.roiVsPlan - a.roiVsPlan),
    [markets],
  );

  const leftRankedMarkets = rankedMarkets.slice(0, RANKINGS_PER_COLUMN);
  const rightRankedMarkets = rankedMarkets.slice(RANKINGS_PER_COLUMN);

  const hovered = tooltip
    ? markers.find((m) => m.market === tooltip.market)
    : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col rounded-lg border border-brand/10 bg-surface-raised px-1.5 py-1.5 shadow-sm">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-x-2 gap-y-0.5">
        <p className="text-[9px] font-semibold leading-tight text-brand/70">
          US markets — click to filter
        </p>
        <div className="flex flex-wrap items-center gap-1.5 text-[8px] leading-tight text-muted">
          {(Object.keys(STATUS_FILL) as TopMarketRow["status"][]).map((status) => (
            <span key={status} className="inline-flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_FILL[status] }}
              />
              {STATUS_LABEL[status]}
            </span>
          ))}
          {selectedMarket && (
            <button
              type="button"
              onClick={() => onSelectMarket?.("")}
              className="rounded border border-brand/20 px-1.5 py-0.5 text-[9px] text-brand hover:bg-brand/5"
            >
              Clear filter
            </button>
          )}
        </div>
      </div>

      <div
        ref={mapContainerRef}
        className="relative mt-1 w-full shrink-0 overflow-hidden rounded border border-brand/8 bg-[#faf6f0]"
        style={{ aspectRatio: `${MAP_VIEWBOX.width} / ${MAP_VIEWBOX.height}` }}
        onMouseLeave={() => setTooltip(null)}
      >
        <svg
          viewBox={`0 0 ${MAP_VIEWBOX.width} ${MAP_VIEWBOX.height}`}
          className="h-full w-full"
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-label="United States map with market performance indicators"
        >
          <rect
            x={0}
            y={0}
            width={MAP_VIEWBOX.width}
            height={MAP_VIEWBOX.height}
            fill="#faf6f0"
          />

          <g>
            {statePaths.map((state) => (
              <path
                key={state.id}
                d={state.d}
                fill="#ffffff"
                stroke="#e8c4ce"
                strokeWidth={1}
              />
            ))}
          </g>

          {markers.map((marker) => {
            const isSelected = selectedMarket === marker.market;
            const isHovered = tooltip?.market === marker.market;
            const radius = isSelected || isHovered ? 9 : 7;

            return (
              <g
                key={marker.market}
                className="cursor-pointer"
                onMouseEnter={(event) =>
                  updateTooltipPosition(event, marker.market)
                }
                onMouseMove={(event) =>
                  updateTooltipPosition(event, marker.market)
                }
                onClick={() => onSelectMarket?.(marker.market)}
              >
                {(isSelected || isHovered) && (
                  <circle
                    cx={marker.x}
                    cy={marker.y}
                    r={radius + 4}
                    fill="none"
                    stroke="#7b2340"
                    strokeWidth={2}
                    opacity={0.85}
                  />
                )}
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r={radius}
                  fill={STATUS_FILL[marker.status]}
                  stroke="#ffffff"
                  strokeWidth={2}
                />
                <text
                  x={marker.x}
                  y={marker.y + 20}
                  textAnchor="middle"
                  fontSize={10}
                  fontWeight={isSelected || isHovered ? 700 : 500}
                  fill="#5c3a4a"
                  stroke="#faf6f0"
                  strokeWidth={4}
                  paintOrder="stroke"
                  pointerEvents="none"
                >
                  {marker.market}
                </text>
              </g>
            );
          })}
        </svg>

        {hovered && tooltip && (
          <div
            className="pointer-events-none absolute z-10 max-w-[200px] rounded-md border border-brand/10 bg-white px-2.5 py-2 text-[10px] shadow-md"
            style={{
              left: Math.max(
                8,
                Math.min(
                  tooltip.x + 12,
                  (mapContainerRef.current?.clientWidth ?? 0) - 208,
                ),
              ),
              top: Math.max(
                8,
                Math.min(
                  tooltip.y + 12,
                  (mapContainerRef.current?.clientHeight ?? 0) - 128,
                ),
              ),
            }}
          >
            <p className="font-semibold text-foreground">{hovered.market}</p>
            <p className="mt-0.5 text-muted">
              ROAS vs plan: {hovered.roiVsPlan}% · {STATUS_LABEL[hovered.status]}
            </p>
            <div className="mt-1.5 space-y-0.5 border-t border-brand/8 pt-1.5">
              {ACTIVATION_ROAS_LABELS.map(([key, label]) => {
                const roas = hovered.activationRoas[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-muted">{label}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {roas === null ? "—" : `${roas.toFixed(1)}%`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="mt-1 flex min-h-0 flex-1 flex-col">
        {rankedMarkets.length === 0 ? (
          <p className="text-[8px] text-muted">No market data for the selected filters.</p>
        ) : (
          <div className="grid h-full min-h-0 grid-cols-2 gap-x-2">
            <MarketRankList
              markets={leftRankedMarkets}
              startRank={1}
              selectedMarket={selectedMarket}
              onSelectMarket={onSelectMarket}
            />
            <MarketRankList
              markets={rightRankedMarkets}
              startRank={RANKINGS_PER_COLUMN + 1}
              selectedMarket={selectedMarket}
              onSelectMarket={onSelectMarket}
            />
          </div>
        )}
      </div>
    </div>
  );
}
