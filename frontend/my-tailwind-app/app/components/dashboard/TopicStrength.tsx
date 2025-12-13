"use client";

import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

type RadarItem = {
  subject: string;
  A: number;
  fullMark: number;
};

type Props = {
  data: RadarItem[];
};

export default function TopicStrength({ data }: Props) {
  return (
    <div className="flex h-[320px] flex-col rounded-2xl bg-[#1e293b] p-5 shadow-lg border border-slate-700/50">
      <h2 className="mb-2 text-lg font-semibold text-white">Topic Wise Strength</h2>
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#334155" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 150]}
              tick={false}
              axisLine={false}
            />
            <Radar
              name="Strength"
              dataKey="A"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="#3b82f6"
              fillOpacity={0.2}
            />
            <Radar
              name="Avg"
              dataKey="A"
              stroke="#22c55e"
              strokeWidth={2}
              fill="#22c55e"
              fillOpacity={0.1}
              // Dummy transform for visual overlap
              points={data.map((d) => ({ ...d, value: d.A * 0.8 }))}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}