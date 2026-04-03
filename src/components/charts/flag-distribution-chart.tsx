"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface FlagDistributionChartProps {
  data: { type: string; label: string; count: number }[];
}

export function FlagDistributionChart({ data }: FlagDistributionChartProps) {
  return (
    <div
      className="select-none rounded-lg border border-neutral-200 bg-white p-5 shadow-sm"
      onMouseDown={(e) => e.preventDefault()}
    >
      <h2 className="mb-4 text-sm font-semibold text-neutral-900">
        Flag Distribution by Type
      </h2>
      <div className="h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              width={160}
              tick={{ fontSize: 13, fill: "#4a4e55" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 13,
                border: "1px solid #e2e6eb",
                borderRadius: 6,
              }}
              formatter={(value) => [String(value), "Documents"]}
            />
            <Bar
              dataKey="count"
              radius={[0, 4, 4, 0]}
              barSize={20}
              activeBar={false}
              isAnimationActive={false}
              style={{ outline: "none", cursor: "default" }}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.type}
                  fill="#006fd6"
                  style={{ outline: "none" }}
                  tabIndex={-1}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
