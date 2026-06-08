"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { getTargetStatus, STATUS_STYLES } from "@/lib/target-status";
import type { TargetGauge, TargetStatus } from "@/lib/types";

interface TargetsPacingProps {
  targets: TargetGauge[];
  pacingPercent: number;
}

const GAUGE_GREEN_THRESHOLD = 98;

function GaugeChart({
  percent,
  status,
}: {
  percent: number;
  status: TargetStatus;
}) {
  const colors = STATUS_STYLES[status];
  const data = [{ value: percent }, { value: 100 - percent }];

  return (
    <div className="relative h-[90px] w-[90px]">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={30}
            outerRadius={42}
            startAngle={90}
            endAngle={-270}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={colors.fill} />
            <Cell fill="#F5F0E8" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-lg font-bold ${colors.text}`}>{percent}%</span>
      </div>
    </div>
  );
}

export function TargetsPacing({ targets, pacingPercent }: TargetsPacingProps) {
  const pacingStatus = getTargetStatus(pacingPercent, 100, GAUGE_GREEN_THRESHOLD);
  const pacingColors = STATUS_STYLES[pacingStatus];

  return (
    <div className="rounded-lg border border-[#4A2C1A]/8 bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-[#3B2314]">
        Targets & Pacing Summary
      </h3>

      <div className="flex flex-wrap items-center gap-8">
        {targets.map((target) => {
          const colors = STATUS_STYLES[target.status];

          return (
            <div key={target.label} className="flex items-center gap-3">
              <GaugeChart percent={target.percent} status={target.status} />
              <div>
                <p className="text-[11px] font-medium text-[#4A2C1A]/60">{target.label}</p>
                <p className="text-sm font-bold text-[#3B2314]">
                  {target.actual}{" "}
                  <span className="text-xs font-normal text-[#4A2C1A]/50">
                    / {target.target}
                  </span>
                </p>
                <p className={`text-[10px] font-semibold ${colors.text}`}>
                  {target.percentOfTarget}% of target
                </p>
                {target.change < 0 && (
                  <span className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-red-500">
                    <TrendingDown className="h-3 w-3" />
                    {target.change.toFixed(1)}%
                  </span>
                )}
                {target.change > 0 && (
                  <span className="mt-0.5 inline-flex items-center gap-0.5 text-[11px] font-medium text-emerald-600">
                    <TrendingUp className="h-3 w-3" />
                    +{target.change.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          );
        })}

        <div className="ml-auto max-w-[200px] flex-1">
          <p className="mb-2 text-[11px] font-medium text-[#4A2C1A]/60">Pacing to Goal</p>
          <div className="h-3 w-full overflow-hidden rounded-full bg-[#F5F0E8]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${pacingColors.bar}`}
              style={{ width: `${pacingPercent}%` }}
            />
          </div>
          <p className={`mt-1 text-xs font-medium ${pacingColors.text}`}>
            {pacingPercent}% of Year Elapsed
          </p>
        </div>
      </div>
    </div>
  );
}
