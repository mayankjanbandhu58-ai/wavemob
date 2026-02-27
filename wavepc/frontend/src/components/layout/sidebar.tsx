"use client";

import { useState } from "react";
import { Upload, FileArchive, BookOpen, Layers, LogOut, Waves, Menu, X, Settings, UserPlus, BarChart3, Link, MessageSquare, Search, ActivitySquare, ListTodo } from "lucide-react";

export type ViewType = "new-scan" | "upload" | "worklist" | "upload-history" | "reports" | "ai-summary" | "ai-chat" | "learn" | "training" | "analytics" | "scoring" | "ehr-sync" | "patient-search" | "settings";

interface SidebarProps {
    currentView: ViewType;
    onChangeView: (view: ViewType) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    const navItems: { id: ViewType; label: string; icon: React.ElementType }[] = [
        { id: "new-scan", label: "New Scan", icon: UserPlus },
        { id: "upload", label: "Analysis & Upload", icon: Upload },
        { id: "reports", label: "Patient Reports", icon: FileArchive },
        { id: "upload-history", label: "Analysis History", icon: Layers },
        { id: "patient-search", label: "Global Search", icon: Search },
        { id: "ai-summary", label: "AI Summary", icon: Layers },
        { id: "ai-chat", label: "AI Assistant", icon: MessageSquare },
        { id: "learn", label: "Knowledge Hub", icon: BookOpen },
        { id: "training", label: "Training Mode", icon: ActivitySquare },
        { id: "analytics", label: "Analytics", icon: BarChart3 },
        { id: "scoring", label: "Scoring Models", icon: ActivitySquare },
        { id: "ehr-sync", label: "EHR Sync", icon: Link },
        { id: "worklist", label: "Triage Worklist", icon: ListTodo },
        { id: "settings", label: "Settings", icon: Settings },
    ];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-sm border border-slate-200 lg:hidden"
            >
                <Menu className="w-5 h-5 text-slate-700" />
            </button>

            {isOpen && (
                <div
                    className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className={`
                ${isOpen ? 'fixed translate-x-0' : 'fixed -translate-x-full lg:translate-x-0 lg:static'}
                lg:shrink-0 inset-y-0 left-0 z-50 w-72 bg-white border-r border-[#e2e8f0] shadow-sm
                flex flex-col text-[#1a1c29] transition-transform duration-300 ease-in-out h-screen
            `}>
                {/* Header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-[#e2e8f0]/60">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1e3a8a] to-[#3b82f6] flex items-center justify-center shadow-md">
                                <Waves className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] bg-clip-text text-transparent">
                                Wavelength
                            </h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
                                Clinical AI System
                            </p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-200 py-4 hide-scrollbar">
                    <nav className="px-4 space-y-1">
                        {navItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onChangeView(item.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${currentView === item.id
                                    ? "bg-[#1e3a8a] text-white shadow-sm shadow-blue-900/10"
                                    : "text-slate-600 hover:bg-[#f8fafc] hover:text-[#1e3a8a]"
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${currentView === item.id ? "text-blue-200" : "text-slate-400"}`} />
                                <span className="text-sm">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-[#e2e8f0]/60">
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-50">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                            DR
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-slate-700">Dr. Sarah Jenkins</p>
                            <p className="text-xs text-slate-500 truncate">Radiology Dept.</p>
                        </div>
                        <LogOut className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-pointer" />
                    </div>
                </div>
            </div>
        </>
    );
}
