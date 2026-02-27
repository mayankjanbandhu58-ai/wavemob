"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldAlert, Shield, Clock, Zap, CheckCircle2 } from "lucide-react";
import type { SimulatedReport } from "@/lib/dataset";

interface RiskBadgeProps { report: SimulatedReport; }

const configs = {
    "High Suspicion": {
        bg: "#FEF2F2", border: "#FECACA", text: "#991B1B", labelColor: "#DC2626",
        icon: ShieldAlert, iconBg: "#DC2626",
        label: "Immediate clinical review required", dot: "#DC2626",
    },
    "Moderate Risk": {
        bg: "#FFFBEB", border: "#FDE68A", text: "#92400E", labelColor: "#D97706",
        icon: Shield, iconBg: "#D97706",
        label: "Follow-up within 48–72 hours", dot: "#D97706",
    },
    "Low Risk": {
        bg: "#F0FDF4", border: "#BBF7D0", text: "#065F46", labelColor: "#059669",
        icon: ShieldCheck, iconBg: "#059669",
        label: "No acute pathology detected", dot: "#059669",
    },
};

export function RiskBadge({ report }: RiskBadgeProps) {
    const c = configs[report.riskLevel];
    const Icon = c.icon;

    return (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl p-5" style={{ background: c.bg, border: `1.5px solid ${c.border}` }}
        >
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow"
                    style={{ background: c.iconBg }}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: c.dot }} />
                        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: c.labelColor }}>
                            Risk Assessment
                        </span>
                    </div>
                    <h3 className="text-lg font-black" style={{ color: c.text }}>{report.riskLevel}</h3>
                    <p className="text-[11px] font-medium" style={{ color: c.text, opacity: 0.7 }}>{c.label}</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2.5 mt-4 pt-4" style={{ borderTop: `1px solid ${c.border}` }}>
                {[
                    { icon: Zap, label: "Confidence", value: `${report.confidenceScore.toFixed(1)}%` },
                    { icon: Clock, label: "Inference", value: `${(report.inferenceTimeMs / 1000).toFixed(2)}s` },
                    { icon: CheckCircle2, label: "Models", value: "3 / 3" },
                ].map(s => (
                    <div key={s.label} className="flex flex-col items-center gap-1 bg-white/70 rounded-xl py-2.5 border"
                        style={{ borderColor: c.border }}>
                        <s.icon className="w-3.5 h-3.5" style={{ color: c.labelColor }} />
                        <span className="text-xs font-black" style={{ color: c.text }}>{s.value}</span>
                        <span className="text-[9px] text-gray-500 font-medium">{s.label}</span>
                    </div>
                ))}
            </div>

            <p className="text-[9px] font-mono mt-2.5" style={{ color: c.text, opacity: 0.5 }}>
                Report ID: {report.reportId}
            </p>
        </motion.div>
    );
}
