"use client";

import { motion } from "framer-motion";
import { Activity, Info } from "lucide-react";
import { useState } from "react";
import type { DiseaseMap, UncertaintyData, Justification } from "@/types";
import { JustificationModal } from "./justification-modal";

interface DiseaseTableProps {
    probabilities: DiseaseMap;
    uncertainty: UncertaintyData;
    justifications?: Record<string, Justification>;
}

const DISEASE_INFO: Record<string, { shortName: string; icon: string }> = {
    Atelectasis: { shortName: "Atelectasis", icon: "🫁" },
    Cardiomegaly: { shortName: "Cardiomegaly", icon: "❤️" },
    Effusion: { shortName: "Effusion", icon: "💧" },
    Infiltration: { shortName: "Infiltration", icon: "🔬" },
    Mass: { shortName: "Mass", icon: "⭕" },
    Nodule: { shortName: "Nodule", icon: "🔴" },
    Pneumonia: { shortName: "Pneumonia", icon: "🦠" },
    Pneumothorax: { shortName: "Pneumothorax", icon: "💨" },
};

function getProbColor(prob: number): string {
    if (prob >= 0.7) return "from-red-500 to-red-400";
    if (prob >= 0.5) return "from-orange-400 to-amber-400";
    if (prob >= 0.3) return "from-amber-300 to-yellow-300";
    return "from-[#3b82f6] to-[#60a5fa]"; // Blue for low probability
}

function getProbTextColor(prob: number): string {
    if (prob >= 0.7) return "text-red-600";
    if (prob >= 0.5) return "text-orange-600";
    if (prob >= 0.3) return "text-amber-600";
    return "text-[#1e3a8a]"; // Navy for low probability
}

export function DiseaseTable({
    probabilities,
    uncertainty,
    justifications,
}: DiseaseTableProps) {
    const diseases = Object.entries(probabilities).sort(([, a], [, b]) => b - a);
    const [selectedDisease, setSelectedDisease] = useState<string | null>(null);

    return (
        <>
            <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3 mb-6 border-b border-slate-100 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm">
                        <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-[#1a1c29]">
                            Probability Analysis
                        </h3>
                        <p className="text-xs text-slate-500 font-medium">Calibrated Confidence Scores</p>
                    </div>
                </div>

                <div className="space-y-4">
                    {diseases.map(([disease, prob], index) => {
                        const uncertain = uncertainty.per_disease.find(
                            (d) => d.disease === disease
                        );
                        const info = DISEASE_INFO[disease];

                        return (
                            <motion.div
                                key={disease}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.05 }}
                                className="group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 shadow-sm">
                                        <span className="text-base">{info?.icon || "📋"}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-slate-700 font-bold">
                                                    {disease}
                                                    {uncertain?.is_uncertain && (
                                                        <span className="ml-2 text-[10px] text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
                                                            ⚠ uncertain
                                                        </span>
                                                    )}
                                                </span>
                                                {justifications && justifications[disease] && (
                                                    <button
                                                        onClick={() => setSelectedDisease(disease)}
                                                        className="text-slate-400 hover:text-blue-500 transition-colors p-1 rounded-full hover:bg-blue-50"
                                                        title="View Clinical Justification"
                                                    >
                                                        <Info className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                            <span
                                                className={`text-sm font-black tabular-nums ${getProbTextColor(prob)}`}
                                            >
                                                {(prob * 100).toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="h-2.5 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shadow-inner">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${Math.max(prob * 100, 1)}%` }}
                                                transition={{
                                                    duration: 0.8,
                                                    delay: index * 0.05 + 0.2,
                                                    ease: "easeOut",
                                                }}
                                                className={`h-full rounded-full bg-gradient-to-r ${getProbColor(prob)} border-r border-white/20`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            <JustificationModal
                isOpen={!!selectedDisease}
                onClose={() => setSelectedDisease(null)}
                disease={selectedDisease || ""}
                probability={selectedDisease ? probabilities[selectedDisease] : 0}
                justification={selectedDisease && justifications ? justifications[selectedDisease] : null}
            />
        </>
    );
}
