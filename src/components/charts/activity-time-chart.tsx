"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ActivityTimeChartProps {
  data: { date: string; totalCount: number; flaggedCount: number }[];
}

function formatDateLabel(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}.${month}`;
}

export function ActivityTimeChart({ data }: ActivityTimeChartProps) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 text-sm font-semibold text-neutral-900">
        Booking Activity + Flags Over Time
      </h2>
      <div className="h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ left: 0, right: 20, top: 5, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e6eb" />
            <XAxis
              dataKey="date"
              tickFormatter={formatDateLabel}
              tick={{ fontSize: 12, fill: "#737880" }}
              axisLine={{ stroke: "#e2e6eb" }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#737880" }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                fontSize: 13,
                border: "1px solid #e2e6eb",
                borderRadius: 6,
              }}
              labelFormatter={(label) => {
                const parts = String(label).split("-");
                return `${parts[2]}.${parts[1]}.${parts[0]}`;
              }}
            />
            <Line
              type="monotone"
              dataKey="totalCount"
              name="Total Documents"
              stroke="#737880"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="flaggedCount"
              name="Flagged Documents"
              stroke="#dc2626"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
