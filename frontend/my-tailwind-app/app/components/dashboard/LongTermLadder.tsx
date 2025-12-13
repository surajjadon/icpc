import React from "react";
import { CheckCircle2, Lock } from "lucide-react";

export type LadderStep = {
  id: number;
  title: string;
  status: "locked" | "in-progress" | "completed";
  req?: number;
  solved?: number;
};

type Props = {
  data: LadderStep[];
};

export default function LongTermLadder({ data }: Props) {
  return (
    <div className="flex h-full w-full flex-col rounded-2xl bg-[#1e293b] border border-slate-700/50 shadow-xl overflow-hidden font-sans">
      
      {/* 1. Header (Fixed) */}
      <div className="flex-none p-5 pb-3 border-b border-slate-700/30 bg-[#1e293b] z-20">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          Long Term
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-medium">
          Master the difficulty levels
        </p>
      </div>

      {/* 2. Scrollable Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1e293b]">
        <div className="relative px-5 py-5">
          
          {/* CONNECTIVITY LINE */}
          {/* Calculated Position: 
              Icon width = 32px (w-8). Center = 16px.
              Line width = 2px. Center = 1px.
              Left = 16px - 1px = 15px.
              
              Height: 
              top-7 aligns with the center of the first icon.
              bottom-10 stops it gracefully before the container edge.
          */}
          <div className="absolute left-[35px] top-7 bottom-10 w-[2px] bg-gradient-to-b from-slate-700 via-slate-700/50 to-transparent z-0" />

          <div className="flex flex-col gap-6">
            {data.map((step) => {
              const isActive = step.status === "in-progress";
              const isLocked = step.status === "locked";
              const isCompleted = step.status === "completed";

              return (
                <div 
                  key={step.id} 
                  className={`relative z-10 group rounded-xl transition-all duration-300 ${
                    isActive 
                      ? "bg-blue-500/5 border border-blue-500/20 p-3 -mx-3 shadow-sm" 
                      : "p-0 border border-transparent"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    
                    {/* ICON CONTAINER */}
                    {/* ring-4 ring-[#1e293b] creates a mask around the icon so the line doesn't cut through it */}
                    <div className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-4 ring-[#1e293b] ${
                        isActive ? "bg-blue-500/10" : "bg-[#1e293b]"
                    }`}>
                      
                      {isCompleted && (
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 fill-emerald-500/10" />
                      )}
                      
                      {isActive && (
                        <div className="relative flex items-center justify-center">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-20"></span>
                          <div className="flex h-5 w-5 items-center justify-center rounded-full border-[2px] border-blue-500 bg-[#1e293b]">
                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                          </div>
                        </div>
                      )}
                      
                      {isLocked && (
                        <Lock className="h-5 w-5 text-slate-600" />
                      )}
                    </div>

                    {/* TEXT CONTENT */}
                    <div className={`flex flex-col pt-0.5 min-w-0 flex-1 ${isLocked ? "opacity-50" : "opacity-100"}`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm font-semibold truncate leading-none ${
                          isActive ? "text-blue-400" : "text-slate-200"
                        }`}>
                          {step.title}
                        </p>
                        
                        {/* Status Badge */}
                        {!isLocked && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium border uppercase tracking-wider ${
                            isCompleted 
                              ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/5" 
                              : "border-blue-500/20 text-blue-400 bg-blue-500/5"
                          }`}>
                            {isCompleted ? "Done" : "Active"}
                          </span>
                        )}
                      </div>

                      {/* Stats / Description */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1.5 font-medium">
                        <span className="capitalize text-slate-400">
                          {step.status.replace("-", " ")}
                        </span>
                        
                        {(step.req && step.solved !== undefined) && (
                          <>
                            <span className="h-1 w-1 rounded-full bg-slate-700"></span>
                            <span className={`${
                              step.solved >= step.req ? "text-emerald-500" : "text-slate-400"
                            }`}>
                              {step.solved} / {step.req}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {/* Optional Progress Bar for Active Item */}
                      {isActive && step.req && step.solved !== undefined && (
                         <div className="mt-2 h-1 w-full rounded-full bg-slate-700/50 overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${Math.min((step.solved / step.req) * 100, 100)}%` }}
                            />
                         </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}