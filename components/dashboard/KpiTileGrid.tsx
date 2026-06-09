import type { CSSProperties } from "react";
import type { KpiMetric, KpiTileLayout, TopMarketRow } from "@/lib/types";
import { KpiTile, TILE_MIN_HEIGHT } from "./KpiTile";
import { MarketMapPanel } from "./MarketMapPanel";

interface KpiTileGridProps {
  layout: KpiTileLayout;
  markets: TopMarketRow[];
  selectedMarket?: string | null;
  onSelectMarket?: (market: string) => void;
}

const TILE_GAP = "gap-2";
const ROW_HEIGHT = `minmax(${TILE_MIN_HEIGHT}px, auto)`;

function Tile({
  kpi,
  className,
  style,
}: {
  kpi: KpiMetric;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`min-h-0 min-w-0 ${className ?? ""}`} style={style}>
      <KpiTile kpi={kpi} />
    </div>
  );
}

export function KpiTileGrid({
  layout,
  markets,
  selectedMarket,
  onSelectMarket,
}: KpiTileGridProps) {
  const { summary, hct, brandExperience, digitalSampling } = layout;

  return (
    <div className={`flex w-full items-stretch ${TILE_GAP}`}>
      {/* Left: metric tile grid (~58%) */}
      <div className={`flex min-w-0 flex-[58] flex-col ${TILE_GAP}`}>
        {/* Row 1 — overview ROAS tiles */}
        <div className={`grid grid-cols-3 ${TILE_GAP}`}>
          <Tile kpi={summary.ttlRoi} />
          <Tile kpi={summary.samplingRoi} />
          <Tile kpi={summary.contentRoi} />
        </div>

        {/* Rows 2–4 — HCT block (4 cols × 3 rows) */}
        <div
          className={`grid ${TILE_GAP}`}
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: `repeat(3, ${ROW_HEIGHT})`,
          }}
        >
          <Tile
            kpi={hct.roi}
            style={{ gridColumn: "1", gridRow: "1 / 4" }}
          />
          <Tile
            kpi={hct.totalEngagements}
            style={{ gridColumn: "2", gridRow: "1" }}
          />
          <Tile
            kpi={hct.totalSamples}
            style={{ gridColumn: "3", gridRow: "1" }}
          />
          <Tile
            kpi={hct.rateOfSale}
            style={{ gridColumn: "4", gridRow: "1" }}
          />
          <Tile
            kpi={hct.organicImpressions}
            style={{ gridColumn: "2", gridRow: "2" }}
          />
          <Tile
            kpi={hct.engRate}
            style={{ gridColumn: "3", gridRow: "2" }}
          />
          <Tile kpi={hct.emv} style={{ gridColumn: "4", gridRow: "2" }} />
          <Tile
            kpi={hct.paidImpressions}
            style={{ gridColumn: "2", gridRow: "3" }}
          />
          <Tile kpi={hct.avgCpc} style={{ gridColumn: "3", gridRow: "3" }} />
          <Tile
            kpi={hct.mediaEfficiency}
            style={{ gridColumn: "4", gridRow: "3" }}
          />
        </div>

        {/* Row 5 — Brand Experience */}
        <div className={`grid grid-cols-4 ${TILE_GAP}`}>
          <Tile kpi={brandExperience.roi} />
          <Tile kpi={brandExperience.totalEngagements} />
          <Tile kpi={brandExperience.totalSamples} />
          <Tile kpi={brandExperience.rateOfSale} />
        </div>

        {/* Rows 6–7 — Digital Sampling */}
        <div
          className={`grid ${TILE_GAP}`}
          style={{
            gridTemplateColumns: "repeat(4, 1fr)",
            gridTemplateRows: `repeat(2, ${ROW_HEIGHT})`,
          }}
        >
          <Tile
            kpi={digitalSampling.roi}
            style={{ gridColumn: "1", gridRow: "1 / 3" }}
          />
          <Tile
            kpi={digitalSampling.totalScans}
            style={{ gridColumn: "2", gridRow: "1 / 3" }}
          />
          <Tile
            kpi={digitalSampling.totalRedemptions}
            style={{ gridColumn: "3", gridRow: "1" }}
          />
          <Tile
            kpi={digitalSampling.rateOfSale}
            style={{ gridColumn: "4", gridRow: "1" }}
          />
          <Tile
            kpi={digitalSampling.optIns}
            style={{ gridColumn: "3", gridRow: "2" }}
          />
          <Tile
            kpi={digitalSampling.optInValue}
            style={{ gridColumn: "4", gridRow: "2" }}
          />
        </div>
      </div>

      {/* Right: US market map panel (~42%) */}
      <div className="min-w-0 flex-[42]">
        <MarketMapPanel
          markets={markets}
          selectedMarket={selectedMarket}
          onSelectMarket={onSelectMarket}
        />
      </div>
    </div>
  );
}
