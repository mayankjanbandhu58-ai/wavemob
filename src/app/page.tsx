"use client";

import { useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { UploadZone } from "@/components/upload-zone";
import { AnalysisScreen } from "@/components/analysis-screen";
import { ResultsScreen } from "@/components/results-screen";
import type { ViewType } from "@/components/sidebar";

type AppState = "idle" | "preview" | "analyzing" | "results";

export default function Dashboard() {
    const [currentView, setCurrentView] = useState<ViewType>("new-scan");
    const [appState, setAppState] = useState<AppState>("idle");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);

    /* ── File handlers ──────────────────────────── */
    const handleFileSelect = useCallback((selectedFile: File) => {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setAppState("preview");
    }, []);

    const handleAnalyze = useCallback(() => {
        if (!file) return;
        setAppState("analyzing");
    }, [file]);

    const handleAnalysisComplete = useCallback(() => {
        setAppState("results");
    }, []);

    const handleReset = useCallback(() => {
        setFile(null);
        setPreview(null);
        setAppState("idle");
    }, []);

    const handleNewScan = useCallback(() => {
        handleReset();
        setCurrentView("new-scan");
    }, [handleReset]);

    /* ── Render ─────────────────────────────────── */
    return (
        <div className="flex w-screen h-screen overflow-hidden bg-gray-50/50">
            <Sidebar currentView={currentView} onChangeView={setCurrentView} />

            {/* ── Main Content ──────────────────────── */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden relative bg-gray-50/50">
                {/* Disclaimer banner */}
                <div className="bg-amber-50 border-b border-amber-100 shrink-0">
                    <div className="px-4 lg:px-6 py-2 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <p className="text-[10px] text-amber-700 font-medium">
                            For clinical decision support only. All findings must be reviewed by qualified medical personnel.
                        </p>
                    </div>
                </div>

                {/* Content area */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {/* Page header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="pl-10 lg:pl-0">
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                                    {currentView === "new-scan"
                                        ? "New Scan Analysis"
                                        : currentView === "history"
                                            ? "Scan History"
                                            : "About Wavelength AI"}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {currentView === "new-scan"
                                        ? "Upload a chest X-ray for AI-powered analysis"
                                        : currentView === "history"
                                            ? "Review previously analyzed scans"
                                            : "System information and capabilities"}
                                </p>
                            </div>
                            {currentView === "new-scan" && (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] text-emerald-700 font-bold">AI Pipeline Ready</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* View content */}
                    <AnimatePresence mode="wait">
                        {currentView === "new-scan" ? (
                            <motion.div
                                key="new-scan"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-lg mx-auto space-y-4"
                            >
                                {/* Upload zone (shown in idle and preview states) */}
                                {(appState === "idle" || appState === "preview") && (
                                    <>
                                        <UploadZone
                                            onFileSelect={handleFileSelect}
                                            file={file}
                                            preview={preview}
                                            onReset={handleReset}
                                        />

                                        {/* Analyze button (preview state) */}
                                        {appState === "preview" && file && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleAnalyze}
                                                className="w-full py-4 rounded-xl gradient-olive-glow text-white font-bold text-sm
                          flex items-center justify-center gap-2.5
                          shadow-lg shadow-olive/20 hover:shadow-xl transition-shadow"
                                            >
                                                <Activity className="w-5 h-5" />
                                                Run AI Analysis
                                            </motion.button>
                                        )}
                                    </>
                                )}

                                {/* Results */}
                                {appState === "results" && file && preview && (
                                    <ResultsScreen
                                        fileName={file.name}
                                        imagePreview={preview}
                                        onNewScan={handleNewScan}
                                    />
                                )}
                            </motion.div>
                        ) : currentView === "history" ? (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-lg mx-auto"
                            >
                                <HistoryView />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="about"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-lg mx-auto"
                            >
                                <AboutView />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>

            {/* ── Full-screen analysis overlay ──────── */}
            <AnimatePresence>
                {appState === "analyzing" && file && preview && (
                    <AnalysisScreen
                        imagePreview={preview}
                        fileName={file.name}
                        onComplete={handleAnalysisComplete}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   History View (static demo data)
   ═══════════════════════════════════════════════════ */
function HistoryView() {
    const demoScans = [
        { name: "1 high sus", risk: "High", date: "Feb 27, 2026" },
        { name: "2 moderate", risk: "Moderate", date: "Feb 26, 2026" },
        { name: "3 low", risk: "Low", date: "Feb 25, 2026" },
        { name: "5 high", risk: "High", date: "Feb 24, 2026" },
        { name: "8 low", risk: "Low", date: "Feb 23, 2026" },
        { name: "12 m", risk: "Moderate", date: "Feb 22, 2026" },
    ];

    const riskColor: Record<string, string> = {
        High: "text-red-600 bg-red-50 border-red-200",
        Moderate: "text-amber-600 bg-amber-50 border-amber-200",
        Low: "text-emerald-600 bg-emerald-50 border-emerald-200",
    };

    return (
        <div className="space-y-3">
            {demoScans.map((scan, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 rounded-xl card-elevated hover:shadow-md transition-shadow"
                >
                    {/* Thumbnail */}
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shrink-0 border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={`/dataset/images/${encodeURIComponent(scan.name)}.png`}
                            alt={scan.name}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">
                            Scan {scan.name}
                        </p>
                        <p className="text-[10px] text-gray-400">{scan.date}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskColor[scan.risk]}`}>
                        {scan.risk}
                    </span>
                </motion.div>
            ))}

            <p className="text-center text-[10px] text-gray-400 pt-4">
                Showing demo scan history • Upload a scan to add new entries
            </p>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   About View
   ═══════════════════════════════════════════════════ */
function AboutView() {
    const specs = [
        { label: "AI Model", value: "DenseNet-121 Ensemble (×3)" },
        { label: "Training Data", value: "NIH ChestX-ray14 (112,120 images)" },
        { label: "Classes", value: "8 pathological conditions" },
        { label: "Inference", value: "On-device, fully offline" },
        { label: "Report Format", value: "Structured PDF with risk scores" },
        { label: "Version", value: "1.0.0 (Demo)" },
    ];

    return (
        <div className="space-y-6">
            {/* Hero */}
            <div className="rounded-2xl card-elevated p-6 text-center">
                <div className="w-16 h-16 rounded-2xl gradient-olive mx-auto mb-4 flex items-center justify-center shadow-xl animate-pulse-glow">
                    <span className="text-2xl">🫁</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Wavelength AI</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    AI-powered multi-disease chest X-ray screening for clinical
                    decision support in resource-limited settings.
                </p>
            </div>

            {/* Specs */}
            <div className="rounded-xl card-elevated divide-y divide-gray-100">
                {specs.map((spec, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between px-4 py-3"
                    >
                        <span className="text-xs text-gray-400">{spec.label}</span>
                        <span className="text-xs text-gray-800 font-medium">{spec.value}</span>
                    </motion.div>
                ))}
            </div>

            {/* Disclaimer */}
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-[10px] text-amber-700 leading-relaxed text-center">
                    This is an offline demo application. The AI analysis is simulated using
                    pre-generated PDF reports. In production, Wavelength AI uses a Python FastAPI
                    backend with real-time DenseNet-121 inference, Grad-CAM heatmaps, and
                    Monte Carlo dropout uncertainty estimation.
                </p>
            </div>
        </div>
    );
}
