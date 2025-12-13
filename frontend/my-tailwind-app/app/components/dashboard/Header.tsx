"use client";

import React, { useState, useRef, useEffect } from "react";
import { User, Flame, ChevronDown, Check, Plus, X, Save, Trash2 } from "lucide-react";

type HeaderProps = {
  user: {
    name: string;
    handle: string;
    streak: number;
  };
};

type SavedProfile = {
  name: string;
  cf: string;
  ac: string;
};

export default function Header({ user }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // --- State for Dynamic Users ---
  const [savedUsers, setSavedUsers] = useState<SavedProfile[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({ name: "", cf: "", ac: "" });

  // 1. Load users from LocalStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("cp-dashboard-users");
    if (stored) {
      setSavedUsers(JSON.parse(stored));
    }
  }, []);

  // 2. Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsAdding(false); // Reset form state on close
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 3. Handle Saving a New User
  const handleSaveUser = () => {
    if (!formData.cf) return; // Basic validation

    const newProfile = {
      name: formData.name || formData.cf, // Fallback to handle if name empty
      cf: formData.cf,
      ac: formData.ac || formData.cf // Fallback to CF handle if AC empty
    };

    const updatedList = [...savedUsers, newProfile];
    setSavedUsers(updatedList);
    localStorage.setItem("cp-dashboard-users", JSON.stringify(updatedList));
    
    // Reset Form
    setFormData({ name: "", cf: "", ac: "" });
    setIsAdding(false);
  };

  // 4. Handle Deleting a User
  const handleDeleteUser = (e: React.MouseEvent, cfHandle: string) => {
    e.stopPropagation(); // Prevent triggering the switch user click
    const updatedList = savedUsers.filter(u => u.cf !== cfHandle);
    setSavedUsers(updatedList);
    localStorage.setItem("cp-dashboard-users", JSON.stringify(updatedList));
  };

  // 5. Switch User Function
  const handleSwitchUser = (cfHandle: string, acHandle: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set("cf", cfHandle);
    if (acHandle) params.set("ac", acHandle);
    window.location.href = `?${params.toString()}`;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0f172a] backdrop-blur-xl supports-[backdrop-filter]:bg-[#0f172a]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left: Logo Section */}
        <div className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
          <h1 className="text-lg font-bold tracking-tight text-slate-100 sm:text-xl">
            <span className="hidden sm:inline">CP Mastery </span>
            <span>Dashboard</span>
          </h1>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4">
          
          {/* Streak Badge */}
          <div className="group flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1.5 text-xs font-bold text-orange-400 border border-orange-500/20 shadow-[0_0_10px_rgba(249,115,22,0.1)] hover:bg-orange-500/20 transition-all cursor-default">
            <Flame size={16} className="fill-orange-500 text-orange-500 animate-pulse" />
            <span className="tabular-nums">{user.streak}</span>
            <span className="hidden sm:inline">Days</span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`group flex items-center gap-2 sm:gap-3 rounded-full sm:rounded-xl p-1 sm:px-3 sm:py-2 transition-all duration-200 border outline-none focus:ring-2 focus:ring-blue-500/50 ${
                isOpen
                  ? "bg-slate-800 border-slate-700 text-slate-100"
                  : "bg-transparent border-transparent hover:bg-slate-900 hover:border-slate-800 text-slate-300 hover:text-slate-100"
              }`}
            >
              {/* Avatar */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-600 shadow-inner">
                <User size={15} className="text-slate-300" />
              </div>

              {/* Text Info */}
              <div className="hidden flex-col items-start text-left sm:flex">
                <span className="text-sm font-semibold leading-none max-w-[100px] truncate">{user.name}</span>
                <span className="text-[10px] font-medium text-slate-500 mt-0.5 max-w-[100px] truncate">@{user.handle.split('|')[0].trim()}</span>
              </div>

              <ChevronDown
                size={14}
                className={`text-slate-500 transition-transform duration-300 ${isOpen ? "rotate-180 text-blue-400" : "group-hover:text-slate-400"}`}
              />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 origin-top-right animate-in fade-in zoom-in-95 duration-200 z-50">
                <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-900 shadow-2xl backdrop-blur-xl ring-1 ring-black/50">
                  
                  {/* Header */}
                  <div className="bg-slate-800/50 px-4 py-3 border-b border-slate-700/50 flex justify-between items-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {isAdding ? "Add New Profile" : "Switch Profile"}
                    </p>
                    {isAdding && (
                      <button 
                        onClick={() => setIsAdding(false)}
                        className="text-slate-500 hover:text-white transition-colors"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {/* CONTENT AREA */}
                  {isAdding ? (
                    // --- ADD USER FORM ---
                    <div className="p-4 space-y-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Display Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g. Tourist"
                          className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                         <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">CF Handle *</label>
                          <input 
                            type="text" 
                            placeholder="Required"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            value={formData.cf}
                            onChange={(e) => setFormData({...formData, cf: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">AtCoder</label>
                          <input 
                            type="text" 
                            placeholder="Optional"
                            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                            value={formData.ac}
                            onChange={(e) => setFormData({...formData, ac: e.target.value})}
                          />
                        </div>
                      </div>
                      
                      <button
                        disabled={!formData.cf}
                        onClick={handleSaveUser}
                        className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save size={14} />
                        Save Profile
                      </button>
                    </div>
                  ) : (
                    // --- USER LIST ---
                    <>
                      <div className="max-h-[320px] overflow-y-auto py-1 custom-scrollbar">
                        {savedUsers.length === 0 && (
                          <div className="px-4 py-8 text-center text-slate-500 text-sm">
                            <p>No profiles saved yet.</p>
                            <p className="text-xs opacity-60">Add your handles to switch quickly.</p>
                          </div>
                        )}

                        {savedUsers.map((u) => {
                          // Check active based on URL or current user prop
                          const isActive = user.handle.toLowerCase().includes(u.cf.toLowerCase());
                          
                          return (
                            <div
                              key={u.cf}
                              className={`relative w-full flex items-center justify-between px-4 py-3 text-sm transition-all group ${
                                isActive 
                                  ? "bg-blue-500/10 text-blue-100" 
                                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                              }`}
                            >
                              {/* Selection Area (Clickable) */}
                              <button 
                                onClick={() => handleSwitchUser(u.cf, u.ac)}
                                className="flex-1 flex items-center gap-3 text-left"
                              >
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border shrink-0 ${
                                  isActive 
                                    ? "bg-blue-500 text-white border-blue-400" 
                                    : "bg-slate-800 border-slate-700 text-slate-500 group-hover:border-slate-600"
                                }`}>
                                  {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex flex-col items-start gap-0.5 min-w-0">
                                  <span className={`font-medium truncate w-full ${isActive ? "text-blue-200" : "text-slate-300"}`}>
                                    {u.name}
                                  </span>
                                  <span className="text-[10px] font-mono opacity-60 truncate w-32 block">
                                    {u.cf} {u.ac ? `| ${u.ac}` : ''}
                                  </span>
                                </div>
                              </button>

                              {/* Actions Area */}
                              <div className="flex items-center gap-2 pl-2">
                                {isActive && <Check size={16} className="text-blue-400" />}
                                <button
                                  onClick={(e) => handleDeleteUser(e, u.cf)}
                                  className="p-1.5 rounded-md hover:bg-red-500/20 hover:text-red-400 text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Remove Profile"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Footer: Add Button */}
                      <div className="p-2 border-t border-slate-700/50 bg-slate-800/30">
                        <button
                          onClick={() => setIsAdding(true)}
                          className="w-full flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-700 hover:border-slate-500 bg-transparent hover:bg-slate-800 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-all"
                        >
                          <Plus size={14} />
                          Add Profile
                        </button>
                      </div>
                    </>
                  )}

                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}