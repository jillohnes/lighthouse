"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChevronDown, TrendingDown, TrendingUp } from "lucide-react";
import type { BreakdownRow, MonthlyPerformance } from "@/lib/types";

interface PerformanceDrilldownProps {
  title: string;
  monthly: MonthlyPerformance[];
  breakdown: BreakdownRow[];
  breakdownLabel: string;
}

const METRICS = ["Reach", "Impact", "Result"] as const;

const METRIC_CONFIG = {
  Reach: { bar: "reach", line: "impact", barName: "Reach", lineName: "Avg Impact", barFmt: (v: number) => `${v}`, lineFmt: (v: number) => `${v}` },
  Impact: { bar: "impact", line: "result", barName: "Impact", lineName: "Result", barFmt: (v: number) => `${v}`, lineFmt: (v: number) => `${(v / 1000).toFixed(0)}K` },
  Result: { bar: "result", line: "reach", barName: "Result", lineName: "Reach", barFmt: (v: number) => `${(v / 1000).toFixed(0)}K`, lineFmt: (v: number) => `${v}` },
} as const;

export function PerformanceDrilldown({
  title,
  monthly,
  breakdown,
  breakdownLabel,
}: PerformanceDrilldownProps) {
  const [activeMetric, setActiveMetric] = useState<(typeof METRICS)[number]>("Reach");
  const config = METRIC_CONFIG[activeMetric];

  return (
    <div className="rounded-lg border border-[#4A2C1A]/8 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#3B2314]">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-[#4A2C1A]/15">
            {METRICS.map((metric) => (
              <button
                key={metric}
                type="button"
                onClick={() => setActiveMetric(metric)}
                className={`px-3 py-1 text-xs font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                  activeMetric === metric
                    ? "bg-[#4A2C1A] text-white"
                    : "text-[#4A2C1A]/70 hover:bg-[#F5F0E8]"
                }`}
              >
                {metric}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="flex items-center gap-1 rounded-md border border-[#4A2C1A]/15 px-2 py-1 text-xs text-[#4A2C1A]/70"
          >
            Monthly
            <ChevronDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_280px] gap-4">
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <ComposedChart data={monthly} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#4A2C1A10" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "#4A2C1A80" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="bar"
                tick={{ fontSize: 11, fill: "#4A2C1A80" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={config.barFmt}
              />
              <YAxis
                yAxisId="line"
                orientation="right"
                tick={{ fontSize: 11, fill: "#4A2C1A80" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={config.lineFmt}
              />
              <Tooltip
                contentStyle={{
                  fontSize: 12,
                  border: "1px solid #4A2C1A15",
                  borderRadius: 8,
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                yAxisId="bar"
                dataKey={config.bar}
                name={config.barName}
                fill="#4A2C1A"
                radius={[3, 3, 0, 0]}
                barSize={28}
              />
              <Line
                yAxisId="line"
                type="monotone"
                dataKey={config.line}
                name={config.lineName}
                stroke="#B5455C"
                strokeWidth={2}
                dot={{ r: 4, fill: "#B5455C", strokeWidth: 0 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#4A2C1A]/50">
            {breakdownLabel}
          </p>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#4A2C1A]/10 text-left text-[#4A2C1A]/50">
                <th className="pb-2 font-medium">Type</th>
                <th className="pb-2 font-medium">Reach</th>
                <th className="pb-2 font-medium">Impact</th>
                <th className="pb-2 font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.map((row) => (
                <tr key={row.name} className="border-b border-[#4A2C1A]/5">
                  <td className="py-2 font-medium text-[#3B2314]">{row.name}</td>
                  <td className="py-2 text-[#4A2C1A]/80">{row.reach.toLocaleString()}</td>
                  <td className="py-2 text-[#4A2C1A]/80">{row.impact}</td>
                  <td className="py-2">
                    <span
                      className={`inline-flex items-center gap-0.5 font-medium ${
                        row.change >= 0 ? "text-emerald-600" : "text-red-500"
                      }`}
                    >
                      {row.change >= 0 ? (
                        <TrendingUp className="h-3 w-3" />
                      ) : (
                        <TrendingDown className="h-3 w-3" />
                      )}
                      {row.result.toLocaleString()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
