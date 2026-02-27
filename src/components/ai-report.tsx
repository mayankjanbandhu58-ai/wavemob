"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, FileText, Download, RotateCcw, Activity, ChevronRight, ShieldAlert } from "lucide-react";
import { DiseaseTable } from "@/components/disease-table";
import { RiskBadge } from "@/components/risk-badge";
import type { SimulatedReport } from "@/lib/dataset";

interface AiReportProps {
    report: SimulatedReport;
    imagePreview: string;
    onNewScan: () => void;
}

type SummaryMode = "clinical" | "patient";

const TIMELINE = [
    { date: "Jan 15", label: "Initial scan", status: "done" },
    { date: "Jan 28", label: "Follow-up #1", status: "done" },
    { date: "Feb 10", label: "Follow-up #2", status: "done" },
    { date: "Feb 20", label: "Follow-up #3", status: "done" },
    { date: "Feb 27", label: "Current", status: "current" },
];

export function AiReport({ report, imagePreview, onNewScan }: AiReportProps) {
    const [mode, setMode] = useState<SummaryMode>("clinical");

    const riskGlow =
        report.riskLevel === "High Suspicion" ? "glow-red" :
            report.riskLevel === "Moderate Risk" ? "glow-amber" : "glow-green";

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
        >
            {/* ── Patient / Scan Header Card ──────────────── */}
            <div className="glass-strong rounded-2xl overflow-hidden">
                <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start gap-4">
                        {/* X-ray thumb */}
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-black border border-white/10 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imagePreview} alt="X-Ray" className="w-full h-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                            <div className="absolute bottom-1 left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent" />
                        </div>

                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-bold text-white mb-0.5 truncate">
                                {report.patientData.name || "Anonymous Patient"}
                            </h2>
                            <p className="text-[10px] text-white/40">
                                {report.patientData.age && `Age ${report.patientData.age}`}
                                {report.patientData.gender && ` · ${report.patientData.gender}`}
                            </p>
                            {report.patientData.symptoms && (
                                <p className="text-[10px] text-white/30 mt-1.5 bg-white/4 rounded-lg px-2 py-1 border border-white/6">
                                    <span className="text-white/50 font-bold">Symptoms:</span> {report.patientData.symptoms}
                                </p>
                            )}
                            <p className="text-[9px] font-mono text-blue-400/50 mt-1.5">{report.reportId}</p>
                        </div>
                    </div>
                </div>

                {/* PDF buttons */}
                <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => window.open(report.pdfUrl, "_blank")}
                        className="btn-primary py-3 text-xs"
                    >
                        <FileText className="w-4 h-4" />
                        View PDF Report
                    </motion.button>
                    <motion.a
                        whileTap={{ scale: 0.97 }}
                        href={report.pdfUrl}
                        download
                        className="btn-secondary py-3 text-xs"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </motion.a>
                </div>
            </div>

            {/* ── Risk Badge ──────────────────────────────── */}
            <RiskBadge report={report} />

            {/* ── Disease Table ───────────────────────────── */}
            <DiseaseTable diseases={report.diseases} showDifferential={true} />

            {/* ── Clinical Guideline ──────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="glass rounded-2xl p-5 border border-blue-500/15"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <h3 className="text-xs font-bold text-blue-300 uppercase tracking-wider">
                        Clinical Next Step
                        <span className="ml-2 text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded uppercase">Guideline</span>
                    </h3>
                </div>
                <p className="text-xs text-white/50 leading-relaxed bg-white/3 rounded-xl p-3 border border-white/5">
                    {report.clinicalGuideline}
                </p>
            </motion.div>

            {/* ── AI Narrative ────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="glass-strong rounded-2xl overflow-hidden"
            >
                {/* Tab header */}
                <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-bold text-white">AI Report Synthesis</h3>
                    </div>
                    {/* Toggle */}
                    <div className="flex items-center bg-white/5 rounded-lg p-0.5 border border-white/8">
                        <button onClick={() => setMode("clinical")}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${mode === "clinical" ? "bg-blue-600 text-white shadow-lg" : "text-white/30 hover:text-white/60"
                                }`}>
                            Clinical
                        </button>
                        <button onClick={() => setMode("patient")}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${mode === "patient" ? "bg-emerald-600 text-white shadow-lg" : "text-white/30 hover:text-white/60"
                                }`}>
                            Patient
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={mode} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.2 }}
                        className="p-5"
                    >
                        <div className="text-xs text-white/50 leading-relaxed space-y-2">
                            {(mode === "clinical" ? report.aiSummaryClinical : report.aiSummaryPatient)
                                .split("\n")
                                .map((line, i) => {
                                    if (line.startsWith("## ")) {
                                        return <h4 key={i} className="text-sm font-bold text-white/80 mt-4 mb-1 first:mt-0">{line.replace("## ", "")}</h4>;
                                    }
                                    if (line.trim() === "") return <div key={i} className="h-1" />;
                                    const parts = line.split(/\*\*(.+?)\*\*/g);
                                    return (
                                        <p key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="text-white/80">{p}</strong> : p)}</p>
                                    );
                                })}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {mode === "clinical" && (
                    <div className="mx-5 mb-4 p-3 rounded-xl bg-red-500/8 border border-red-500/15">
                        <div className="flex items-start gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-red-300/70 leading-relaxed">
                                AI-generated synthesis only. Requires radiologist verification before clinical action.
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ── Longitudinal Timeline ───────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="glass rounded-2xl p-5"
            >
                <div className="flex items-center gap-2 mb-5">
                    <ChevronRight className="w-4 h-4 text-blue-400" />
                    <h3 className="text-sm font-bold text-white">Longitudinal Tracking</h3>
                </div>

                <div className="relative">
                    <div className="absolute top-2.5 left-2 right-2 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <div className="relative flex justify-between">
                        {TIMELINE.map((t, i) => {
                            const isCurrentScan = t.status === "current";
                            return (
                                <div key={i} className="flex flex-col items-center gap-2" style={{ width: `${100 / TIMELINE.length}%` }}>
                                    <div className={`w-5 h-5 rounded-full border-2 border-[#070d1f] z-10 shadow-md ${isCurrentScan
                                            ? "bg-gradient-to-br " + (report.riskColor === "red" ? "from-red-500 to-red-400" : report.riskColor === "amber" ? "from-amber-500 to-amber-400" : "from-emerald-500 to-emerald-400")
                                            : "bg-white/20"
                                        } ${isCurrentScan ? "ring-2 ring-offset-1 ring-blue-500/50" : ""}`} />
                                    <p className="text-[8px] text-white/25 font-medium">{t.date}</p>
                                    <p className="text-[8px] text-white/40 font-bold text-center leading-tight">{t.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* ── New Scan ─────────────────────────────────── */}
            <motion.button whileTap={{ scale: 0.97 }} onClick={onNewScan}
                className="w-full py-3 rounded-xl text-white/25 font-medium text-sm flex items-center justify-center gap-2 hover:text-white/50 hover:bg-white/4 transition-all border border-white/5"
            >
                <RotateCcw className="w-4 h-4" />
                Analyze Another Scan
            </motion.button>
        </motion.div>
    );
}
