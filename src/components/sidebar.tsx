"use client";

import { useState } from "react";
import { Waves, Menu, X, ScanLine, History, Info, LogOut, Stethoscope, BarChart2, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type ViewType = "new-scan" | "history" | "analytics" | "about";

interface SidebarProps {
    currentView: ViewType;
    onChangeView: (view: ViewType) => void;
}

const navItems: { id: ViewType; label: string; icon: React.ElementType; desc: string }[] = [
    { id: "new-scan", label: "New Scan", icon: ScanLine, desc: "Upload & analyze" },
    { id: "history", label: "Scan History", icon: History, desc: "Previous results" },
    { id: "analytics", label: "Analytics", icon: BarChart2, desc: "Session stats" },
    { id: "about", label: "About", icon: Info, desc: "System info" },
];

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed top-4 left-4 z-50 p-2.5 rounded-xl glass glow-blue lg:hidden"
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5 text-blue-300" />
            </button>

            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar */}
            <div className={`
        ${isOpen ? "fixed translate-x-0" : "fixed -translate-x-full lg:translate-x-0 lg:static"}
        lg:shrink-0 inset-y-0 left-0 z-50 w-72 flex flex-col h-screen glass-sidebar
        transition-transform duration-300 ease-in-out
      `}>

                {/* Logo header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg animate-pulse-glow">
                                <Waves className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#070d1f] shadow-glow" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight">Wavelength</h1>
                            <p className="text-[10px] text-blue-400/70 uppercase tracking-[0.2em] font-semibold">Clinical AI</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-white/30 hover:text-white/70 rounded-lg hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.2em] font-semibold mb-3 px-3">Navigation</p>
                    <nav className="space-y-1.5">
                        {navItems.map(item => {
                            const isActive = currentView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { onChangeView(item.id); setIsOpen(false); }}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-3.5 rounded-xl
                    transition-all duration-200 group relative overflow-hidden text-left
                    ${isActive
                                            ? "bg-gradient-to-r from-blue-600/30 to-cyan-600/10 border border-blue-500/25 text-white shadow-lg"
                                            : "text-white/40 hover:bg-white/5 hover:text-white/70 border border-transparent"
                                        }
                  `}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gradient-to-b from-blue-400 to-cyan-400 rounded-r-full" />
                                    )}
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${isActive ? "bg-blue-500/20" : "bg-white/5 group-hover:bg-white/10"
                                        }`}>
                                        <item.icon className={`w-4 h-4 ${isActive ? "text-blue-300" : "text-white/40 group-hover:text-white/70"}`} />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold block">{item.label}</span>
                                        <span className={`text-[10px] ${isActive ? "text-blue-300/60" : "text-white/25"}`}>{item.desc}</span>
                                    </div>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                                    )}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Status */}
                    <div className="mt-8 mx-1 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                        <div className="flex items-center gap-2 mb-1.5">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">AI Pipeline Ready</span>
                        </div>
                        <p className="text-[10px] text-white/30 leading-relaxed">
                            Fully offline mode. Analysis runs on-device.
                        </p>
                    </div>

                    {/* Security note */}
                    <div className="mt-3 mx-1 p-3 rounded-xl bg-white/3 border border-white/5 flex items-start gap-2">
                        <Shield className="w-3.5 h-3.5 text-white/20 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-white/20 leading-relaxed">
                            Data stays on device. No network calls made.
                        </p>
                    </div>
                </div>

                {/* Doctor footer */}
                <div className="p-4 border-t border-white/5">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/4 border border-white/6">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                            <Stethoscope className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white/80 truncate">Dr. Sarah Jenkins</p>
                            <p className="text-[10px] text-white/30 truncate">Radiology Dept.</p>
                        </div>
                        <LogOut className="w-4 h-4 text-white/20 hover:text-white/50 cursor-pointer shrink-0 transition-colors" />
                    </div>
                </div>
            </div>
        </>
    );
}
