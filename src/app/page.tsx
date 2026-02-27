"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle, BarChart2 } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { UploadZone } from "@/components/upload-zone";
import { PatientForm } from "@/components/patient-form";
import { AnalysisScreen } from "@/components/analysis-screen";
import { AiReport } from "@/components/ai-report";
import type { ViewType } from "@/components/sidebar";
import { generateSimulatedReport, type PatientData, type SimulatedReport } from "@/lib/dataset";

type AppState = "idle" | "preview" | "analyzing" | "results";

interface ScanRecord {
    id: string;
    timestamp: string;
    patientData: PatientData;
    report: SimulatedReport;
    preview: string;
}

const EMPTY_PATIENT: PatientData = {
    name: "",
    age: "",
    gender: "",
    phone: "",
    address: "",
    symptoms: "",
    smoking_history: "Never",
};

export default function Dashboard() {
    const [currentView, setCurrentView] = useState<ViewType>("new-scan");
    const [appState, setAppState] = useState<AppState>("idle");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [patient, setPatient] = useState<PatientData>({ ...EMPTY_PATIENT });
    const [report, setReport] = useState<SimulatedReport | null>(null);
    const [history, setHistory] = useState<ScanRecord[]>([]);
    const [selectedHistory, setSelectedHistory] = useState<ScanRecord | null>(null);
    const previewBlobRef = useRef<string | null>(null);

    const isFormValid = patient.name.trim() && patient.age.trim() && patient.gender;

    /* ── File handlers ─────────────────────────────── */
    const handleFileSelect = useCallback((selectedFile: File) => {
        if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
        const url = URL.createObjectURL(selectedFile);
        previewBlobRef.current = url;
        setFile(selectedFile);
        setPreview(url);
        setAppState("preview");
    }, []);

    const handleAnalyze = useCallback(() => {
        if (!file || !isFormValid) return;
        setAppState("analyzing");
    }, [file, isFormValid]);

    const handleAnalysisComplete = useCallback(() => {
        if (!file || !preview) return;
        const sim = generateSimulatedReport(file.name, patient);
        setReport(sim);

        const record: ScanRecord = {
            id: sim.reportId,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            patientData: { ...patient },
            report: sim,
            preview,
        };
        setHistory(prev => [record, ...prev]);
        setAppState("results");
    }, [file, preview, patient]);

    const handleReset = useCallback(() => {
        setFile(null);
        setPreview(null);
        setAppState("idle");
        setReport(null);
        setPatient({ ...EMPTY_PATIENT });
    }, []);

    const handleNewScan = useCallback(() => {
        handleReset();
        setCurrentView("new-scan");
    }, [handleReset]);

    /* ── Render ─────────────────────────────────────── */
    return (
        <div className="flex w-screen h-screen overflow-hidden bg-gray-50/50">
            <Sidebar currentView={currentView} onChangeView={setCurrentView} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Disclaimer banner */}
                <div className="bg-amber-50 border-b border-amber-100 shrink-0">
                    <div className="px-4 lg:px-6 py-2 flex items-center gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        <p className="text-[10px] text-amber-700 font-medium">
                            For clinical decision support only. All findings must be reviewed by qualified medical personnel.
                        </p>
                    </div>
                </div>

                {/* Scrollable content area */}
                <main className="flex-1 overflow-y-auto p-4 lg:p-8">
                    {/* Page header */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between">
                            <div className="pl-10 lg:pl-0">
                                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">
                                    {currentView === "new-scan" ? "New Scan Analysis"
                                        : currentView === "history" ? "Scan History"
                                            : currentView === "analytics" ? "Analytics"
                                                : "About Wavelength AI"}
                                </h2>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {currentView === "new-scan" ? "Upload a chest X-ray for AI-powered analysis"
                                        : currentView === "history" ? `${history.length} scan${history.length !== 1 ? "s" : ""} this session`
                                            : currentView === "analytics" ? "Session performance overview"
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

                    {/* View */}
                    <AnimatePresence mode="wait">

                        {/* ══ NEW SCAN VIEW ══ */}
                        {currentView === "new-scan" && (
                            <motion.div
                                key="new-scan"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-lg mx-auto space-y-4"
                            >
                                {/* Show patient form + upload in idle/preview */}
                                {(appState === "idle" || appState === "preview") && (
                                    <>
                                        <PatientForm
                                            data={patient}
                                            onChange={setPatient}
                                            disabled={false}
                                        />

                                        {/* Upload zone (unlocked after form filled) */}
                                        <div className={`relative transition-all duration-300 ${!isFormValid ? "opacity-50 pointer-events-none" : ""}`}>
                                            {!isFormValid && (
                                                <div className="absolute inset-0 z-10 flex items-center justify-center">
                                                    <div className="bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow text-xs font-bold text-gray-500 flex items-center gap-1.5">
                                                        <span>🔒</span> Complete patient form first
                                                    </div>
                                                </div>
                                            )}
                                            <UploadZone
                                                onFileSelect={handleFileSelect}
                                                file={file}
                                                preview={preview}
                                                onReset={handleReset}
                                            />
                                        </div>

                                        {/* Analyze button */}
                                        {appState === "preview" && file && isFormValid && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleAnalyze}
                                                className="w-full py-4 rounded-xl gradient-olive-glow text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-olive/20 hover:shadow-xl transition-shadow"
                                            >
                                                <Activity className="w-5 h-5" />
                                                Run AI Analysis
                                            </motion.button>
                                        )}
                                    </>
                                )}

                                {/* Results — full AI report */}
                                {appState === "results" && report && preview && (
                                    <AiReport
                                        report={report}
                                        imagePreview={preview}
                                        onNewScan={handleNewScan}
                                    />
                                )}
                            </motion.div>
                        )}

                        {/* ══ HISTORY VIEW ══ */}
                        {currentView === "history" && (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-lg mx-auto"
                            >
                                <HistoryView
                                    history={history}
                                    onOpenScan={setSelectedHistory}
                                />
                            </motion.div>
                        )}

                        {/* ══ ANALYTICS VIEW ══ */}
                        {currentView === "analytics" && (
                            <motion.div
                                key="analytics"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="max-w-lg mx-auto"
                            >
                                <AnalyticsView history={history} />
                            </motion.div>
                        )}

                        {/* ══ ABOUT VIEW ══ */}
                        {currentView === "about" && (
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

            {/* ── Full-screen analysis overlay ──────────── */}
            <AnimatePresence>
                {appState === "analyzing" && file && preview && (
                    <AnalysisScreen
                        imagePreview={preview}
                        fileName={file.name}
                        onComplete={handleAnalysisComplete}
                    />
                )}
            </AnimatePresence>

            {/* ── History detail modal ───────────────────── */}
            <AnimatePresence>
                {selectedHistory && (
                    <HistoryModal
                        scan={selectedHistory}
                        onClose={() => setSelectedHistory(null)}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   History View
   ═══════════════════════════════════════════════════ */
function HistoryView({ history, onOpenScan }: { history: ScanRecord[]; onOpenScan: (s: ScanRecord) => void }) {
    const riskColor: Record<string, string> = {
        "High Suspicion": "text-red-600 bg-red-50 border-red-200",
        "Moderate Risk": "text-amber-600 bg-amber-50 border-amber-200",
        "Low Risk": "text-emerald-600 bg-emerald-50 border-emerald-200",
    };

    if (history.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-4">
                    <Activity className="w-7 h-7 text-gray-300" />
                </div>
                <h3 className="text-sm font-bold text-gray-600 mb-1">No Scans This Session</h3>
                <p className="text-xs text-gray-400 text-center max-w-[200px]">
                    Complete a patient scan to see results here.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {history.map((scan, i) => (
                <motion.div
                    key={scan.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => onOpenScan(scan)}
                    className="flex items-center gap-4 p-4 rounded-xl card-elevated hover:shadow-md transition-shadow cursor-pointer"
                >
                    <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={scan.preview} alt={scan.patientData.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate">{scan.patientData.name || "Anonymous"}</p>
                        <p className="text-[10px] text-gray-400">{scan.timestamp} · {scan.patientData.age && `Age ${scan.patientData.age}`}</p>
                        <p className="text-[10px] font-mono text-olive">{scan.id}</p>
                    </div>
                    <div className="shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${riskColor[scan.report.riskLevel]}`}>
                            {scan.report.riskLevel}
                        </span>
                    </div>
                </motion.div>
            ))}
            <p className="text-center text-[10px] text-gray-400 pt-2">
                Tap a record to view full report
            </p>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   History Detail Modal
   ═══════════════════════════════════════════════════ */
function HistoryModal({ scan, onClose }: { scan: ScanRecord; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 60, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto"
            >
                {/* Modal header */}
                <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between z-10">
                    <h3 className="text-sm font-bold text-gray-900">Scan Report</h3>
                    <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 font-bold px-3 py-1 rounded-lg hover:bg-gray-100">
                        Close ✕
                    </button>
                </div>
                <div className="p-4">
                    <AiReport
                        report={scan.report}
                        imagePreview={scan.preview}
                        onNewScan={onClose}
                    />
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ═══════════════════════════════════════════════════
   Analytics View
   ═══════════════════════════════════════════════════ */
function AnalyticsView({ history }: { history: ScanRecord[] }) {
    const total = history.length;
    const highCount = history.filter(s => s.report.riskLevel === "High Suspicion").length;
    const modCount = history.filter(s => s.report.riskLevel === "Moderate Risk").length;
    const lowCount = history.filter(s => s.report.riskLevel === "Low Risk").length;
    const avgConf = total > 0
        ? history.reduce((acc, s) => acc + s.report.confidenceScore, 0) / total
        : 0;
    const topDisease = total > 0
        ? history.reduce((acc: Record<string, number>, s) => {
            const d = s.report.topDisease;
            acc[d] = (acc[d] || 0) + 1;
            return acc;
        }, {})
        : {};
    const topDx = Object.entries(topDisease).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—";

    const stats = [
        { label: "Total Scans", value: total.toString(), color: "text-olive" },
        { label: "High Risk", value: highCount.toString(), color: "text-red-600" },
        { label: "Moderate", value: modCount.toString(), color: "text-amber-600" },
        { label: "Low Risk", value: lowCount.toString(), color: "text-emerald-600" },
        { label: "Avg Confidence", value: total > 0 ? `${avgConf.toFixed(1)}%` : "—", color: "text-indigo-600" },
        { label: "Top Finding", value: topDx, color: "text-gray-800" },
    ];

    if (total === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 rounded-2xl border-2 border-dashed border-gray-200 bg-white">
                <BarChart2 className="w-12 h-12 text-gray-200 mb-4" />
                <h3 className="text-sm font-bold text-gray-600 mb-1">No Data Yet</h3>
                <p className="text-xs text-gray-400 text-center max-w-[200px]">
                    Run at least one scan to see analytics.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {stats.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="rounded-2xl card-elevated p-4 flex flex-col gap-1"
                    >
                        <span className={`text-xl font-black truncate ${s.color}`}>{s.value}</span>
                        <span className="text-[10px] text-gray-400 font-medium">{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Risk distribution bar */}
            {total > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-2xl card-elevated p-5"
                >
                    <h3 className="text-xs font-bold text-gray-700 mb-4 uppercase tracking-wider">Risk Distribution</h3>
                    <div className="h-4 rounded-full overflow-hidden flex gap-0.5">
                        {highCount > 0 && (
                            <div className="bg-red-400 h-full" style={{ width: `${(highCount / total) * 100}%` }} title="High" />
                        )}
                        {modCount > 0 && (
                            <div className="bg-amber-400 h-full" style={{ width: `${(modCount / total) * 100}%` }} title="Moderate" />
                        )}
                        {lowCount > 0 && (
                            <div className="bg-emerald-400 h-full" style={{ width: `${(lowCount / total) * 100}%` }} title="Low" />
                        )}
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                        {[
                            { label: "High", color: "bg-red-400", count: highCount },
                            { label: "Moderate", color: "bg-amber-400", count: modCount },
                            { label: "Low", color: "bg-emerald-400", count: lowCount },
                        ].map(r => (
                            <div key={r.label} className="flex items-center gap-1.5">
                                <div className={`w-2.5 h-2.5 rounded-full ${r.color}`} />
                                <span className="text-[10px] text-gray-600 font-medium">{r.label} ({r.count})</span>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Recent scan list */}
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="rounded-2xl card-elevated divide-y divide-gray-100 overflow-hidden"
            >
                <div className="px-5 py-3 bg-gray-50">
                    <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Recent Scans</h3>
                </div>
                {history.slice(0, 5).map((scan, i) => (
                    <div key={scan.id} className="px-5 py-3 flex items-center gap-3">
                        <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}</span>
                        <p className="text-xs font-semibold text-gray-800 flex-1 truncate">{scan.patientData.name || "Anonymous"}</p>
                        <p className="text-[10px] text-gray-400 shrink-0">{scan.report.topDisease}</p>
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${scan.report.riskLevel === "High Suspicion" ? "bg-red-100 text-red-600"
                            : scan.report.riskLevel === "Moderate Risk" ? "bg-amber-100 text-amber-600"
                                : "bg-emerald-100 text-emerald-600"
                            }`}>
                            {scan.report.riskLevel.split(" ")[0]}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════
   About View
   ═══════════════════════════════════════════════════ */
function AboutView() {
    const specs = [
        { label: "AI Model", value: "DenseNet-121 + EfficientNet-B4 Ensemble" },
        { label: "Training Data", value: "NIH ChestX-ray14 (112,120 images)" },
        { label: "Pathologies", value: "8 multi-label conditions" },
        { label: "Inference", value: "On-device, fully offline" },
        { label: "Uncertainty", value: "Monte Carlo Dropout (n=50)" },
        { label: "Calibration", value: "Platt Scaling" },
        { label: "Report Format", value: "Structured PDF + AI Narrative" },
        { label: "Version", value: "2.0.0 (Mobile Demo)" },
    ];

    return (
        <div className="space-y-5">
            <div className="rounded-2xl card-elevated p-6 text-center">
                <div className="w-16 h-16 rounded-2xl gradient-olive mx-auto mb-4 flex items-center justify-center shadow-xl animate-pulse-glow">
                    <span className="text-2xl">🫁</span>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">Wavelength AI</h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                    AI-powered multi-disease chest X-ray screening for rapid clinical decision support in resource-limited settings.
                </p>
            </div>

            <div className="rounded-xl card-elevated divide-y divide-gray-100">
                {specs.map((spec, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between px-4 py-3"
                    >
                        <span className="text-xs text-gray-400">{spec.label}</span>
                        <span className="text-xs text-gray-800 font-medium text-right max-w-[55%]">{spec.value}</span>
                    </motion.div>
                ))}
            </div>

            <div className="rounded-xl bg-amber-50 border border-amber-200 p-4">
                <p className="text-[10px] text-amber-700 leading-relaxed text-center">
                    This is an offline demo application. AI analysis is simulated using pre-generated PDF reports matched by filename.
                    In production, Wavelength AI uses a Python FastAPI backend with real-time DenseNet inference and Grad-CAM heatmaps.
                </p>
            </div>
        </div>
    );
}
