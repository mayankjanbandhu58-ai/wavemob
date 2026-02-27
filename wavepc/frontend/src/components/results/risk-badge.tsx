"use client";

import { motion } from "framer-motion";
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Clock,
    CheckCircle2,
} from "lucide-react";
import type { RiskAssessment } from "@/types";

interface RiskBadgeProps {
    riskAssessment: RiskAssessment;
    inferenceTime: number;
    calibrated: boolean;
}

function getRiskStyles(level: string) {
    switch (level) {
        case "Low Risk":
            return {
                bg: "bg-white",
                border: "border-emerald-200",
                icon: ShieldCheck,
                iconColor: "text-emerald-600",
                textColor: "text-emerald-700",
                badgeBg: "bg-emerald-50 border border-emerald-100",
                glow: "shadow-sm shadow-emerald-500/10",
                labelBg: "bg-emerald-100 text-emerald-700",
            };
        case "Moderate Risk":
            return {
                bg: "bg-white",
                border: "border-amber-200",
                icon: ShieldAlert,
                iconColor: "text-amber-600",
                textColor: "text-amber-700",
                badgeBg: "bg-amber-50 border border-amber-100",
                glow: "shadow-md shadow-amber-500/10",
                labelBg: "bg-amber-100 text-amber-800",
            };
        case "High Suspicion":
            return {
                bg: "bg-red-50",
                border: "border-red-300",
                icon: ShieldX,
                iconColor: "text-red-600",
                textColor: "text-red-700",
                badgeBg: "bg-white border border-red-200 shadow-sm",
                glow: "shadow-lg shadow-red-500/20",
                labelBg: "bg-red-200 text-red-800",
            };
        default:
            return {
                bg: "bg-white",
                border: "border-[#e2e8f0]",
                icon: ShieldCheck,
                iconColor: "text-slate-500",
                textColor: "text-[#1a1c29]",
                badgeBg: "bg-slate-50 border border-slate-200",
                glow: "shadow-sm",
                labelBg: "bg-slate-100 text-slate-700",
            };
    }
}

export function RiskBadge({
    riskAssessment,
    inferenceTime,
    calibrated,
}: RiskBadgeProps) {
    const styles = getRiskStyles(riskAssessment.risk_level);
    const Icon = styles.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className={`rounded-2xl border ${styles.border} ${styles.bg} p-6 ${styles.glow}`}
        >
            {/* Risk Level */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <motion.div
                        initial={{ rotate: -10 }}
                        animate={{ rotate: 0 }}
                        transition={{ type: "spring", stiffness: 200 }}
                    >
                        <div
                            className={`w-14 h-14 rounded-xl ${styles.badgeBg} flex items-center justify-center`}
                        >
                            <Icon className={`w-7 h-7 ${styles.iconColor}`} />
                        </div>
                    </motion.div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-1">
                            Clinical Risk Assessment
                        </p>
                        <h3 className={`text-2xl font-black ${styles.textColor}`}>
                            {riskAssessment.risk_level}
                        </h3>
                        <p className="text-[11px] text-slate-600 font-semibold mt-1 flex flex-wrap items-center gap-1">
                            <span>Neural Score:</span>
                            <span className="tabular-nums bg-slate-100 px-1.5 rounded text-slate-700 border border-slate-200 mr-2">{(riskAssessment.risk_score * 100).toFixed(1)}%</span>
                            <span>RSI Severity:</span>
                            <span className={`tabular-nums px-1.5 rounded border font-bold ${riskAssessment.severity_grade === 'Severe' ? 'bg-red-50 text-red-700 border-red-200' :
                                    riskAssessment.severity_grade === 'Moderate' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                                        'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>{riskAssessment.severity_index}/100 ({riskAssessment.severity_grade})</span>
                        </p>
                    </div>
                </div>

                {/* Status badges */}
                <div className="flex flex-col gap-2 items-end">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs shadow-sm">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span className="text-slate-600 font-bold tabular-nums">
                            {inferenceTime.toFixed(0)}ms
                        </span>
                    </div>
                    {calibrated && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-xs shadow-sm">
                            <CheckCircle2 className="w-3 h-3 text-blue-600" />
                            <span className="text-blue-700 font-bold">Calibrated AI</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Recommendation */}
            <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-inner">
                <p className="text-sm text-slate-700 font-medium leading-relaxed">
                    {riskAssessment.recommendation}
                </p>
            </div>

            {/* Dominant Findings */}
            {riskAssessment.dominant_findings.length > 0 && (
                <div className="mt-5 border-t border-slate-100 pt-4">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-3">Primary Findings</p>
                    <div className="flex flex-wrap gap-2">
                        {riskAssessment.dominant_findings.map((finding) => (
                            <span
                                key={finding.disease}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold ${styles.labelBg} flex items-center gap-2 shadow-sm`}
                            >
                                <span>{finding.disease}</span>
                                <span className="bg-white/50 px-1.5 rounded opacity-80 tabular-nums">{(finding.probability * 100).toFixed(0)}%</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
