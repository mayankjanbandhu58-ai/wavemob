"use client";

import { motion } from "framer-motion";
import { Activity, Info } from "lucide-react";
import { useState } from "react";
import type { DiseaseScore } from "@/lib/dataset";

interface DiseaseTableProps {
    diseases: DiseaseScore[];
    showDifferential?: boolean;
}

function getProbGradient(prob: number): string {
    if (prob >= 0.7) return "from-red-500 to-red-400";
    if (prob >= 0.5) return "from-orange-400 to-amber-400";
    if (prob >= 0.3) return "from-amber-300 to-yellow-300";
    return "from-olive to-[#8a9440]";
}

function getProbTextColor(prob: number): string {
    if (prob >= 0.7) return "text-red-600";
    if (prob >= 0.5) return "text-orange-600";
    if (prob >= 0.3) return "text-amber-600";
    return "text-olive";
}

function getProbBg(prob: number): string {
    if (prob >= 0.7) return "bg-red-50 border-red-100";
    if (prob >= 0.5) return "bg-orange-50 border-orange-100";
    if (prob >= 0.3) return "bg-amber-50 border-amber-100";
    return "bg-gray-50 border-gray-100";
}

export function DiseaseTable({ diseases, showDifferential = true }: DiseaseTableProps) {
    const [showInfo, setShowInfo] = useState<string | null>(null);

    const top3 = diseases.slice(0, 3);

    return (
        <div className="space-y-4">
            {/* Main probability table */}
            <div className="rounded-2xl card-elevated overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                        <Activity className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Pathology Probability Analysis</h3>
                        <p className="text-[10px] text-gray-400">Calibrated Confidence Scores — DenseNet-121 Ensemble</p>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {diseases.map((d, i) => (
                        <motion.div
                            key={d.disease}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.4 }}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 text-base">
                                    {d.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1.5">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-xs font-bold text-gray-800">{d.disease}</span>
                                            {d.isUncertain && (
                                                <span className="text-[9px] text-amber-700 bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold">
                                                    ⚠ uncertain
                                                </span>
                                            )}
                                            <button
                                                onClick={() => setShowInfo(showInfo === d.disease ? null : d.disease)}
                                                className="text-gray-300 hover:text-blue-400 transition-colors"
                                            >
                                                <Info className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                        <span className={`text-xs font-black tabular-nums ${getProbTextColor(d.probability)}`}>
                                            {(d.probability * 100).toFixed(1)}%
                                        </span>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.max(d.probability * 100, 1)}%` }}
                                            transition={{ delay: i * 0.06 + 0.2, duration: 0.8, ease: "easeOut" }}
                                            className={`h-full rounded-full bg-gradient-to-r ${getProbGradient(d.probability)}`}
                                        />
                                    </div>

                                    {/* Info tooltip */}
                                    {showInfo === d.disease && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -4 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="mt-2 text-[10px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2"
                                        >
                                            ICD-10: <span className="font-mono font-bold text-olive">{d.icd10}</span> — Clinical correlation recommended.
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Differential Diagnosis */}
            {showDifferential && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl card-elevated overflow-hidden"
                >
                    <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                            <Activity className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Differential Diagnosis</h3>
                            <p className="text-[10px] text-gray-400">Top Ranked Conditions — ICD-10 Mapping</p>
                        </div>
                    </div>

                    <div className="p-4 space-y-2">
                        {top3.map((d, i) => (
                            <div key={d.disease} className={`flex items-center justify-between p-3 rounded-xl border ${getProbBg(d.probability)}`}>
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[10px] font-bold text-gray-600 shadow-sm">
                                        {i + 1}
                                    </span>
                                    <div>
                                        <p className="text-xs font-bold text-gray-800">{d.disease}</p>
                                        <p className="text-[10px] text-gray-400">Clinical correlation recommended</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-2">
                                    <p className={`text-xs font-black ${getProbTextColor(d.probability)}`}>
                                        {(d.probability * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-[9px] text-gray-400 font-mono font-bold">ICD-10: {d.icd10}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
