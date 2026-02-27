"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Shield, Clock, Zap, CheckCircle2 } from "lucide-react";
import type { SimulatedReport } from "@/lib/dataset";

interface RiskBadgeProps {
    report: SimulatedReport;
}

export function RiskBadge({ report }: RiskBadgeProps) {
    const isHigh = report.riskLevel === "High Suspicion";
    const isMod = report.riskLevel === "Moderate Risk";

    const config = {
        "High Suspicion": {
            bg: "bg-red-50 border-red-200",
            text: "text-red-700",
            badge: "bg-red-600",
            icon: ShieldAlert,
            dot: "bg-red-500",
        },
        "Moderate Risk": {
            bg: "bg-amber-50 border-amber-200",
            text: "text-amber-700",
            badge: "bg-amber-500",
            icon: Shield,
            dot: "bg-amber-500",
        },
        "Low Risk": {
            bg: "bg-emerald-50 border-emerald-200",
            text: "text-emerald-700",
            badge: "bg-emerald-600",
            icon: ShieldCheck,
            dot: "bg-emerald-500",
        },
    }[report.riskLevel];

    const Icon = config.icon;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className={`rounded-2xl border p-5 ${config.bg}`}
        >
            <div className="flex items-center gap-4">
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl ${config.badge} flex items-center justify-center shadow-lg shrink-0`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Risk text */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <div className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest ${config.text}`}>
                            Risk Assessment
                        </span>
                    </div>
                    <h3 className={`text-lg font-black ${config.text}`}>{report.riskLevel}</h3>
                    <p className={`text-[10px] font-medium ${config.text} opacity-70`}>
                        {isHigh
                            ? "Immediate clinical review required"
                            : isMod
                                ? "Follow-up within 48–72 hours"
                                : "No acute pathology detected"}
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-black/5">
                <StatChip icon={Zap} label="Confidence" value={`${report.confidenceScore.toFixed(1)}%`} color={config.text} />
                <StatChip icon={Clock} label="Inference" value={`${(report.inferenceTimeMs / 1000).toFixed(2)}s`} color={config.text} />
                <StatChip icon={CheckCircle2} label="Models" value="3 / 3" color={config.text} />
            </div>

            {/* Report ID */}
            <div className="mt-3 flex items-center gap-2">
                <span className={`text-[9px] font-mono font-bold ${config.text} opacity-60 uppercase tracking-widest`}>
                    Report ID: {report.reportId}
                </span>
            </div>
        </motion.div>
    );
}

function StatChip({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: React.ElementType;
    label: string;
    value: string;
    color: string;
}) {
    return (
        <div className="flex flex-col items-center gap-1 bg-white/60 rounded-xl py-2.5 border border-white/80">
            <Icon className={`w-3.5 h-3.5 ${color}`} />
            <span className={`text-xs font-black ${color}`}>{value}</span>
            <span className="text-[9px] text-gray-400 font-medium">{label}</span>
        </div>
    );
}
