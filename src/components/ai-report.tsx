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

// Simulated 5-point longitudinal timeline
const TIMELINE = [
    { date: "Jan 15", label: "Initial scan", status: "resolved" },
    { date: "Jan 28", label: "Follow-up #1", status: "resolved" },
    { date: "Feb 10", label: "Follow-up #2", status: "stable" },
    { date: "Feb 20", label: "Follow-up #3", status: "stable" },
    { date: "Feb 27", label: "Current scan", status: "current" },
];

export function AiReport({ report, imagePreview, onNewScan }: AiReportProps) {
    const [mode, setMode] = useState<SummaryMode>("clinical");

    const statusColor = {
        resolved: "bg-emerald-400",
        stable: "bg-amber-400",
        current: report.riskColor === "red" ? "bg-red-500" : report.riskColor === "amber" ? "bg-amber-500" : "bg-emerald-500",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-5"
        >
            {/* ── Header Card ──────────────────────────────── */}
            <div className="rounded-2xl card-elevated overflow-hidden">
                <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start gap-4">
                        {/* X-ray Thumbnail */}
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imagePreview} alt="X-Ray" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 truncate">
                                        {report.patientData.name || "Patient"}
                                    </h2>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        {report.patientData.age && `Age ${report.patientData.age}`}
                                        {report.patientData.gender && ` · ${report.patientData.gender}`}
                                    </p>
                                    <p className="text-[9px] font-mono text-olive mt-1 font-bold">{report.reportId}</p>
                                </div>
                            </div>
                            {report.patientData.symptoms && (
                                <p className="text-[10px] text-gray-500 mt-2 bg-gray-50 rounded-lg px-2 py-1 border border-gray-100">
                                    <span className="font-bold">Symptoms:</span> {report.patientData.symptoms}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* PDF buttons */}
                <div className="px-5 pb-5 grid grid-cols-2 gap-3">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={() => window.open(report.pdfUrl, "_blank")}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl gradient-olive text-white text-xs font-bold shadow-md shadow-olive/20"
                    >
                        <FileText className="w-4 h-4" />
                        View PDF Report
                    </motion.button>
                    <motion.a
                        whileTap={{ scale: 0.97 }}
                        href={report.pdfUrl}
                        download
                        className="flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </motion.a>
                </div>
            </div>

            {/* ── Risk Badge ────────────────────────────────── */}
            <RiskBadge report={report} />

            {/* ── Disease Probability Table ─────────────────── */}
            <DiseaseTable diseases={report.diseases} showDifferential={true} />

            {/* ── Clinical Next Step ────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl bg-indigo-50 border border-indigo-200 p-5"
            >
                <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                        Clinical Next Step
                        <span className="ml-2 text-[9px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded uppercase font-bold">
                            Guideline
                        </span>
                    </h3>
                </div>
                <p className="text-xs text-indigo-800 leading-relaxed font-medium bg-white/60 rounded-xl p-3 border border-indigo-100">
                    {report.clinicalGuideline}
                </p>
            </motion.div>

            {/* ── AI Narrative ─────────────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl card-elevated overflow-hidden"
            >
                {/* Tab header */}
                <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <h3 className="text-sm font-bold text-gray-900">AI Report Synthesis</h3>
                    </div>
                    {/* Mode toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={() => setMode("clinical")}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${mode === "clinical" ? "bg-white text-indigo-700 shadow-sm" : "text-gray-500"
                                }`}
                        >
                            Clinical
                        </button>
                        <button
                            onClick={() => setMode("patient")}
                            className={`px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors ${mode === "patient" ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500"
                                }`}
                        >
                            Patient
                        </button>
                    </div>
                </div>

                {/* Narrative content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={mode}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.2 }}
                        className="p-5"
                    >
                        <div className="prose prose-sm max-w-none text-gray-700 text-xs leading-relaxed">
                            {(mode === "clinical" ? report.aiSummaryClinical : report.aiSummaryPatient)
                                .split("\n")
                                .map((line, i) => {
                                    if (line.startsWith("## ")) {
                                        return (
                                            <h4 key={i} className="text-sm font-bold text-gray-900 mt-4 mb-2 first:mt-0">
                                                {line.replace("## ", "")}
                                            </h4>
                                        );
                                    }
                                    if (line.trim() === "") return <div key={i} className="h-2" />;
                                    // Render **bold** text
                                    const parts = line.split(/\*\*(.+?)\*\*/g);
                                    return (
                                        <p key={i} className="mb-1">
                                            {parts.map((p, j) =>
                                                j % 2 === 1 ? <strong key={j}>{p}</strong> : p
                                            )}
                                        </p>
                                    );
                                })}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Disclaimer for clinical mode */}
                {mode === "clinical" && (
                    <div className="mx-5 mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
                        <div className="flex items-start gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-red-700 font-medium leading-relaxed">
                                This is an AI-generated diagnostic synthesis. All findings require verification by a qualified radiologist or physician before any clinical action is taken.
                            </p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ── Longitudinal Timeline ─────────────────────── */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-2xl card-elevated p-5"
            >
                <div className="flex items-center gap-2 mb-5">
                    <ChevronRight className="w-4 h-4 text-indigo-500" />
                    <h3 className="text-sm font-bold text-gray-900">Longitudinal Case Tracking</h3>
                </div>

                <div className="relative">
                    {/* Line */}
                    <div className="absolute top-2.5 left-2 right-2 h-0.5 bg-gray-200" />

                    <div className="relative flex justify-between">
                        {TIMELINE.map((t, i) => (
                            <div key={i} className="flex flex-col items-center gap-2" style={{ width: `${100 / TIMELINE.length}%` }}>
                                <div
                                    className={`w-5 h-5 rounded-full border-2 border-white shadow-md z-10 ${statusColor[t.status as keyof typeof statusColor]
                                        } ${t.status === "current" ? "ring-2 ring-offset-1 ring-olive" : ""}`}
                                />
                                <p className="text-[9px] text-gray-400 font-medium text-center">{t.date}</p>
                                <p className="text-[9px] text-gray-600 font-bold text-center leading-tight">{t.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ── New Scan Button ───────────────────────────── */}
            <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={onNewScan}
                className="w-full py-3 rounded-xl text-gray-400 font-medium text-sm flex items-center justify-center gap-2 hover:text-gray-600 hover:bg-gray-50 transition-all"
            >
                <RotateCcw className="w-4 h-4" />
                Analyze Another Scan
            </motion.button>

            {/* ── Disclaimer ───────────────────────────────── */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-[10px] text-amber-700 leading-relaxed text-center">
                    <span className="font-semibold">⚠ Clinical Disclaimer:</span>{" "}
                    This report is for decision support only. All findings must be reviewed by a qualified radiologist or physician.
                </p>
            </div>
        </motion.div>
    );
}
