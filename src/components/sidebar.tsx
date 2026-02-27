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
                className="fixed top-4 left-4 z-50 p-2.5 rounded-xl bg-white border border-gray-200 shadow-sm lg:hidden"
                aria-label="Open menu"
            >
                <Menu className="w-5 h-5" style={{ color: "#636B2F" }} />
            </button>

            {/* Mobile overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 z-40 lg:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Sidebar panel */}
            <div className={`
        ${isOpen ? "fixed translate-x-0" : "fixed -translate-x-full lg:translate-x-0 lg:static"}
        lg:shrink-0 inset-y-0 left-0 z-50 w-72 flex flex-col h-screen sidebar
        transition-transform duration-300 ease-in-out
      `}>
                {/* Logo */}
                <div className="h-20 flex items-center justify-between px-5 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <div className="w-11 h-11 rounded-xl gradient-olive flex items-center justify-center animate-pulse-glow">
                                <Waves className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold" style={{ color: "#636B2F" }}>Wavelength</h1>
                            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold">Clinical AI</p>
                        </div>
                    </div>
                    <button onClick={() => setIsOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <div className="flex-1 overflow-y-auto py-5 px-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold mb-3 px-2">Navigation</p>
                    <nav className="space-y-1">
                        {navItems.map(item => {
                            const isActive = currentView === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => { onChangeView(item.id); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-150 text-left"
                                    style={{
                                        background: isActive ? "#EEF0E0" : "transparent",
                                        borderLeft: isActive ? "3px solid #636B2F" : "3px solid transparent",
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                                        style={{ background: isActive ? "#636B2F" : "#F0F0E8" }}>
                                        <item.icon className="w-4 h-4" style={{ color: isActive ? "#fff" : "#888880" }} />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold block" style={{ color: isActive ? "#636B2F" : "#333333" }}>
                                            {item.label}
                                        </span>
                                        <span className="text-[10px]" style={{ color: isActive ? "#7a8438" : "#999999" }}>
                                            {item.desc}
                                        </span>
                                    </div>
                                    {isActive && <div className="ml-auto w-2 h-2 rounded-full" style={{ background: "#636B2F" }} />}
                                </button>
                            );
                        })}
                    </nav>

                    {/* Status */}
                    <div className="mt-6 mx-1 p-4 rounded-xl border" style={{ background: "#EEF0E0", borderColor: "#C5CC9A" }}>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#636B2F" }}>AI Pipeline Ready</span>
                        </div>
                        <p className="text-[10px] text-gray-500 leading-relaxed">Fully offline mode.</p>
                    </div>

                    <div className="mt-2 mx-1 p-3 rounded-xl bg-gray-50 border border-gray-100 flex items-start gap-2">
                        <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-gray-400 leading-relaxed">Data stays on device — no network calls.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-9 h-9 rounded-full gradient-olive flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-800 truncate">Dr. Sarah Jenkins</p>
                            <p className="text-[10px] text-gray-500 truncate">Radiology Dept.</p>
                        </div>
                        <LogOut className="w-4 h-4 text-gray-300 hover:text-gray-500 cursor-pointer shrink-0 transition-colors" />
                    </div>
                </div>
            </div>
        </>
    );
}
