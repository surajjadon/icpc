"use client";

import React, { useMemo, useState } from "react";
import { Calendar, Download } from "lucide-react";

export default function GetDetailedAnalysis() {
  // Yesterday (max selectable date)
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const formatDate = (d: Date) => d.toISOString().split("T")[0];

  const [startDate, setStartDate] = useState(formatDate(yesterday));
  const [endDate, setEndDate] = useState(formatDate(yesterday));

  // ---- CSV GENERATION ----   
const handleDownloadCSV = async () => {
  try {
    const params = new URLSearchParams(window.location.search);
    const cfHandle = params.get("cf") ?? "shiva_karthik121";

    const res = await fetch(
      `http://localhost:5000/api/cf/detailed-analysis?handle=${encodeURIComponent(
        cfHandle
      )}&start=${startDate}&end=${endDate}`
    );

    if (!res.ok) throw new Error("Failed to fetch analysis");

    const data = await res.json();

    const rows: string[][] = [];

    // ================= SUMMARY =================
    rows.push(["Metric", "Value"]);
    rows.push(["Total Solved Problems", data.summary.solvedCount]);
    rows.push(["Total Pending Problems", data.summary.pendingCount]);
    rows.push(["Daily Tasks Solved", data.summary.dailyTasksSolvedCount]);
    rows.push(["Daily Tasks Unsolved", data.summary.dailyTasksUnsolvedCount]);
    rows.push(["Contests Participated", data.summary.contestCount]);
    rows.push(["Rating Change", data.summary.ratingChange]);

    // ================= SOLVED PROBLEMS =================
    rows.push([]);
    rows.push(["Solved Problems"]);
    rows.push(["Contest ID", "Index", "Name", "Rating", "Tags"]);

    data.solvedProblems.forEach((p: any) => {
      rows.push([
        String(p.contestId),
        p.index,
        `"${p.name}"`,
        p.rating ?? "",
        (p.tags || []).join("|")
      ]);
    });

    // ================= PENDING PROBLEMS =================
    rows.push([]);
    rows.push(["Pending Problems"]);
    rows.push(["Contest ID", "Index", "Name"]);

    data.pendingProblems.forEach((p: any) => {
      rows.push([
        String(p.contestId),
        p.index,
        `"${p.name}"`
      ]);
    });

    // ================= DAILY TASKS SOLVED =================
    rows.push([]);
    rows.push(["Daily Tasks Solved"]);
    rows.push(["Contest ID", "Index", "Name", "Rating", "Tags"]);

    data.dailyTasksSolved.forEach((p: any) => {
      rows.push([
        String(p.contestId),
        p.index,
        `"${p.name}"`,
        p.rating ?? "",
        (p.tags || []).join("|")
      ]);
    });

    // ================= DAILY TASKS UNSOLVED =================
    rows.push([]);
    rows.push(["Daily Tasks Unsolved"]);
    rows.push(["Contest ID", "Index", "Name", "Rating", "Tags"]);

    data.dailyTasksUnsolved.forEach((p: any) => {
      rows.push([
        String(p.contestId),
        p.index,
        `"${p.name}"`,
        p.rating ?? "",
        (p.tags || []).join("|")
      ]);
    });

    // ================= CSV EXPORT =================
    const csvContent = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `cf_detailed_analysis_${startDate}_to_${endDate}.csv`;
    link.click();

    URL.revokeObjectURL(url);

  } catch (err) {
    console.error(err);
    alert("Failed to generate detailed analysis");
  }
};

  return (
    <div className="flex flex-col rounded-2xl bg-[#1e293b] p-5 shadow-lg border border-slate-700/50">
      
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-white">
          Get Detailed Analysis
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Select a date range and export your performance
        </p>
      </div>

      {/* Date Inputs */}
      <div className="grid grid-cols-1 gap-4">
        
        {/* Start Date */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            Start Date
          </label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="date"
              max={formatDate(yesterday)}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 outline-none transition focus:border-blue-500/60"
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-500">Time: 12:00 AM</p>
        </div>

        {/* End Date */}
        <div>
          <label className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            End Date
          </label>
          <div className="relative">
            <Calendar
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              type="date"
              max={formatDate(yesterday)}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 pl-9 pr-3 text-sm text-slate-200 outline-none transition focus:border-blue-500/60"
            />
          </div>
          <p className="mt-1 text-[10px] text-slate-500">Time: 11:59 PM</p>
        </div>
      </div>

      {/* CSV Button */}
      <button
        onClick={handleDownloadCSV}
        className="mt-5 flex items-center justify-center gap-2 rounded-lg bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
      >
        <Download size={16} />
        Download CSV
      </button>
    </div>
  );
}
