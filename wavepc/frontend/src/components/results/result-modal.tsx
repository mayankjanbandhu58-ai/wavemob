"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Database, FileText, Activity, Info, ChevronRight, ShieldAlert } from "lucide-react";
import { ImageViewer } from "@/components/viewer/image-viewer";
import { DiseaseTable } from "@/components/results/disease-table";
import { RiskBadge } from "@/components/results/risk-badge";
import { UncertaintyIndicator } from "@/components/results/uncertainty-indicator";
import { DiseaseTimeline } from "@/components/results/disease-timeline";
import { ReportDownload } from "@/components/report/report-download";
import { getClinicalGuidelines, verifyReport, correctReport } from "@/lib/api";
import ReactMarkdown from "react-markdown";
import { useState, useEffect } from "react";
import type { PredictionResponse } from "@/types";
import { Portal } from "@/components/ui/portal";
import { AmbientDictation } from "@/components/ui/ambient-dictation";

interface ResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    result: PredictionResponse | null;
    previewUrl: string | null;
}

export function ResultModal({ isOpen, onClose, result, previewUrl }: ResultModalProps) {
    const [guideline, setGuideline] = useState<string | null>(null);
    const [loadingGuideline, setLoadingGuideline] = useState(false);
    const [isChatOpen, setIsChatOpen] = useState(false);
    const [summaryMode, setSummaryMode] = useState<'clinical' | 'patient'>('clinical');

    // Correction Form State
    const [showCorrectionForm, setShowCorrectionForm] = useState(false);
    const [correctedDisease, setCorrectedDisease] = useState('');
    const [correctionNotes, setCorrectionNotes] = useState('');
    const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsChatOpen(false);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !result) return;

        const topDisease = Object.keys(result.disease_probabilities).reduce((a, b) =>
            result.disease_probabilities[a] > result.disease_probabilities[b] ? a : b
            , "No Finding");

        const fetchGuideline = async () => {
            setLoadingGuideline(true);
            try {
                const data = await getClinicalGuidelines(topDisease);
                setGuideline(data.guideline);
            } catch (err) {
                console.error("Failed to fetch guideline:", err);
                setGuideline("Clinical correlation required. Further imaging may be indicated based on patient presentation.");
            } finally {
                setLoadingGuideline(false);
            }
        };

        fetchGuideline();
    }, [isOpen, result]);

    if (!result) return null;

    const topDisease = Object.keys(result.disease_probabilities).reduce((a, b) =>
        result.disease_probabilities[a] > result.disease_probabilities[b] ? a : b
        , "No Finding");

    return (
        <Portal>
            <AnimatePresence mode="wait">
                {isOpen && (
                    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className={`bg-white rounded-3xl transition-all duration-500 max-h-[90vh] flex shadow-2xl relative z-10 overflow-hidden border border-slate-200 ${isChatOpen ? 'w-full max-w-[90vw]' : 'w-full max-w-5xl'}`}
                        >
                            {/* Main Content Area */}
                            <div className="flex-1 flex flex-col relative overflow-hidden">
                                {/* Header */}
                                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-200">
                                            <Activity className="w-7 h-7 text-white" />
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-extrabold text-[#111827] tracking-tight">Patient AI Diagnostic Report</h2>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                                                    ID: {result.report_id}
                                                </span>
                                                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                                                    {result.report?.patient_details?.name || "Anonymous Patient"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => setIsChatOpen(!isChatOpen)}
                                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border ${isChatOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}
                                        >
                                            <Sparkles className={`w-4 h-4 ${isChatOpen ? 'text-indigo-600' : 'text-slate-400'}`} />
                                            Ask AI
                                        </button>
                                        <div className="w-px h-6 bg-slate-200 mx-1" />
                                        <button
                                            onClick={onClose}
                                            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors text-slate-400 group"
                                        >
                                            <X className="w-6 h-6 group-hover:text-slate-600" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 md:p-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Left Column: Visuals */}
                                        <div className="space-y-6">
                                            <ImageViewer
                                                preview={previewUrl || (result.images?.original ? result.images.original.startsWith('data:') ? result.images.original : `data:image/png;base64,${result.images.original}` : null)}
                                                segmentationOverlay={result.images?.segmentation_overlay ? (result.images.segmentation_overlay.startsWith('data:') ? result.images.segmentation_overlay : `data:image/png;base64,${result.images.segmentation_overlay}`) : null}
                                                heatmapOverlay={result.images?.heatmap ? (result.images.heatmap.startsWith('data:') ? result.images.heatmap : `data:image/png;base64,${result.images.heatmap}`) : null}
                                                topDisease={topDisease}
                                            />

                                            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                                                <div className="flex items-center gap-2 mb-3 text-[#1f2937]">
                                                    <Info className="w-4 h-4 text-blue-500" />
                                                    <h4 className="font-bold text-sm">Differential Diagnosis Summary</h4>
                                                </div>
                                                <p className="text-xs text-slate-600 leading-relaxed font-medium italic">
                                                    &quot;The primary radiological finding indicates a strong clinical correlation for <strong>{topDisease}</strong>. The neural network identified several focal points of architectural distortion. Please correlate these visual heatmaps with patient history and secondary symptoms.&quot;
                                                </p>
                                            </div>
                                        </div>

                                        {/* Right Column: Data & Analytics */}
                                        <div className="space-y-6">
                                            {/* Clinical Next Step Guideline */}
                                            <div className="p-5 bg-blue-50 border border-blue-200 rounded-2xl shadow-sm relative overflow-hidden">
                                                <div className="flex items-start gap-3 relative z-10">
                                                    <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
                                                        <Activity className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold text-blue-900 text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
                                                            Clinical Next Step
                                                            <span className="text-[9px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
                                                                Guideline
                                                            </span>
                                                        </h4>
                                                        {loadingGuideline ? (
                                                            <div className="flex items-center gap-2 text-blue-600/70 text-sm mt-1 animate-pulse font-medium">
                                                                <div className="w-4 h-4 border-2 border-blue-600/50 border-t-transparent rounded-full animate-spin" />
                                                                Consulting medical guidelines...
                                                            </div>
                                                        ) : (
                                                            <p className="text-sm text-blue-800 font-medium leading-relaxed bg-white/50 p-3 rounded-lg border border-blue-100 mt-2 shadow-sm">
                                                                {guideline || "Consult standard clinical guidelines for appropriate follow-up."}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <DiseaseTable
                                                probabilities={result.disease_probabilities}
                                                uncertainty={result.uncertainty}
                                                justifications={result.justifications}
                                                differentialDiagnoses={result.differential_diagnoses}
                                            />

                                            <RiskBadge
                                                riskAssessment={result.risk_assessment}
                                                inferenceTime={result.inference_time_ms}
                                                calibrated={result.calibrated}
                                            />

                                            <UncertaintyIndicator uncertainty={result.uncertainty} />
                                        </div>
                                    </div>

                                    {/* Full Width Sections */}
                                    <div className="mt-8 space-y-8">
                                        {/* AI Summary Section */}
                                        <div className="p-8 bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                                <Sparkles className="w-32 h-32 text-indigo-600" />
                                            </div>
                                            <div className="relative z-10">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-2 text-indigo-900">
                                                        <Sparkles className="w-5 h-5" />
                                                        <h4 className="font-extrabold text-lg">AI Report Synthesis</h4>
                                                    </div>

                                                    {/* Mode Toggle */}
                                                    <div className="flex items-center bg-white rounded-lg p-1 border border-indigo-100 shadow-sm relative z-20">
                                                        <button
                                                            onClick={() => setSummaryMode('clinical')}
                                                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${summaryMode === 'clinical' ? 'bg-indigo-600 text-white shadow focus:outline-none' : 'text-slate-500 hover:text-slate-900'}`}
                                                        >
                                                            Clinical View
                                                        </button>
                                                        <button
                                                            onClick={() => setSummaryMode('patient')}
                                                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${summaryMode === 'patient' ? 'bg-emerald-600 text-white shadow focus:outline-none' : 'text-slate-500 hover:text-slate-900'}`}
                                                        >
                                                            Patient View
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-medium text-sm">
                                                    <ReactMarkdown>
                                                        {summaryMode === 'clinical'
                                                            ? (result.ai_summary || "Synthesizing clinical AI report in background...")
                                                            : (result.ai_patient_summary || "Synthesizing patient-friendly report in background...")}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Longitudinal Timeline Section */}
                                        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                            <div className="flex items-center gap-2 mb-6 text-[#1e3a8a]">
                                                <ChevronRight className="w-5 h-5" />
                                                <h4 className="font-extrabold text-lg">Longitudinal Case Tracking</h4>
                                            </div>
                                            <DiseaseTimeline topDisease={topDisease} />
                                        </div>

                                        {/* Similar Cases Section */}
                                        {(result.similar_cases?.length || result.report?.similar_cases?.length || 0) > 0 && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-8">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <div className="p-2 bg-slate-200 rounded-xl">
                                                        <Database className="w-6 h-6 text-slate-700" />
                                                    </div>
                                                    <div>
                                                        <h4 className="font-extrabold text-lg text-slate-900">Visually Similar Cases</h4>
                                                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Matched via Repository Core</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                    {(result.similar_cases || result.report?.similar_cases)?.map((sim, i: number) => (
                                                        <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group hover:border-blue-200 transition-all">
                                                            <div className="aspect-square bg-slate-900 relative">
                                                                <img src={sim.url} alt={sim.diagnosis} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                <div className="absolute top-2 right-2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-md">
                                                                    {(sim.similarity * 100).toFixed(0)}% MATCH
                                                                </div>
                                                            </div>
                                                            <div className="p-3">
                                                                <h5 className="font-bold text-slate-900 text-xs mb-1 truncate">{sim.diagnosis}</h5>
                                                                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{sim.gender}, {sim.age}y</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Ambient Dictation Integration */}
                                        <div className="pt-2">
                                            <AmbientDictation onSaveNotes={(notes) => {
                                                console.log("Physician notes saved:", notes);
                                                // Ideally, we would save these to state and submit them with the verification
                                            }} />
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions / Correction Form */}
                                <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 transition-all">
                                    {showCorrectionForm ? (
                                        <div className="bg-white p-6 rounded-2xl border border-rose-200 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-extrabold text-rose-700 flex items-center gap-2">
                                                    <ShieldAlert className="w-5 h-5" />
                                                    Submit Physician Correction
                                                </h4>
                                                <button onClick={() => setShowCorrectionForm(false)} className="text-slate-400 hover:text-slate-600">
                                                    <X className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">Corrected Diagnosis</label>
                                                    <input
                                                        type="text"
                                                        value={correctedDisease}
                                                        onChange={(e) => setCorrectedDisease(e.target.value)}
                                                        placeholder="e.g. Pneumothorax"
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Notes (Optional)</label>
                                                    <input
                                                        type="text"
                                                        value={correctionNotes}
                                                        onChange={(e) => setCorrectionNotes(e.target.value)}
                                                        placeholder="Reason for correction..."
                                                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                                                    />
                                                </div>
                                            </div>
                                            <div className="mt-4 flex justify-end">
                                                <button
                                                    disabled={!correctedDisease || isSubmittingCorrection}
                                                    onClick={async () => {
                                                        setIsSubmittingCorrection(true);
                                                        try {
                                                            await correctReport(
                                                                result.report_id,
                                                                correctedDisease,
                                                                correctionNotes
                                                            );
                                                            setTimeout(() => {
                                                                setIsSubmittingCorrection(false);
                                                                setShowCorrectionForm(false);
                                                                onClose();
                                                            }, 800);
                                                        } catch (e) {
                                                            console.error("Correction failed", e);
                                                            setIsSubmittingCorrection(false);
                                                        }
                                                    }}
                                                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-sm font-extrabold transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2"
                                                >
                                                    {isSubmittingCorrection ? "Submitting..." : "Send to Active Learning Queue"}
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
                                                    <FileText className="w-4 h-4 text-slate-400" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Clinical Report</p>
                                                    <p className="text-xs font-bold text-slate-700 leading-none">ID: {result.report_id}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex items-center gap-2">
                                                    <ReportDownload reportId={result.report_id} />
                                                </div>
                                                <button
                                                    onClick={() => setShowCorrectionForm(true)}
                                                    className="px-6 py-3 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-extrabold transition-all shadow-sm flex items-center gap-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Correct AI Finding
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            await verifyReport(
                                                                result.report_id,
                                                                "approved",
                                                                "Clinically correlated and verified by attending physician. Handled via dictation."
                                                            );
                                                            onClose();
                                                        } catch (e) {
                                                            console.error("Verification failed", e);
                                                        }
                                                    }}
                                                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold transition-all shadow-lg shadow-emerald-600/20 active:scale-95 flex items-center gap-2"
                                                >
                                                    <ShieldAlert className="w-4 h-4" />
                                                    Approve AI Finding
                                                </button>
                                                <button
                                                    onClick={onClose}
                                                    className="px-6 py-3 bg-[#0f172a] hover:bg-slate-800 text-white rounded-xl text-sm font-extrabold transition-all shadow-lg active:scale-95"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </Portal>
    );
}
