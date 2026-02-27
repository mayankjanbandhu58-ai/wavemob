"use client";

import { useState } from "react";
import { Waves, Menu, X, ScanLine, History, Info, LogOut, Stethoscope, BarChart2 } from "lucide-react";
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
                className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm lg:hidden"
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5 text-olive" />
            </button>

            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar panel */}
            <div className={`
        ${isOpen ? "fixed translate-x-0" : "fixed -translate-x-full lg:translate-x-0 lg:static"}
        lg:shrink-0 inset-y-0 left-0 z-50 w-72 flex flex-col h-screen bg-white
        border-r border-gray-100 transition-transform duration-300 ease-in-out shadow-sm
      `}>

                {/* Logo header */}
                <div className="h-20 flex items-center justify-between px-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-xl gradient-olive flex items-center justify-center shadow-md animate-pulse-glow">
                                <Waves className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-olive tracking-tight">Wavelength</h1>
                            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-semibold">Clinical AI</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-6 px-4">
                    <p className="text-[10px] text-gray-400 uppercase tracking-[0.15em] font-semibold mb-3 px-3">Navigation</p>
                    <nav className="space-y-1">
                        {navItems.map(item => {
                            const isActive = currentView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { onChangeView(item.id); setIsOpen(false); }}
                                    className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 group relative overflow-hidden
                    ${isActive
                                            ? "gradient-olive text-white shadow-md shadow-olive/15"
                                            : "text-gray-600 hover:bg-gray-50 hover:text-olive"
                                        }
                  `}
                                >
                                    {isActive && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white/60 rounded-r-full" />
                                    )}
                                    <item.icon className={`w-5 h-5 ${isActive ? "text-white/80" : "text-gray-400 group-hover:text-olive"}`} />
                                    <div className="text-left">
                                        <span className="text-sm font-semibold block">{item.label}</span>
                                        <span className={`text-[10px] ${isActive ? "text-white/70" : "text-gray-400"}`}>{item.desc}</span>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>

                    {/* Status card */}
                    <div className="mt-8 mx-1 p-4 rounded-xl bg-olive/5 border border-olive/10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-olive font-bold uppercase tracking-wider">System Online</span>
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                            Offline inference mode. All analysis runs locally on-device.
                        </p>
                    </div>
                </div>

                {/* Doctor footer */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50">
                        <div className="w-9 h-9 rounded-full gradient-olive flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">Dr. Sarah Jenkins</p>
                            <p className="text-[10px] text-gray-400 truncate">Radiology Dept.</p>
                        </div>
                        <LogOut className="w-4 h-4 text-gray-300 hover:text-gray-500 cursor-pointer shrink-0" />
                    </div>
                </div>
            </div>
        </>
    );
}
