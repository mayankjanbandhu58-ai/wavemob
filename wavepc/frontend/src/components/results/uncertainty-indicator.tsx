"use client";

import { motion } from "framer-motion";
import { Gauge, AlertCircle, CheckCircle } from "lucide-react";
import type { UncertaintyData } from "@/types";

interface UncertaintyIndicatorProps {
    uncertainty: UncertaintyData;
}

function getUncertaintyStyles(level: string) {
    switch (level) {
        case "low":
            return {
                color: "text-emerald-700",
                bg: "bg-emerald-50 text-emerald-800",
                border: "border-emerald-200",
                iconBg: "bg-emerald-100",
                iconColor: "text-emerald-600",
                icon: CheckCircle,
                label: "High Confidence",
                desc: "Model predictions are highly stable across iterations.",
            };
        case "moderate":
            return {
                color: "text-amber-700",
                bg: "bg-amber-50 text-amber-800",
                border: "border-amber-200",
                iconBg: "bg-amber-100",
                iconColor: "text-amber-600",
                icon: AlertCircle,
                label: "Moderate Confidence",
                desc: "Some uncertainty detected. Clinical review advised.",
            };
        case "high":
            return {
                color: "text-red-700",
                bg: "bg-red-50 text-red-800",
                border: "border-red-200",
                iconBg: "bg-red-100",
                iconColor: "text-red-600",
                icon: AlertCircle,
                label: "Low Confidence",
                desc: "High variance in predictions. Manual oversight mandatory.",
            };
        default:
            return {
                color: "text-slate-700",
                bg: "bg-slate-50 text-slate-800",
                border: "border-slate-200",
                iconBg: "bg-slate-100",
                iconColor: "text-slate-500",
                icon: Gauge,
                label: "Confidence Unknown",
                desc: "Unable to calculate statistical uncertainty.",
            };
    }
}

export function UncertaintyIndicator({
    uncertainty,
}: UncertaintyIndicatorProps) {
    const styles = getUncertaintyStyles(uncertainty.overall_uncertainty);
    const Icon = styles.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className={`rounded-2xl border ${styles.border} bg-white p-5 shadow-sm hover:shadow-md transition-shadow`}
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                    <Gauge className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-[#1a1c29]">Model Reliability</h3>
            </div>

            <div className={`p-4 rounded-xl border ${styles.border} ${styles.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg ${styles.iconBg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${styles.iconColor}`} />
                    </div>
                    <span className={`text-base font-bold ${styles.color}`}>
                        {styles.label}
                    </span>
                </div>
                <p className="text-xs font-medium opacity-80 leading-relaxed mb-3">
                    {styles.desc}
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-black/5">
                    <span className="text-[10px] uppercase tracking-wider font-bold opacity-60">
                        Variance Score:
                    </span>
                    <span className="text-xs tabular-nums font-mono font-bold bg-white/50 px-1.5 py-0.5 rounded border border-black/10">
                        {uncertainty.mean_variance.toFixed(4)}
                    </span>
                </div>
            </div>
        </motion.div>
    );
}
