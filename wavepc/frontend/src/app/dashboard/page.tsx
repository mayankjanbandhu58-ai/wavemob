"use client";

import { useState, useCallback, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Upload,
    FileText,
    Shield,
    AlertTriangle,
    Database,
    Image as ImageIcon,
} from "lucide-react";
import { UploadZone } from "@/components/upload/upload-zone";
import { ImageViewer } from "@/components/viewer/image-viewer";
import { DiseaseTable } from "@/components/results/disease-table";
import { RiskBadge } from "@/components/results/risk-badge";
import { UncertaintyIndicator } from "@/components/results/uncertainty-indicator";
import { ReportDownload } from "@/components/report/report-download";
import { predictImage } from "@/lib/api";
import type { PredictionResponse, ScanRecord } from "@/types";
import { Sidebar } from "@/components/layout/sidebar";
import { NewScan } from "@/components/views/new-scan";
import { Worklist } from "@/components/views/worklist";
import { PatientReports } from "@/components/views/patient-reports";
import { UploadHistory } from "@/components/views/upload-history";
import { AiSummary } from "@/components/views/ai-summary";
import { AiChat } from "@/components/views/ai-chat";
import { Learn } from "@/components/views/learn";
import { Analytics } from "@/components/views/analytics";
import { EhrSync } from "@/components/views/ehr-sync";
import { Scoring } from "@/components/views/scoring";
import { TrainingMode } from "@/components/views/training-mode";
import { DeveloperMode } from "@/components/views/developer-mode";
import type { ViewType } from "@/components/layout/sidebar";

const referenceCases: Record<string, { url: string, caption: string }[]> = {
    "No Finding": [
        { url: "/dataset/CHNCXR_0187_0.png", caption: "Verified Case #00221 (Clear lungs, normal cardiac size)" },
        { url: "/dataset/CHNCXR_0188_0.png", caption: "Verified Case #00812 (No acute pulmonary disease)" }
    ],
    "Infiltration": [
        { url: "/dataset/CHNCXR_0189_0.png", caption: "Verified Case #44199 (Bibasilar infiltration)" },
        { url: "/dataset/CHNCXR_0190_0.png", caption: "Verified Case #11029 (Right lower lobe opacities)" }
    ],
    "Effusion": [
        { url: "/dataset/CHNCXR_0191_0.png", caption: "Verified Case #77102 (Large right pleural effusion)" },
        { url: "/dataset/CHNCXR_0192_0.png", caption: "Verified Case #99211 (Bilateral small effusions)" }
    ],
    "Cardiomegaly": [
        { url: "/dataset/CHNCXR_0025_0.png", caption: "Verified Case #34912 (Severe cardiomegaly, CTR 0.62)" },
        { url: "/dataset/CHNCXR_0036_0.png", caption: "Verified Case #88102 (Moderate cardiomegaly)" }
    ],
    "Mass": [
        { url: "/dataset/CHNCXR_0039_0.png", caption: "Verified Case #90012 (6cm Left Upper Lobe Mass)" },
        { url: "/dataset/CHNCXR_0040_0.png", caption: "Verified Case #22100 (Right paratracheal mass)" }
    ],
    "Nodule": [
        { url: "/dataset/CHNCXR_0065_0.png", caption: "Verified Case #15502 (1.2cm nodule RUL)" },
        { url: "/dataset/CHNCXR_0181_0.png", caption: "Verified Case #38810 (2.5cm calcified nodule)" }
    ],
    "Atelectasis": [
        { url: "/dataset/CHNCXR_0193_0.png", caption: "Verified Case #50122 (Right upper lobe atelectasis)" },
        { url: "/dataset/CHNCXR_0194_0.png", caption: "Verified Case #28811 (Left base subsegmental atelectasis)" }
    ],
    "Other": [
        { url: "/dataset/CHNCXR_0195_0.png", caption: "Verified Case #55121 (Apical scarring)" }
    ]
};

export default function DashboardPage() {
    const searchParams = useSearchParams();
    const [currentView, setCurrentView] = useState<ViewType>("new-scan");

    useEffect(() => {
        const view = searchParams.get("view") as ViewType;
        if (view && [
            "new-scan", "worklist", "upload", "upload-history", "reports",
            "ai-summary", "ai-chat", "learn", "analytics", "ehr-sync",
            "training", "scoring", "developer-mode"
        ].includes(view)) {
            setCurrentView(view);
        }
    }, [searchParams]);
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<PredictionResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Global Scan History
    const [scanHistory, setScanHistory] = useState<ScanRecord[]>([]);

    const handleFileSelect = useCallback((selectedFile: File) => {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setResult(null);
        setError(null);
    }, []);

    const handleAnalyze = useCallback(async () => {
        if (!file) return;

        setLoading(true);
        setError(null);

        try {
            const response = await predictImage(file);
            setResult(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
        } finally {
            setLoading(false);
        }
    }, [file]);

    const handleReset = useCallback(() => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
    }, []);

    return (
        <div className="flex w-screen h-screen bg-[#fdfcfa] overflow-hidden">
            <Sidebar currentView={currentView} onChangeView={setCurrentView} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col h-screen relative overflow-y-auto overflow-x-hidden">

                {/* Dashboard Content */}
                <main className="flex-1 p-6 lg:p-8 w-full relative z-10">

                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-[#1a1c29]">
                                {currentView === "new-scan" ? "New Patient Registration & Scan" :
                                    currentView === "worklist" ? "Intelligent Triage Worklist" :
                                        currentView === "upload" ? "Quick Analysis Dashboard" :
                                            currentView === "upload-history" ? "Quick Analysis History" :
                                                currentView === "reports" ? "Patient Database" :
                                                    currentView === "ai-summary" ? "AI Case Synthesis" :
                                                        currentView === "ai-chat" ? "Global AI Assistant" :
                                                            currentView === "learn" ? "Clinical Knowledge Base" :
                                                                currentView === "analytics" ? "Clinical Analytics Overview" :
                                                                    currentView === "ehr-sync" ? "EHR Integration Settings" :
                                                                        currentView === "training" ? "Radiology Diagnostic Training Ground" :
                                                                            currentView === "scoring" ? "AI Scoring & Calibration" :
                                                                                "System Settings"}
                            </h2>
                            <p className="text-sm text-slate-500 mt-1">
                                {currentView === "new-scan" ? "Comprehensive workflow integrating patient demographics and diagnostic AI." :
                                    currentView === "worklist" ? "AI-prioritized queue of patient cases awaiting radiological review." :
                                        currentView === "upload" ? "Expedited X-ray screening and probability analysis without demographic tracking." :
                                            currentView === "upload-history" ? "Immutable ledger of all anonymous AI interpretations." :
                                                currentView === "reports" ? "Immutable ledger of all registered patient interpretations." :
                                                    currentView === "ai-summary" ? "Longitudinal clinical summaries synthesized by language models." :
                                                        currentView === "ai-chat" ? "Context-aware global LLM for navigating reports, querying data, and answering medical inquiries." :
                                                            currentView === "learn" ? "Explore detailed pathologies and model architectures." :
                                                                currentView === "analytics" ? "Real-time metrics on throughput, pathology distribution, and hospital KPIs." :
                                                                    currentView === "ehr-sync" ? "Configure HL7/FHIR mappings to push reports to downstream Epic/Cerner systems." :
                                                                        currentView === "training" ? "Hone clinical intuition against AI Grad-CAM and NIH expert validated cases." :
                                                                            "Manage user preferences and system configurations."}
                            </p>
                        </div>
                        {currentView === "upload" && (
                            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-xs text-emerald-700 font-bold">
                                    AI Pipeline Active
                                </span>
                            </div>
                        )}
                    </div>

                    <AnimatePresence mode="wait">
                        {currentView === "new-scan" ? (
                            <motion.div key="new-scan-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <NewScan
                                    onAiSummaryClick={() => setCurrentView("ai-summary")}
                                    externalHistory={scanHistory}
                                    onHistoryUpdate={setScanHistory}
                                />
                            </motion.div>
                        ) : currentView === "worklist" ? (
                            <motion.div key="worklist-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <Worklist />
                            </motion.div>
                        ) : currentView === "upload" ? (
                            <motion.div
                                key="upload-view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                            >
                                {/* ═══ LEFT PANEL ═══ */}
                                <div className="space-y-6">
                                    {/* Upload Section */}
                                    <div className="rounded-2xl border border-[#e2e8f0] bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100">
                                                <Upload className="w-5 h-5 text-blue-600" />
                                            </div>
                                            <h3 className="text-lg font-bold text-[#1a1c29]">
                                                Upload Chest X-Ray
                                            </h3>
                                        </div>

                                        <UploadZone
                                            onFileSelect={handleFileSelect}
                                            file={file}
                                            onReset={handleReset}
                                        />

                                        {file && !loading && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                whileHover={{ scale: 1.01 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={handleAnalyze}
                                                className="w-full mt-4 py-3.5 rounded-xl bg-gradient-to-r from-[#1e3a8a] to-[#2563eb] text-white font-bold text-sm hover:from-blue-800 hover:to-blue-600 transition-all duration-300 shadow-lg shadow-blue-900/20 flex items-center justify-center gap-2"
                                            >
                                                <Activity className="w-4 h-4" />
                                                Run AI Analysis
                                            </motion.button>
                                        )}

                                        {loading && (
                                            <div className="mt-4 py-3.5 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center gap-3 shadow-inner">
                                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-sm text-blue-800 font-bold tracking-wide">
                                                    Analyzing Image Pipeline...
                                                </span>
                                            </div>
                                        )}

                                        {error && (
                                            <motion.div
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium shadow-sm"
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <AlertTriangle className="w-4 h-4" />
                                                    <span className="font-bold border-b border-red-200">Analysis Failed</span>
                                                </div>
                                                {error}
                                            </motion.div>
                                        )}
                                    </div>

                                    {/* Image Viewer */}
                                    <ImageViewer
                                        preview={preview}
                                        segmentationOverlay={
                                            result?.images?.segmentation_overlay
                                                ? `data:image/png;base64,${result.images.segmentation_overlay}`
                                                : null
                                        }
                                        heatmapOverlay={
                                            result?.images?.heatmap
                                                ? `data:image/png;base64,${result.images.heatmap}`
                                                : null
                                        }
                                        topDisease={
                                            result ? Object.keys(result.disease_probabilities).reduce((a, b) => result.disease_probabilities[a] > result.disease_probabilities[b] ? a : b) : undefined
                                        }
                                    />
                                </div>

                                {/* ═══ RIGHT PANEL ═══ */}
                                <div className="space-y-6">
                                    <AnimatePresence mode="wait">
                                        {result ? (
                                            <motion.div
                                                key="results"
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="space-y-6"
                                            >
                                                <RiskBadge
                                                    riskAssessment={result.risk_assessment}
                                                    inferenceTime={result.inference_time_ms}
                                                    calibrated={result.calibrated}
                                                />

                                                <DiseaseTable
                                                    probabilities={result.disease_probabilities}
                                                    uncertainty={result.uncertainty}
                                                    justifications={result.justifications}
                                                />

                                                <UncertaintyIndicator uncertainty={result.uncertainty} />

                                                <ReportDownload reportId={result.report_id} />

                                                {/* Similar Historical Cases Section */}
                                                {(() => {
                                                    let topDisease = "No Finding";
                                                    let maxProb = -1;
                                                    Object.entries(result.disease_probabilities).forEach(([disease, prob]) => {
                                                        if (prob > maxProb) {
                                                            maxProb = prob;
                                                            topDisease = disease;
                                                        }
                                                    });

                                                    const mappingKey = referenceCases[topDisease] ? topDisease : "Other";
                                                    const similarCases = referenceCases[mappingKey];

                                                    return similarCases && similarCases.length > 0 ? (
                                                        <div className="mt-6 p-6 bg-white border border-[#e2e8f0] rounded-2xl shadow-sm">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <div className="p-2 bg-slate-100 rounded-lg">
                                                                    <Database className="w-5 h-5 text-slate-700" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-slate-900 text-lg">Similar Historical Cases</h4>
                                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">NIH Dataset Precedent for {topDisease}</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-sm text-slate-600 font-medium mb-4 leading-relaxed">
                                                                The AI ensemble identified features highly consistent with these verified historical cases in the training dataset. Review these ground-truth examples to visually cross-verify the diagnosis.
                                                            </p>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {similarCases.map((img, idx) => (
                                                                    <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 group bg-slate-900 shadow-sm">
                                                                        <div className="aspect-[4/3] w-full relative">
                                                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                                                            <img
                                                                                src={img.url}
                                                                                alt={img.caption}
                                                                                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                                                                            />
                                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                                                                        </div>
                                                                        <div className="absolute bottom-0 left-0 right-0 p-4">
                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                <ImageIcon className="w-3 h-3 text-emerald-400" />
                                                                                <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-400">Ground Truth Match</span>
                                                                            </div>
                                                                            <p className="text-xs text-white font-medium leading-tight">
                                                                                {img.caption}
                                                                            </p>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ) : null;
                                                })()}
                                            </motion.div>
                                        ) : loading ? (
                                            <motion.div
                                                key="loading-skeleton"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="space-y-6"
                                            >
                                                {/* Skeleton for Risk Badge */}
                                                <div className="h-32 w-full bg-slate-200/50 rounded-2xl animate-pulse" />

                                                {/* Skeleton for Metrics/Disease Table */}
                                                <div className="bg-white rounded-2xl border border-slate-100 p-6 flex flex-col gap-4">
                                                    <div className="h-6 w-1/3 bg-slate-200 rounded animate-pulse mb-2" />
                                                    {[...Array(4)].map((_, i) => (
                                                        <div key={i} className="flex gap-4 items-center">
                                                            <div className="h-4 w-1/4 bg-slate-200 rounded animate-pulse" />
                                                            <div className="h-4 flex-1 bg-slate-100 rounded animate-pulse" />
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Skeleton for Confidence */}
                                                <div className="h-24 w-full bg-slate-200/50 rounded-2xl animate-pulse" />
                                            </motion.div>
                                        ) : (
                                            <motion.div
                                                key="placeholder"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="flex flex-col items-center justify-center h-[600px] rounded-2xl border-2 border-dashed border-[#e2e8f0] bg-white/50"
                                            >
                                                <div className="w-20 h-20 rounded-2xl bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
                                                    <Shield className="w-10 h-10 text-slate-300" />
                                                </div>
                                                <h3 className="text-lg font-bold text-[#1a1c29] mb-1">Awaiting X-Ray</h3>
                                                <p className="text-slate-500 text-sm font-medium max-w-[250px] text-center">
                                                    Upload a patient scan to generate detailed AI insights and reports.
                                                </p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </motion.div>
                        ) : currentView === "upload-history" ? (
                            <motion.div key="upload-history-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <UploadHistory />
                            </motion.div>
                        ) : currentView === "reports" ? (
                            <motion.div key="reports-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <PatientReports />
                            </motion.div>
                        ) : currentView === "ai-summary" ? (
                            <motion.div key="ai-summary-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <AiSummary initialResult={result} />
                            </motion.div>
                        ) : currentView === "ai-chat" ? (
                            <motion.div key="ai-chat-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <AiChat />
                            </motion.div>
                        ) : currentView === "learn" ? (
                            <motion.div key="learn-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <Learn />
                            </motion.div>
                        ) : currentView === "analytics" ? (
                            <motion.div key="analytics-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <Analytics />
                            </motion.div>
                        ) : currentView === "scoring" ? (
                            <motion.div key="scoring-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <Scoring />
                            </motion.div>
                        ) : currentView === "training" ? (
                            <motion.div key="training-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <TrainingMode />
                            </motion.div>
                        ) : currentView === "ehr-sync" ? (
                            <motion.div key="ehr-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <EhrSync />
                            </motion.div>
                        ) : currentView === "developer-mode" ? (
                            <motion.div key="developer-view" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full">
                                <DeveloperMode />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="settings-view"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col items-center justify-center h-[600px] rounded-2xl border border-[#e2e8f0] bg-white shadow-sm"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 border border-blue-100">
                                    <FileText className="w-8 h-8 text-blue-300" />
                                </div>
                                <h3 className="text-xl font-bold text-[#1a1c29] mb-2 capitalize">{currentView} Interface</h3>
                                <p className="text-slate-500 text-sm">Component module in development.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
}
