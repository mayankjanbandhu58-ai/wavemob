"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Activity, Info } from "lucide-react";
import type { DiseaseScore } from "@/lib/dataset";

interface DiseaseTableProps {
    diseases: DiseaseScore[];
    showDifferential?: boolean;
}

function getBarColor(prob: number) {
    if (prob >= 0.7) return "#DC2626";
    if (prob >= 0.5) return "#D97706";
    if (prob >= 0.3) return "#CA8A04";
    return "#636B2F";
}

function getTextColor(prob: number) {
    if (prob >= 0.7) return "#DC2626";
    if (prob >= 0.5) return "#D97706";
    if (prob >= 0.3) return "#CA8A04";
    return "#636B2F";
}

function getRowBg(prob: number): string {
    if (prob >= 0.7) return "#FEF2F2";
    if (prob >= 0.5) return "#FFFBEB";
    return "#F9FAF5";
}

export function DiseaseTable({ diseases, showDifferential = true }: DiseaseTableProps) {
    const [showInfo, setShowInfo] = useState<string | null>(null);
    const top3 = diseases.slice(0, 3);

    return (
        <div className="space-y-4">
            {/* Main Table */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E5DC", boxShadow: "0 2px 12px rgba(0,0,0,0.05)" }}>
                <div className="px-5 py-4 flex items-center gap-3" style={{ background: "#F5F5EF", borderBottom: "1px solid #E5E5DC" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF0E0", border: "1px solid #C5CC9A" }}>
                        <Activity className="w-4 h-4" style={{ color: "#636B2F" }} />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-900">Pathology Probability Analysis</h3>
                        <p className="text-[10px] text-gray-500">Calibrated Confidence — DenseNet-121 Ensemble</p>
                    </div>
                </div>

                <div className="p-4 space-y-4">
                    {diseases.map((d, i) => (
                        <motion.div key={d.disease} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <div className="p-3 rounded-xl" style={{ background: getRowBg(d.probability), border: "1px solid #EEEEЕ5" }}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-base">{d.icon}</span>
                                    <span className="text-sm font-bold text-gray-900">{d.disease}</span>
                                    {d.isUncertain && (
                                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A" }}>
                                            ⚠ uncertain
                                        </span>
                                    )}
                                    <button onClick={() => setShowInfo(showInfo === d.disease ? null : d.disease)} className="ml-auto text-gray-300 hover:text-gray-500">
                                        <Info className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="text-sm font-black tabular-nums" style={{ color: getTextColor(d.probability) }}>
                                        {(d.probability * 100).toFixed(1)}%
                                    </span>
                                </div>

                                <div className="progress-track">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${Math.max(d.probability * 100, 1)}%` }}
                                        transition={{ delay: i * 0.05 + 0.2, duration: 0.7, ease: "easeOut" }}
                                        className="progress-fill"
                                        style={{ background: getBarColor(d.probability), boxShadow: "none" }}
                                    />
                                </div>

                                <AnimatePresence>
                                    {showInfo === d.disease && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }} className="mt-2 text-[10px] text-gray-500 pt-2"
                                            style={{ borderTop: "1px solid #EEEEEA" }}>
                                            ICD-10: <span className="font-mono font-bold" style={{ color: "#636B2F" }}>{d.icd10}</span> — Clinical correlation recommended.
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Differential Diagnosis */}
            {showDifferential && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl overflow-hidden"
                    style={{ border: "1px solid #E5E5DC", boxShadow: "0 2px 8px rgba(0,0,0,0.04)" }}
                >
                    <div className="px-5 py-4 flex items-center gap-3" style={{ background: "#F5F5EF", borderBottom: "1px solid #E5E5DC" }}>
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#EEF0E0", border: "1px solid #C5CC9A" }}>
                            <Activity className="w-4 h-4" style={{ color: "#636B2F" }} />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-gray-900">Differential Diagnosis</h3>
                            <p className="text-[10px] text-gray-500">Top 3 Conditions — ICD-10 Mapped</p>
                        </div>
                    </div>

                    <div className="p-4 space-y-2.5">
                        {top3.map((d, i) => (
                            <div key={d.disease} className="flex items-center gap-3 p-3 rounded-xl"
                                style={{ background: "#F9FAF6", border: "1px solid #E8E8E0" }}>
                                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                                    style={{ background: "#636B2F" }}>
                                    {i + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900">{d.disease}</p>
                                    <p className="text-[10px] text-gray-500">Clinical correlation needed</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-sm font-black" style={{ color: getTextColor(d.probability) }}>
                                        {(d.probability * 100).toFixed(1)}%
                                    </p>
                                    <p className="text-[9px] text-gray-400 font-mono">ICD-10: {d.icd10}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}
        </div>
    );
}
