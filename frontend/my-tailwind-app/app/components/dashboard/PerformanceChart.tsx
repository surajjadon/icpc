"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ChevronDown } from "lucide-react";

// --- Types ---
type ChartData = {
  date: string;
  fullDate?: string;
  official: number;
  performance: number;
};

type HistoryRow = {
  date: string;
  contest: string;
  platform: string;
  rank: string;
  change: string;
  level: string;
};

type Props = {
  chartData: ChartData[];
  history: HistoryRow[];
};

type FilterType = "Last Week" | "Last Month" | "Last 6 Month" | "Last Year" | "All";

export default function PerformanceChart({ chartData, history }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterType>("All");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { filteredChartData, filteredHistory } = useMemo(() => {
    if (activeFilter === "All") return { filteredChartData: chartData, filteredHistory: history };
    const now = new Date();
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);

    if (activeFilter === "Last Week") cutoff.setDate(now.getDate() - 7);
    else if (activeFilter === "Last Month") cutoff.setDate(now.getDate() - 30);
    else if (activeFilter === "Last 6 Month") cutoff.setMonth(now.getMonth() - 6);
    else if (activeFilter === "Last Year") cutoff.setFullYear(now.getFullYear() - 1);

    const newChartData = chartData.filter((item) => {
      const dateStr = item.fullDate || item.date;
      return new Date(dateStr) >= cutoff;
    });

    const newHistory = history.filter((row) => new Date(row.date) >= cutoff);
    return { filteredChartData: newChartData, filteredHistory: newHistory };
  }, [activeFilter, chartData, history]);

  const filters: FilterType[] = ["Last Week", "Last Month", "Last 6 Month", "Last Year", "All"];

  return (
    <>
      <style jsx global>{`
        /* Target the specific container */
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #475569 transparent;
        }
        
        /* WEB KITS (Chrome, Safari, Edge) */
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px; /* Height for Horizontal Scrollbar */
          width: 8px;  /* Width for Vertical Scrollbar */
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #475569; /* Slate-600 */
          border-radius: 99px;
          border: 2px solid #1e293b; /* Creates padding effect */
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #64748b; /* Slate-500 */
        }
        /* The corner where scrollbars meet */
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: transparent;
        }
      `}</style>

      <div className="flex flex-col bg-[#1e293b] rounded-xl p-4 sm:p-6 shadow-xl border border-slate-800">
        
        {/* --- Header --- */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between z-20">
          <div>
            <h2 className="text-lg font-bold text-white tracking-wide">
              Performance Analysis
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 justify-between sm:justify-start">
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-1 bg-green-500 rounded-full"></div>
                <span className="text-green-500 uppercase tracking-wider">Official</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-1 bg-blue-500 rounded-full"></div>
                <span className="text-blue-500 uppercase tracking-wider">Performance</span>
              </div>
            </div>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-4 py-2 rounded-lg border border-slate-700 transition-colors w-full sm:w-[140px] justify-between cursor-pointer"
              >
                <span>{activeFilter}</span>
                <ChevronDown size={14} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-[140px] bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50">
                  {filters.map((filter) => (
                    <button
                      key={filter}
                      onClick={() => { setActiveFilter(filter); setIsDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-xs hover:bg-slate-700 transition-colors cursor-pointer ${activeFilter === filter ? "text-blue-400 font-bold bg-slate-700/50" : "text-slate-300"}`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- Chart --- */}
        <div className="h-[250px] sm:h-[280px] w-full -ml-2 z-0 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} vertical={false} />
              <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} dy={10} interval="preserveStartEnd" minTickGap={20} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 11 }} domain={["auto", "auto"]} width={35} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", color: "#fff", fontSize: "12px", borderRadius: "8px" }}
                itemStyle={{ padding: 0 }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line type="monotone" dataKey="official" stroke="#22c55e" strokeWidth={2} dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="performance" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: "#1e293b", stroke: "#3b82f6", strokeWidth: 2 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* --- Table with DUAL SCROLLBARS --- */}
        {/* 1. custom-scrollbar: Applies the styling
            2. overflow-auto: Enables BOTH X and Y scrolling 
            3. max-h-[300px]: Forces vertical scroll if content > 300px
        */}
        <div className="w-full mt-6 pb-2 overflow-auto custom-scrollbar max-h-[300px] border-t border-slate-800/50">
          {filteredHistory.length === 0 ? (
            <div className="text-center text-slate-500 text-sm py-8">
              No contests found in this time range.
            </div>
          ) : (
            <table className="w-full min-w-[650px] text-left text-sm border-collapse">
              {/* Sticky Header ensures header stays visible while scrolling vertically */}
              <thead className="text-[10px] font-bold uppercase text-slate-500 tracking-wider sticky top-0 bg-[#1e293b] z-10 shadow-sm shadow-slate-900/10">
                <tr>
                  <th className="pb-4 pt-4 font-bold w-[100px]">Date</th>
                  <th className="pb-4 pt-4 font-bold">Contest</th>
                  <th className="pb-4 pt-4 pr-4 font-bold text-right">Rank</th>
                  <th className="pb-4 pt-4 pr-5 font-bold text-right">Rating Change</th>
                  <th className="pb-4 pt-4 font-bold text-right w-[100px]">Level</th>
                </tr>
              </thead>
              <tbody className="text-xs">
                {filteredHistory.map((row, idx) => {
                  const isPositive = row.change.startsWith("+");
                  return (
                    <tr key={idx} className="group border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 text-slate-300 whitespace-nowrap align-middle">{row.date}</td>
                      <td className="py-4 text-white font-medium align-middle pr-4">
                        <div className="truncate max-w-[200px] sm:max-w-none" title={row.contest}>{row.contest}</div>
                      </td>
                      
                      <td className="py-4 text-white  pr-4 font-bold text-right align-middle">{row.rank}</td>
                      <td className={`py-4 font-bold  pr-4 text-right align-middle ${isPositive ? "text-green-500" : "text-red-500"}`}>{row.change}</td>
                      <td className="py-4 text-white font-bold text-right align-middle">{row.level}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}