"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation"; 

// Component Imports
import Header from "./components/dashboard/Header";
import LongTermLadder from "./components/dashboard/LongTermLadder";
import DailyDose from "./components/dashboard/DailyDose";
import PerformanceChart from "./components/dashboard/PerformanceChart";
import TopicStrength from "./components/dashboard/TopicStrength";
import TotalSolved from "./components/dashboard/TotalSolved";
import GetDetailedAnalysis from "./components/dashboard/GetDetailedAnalysis";


// 1. Define Data Interface
interface DashboardData {
  user: {
    name: string;
    handle: string;
    streak: number;
    avatar?: string;
  };
  dailyDose: Array<{
    id: number;
    date: string;
    platform: string;
    title: string;
    link?: string;
    status: string;
    tags: string[];
  }>;
  ladder: Array<{
    id: number;
    title: string;
    status: "locked" | "in-progress" | "completed";
    req: number;
    solved: number;
  }>;
  chartData: Array<{
    date: string;
    official: number;
    performance: number;
  }>;
  contestHistory: Array<{
    date: string;
    contest: string;
    platform: string;
    rank: string;
    change: string;
    level: string;
  }>;
  radarData: Array<{
    subject: string;
    A: number;
    fullMark: number;
  }>;
  stats: {
    totalSolved: number;
    cfRating: number;
    progress: number;
  };
}

// 2. Fetch Function
async function fetchData(cfHandle: string, acHandle: string): Promise<DashboardData | null> {
  try {
    const baseUrl = https://143.244.138.45.sslip.io;
    const url = `${baseUrl}/api/dashboard?cf=${cfHandle}&ac=${acHandle || ''}`;
    
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    return data as DashboardData;

  } catch (error) {
    console.error("Failed to fetch dashboard data:", error);
    return null;
  }
}

// 3. Inner Component (Uses Search Params)
function DashboardContent() {
  const searchParams = useSearchParams();
  
  // Get handles from URL, default to "shiva_karthik121" if missing
  const cfHandle = searchParams.get("cf") || "shiva_karthik121";
  const acHandle = searchParams.get("ac") || "shiva_karthik121";

  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const load = async () => {
      // Fetch new data whenever cfHandle or acHandle changes
      const result = await fetchData(cfHandle, acHandle);
      if (result) {
        setData(result);
      }
    };
    
    load();
  }, [cfHandle, acHandle]);

  // Loading State
  if (!data) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400 font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p>Loading Dashboard for <span className="text-white font-mono">{cfHandle}</span>...</p>
        </div>
      </div>
    );
  }

  // Render Dashboard
  return (
    <div className="min-h-screen bg-[#0f172a] px-4 pt-3 font-sans text-slate-200">
      <Header user={data.user} />
      
      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-6 lg:h-[calc(100vh-100px)]">
        
        {/* Left Column (Sidebar) */}
       <div className="col-span-12 lg:col-span-2 hidden lg:block sticky top-5 h-[calc(100vh-40px)]">
  <LongTermLadder data={data.ladder} />
</div>

     {/* Center Column (Main Content) */}
        <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 h-full overflow-hidden">
          <div className="shrink-0 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
            <DailyDose tasks={data.dailyDose} />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-2 no-scrollbar">
            <PerformanceChart 
              chartData={data.chartData} 
              history={data.contestHistory} 
            />
          </div>
          
        </div>




        {/* Right Column (Stats) */}
        <div className="col-span-12 lg:col-span-3 flex flex-col gap-6 h-full">
          <TopicStrength data={data.radarData} />
          <TotalSolved stats={data.stats} />
          <GetDetailedAnalysis />
        </div>

      </div>
    </div>
  );
}

// 4. Main Export (Wraps Content in Suspense)
export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-slate-400">Loading...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
