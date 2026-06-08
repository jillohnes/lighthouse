"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color = "#4A2C1A" }: SparklineProps) {
  const chartData = data.map((value, index) => ({ index, value }));

  return (
    <div className="h-8 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={chartData}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
