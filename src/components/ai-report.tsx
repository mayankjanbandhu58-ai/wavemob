"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Download, RotateCcw, Activity, ChevronRight, ShieldAlert, Loader2 } from "lucide-react";
import { DiseaseTable } from "@/components/disease-table";
import { RiskBadge } from "@/components/risk-badge";
import type { SimulatedReport } from "@/lib/dataset";

interface AiReportProps {
    report: SimulatedReport;
    imagePreview: string;
    onNewScan: () => void;
}

type SummaryMode = "clinical" | "patient";

import { generateReportPdf } from "@/lib/pdf-generator";

/* ── Robust PDF download for Android Capacitor ────────────────
   Strategy A (native): generate Blob → base64 → Filesystem.writeFile → Share
   Strategy B (browser): generate Blob → hidden <a> click with download attr
   NEVER uses window.open (breaks WebView navigation + back button)
────────────────────────────────────────────────────────────── */
async function downloadPdf(report: SimulatedReport, imageBase64: string, filename: string) {
    let blob: Blob;
    try {
        // Generate PDF on the fly using jspdf — 100% reliable, no network requests
        blob = generateReportPdf(report, imageBase64);
    } catch (err) {
        console.error("PDF generation failed:", err);
        alert("Could not generate the report PDF. Please try again.");
        return;
    }

    // ── Strategy A: Native Capacitor (Android APK) ──
    try {
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve((reader.result as string).split(",")[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        const { Filesystem, Directory } = await import("@capacitor/filesystem");
        const { Share } = await import("@capacitor/share");

        const result = await Filesystem.writeFile({
            path: filename,
            data: base64,
            directory: Directory.Cache,
            recursive: true,
        });

        await Share.share({
            title: filename,
            text: "Wavelength AI — Chest X-Ray Report",
            url: result.uri,
            dialogTitle: "Save or open your report",
        });
        return; // success — exit early
    } catch {
        // Capacitor not available or failed → fall through to browser method
    }

    // ── Strategy B: Browser fallback (hidden <a> blob download) ──
    try {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(blobUrl);
        }, 500);
    } catch {
        alert("Download failed. Please try again.");
    }
}



const TIMELINE = [
    { date: "Jan 15", label: "Initial" },
    { date: "Jan 28", label: "Fup #1" },
    { date: "Feb 10", label: "Fup #2" },
    { date: "Feb 20", label: "Fup #3" },
    { date: "Feb 27", label: "Current" },
];

export function AiReport({ report, imagePreview, onNewScan }: AiReportProps) {
    const [mode, setMode] = useState<SummaryMode>("clinical");
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        const name = `Wavelength-${report.patientData.name || "Report"}-${report.reportId}.pdf`;
        await downloadPdf(report, imagePreview, name);
        setDownloading(false);
    };

    return (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

            {/* ── Patient Header ─────────────────────────── */}
            <div className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E5DC", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-900 shrink-0" style={{ border: "1px solid #E5E5DC" }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={imagePreview} alt="X-Ray" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-base font-bold text-gray-900 truncate">{report.patientData.name || "Anonymous Patient"}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {report.patientData.age && `Age ${report.patientData.age}`}
                                {report.patientData.gender && ` · ${report.patientData.gender}`}
                            </p>
                            {report.patientData.symptoms && (
                                <p className="text-[10px] text-gray-600 mt-1.5 px-2 py-1 rounded-lg" style={{ background: "#F0F0E8", border: "1px solid #E5E5DC" }}>
                                    <span className="font-bold">Symptoms:</span> {report.patientData.symptoms}
                                </p>
                            )}
                            <p className="text-[9px] font-mono mt-1.5" style={{ color: "#636B2F" }}>{report.reportId}</p>
                        </div>
                    </div>
                </div>

                {/* Download Report — native Capacitor download */}
                <div className="px-5 pb-5">
                    <motion.button
                        whileTap={{ scale: 0.97 }}
                        onClick={handleDownload}
                        disabled={downloading}
                        className="btn-primary"
                        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, fontSize: 15, padding: "14px 20px", width: "100%", border: "none", cursor: downloading ? "not-allowed" : "pointer", opacity: downloading ? 0.8 : 1 }}
                    >
                        {downloading
                            ? <><Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} /> Preparing…</>
                            : <><Download style={{ width: 20, height: 20 }} /> Download Report</>}
                    </motion.button>
                </div>
            </div>

            {/* ── Risk Badge ─────────────────────────────── */}
            <RiskBadge report={report} />

            {/* ── Disease Table ──────────────────────────── */}
            <DiseaseTable diseases={report.diseases} showDifferential={true} />

            {/* ── Clinical Guideline ─────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="rounded-2xl p-5" style={{ background: "#EEF0E0", border: "1px solid #C5CC9A" }}>
                <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4" style={{ color: "#636B2F" }} />
                    <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: "#636B2F" }}>
                        Clinical Next Step
                        <span className="ml-2 text-[9px] px-2 py-0.5 rounded uppercase font-bold"
                            style={{ background: "#C5CC9A", color: "#3a400f" }}>Guideline</span>
                    </h3>
                </div>
                <p className="text-sm text-gray-800 leading-relaxed bg-white rounded-xl p-3" style={{ border: "1px solid #D8DBA8" }}>
                    {report.clinicalGuideline}
                </p>
            </motion.div>

            {/* ── AI Narrative ───────────────────────────── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                className="bg-white rounded-2xl overflow-hidden" style={{ border: "1px solid #E5E5DC", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                {/* Tab header */}
                <div className="px-5 py-4 flex items-center justify-between" style={{ background: "#F5F5EF", borderBottom: "1px solid #E5E5DC" }}>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4" style={{ color: "#636B2F" }} />
                        <h3 className="text-sm font-bold text-gray-900">AI Report Synthesis</h3>
                    </div>
                    <div className="flex items-center bg-white rounded-lg p-0.5" style={{ border: "1px solid #E5E5DC" }}>
                        <button onClick={() => setMode("clinical")}
                            className="px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors"
                            style={{ background: mode === "clinical" ? "#636B2F" : "transparent", color: mode === "clinical" ? "#fff" : "#888" }}>
                            Clinical
                        </button>
                        <button onClick={() => setMode("patient")}
                            className="px-3 py-1.5 text-[10px] font-bold rounded-md transition-colors"
                            style={{ background: mode === "patient" ? "#059669" : "transparent", color: mode === "patient" ? "#fff" : "#888" }}>
                            Patient
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div key={mode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }} className="p-5">
                        <div className="text-sm text-gray-700 leading-relaxed space-y-2">
                            {(mode === "clinical" ? report.aiSummaryClinical : report.aiSummaryPatient)
                                .split("\n").map((line, i) => {
                                    if (line.startsWith("## ")) return <h4 key={i} className="text-base font-bold text-gray-900 mt-3 mb-1 first:mt-0">{line.replace("## ", "")}</h4>;
                                    if (!line.trim()) return <div key={i} className="h-1" />;
                                    const parts = line.split(/\*\*(.+?)\*\*/g);
                                    return <p key={i}>{parts.map((p, j) => j % 2 === 1 ? <strong key={j}>{p}</strong> : p)}</p>;
                                })}
                        </div>
                    </motion.div>
                </AnimatePresence>

                {mode === "clinical" && (
                    <div className="mx-5 mb-4 p-3 rounded-xl" style={{ background: "#FEF2F2", border: "1px solid #FECACA" }}>
                        <div className="flex items-start gap-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-red-700 leading-relaxed">AI-generated synthesis only. Requires radiologist verification before clinical action.</p>
                        </div>
                    </div>
                )}
            </motion.div>

            {/* ── Longitudinal Timeline ──────────────────── */}
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                className="bg-white rounded-2xl p-5" style={{ border: "1px solid #E5E5DC" }}>
                <div className="flex items-center gap-2 mb-5">
                    <ChevronRight className="w-4 h-4" style={{ color: "#636B2F" }} />
                    <h3 className="text-sm font-bold text-gray-900">Longitudinal Tracking</h3>
                </div>
                <div className="relative">
                    <div className="absolute top-2.5 left-4 right-4 h-px" style={{ background: "#E5E5DC" }} />
                    <div className="relative flex justify-between">
                        {TIMELINE.map((t, i) => {
                            const isCurrent = i === TIMELINE.length - 1;
                            return (
                                <div key={i} className="flex flex-col items-center gap-1.5" style={{ width: `${100 / TIMELINE.length}%` }}>
                                    <div className="w-5 h-5 rounded-full z-10 border-2 border-white shadow-md"
                                        style={{
                                            background: isCurrent ? "#636B2F" : "#C5CC9A",
                                            outline: isCurrent ? "2px solid #636B2F" : "none",
                                            outlineOffset: 2,
                                        }} />
                                    <p className="text-[8px] text-gray-400">{t.date}</p>
                                    <p className="text-[8px] font-bold text-gray-600 text-center">{t.label}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* ── New Scan ───────────────────────────────── */}
            <button onClick={onNewScan}
                className="w-full py-3 rounded-xl text-sm font-medium text-gray-400 flex items-center justify-center gap-2 hover:text-gray-600 hover:bg-white transition-all"
                style={{ border: "1px solid #E5E5DC" }}>
                <RotateCcw className="w-4 h-4" />
                Analyze Another Scan
            </button>

            {/* Disclaimer */}
            <div className="rounded-xl p-4 text-center" style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
                <p className="text-[10px] text-amber-700">
                    <strong>⚠ Clinical Disclaimer:</strong> For decision support only. All findings require physician review.
                </p>
            </div>
        </motion.div>
    );
}
