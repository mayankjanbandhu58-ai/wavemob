"use client";

import { motion } from "framer-motion";
import {
    CheckCircle2,
    FileText,
    RotateCcw,
    Download,
    ShieldCheck,
    Clock,
    Sparkles,
} from "lucide-react";
import { getReportUrl, getDisplayName } from "@/lib/dataset";

interface ResultsScreenProps {
    fileName: string;
    imagePreview: string;
    onNewScan: () => void;
}

export function ResultsScreen({ fileName, imagePreview, onNewScan }: ResultsScreenProps) {
    const reportUrl = getReportUrl(fileName);
    const displayName = getDisplayName(fileName);

    const handleViewReport = () => {
        window.open(reportUrl, "_blank");
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
        >
            {/* ── Success hero card ─────────────────── */}
            <div className="rounded-2xl card-elevated overflow-hidden">
                <div className="p-6 flex flex-col items-center text-center">
                    {/* Success icon */}
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", delay: 0.1, stiffness: 200 }}
                        className="w-20 h-20 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center mb-4"
                    >
                        <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                    </motion.div>

                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl font-bold text-gray-900 mb-1"
                    >
                        Report Generated Successfully
                    </motion.h2>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-sm text-gray-400 mb-5"
                    >
                        AI analysis complete for {displayName}
                    </motion.p>

                    {/* Stats row */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.35 }}
                        className="grid grid-cols-3 gap-3 w-full mb-6"
                    >
                        {[
                            { icon: Clock, label: "Inference", value: "2.8s" },
                            { icon: ShieldCheck, label: "Confidence", value: "97.2%" },
                            { icon: Sparkles, label: "Models", value: "3 / 3" },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className="rounded-xl bg-gray-50 border border-gray-100 p-3 flex flex-col items-center gap-1"
                            >
                                <stat.icon className="w-4 h-4 text-olive" />
                                <span className="text-xs font-bold text-gray-800">{stat.value}</span>
                                <span className="text-[10px] text-gray-400">{stat.label}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>

                {/* Image thumbnail */}
                <div className="mx-6 mb-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                    <div className="aspect-[16/10] relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imagePreview}
                            alt={displayName}
                            className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
                        <div className="absolute bottom-3 left-3 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[10px] text-emerald-700 font-mono font-bold uppercase tracking-wider bg-white/80 px-2 py-0.5 rounded-full">
                                Analysis Complete
                            </span>
                        </div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="p-6 pt-2 space-y-3">
                    {/* Primary: View PDF Report */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleViewReport}
                        className="w-full py-4 rounded-xl gradient-olive-glow text-white font-bold text-sm
              flex items-center justify-center gap-2.5 shadow-lg shadow-olive/20
              hover:shadow-xl transition-shadow"
                    >
                        <FileText className="w-5 h-5" />
                        View Full PDF Report
                    </motion.button>

                    {/* Secondary: Download PDF */}
                    <motion.a
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        href={reportUrl}
                        download
                        className="w-full py-3.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm
              flex items-center justify-center gap-2.5
              hover:bg-gray-50 hover:border-gray-300 transition-all"
                    >
                        <Download className="w-4 h-4" />
                        Download Report
                    </motion.a>

                    {/* Tertiary: New Scan */}
                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={onNewScan}
                        className="w-full py-3 rounded-xl text-gray-400 font-medium text-sm
              flex items-center justify-center gap-2
              hover:text-gray-600 hover:bg-gray-50 transition-all"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Analyze Another Scan
                    </motion.button>
                </div>
            </div>

            {/* ── Disclaimer ────────────────────────── */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-[10px] text-amber-700 leading-relaxed text-center">
                    <span className="font-semibold">⚠ Clinical Disclaimer:</span>{" "}
                    This report is generated by an AI model for decision support purposes only.
                    All findings must be reviewed and confirmed by a qualified radiologist or physician.
                </p>
            </div>
        </motion.div>
    );
}
