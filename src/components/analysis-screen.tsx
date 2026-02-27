"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, Zap, BrainCircuit, FileSearch, FileCheck } from "lucide-react";
import { TERMINAL_LOGS } from "@/lib/dataset";

interface AnalysisScreenProps {
    imagePreview: string;
    fileName: string;
    onComplete: () => void;
}

const ANALYSIS_DURATION = 3000;

const STAGES = [
    { label: "Preprocessing", icon: BrainCircuit, pct: 25 },
    { label: "Ensemble Inference", icon: Cpu, pct: 60 },
    { label: "Heatmap Generation", icon: FileSearch, pct: 85 },
    { label: "Report Compilation", icon: FileCheck, pct: 100 },
];

export function AnalysisScreen({ imagePreview, fileName, onComplete }: AnalysisScreenProps) {
    const [progress, setProgress] = useState(0);
    const [visibleLogs, setVisibleLogs] = useState(0);
    const [stageIndex, setStageIndex] = useState(0);

    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min((elapsed / ANALYSIS_DURATION) * 100, 100);
            setProgress(pct);

            // Update stage
            const stage = STAGES.findIndex(s => pct < s.pct);
            setStageIndex(stage === -1 ? STAGES.length - 1 : stage);

            if (elapsed >= ANALYSIS_DURATION) {
                clearInterval(interval);
                setTimeout(onComplete, 200);
            }
        }, 30);
        return () => clearInterval(interval);
    }, [onComplete]);

    useEffect(() => {
        const perLog = ANALYSIS_DURATION / TERMINAL_LOGS.length;
        const interval = setInterval(() => {
            setVisibleLogs(prev => {
                if (prev >= TERMINAL_LOGS.length) { clearInterval(interval); return prev; }
                return prev + 1;
            });
        }, perLog);
        return () => clearInterval(interval);
    }, []);

    const currentStage = STAGES[stageIndex] ?? STAGES[STAGES.length - 1];
    const StageIcon = currentStage.icon;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-white flex items-center justify-center overflow-y-auto"
        >
            <div className="w-full max-w-md mx-4 space-y-5 py-8">
                {/* Stage header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 rounded-2xl gradient-olive mx-auto mb-4 flex items-center justify-center shadow-xl animate-pulse-glow">
                        <StageIcon className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">Analyzing X-Ray</h2>
                    <motion.p
                        key={currentStage.label}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-olive font-semibold"
                    >
                        Stage: {currentStage.label}
                    </motion.p>
                    <p className="text-xs text-gray-400 mt-1">AI inference pipeline active</p>
                </motion.div>

                {/* Stage pills */}
                <div className="flex items-center justify-between px-2">
                    {STAGES.map((s, i) => {
                        const Icon = s.icon;
                        const done = i < stageIndex;
                        const active = i === stageIndex;
                        return (
                            <div key={s.label} className="flex flex-col items-center gap-1.5">
                                <div className={`
                  w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500
                  ${done ? "gradient-olive" : active ? "border-2 border-olive bg-olive/10" : "bg-gray-100"}
                `}>
                                    <Icon className={`w-4 h-4 ${done ? "text-white" : active ? "text-olive" : "text-gray-300"}`} />
                                </div>
                                <span className={`text-[9px] font-bold text-center max-w-[50px] leading-tight ${active ? "text-olive" : done ? "text-gray-500" : "text-gray-300"}`}>
                                    {s.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* X-ray scanning image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative rounded-2xl overflow-hidden card-elevated mx-auto max-w-[180px]"
                >
                    <div className="aspect-square relative bg-gray-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={imagePreview} alt="Analyzing" className="w-full h-full object-cover opacity-70" />
                        <div className="absolute inset-0 overflow-hidden">
                            <div
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-olive to-transparent animate-scan-line"
                                style={{ filter: "blur(1px)" }}
                            />
                        </div>
                        <div className="absolute inset-3 border border-olive/30 rounded-lg pointer-events-none" />
                        {/* corner markers */}
                        {[["top-2 left-2", "rounded-br-none rounded-bl-none rounded-tr-none"],
                        ["top-2 right-2", "rounded-bl-none rounded-br-none rounded-tl-none"],
                        ["bottom-2 left-2", "rounded-tr-none rounded-tl-none rounded-br-none"],
                        ["bottom-2 right-2", "rounded-tl-none rounded-tr-none rounded-bl-none"],
                        ].map(([pos], ci) => (
                            <div key={ci} className={`absolute ${pos} w-3 h-3 border-2 border-olive/60 rounded`} />
                        ))}
                    </div>
                </motion.div>

                {/* Progress bar */}
                <div className="space-y-1.5 px-1">
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-olive" />
                            <span className="text-gray-600 font-medium">Neural Pipeline</span>
                        </div>
                        <span className="text-olive font-black font-mono">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ width: `${progress}%`, background: "linear-gradient(90deg, #636B2F, #8a9440)" }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                </div>

                {/* Terminal logs */}
                <div className="rounded-xl card-elevated overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono ml-1.5">wavelength-inference.log</span>
                    </div>
                    <div className="p-3 h-[180px] overflow-y-auto font-mono text-[11px] space-y-1 bg-white">
                        {TERMINAL_LOGS.slice(0, visibleLogs).map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-2"
                            >
                                <span className="text-olive shrink-0">[{log.time}]</span>
                                <span className={i === visibleLogs - 1 ? "text-gray-800" : "text-gray-400"}>{log.text}</span>
                            </motion.div>
                        ))}
                        {visibleLogs < TERMINAL_LOGS.length && (
                            <span className="text-olive animate-terminal-blink">▋</span>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
