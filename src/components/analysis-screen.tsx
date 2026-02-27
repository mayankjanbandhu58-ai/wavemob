"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BrainCircuit, Cpu, FileSearch, FileCheck, Zap } from "lucide-react";
import { TERMINAL_LOGS } from "@/lib/dataset";

interface AnalysisScreenProps {
    imagePreview: string;
    fileName: string;
    onComplete: () => void;
}

const ANALYSIS_DURATION = 3000;

const STAGES = [
    { label: "Preprocessing", icon: BrainCircuit, color: "from-violet-500 to-purple-500" },
    { label: "Ensemble Inference", icon: Cpu, color: "from-blue-500 to-cyan-400" },
    { label: "Heatmap Generation", icon: FileSearch, color: "from-cyan-400 to-teal-400" },
    { label: "Report Compilation", icon: FileCheck, color: "from-emerald-500 to-green-400" },
];

export function AnalysisScreen({ imagePreview, onComplete }: AnalysisScreenProps) {
    const [progress, setProgress] = useState(0);
    const [visibleLogs, setVisibleLogs] = useState(0);
    const [stageIndex, setStageIndex] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min((elapsed / ANALYSIS_DURATION) * 100, 100);
            setProgress(pct);
            setStageIndex(Math.min(Math.floor((pct / 100) * STAGES.length), STAGES.length - 1));
            if (elapsed >= ANALYSIS_DURATION) { clearInterval(interval); setTimeout(onComplete, 200); }
        }, 30);
        return () => clearInterval(interval);
    }, [onComplete]);

    useEffect(() => {
        const perLog = ANALYSIS_DURATION / TERMINAL_LOGS.length;
        const t = setInterval(() => {
            setVisibleLogs(p => {
                if (p >= TERMINAL_LOGS.length) { clearInterval(t); return p; }
                return p + 1;
            });
        }, perLog);
        return () => clearInterval(t);
    }, []);

    const stage = STAGES[stageIndex];
    const StageIcon = stage.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto"
            style={{
                background: "linear-gradient(135deg, #070d1f 0%, #0a1628 50%, #0d1f3c 100%)",
            }}
        >
            {/* Background ambient blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-600/8 rounded-full blur-3xl" />
            </div>

            <div className="relative w-full max-w-md mx-4 space-y-5 py-8">
                {/* Header */}
                <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <div className={`w-18 h-18 rounded-2xl bg-gradient-to-br ${stage.color} mx-auto mb-4 p-4 flex items-center justify-center shadow-xl animate-pulse-glow`}
                        style={{ width: 72, height: 72 }}>
                        <StageIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-white mb-1">Analyzing X-Ray</h2>
                    <motion.p key={stage.label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-blue-400 font-semibold"
                    >
                        {stage.label}
                    </motion.p>
                    <p className="text-xs text-white/25 mt-1">AI inference pipeline active</p>
                </motion.div>

                {/* Stage pills */}
                <div className="glass rounded-2xl p-4">
                    <div className="flex items-center gap-2">
                        {STAGES.map((s, i) => {
                            const Icon = s.icon;
                            const done = i < stageIndex;
                            const active = i === stageIndex;
                            return (
                                <div key={s.label} className="flex-1 flex flex-col items-center gap-1.5">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-500 ${done ? `bg-gradient-to-br ${s.color} shadow-lg` :
                                            active ? "bg-white/10 border border-blue-400/40" : "bg-white/5"
                                        }`}>
                                        <Icon className={`w-3.5 h-3.5 ${done || active ? "text-white" : "text-white/20"}`} />
                                    </div>
                                    <span className={`text-[8px] font-bold text-center leading-tight ${active ? "text-blue-300" : done ? "text-white/40" : "text-white/15"
                                        }`}>{s.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* X-ray scanning image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative glass rounded-2xl overflow-hidden mx-auto"
                    style={{ maxWidth: 200 }}
                >
                    <div className="aspect-square relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Analyzing" className="w-full h-full object-cover opacity-60" />

                        {/* Scan gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 to-transparent mix-blend-overlay" />

                        {/* Scan line */}
                        <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-line"
                            style={{ filter: "blur(1px)" }} />

                        {/* Corner brackets */}
                        {[
                            "top-2 left-2 border-t-2 border-l-2",
                            "top-2 right-2 border-t-2 border-r-2",
                            "bottom-2 left-2 border-b-2 border-l-2",
                            "bottom-2 right-2 border-b-2 border-r-2",
                        ].map((cls, i) => (
                            <div key={i} className={`absolute ${cls} w-4 h-4 border-blue-400/80 rounded-sm`} />
                        ))}

                        {/* Center cross-hair */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-6 h-6 border border-blue-400/30 rounded-full" />
                            <div className="absolute w-10 h-px bg-blue-400/20" />
                            <div className="absolute w-px h-10 bg-blue-400/20" />
                        </div>
                    </div>
                </motion.div>

                {/* Progress bar */}
                <div className="space-y-2 px-1">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-blue-400" />
                            <span className="text-white/40 font-medium">Neural Pipeline</span>
                        </div>
                        <span className="text-blue-300 font-black font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Terminal logs */}
                <div className="glass rounded-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/70" />
                        </div>
                        <span className="text-[10px] text-white/20 font-mono ml-1.5">wavelength-inference.log</span>
                    </div>
                    <div className="p-3 h-[180px] overflow-y-auto font-mono text-[11px] space-y-1 bg-transparent">
                        {TERMINAL_LOGS.slice(0, visibleLogs).map((log, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                                <span className="text-blue-400/60 shrink-0">[{log.time}]</span>
                                <span className={i === visibleLogs - 1 ? "text-white/80" : "text-white/30"}>{log.text}</span>
                            </motion.div>
                        ))}
                        {visibleLogs < TERMINAL_LOGS.length && (
                            <span className="text-blue-400 animate-terminal-blink">▋</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
