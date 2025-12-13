"use client";

import React, { useState, useMemo } from "react";
import { CheckCircle2, ChevronDown, ChevronUp, Calendar } from "lucide-react";

type Task = {
  id: number;
  date: string;
  platform: string;
  title: string;
  link?: string;
  status: string;
  tags: string[];
};

type Props = {
  tasks: Task[];
};

export default function DailyDose({ tasks }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Group tasks by Date
  const groupedTasks = useMemo(() => {
    const groups: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      const dateKey = task.date || "Unknown Date";
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(task);
    });
    return groups;
  }, [tasks]);

  // 2. Sort dates (Newest First)
  const sortedDates = useMemo(() => {
    return Object.keys(groupedTasks).sort((a, b) => {
      return new Date(b).getTime() - new Date(a).getTime();
    });
  }, [groupedTasks]);

  // 3. Determine display
  const displayDates = isExpanded ? sortedDates : sortedDates.slice(0, 1);

  return (
    // CONTAINER: 
    // h-full ensures it takes available space from parent.
    // max-h-[calc(100vh-100px)] ensures it never overflows the viewport if parent fails to constrain it.
    <div className="flex flex-col h-full max-h-[600px] w-full rounded-2xl bg-[#1e293b] shadow-xl border border-slate-700/50 overflow-hidden">
      
      {/* --- FIXED HEADER --- */}
      <div className="flex-none p-5 pb-4 border-b border-slate-700/30 z-20 bg-[#1e293b]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Daily Tasks
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Your consistency tracker
            </p>
          </div>
          
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 rounded-lg cursor-pointer bg-slate-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-all hover:bg-slate-700 hover:text-white border border-slate-700 hover:border-slate-600"
          >
            {isExpanded ? "Show Latest" : "View History"}
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* --- SCROLLABLE CONTENT --- */}
      <div className="flex-1 overflow-y-auto p-5 pt-2 custom-scrollbar relative">
        <div className="space-y-6">
          
          {displayDates.map((date) => (
            <div key={date} className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              
              {/* DATE SEPARATOR (Sticky) */}
              {/* This sticks to the top of the scroll area when scrolling past a long list of tasks */}
              <div className="sticky top-0 z-10 -mx-5 px-5 py-3 mb-3 bg-[#1e293b]/95 backdrop-blur-sm border-b border-slate-700/50 flex items-center gap-3">
                <div className="p-1.5 bg-blue-500/10 rounded-md">
                   <Calendar size={14} className="text-blue-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-200">{date}</h3>
                <div className="h-[1px] flex-1 bg-gradient-to-r from-slate-700/50 to-transparent"></div>
              </div>

              {/* GRID FOR THIS DATE */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {groupedTasks[date].map((task) => (
                  <a
                    key={task.id}
                    href={task.link || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative flex flex-col justify-between rounded-xl border p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg ${
                      task.status === "solved"
                        ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                        : "border-slate-700/60 bg-slate-800/40 hover:bg-slate-800 hover:border-blue-500/30"
                    }`}
                  >
                    {/* Status Icon */}
                    {task.status === "solved" && (
                      <div className="absolute right-3 top-3">
                        <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-sm" />
                      </div>
                    )}

                    <div className="mb-3 pr-6">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] uppercase tracking-wider font-bold ${
                           task.platform.toLowerCase().includes("atcoder") ? "text-slate-400" : "text-blue-400"
                        }`}>
                          {task.platform}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-100 leading-snug group-hover:text-blue-300 transition-colors line-clamp-2">
                        {task.title}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-auto">
                      {task.tags.slice(0, 3).map((tag, idx) => (
                        <span 
                          key={`${task.id}-${tag}-${idx}`} 
                          className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-900/50 text-slate-400 border border-slate-700/50"
                        >
                          {tag}
                        </span>
                      ))}
                      
                      {/* Solved/Pending Badge */}
                      <span className={`ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                        task.status === "solved"
                         ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                         : "bg-yellow-500/10 text-yellow-500/80 border-yellow-500/20 group-hover:opacity-100 opacity-70"
                      }`}>
                        {task.status === "solved" ? "Done" : "Pending"}
                      </span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          ))}

          {/* Empty State */}
          {sortedDates.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
               <Calendar size={48} className="opacity-20 mb-4" />
               <p className="text-sm">No tasks found yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}