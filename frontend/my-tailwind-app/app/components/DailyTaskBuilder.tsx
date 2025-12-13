"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Save, Calendar, Loader2, Link as LinkIcon, AlertCircle, CheckCircle } from "lucide-react";

// --- Types ---
type Task = {
  title: string;
  link: string;
  tags: string[]; // Will now contain only ONE item
  platform: 'Codeforces' | 'AtCoder';
};

// Cached AtCoder data
let atCoderProblemsCache: any[] | null = null;
let atCoderDifficultyCache: any | null = null;

export default function DailyTaskBuilder() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [urlInput, setUrlInput] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [isFetching, setIsFetching] = useState(false);
  const [isSavingDB, setIsSavingDB] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- Helper: Fetch AtCoder Data (Once) ---
  const ensureAtCoderData = async () => {
    if (atCoderProblemsCache) return;
    try {
      const [probsRes, diffRes] = await Promise.all([
        fetch("https://kenkoooo.com/atcoder/resources/problems.json"),
        fetch("https://kenkoooo.com/atcoder/resources/problem-models.json")
      ]);
      atCoderProblemsCache = await probsRes.json();
      atCoderDifficultyCache = await diffRes.json();
    } catch (e) {
      console.error("Failed to load AtCoder data", e);
      throw new Error("Could not load AtCoder problem list.");
    }
  };

  // --- 1. Main Logic: Determine Platform & Fetch ---
  const handleAddProblem = async () => {
    setMessage(null);
    if (!urlInput.trim()) return;

    setIsFetching(true);

    try {
      if (urlInput.includes("atcoder.jp")) {
        await handleAtCoder(urlInput);
      } else if (urlInput.includes("codeforces.com")) {
        await handleCodeforces(urlInput);
      } else {
        throw new Error("Only Codeforces and AtCoder links are supported.");
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setIsFetching(false);
    }
  };

  // --- Logic: AtCoder ---
  const handleAtCoder = async (url: string) => {
    const regex = /contests\/([^\/]+)\/tasks\/([^\/]+)/;
    const match = url.match(regex);
    if (!match) throw new Error("Invalid AtCoder URL.");

    const [_, contestId, problemId] = match;
    await ensureAtCoderData();

    const problem = atCoderProblemsCache?.find((p: any) => p.id === problemId);
    if (!problem) throw new Error("Problem not found in AtCoder database.");

    // Extract Difficulty as the single "Topic"
    let singleTag = "AtCoder";
    if (atCoderDifficultyCache && atCoderDifficultyCache[problemId]) {
      const diff = atCoderDifficultyCache[problemId].difficulty;
      if (diff !== undefined) singleTag = `Diff: ${diff}`; 
    }

    const newTask: Task = {
      title: `${problem.title} (${problemId})`,
      link: url,
      tags: [singleTag], // Only one tag pushed
      platform: 'AtCoder'
    };

    setTasks(prev => [...prev, newTask]);
    setUrlInput("");
  };

  // --- Logic: Codeforces ---
  const handleCodeforces = async (url: string) => {
    const regex = /(?:contest|problemset\/problem)\/(\d+)\/(?:problem\/)?(\w+)/;
    const match = url.match(regex);
    if (!match) throw new Error("Invalid Codeforces URL.");

    const [_, contestId, index] = match;

    const res = await fetch(`https://codeforces.com/api/contest.standings?contestId=${contestId}&from=1&count=1`);
    const data = await res.json();

    if (data.status !== "OK") throw new Error(data.comment);

    const problem = data.result.problems.find(
      (p: any) => p.index.toUpperCase() === index.toUpperCase()
    );

    if (!problem) throw new Error("Problem not found in contest data.");

    // Extract ONLY the first tag (Topic)
    // If no tags exist, fallback to "Unrated" or the rating
    let singleTopic = "Unrated";
    if (problem.tags && problem.tags.length > 0) {
      singleTopic = problem.tags[0]; // Takes only the first tag (e.g., "math")
    } else if (problem.rating) {
      singleTopic = problem.rating.toString();
    }

    const newTask: Task = {
      title: problem.name,
      link: url,
      tags: [singleTopic], // Only one tag pushed
      platform: 'Codeforces'
    };

    setTasks(prev => [...prev, newTask]);
    setUrlInput("");
  };

  const handleRemoveTask = (idx: number) => {
    setTasks(tasks.filter((_, i) => i !== idx));
  };

  // --- 2. Save to Database ---
  const handleSaveToDB = async () => {
    if (tasks.length === 0) return;
    setIsSavingDB(true);
    setMessage(null);

    try {
      const payload = { date, tasks };

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'; 
      const url = `${baseUrl}/api/daily`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save.");
      
      setMessage({ type: 'success', text: "Tasks saved successfully!" });
      setTasks([]); 
    } catch (err: any) {
      setMessage({ type: 'error', text: "Server error. Could not save." });
    } finally {
      setIsSavingDB(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-[#0f172a] min-h-screen text-slate-200 font-sans border border-slate-800 rounded-xl mt-10">
      
      <div className="mb-6">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
           Task Manager <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400 font-normal">Single Topic</span>
        </h1>
      </div>

      {/* Date Picker */}
      <div className="mb-6">
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 block">Target Date</label>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
          <input 
            type="date" 
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-[#1e293b] border border-slate-700 text-white text-sm rounded-lg pl-10 pr-4 py-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-[#1e293b] p-4 rounded-xl border border-slate-700/50 mb-6 shadow-sm">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Paste Problem Link</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Codeforces or AtCoder URL..."
            className="flex-1 bg-slate-950 border border-slate-700 text-sm text-white rounded-lg px-4 py-2 outline-none focus:border-blue-500"
            onKeyDown={(e) => e.key === "Enter" && handleAddProblem()}
          />
          <button
            onClick={handleAddProblem}
            disabled={isFetching || !urlInput}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-4 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
          >
            {isFetching ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
            Add
          </button>
        </div>
      </div>

      {/* Staged Tasks List */}
      <div className="space-y-3 mb-8 min-h-[100px]">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-slate-600 border-2 border-dashed border-slate-800 rounded-xl">
            <p className="text-sm">No tasks added yet.</p>
          </div>
        ) : (
          tasks.map((task, idx) => (
            <div key={idx} className="group flex items-center justify-between bg-[#1e293b]/50 border border-slate-800 p-3 rounded-lg hover:border-slate-600 transition-all">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    task.platform === 'AtCoder' ? 'bg-slate-700 text-white' : 'bg-blue-900/30 text-blue-300'
                  }`}>
                    {task.platform === 'AtCoder' ? 'AC' : 'CF'}
                  </span>
                  <h3 className="text-sm font-medium text-slate-200 truncate">{task.title}</h3>
                  <a href={task.link} target="_blank" className="text-slate-500 hover:text-blue-400">
                    <LinkIcon size={12} />
                  </a>
                </div>
                <div className="flex gap-1.5">
                  {/* Since tags is only length 1 now, this will just render one chip */}
                  {task.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700/50">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => handleRemoveTask(idx)}
                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Submit Button */}
      <div className="border-t border-slate-800 pt-6">
        {message && (
          <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
            message.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            {message.text}
          </div>
        )}

        <button
          onClick={handleSaveToDB}
          disabled={tasks.length === 0 || isSavingDB}
          className="w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
        >
          {isSavingDB ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          Save Tasks
        </button>
      </div>
    </div>
  );
}