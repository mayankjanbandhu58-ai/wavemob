"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Cpu, Zap } from "lucide-react";
import { TERMINAL_LOGS } from "@/lib/dataset";

interface AnalysisScreenProps {
    imagePreview: string;
    fileName: string;
    onComplete: () => void;
}

const ANALYSIS_DURATION = 3000; // 3 seconds

export function AnalysisScreen({ imagePreview, fileName, onComplete }: AnalysisScreenProps) {
    const [progress, setProgress] = useState(0);
    const [visibleLogs, setVisibleLogs] = useState(0);

    /* ── Progress bar (0→100 over 3s) ────────── */
    useEffect(() => {
        const startTime = Date.now();
        const interval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const pct = Math.min((elapsed / ANALYSIS_DURATION) * 100, 100);
            setProgress(pct);

            if (elapsed >= ANALYSIS_DURATION) {
                clearInterval(interval);
                setTimeout(onComplete, 200);
            }
        }, 30);

        return () => clearInterval(interval);
    }, [onComplete]);

    /* ── Terminal logs appear sequentially ───── */
    useEffect(() => {
        const perLog = ANALYSIS_DURATION / TERMINAL_LOGS.length;
        const interval = setInterval(() => {
            setVisibleLogs((prev) => {
                if (prev >= TERMINAL_LOGS.length) {
                    clearInterval(interval);
                    return prev;
                }
                return prev + 1;
            });
        }, perLog);

        return () => clearInterval(interval);
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-white"
        >
            <div className="w-full max-w-lg mx-4 space-y-6">
                {/* ── Header ──────────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-center"
                >
                    <div className="w-16 h-16 rounded-2xl gradient-olive mx-auto mb-4 flex items-center justify-center shadow-xl animate-pulse-glow">
                        <Cpu className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                        Analyzing X-Ray
                    </h2>
                    <p className="text-sm text-gray-400">
                        AI inference pipeline active
                    </p>
                </motion.div>

                {/* ── Image with scan effect ──────── */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="relative rounded-2xl overflow-hidden card-elevated mx-auto max-w-[200px]"
                >
                    <div className="aspect-square relative bg-gray-50">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imagePreview}
                            alt="Analyzing"
                            className="w-full h-full object-cover opacity-70"
                        />
                        {/* Scanning line */}
                        <div className="absolute inset-0 overflow-hidden">
                            <div
                                className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-olive to-transparent animate-scan-line"
                                style={{ filter: "blur(1px)" }}
                            />
                        </div>
                        {/* Corner brackets */}
                        <div className="absolute inset-3 border border-olive/30 rounded-lg pointer-events-none" />
                    </div>
                </motion.div>

                {/* ── Progress bar ────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                >
                    <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-olive" />
                            <span className="text-gray-600 font-medium">Neural Pipeline</span>
                        </div>
                        <span className="text-olive font-bold font-mono">
                            {Math.round(progress)}%
                        </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{
                                width: `${progress}%`,
                                background: "linear-gradient(90deg, #636B2F, #8a9440)",
                            }}
                            transition={{ duration: 0.1 }}
                        />
                    </div>
                </motion.div>

                {/* ── Terminal logs ────────────────── */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="rounded-xl card-elevated overflow-hidden"
                >
                    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-100 bg-gray-50">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                        </div>
                        <span className="text-[10px] text-gray-400 font-mono ml-1.5">
                            wavelength-inference.log
                        </span>
                    </div>
                    <div className="p-3 h-[200px] overflow-y-auto font-mono text-[11px] space-y-1 bg-white">
                        {TERMINAL_LOGS.slice(0, visibleLogs).map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="flex gap-2"
                            >
                                <span className="text-olive shrink-0">[{log.time}]</span>
                                <span className={`${i === visibleLogs - 1 ? "text-gray-800" : "text-gray-400"}`}>
                                    {log.text}
                                </span>
                            </motion.div>
                        ))}
                        {visibleLogs < TERMINAL_LOGS.length && (
                            <span className="text-olive animate-terminal-blink">▋</span>
                        )}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
