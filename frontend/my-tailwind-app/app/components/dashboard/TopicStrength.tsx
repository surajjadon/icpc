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
  // 1. Transform the data here to include the "Avg" value safely
  // This replaces the hack you had in the 'points' prop
  const chartData = data.map((d) => ({
    ...d,
    avgValue: d.A * 0.8, // This is your logic for the visual overlap
  }));

  return (
    <div className="flex h-[320px] flex-col rounded-2xl bg-[#1e293b] p-5 shadow-lg border border-slate-700/50">
      <h2 className="mb-2 text-lg font-semibold text-white">Topic Wise Strength</h2>
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height="100%">
          {/* 2. Pass the transformed 'chartData' instead of raw 'data' */}
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
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
            
            {/* Main Radar */}
           
            
            {/* Avg/Shadow Radar */}
            <Radar
              name="Avg"
              dataKey="avgValue" // 3. Point to the new safe property
              stroke="#22c55e"
              strokeWidth={2}
              fill="#22c55e"
              fillOpacity={0.1}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}