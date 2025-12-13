import React from "react";

type Stats = {
  totalSolved: number;
  cfRating: number;
  progress: number;
};

type Props = {
  stats: Stats;
};

export default function TotalSolved({ stats }: Props) {
  return (
    <div className="flex flex-col justify-center rounded-2xl bg-[#1e293b] p-6 shadow-lg border border-slate-700/50 mt-4 h-[140px]">
      <h2 className="text-lg font-semibold text-white">
        Total Solved: {stats.totalSolved}
      </h2>
      <div className="mt-4">
        <div className="mb-2 flex justify-between text-xs font-medium text-gray-400">
          <span>Next Milestone: {stats.cfRating} Rating</span>
        </div>
        <div className="h-3 w-full rounded-full bg-slate-700">
          <div
            className="h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}