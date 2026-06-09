"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ACTIVATION_TYPE_CHART_COLORS, CHART_AXIS_COLOR, CHART_GRID_COLOR } from "@/lib/brand-colors";
import { formatCurrency } from "@/lib/format";
import type { SamplingTypeDetail as SamplingTypeDetailData } from "@/lib/types";

interface SamplingTypeDetailProps {
  detail: SamplingTypeDetailData;
}

const MIN_ROS_CONVERSION_PCT = 54;
const MAX_ROS_CONVERSION_PCT = 90;

function syntheticRosConversionPct(rankIndex: number, total: number): number {
  if (total <= 1) return MAX_ROS_CONVERSION_PCT;
  const pct =
    MAX_ROS_CONVERSION_PCT -
    (rankIndex / (total - 1)) * (MAX_ROS_CONVERSION_PCT - MIN_ROS_CONVERSION_PCT);
  return Math.round(pct);
}

export function SamplingTypeDetail({ detail }: SamplingTypeDetailProps) {
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const accentColor =
    ACTIVATION_TYPE_CHART_COLORS[detail.type] ?? ACTIVATION_TYPE_CHART_COLORS.HCT;

  const brandChartData = detail.brandsSampled.slice(0, 8).map((row) => ({
    brand: row.brand,
    samples: row.samples,
  }));

  const topConvertingBrands = [...detail.brandsSampled]
    .sort((a, b) => b.conversionRate - a.conversionRate)
    .slice(0, 8);
  const maxBrandConversion = topConvertingBrands[0]?.conversionRate || 1;

  function brandConversionPercent(rate: number): number {
    return Math.round((rate / maxBrandConversion) * 100);
  }

  const marketRosConversionPct = new Map(
    detail.marketConversion.map((row, index) => [
      row.market,
      syntheticRosConversionPct(index, detail.marketConversion.length),
    ]),
  );

  const marketConversionChartData = detail.marketConversion
    .slice(0, 8)
    .map((row) => ({
      market: row.market,
      conversionPct: marketRosConversionPct.get(row.market) ?? MIN_ROS_CONVERSION_PCT,
    }));

  return (
    <section className="rounded-lg border border-brand/8 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <span
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
        <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
          {detail.title}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Brands Being Sampled
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={brandChartData}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 9, fill: CHART_AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="brand"
                  width={88}
                  tick={{ fontSize: 9, fill: CHART_AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [
                    Number(value ?? 0).toLocaleString(),
                    "Samples",
                  ]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar dataKey="samples" fill={accentColor} radius={[0, 3, 3, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <table className="mt-3 w-full text-[11px]">
            <thead>
              <tr className="border-b border-brand/10 text-left text-muted">
                <th className="pb-1 font-medium">Brand</th>
                <th className="pb-1 font-medium">Samples</th>
                <th className="pb-1 font-medium">ROS</th>
                <th className="pb-1 font-medium">Conv. %</th>
                <th className="pb-1 font-medium">$/Sample</th>
              </tr>
            </thead>
            <tbody>
              {detail.brandsSampled.map((row) => (
                <tr key={row.brand} className="border-b border-brand/5 last:border-0">
                  <td className="py-1 font-medium text-foreground">{row.brand}</td>
                  <td className="py-1 text-brand/80">{row.samples.toLocaleString()}</td>
                  <td className="py-1 text-brand/80">{formatCurrency(row.result)}</td>
                  <td className="py-1 font-semibold text-foreground">
                    {brandConversionPercent(row.conversionRate)}%
                  </td>
                  <td className="py-1 text-brand/80">
                    {row.conversionRate.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Market sample to ROS conversion
          </p>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={marketConversionChartData}
                layout="vertical"
                margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_COLOR} horizontal={false} />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 9, fill: CHART_AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `${value}%`}
                />
                <YAxis
                  type="category"
                  dataKey="market"
                  width={88}
                  tick={{ fontSize: 9, fill: CHART_AXIS_COLOR }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${Number(value ?? 0)}%`, "ROS Conversion"]}
                  contentStyle={{ fontSize: 11 }}
                />
                <Bar
                  dataKey="conversionPct"
                  fill={accentColor}
                  fillOpacity={0.85}
                  radius={[0, 3, 3, 0]}
                  barSize={14}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-1 text-[9px] text-muted">
            Modeled sample-to-ROS conversion rate (54%–90%)
          </p>

          <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Markets Converting Samples to ROS
          </p>
          <div className="max-h-[280px] overflow-y-auto">
            <table className="w-full text-[11px]">
              <thead className="sticky top-0 bg-white">
                <tr className="border-b border-brand/10 text-left text-muted">
                  <th className="pb-1 font-medium">Market</th>
                  <th className="pb-1 font-medium">Samples</th>
                  <th className="pb-1 font-medium">ROS</th>
                  <th className="pb-1 font-medium">Conv. %</th>
                  <th className="pb-1 font-medium">$/Sample</th>
                  <th className="w-6 pb-1" />
                </tr>
              </thead>
              <tbody>
                {detail.marketConversion.map((market) => {
                  const isExpanded = expandedMarket === market.market;
                  return (
                    <Fragment key={market.market}>
                      <tr
                        className="cursor-pointer border-b border-brand/5 hover:bg-surface/60"
                        onClick={() =>
                          setExpandedMarket(isExpanded ? null : market.market)
                        }
                      >
                        <td className="py-1.5 font-medium text-foreground">
                          {market.market}
                        </td>
                        <td className="py-1.5 text-brand/80">
                          {market.samples.toLocaleString()}
                        </td>
                        <td className="py-1.5 text-brand/80">
                          {formatCurrency(market.result)}
                        </td>
                        <td className="py-1.5 font-semibold text-foreground">
                          {marketRosConversionPct.get(market.market) ?? MIN_ROS_CONVERSION_PCT}%
                        </td>
                        <td className="py-1.5 text-brand/80">
                          {market.conversionRate.toFixed(2)}
                        </td>
                        <td className="py-1.5 text-muted">
                          {isExpanded ? (
                            <ChevronDown className="h-3.5 w-3.5" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5" />
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr>
                          <td colSpan={6} className="bg-surface/50 px-3 py-2">
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                              Top Brands in {market.market}
                            </p>
                            <div className="space-y-1">
                              {market.topBrands.map((brand, index) => (
                                <div
                                  key={brand.brand}
                                  className="flex items-center justify-between text-[11px]"
                                >
                                  <span className="text-foreground">
                                    <span className="mr-1.5 text-muted">#{index + 1}</span>
                                    {brand.brand}
                                  </span>
                                  <span className="tabular-nums text-brand/80">
                                    {brand.conversionRate.toFixed(2)} $/sample ·{" "}
                                    {brand.samples.toLocaleString()} samples
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}
