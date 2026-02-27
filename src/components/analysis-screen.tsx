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
    { label: "Preprocessing", icon: BrainCircuit },
    { label: "Ensemble Inference", icon: Cpu },
    { label: "Heatmap Generation", icon: FileSearch },
    { label: "Report Compilation", icon: FileCheck },
];

export function AnalysisScreen({ imagePreview, onComplete }: AnalysisScreenProps) {
    const [progress, setProgress] = useState(0);
    const [visibleLogs, setVisibleLogs] = useState(0);
    const [stageIndex, setStageIndex] = useState(0);

    useEffect(() => {
        const start = Date.now();
        const t = setInterval(() => {
            const pct = Math.min(((Date.now() - start) / ANALYSIS_DURATION) * 100, 100);
            setProgress(pct);
            setStageIndex(Math.min(Math.floor((pct / 100) * STAGES.length), STAGES.length - 1));
            if (pct >= 100) { clearInterval(t); setTimeout(onComplete, 200); }
        }, 30);
        return () => clearInterval(t);
    }, [onComplete]);

    useEffect(() => {
        const perLog = ANALYSIS_DURATION / TERMINAL_LOGS.length;
        const t = setInterval(() => {
            setVisibleLogs(p => { if (p >= TERMINAL_LOGS.length) { clearInterval(t); return p; } return p + 1; });
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
            className="fixed inset-0 z-[100] overflow-y-auto"
            style={{ background: "#F7F7F3" }}
        >
            <div className="w-full max-w-md mx-auto px-4 py-8 space-y-5">
                {/* Header */}
                <div className="text-center">
                    <div className="w-16 h-16 rounded-2xl gradient-olive mx-auto mb-4 flex items-center justify-center animate-pulse-glow">
                        <StageIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Analyzing X-Ray</h2>
                    <motion.p key={stage.label} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-sm font-semibold" style={{ color: "#636B2F" }}>
                        {stage.label}
                    </motion.p>
                    <p className="text-xs text-gray-500 mt-1">AI inference pipeline running…</p>
                </div>

                {/* Stage pills */}
                <div className="bg-white rounded-2xl p-4" style={{ border: "1px solid #E5E5DC", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                    <div className="flex items-start gap-2">
                        {STAGES.map((s, i) => {
                            const Icon = s.icon;
                            const done = i < stageIndex;
                            const active = i === stageIndex;
                            return (
                                <div key={s.label} className="flex-1 flex flex-col items-center gap-1.5">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500"
                                        style={{
                                            background: done ? "#636B2F" : active ? "#EEF0E0" : "#F5F5EF",
                                            border: active ? "1.5px solid #636B2F" : "1px solid transparent"
                                        }}>
                                        <Icon className="w-4 h-4" style={{ color: done ? "#fff" : active ? "#636B2F" : "#CCCCBB" }} />
                                    </div>
                                    <span className="text-[8px] font-semibold text-center leading-tight"
                                        style={{ color: active ? "#636B2F" : done ? "#888880" : "#CCCCBB" }}>
                                        {s.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* X-ray preview */}
                <div className="relative rounded-2xl overflow-hidden mx-auto bg-black" style={{ maxWidth: 200, border: "1px solid #E5E5DC" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Analyzing" className="w-full h-full object-cover aspect-square opacity-80" />
                    {/* Corner brackets */}
                    {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2",
                        "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"
                    ].map((cls, i) => (
                        <div key={i} className={`absolute ${cls} w-4 h-4 border-white/60 rounded-sm`} />
                    ))}
                    <div className="animate-scan-line" style={{
                        background: "linear-gradient(90deg, transparent, rgba(99,107,47,0.8), transparent)",
                    }} />
                </div>

                {/* Progress */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5" style={{ color: "#636B2F" }} />
                            <span className="text-gray-600 font-medium">Neural Pipeline</span>
                        </div>
                        <span className="font-black font-mono" style={{ color: "#636B2F" }}>{Math.round(progress)}%</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${progress}%` }} />
                    </div>
                </div>

                {/* Terminal */}
                <div className="bg-gray-900 rounded-2xl overflow-hidden" style={{ border: "1px solid #333" }}>
                    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-800 border-b border-gray-700">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                        <span className="text-[10px] text-gray-400 font-mono ml-2">wavelength-inference.log</span>
                    </div>
                    <div className="p-3 h-[180px] overflow-y-auto font-mono text-[11px] space-y-1">
                        {TERMINAL_LOGS.slice(0, visibleLogs).map((log, i) => (
                            <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                                <span style={{ color: "#8A9340" }} className="shrink-0">[{log.time}]</span>
                                <span className={i === visibleLogs - 1 ? "text-green-400" : "text-gray-500"}>{log.text}</span>
                            </motion.div>
                        ))}
                        {visibleLogs < TERMINAL_LOGS.length && (
                            <span style={{ color: "#8A9340" }} className="animate-terminal-blink">▋</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
