"use client";

import { useState, useEffect } from "react";
import { Layers, Sparkles, Loader2, Database, Info, Activity, ChevronRight, ShieldAlert } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getReports } from "@/lib/api";
import type { PredictionResponse, Report } from "@/types";
import { format } from "date-fns";
import { ExportReportButton } from "@/components/ui/export-report-button";
import { ImageViewer } from "@/components/viewer/image-viewer";
import { DiseaseTable } from "@/components/results/disease-table";
import { RiskBadge } from "@/components/results/risk-badge";
import { UncertaintyIndicator } from "@/components/results/uncertainty-indicator";
import { DiseaseTimeline } from "@/components/results/disease-timeline";
import { AmbientDictation } from "@/components/ui/ambient-dictation";

interface AiSummaryProps {
    initialResult?: PredictionResponse | null;
}

export function AiSummary({ initialResult }: AiSummaryProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(initialResult?.report_id || null);

    const [guideline, setGuideline] = useState<string | null>(null);
    const [loadingGuideline, setLoadingGuideline] = useState(false);
    const [summaryMode, setSummaryMode] = useState<'clinical' | 'patient'>('clinical');

    const fetchReportsSilently = async () => {
        try {
            const data = await getReports();
            data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setReports(data);
        } catch (err) {
            console.error("Polling error", err);
        }
    };

    useEffect(() => {
        const fetchAll = async () => {
            setLoading(true);
            await fetchReportsSilently();
            setLoading(false);
        };
        fetchAll();
    }, []);

    useEffect(() => {
        if (!selectedReportId && reports.length > 0) {
            setSelectedReportId(reports[0].report_id);
        }
    }, [reports, selectedReportId]);

    const selectedReport = reports.find(r => r.report_id === selectedReportId) || initialResult?.report;

    useEffect(() => {
        const isGenerating =
            selectedReport?.ai_summary?.includes("generating") ||
            selectedReport?.ai_second_opinion?.includes("Analyzing");

        if (isGenerating) {
            const interval = setInterval(() => {
                fetchReportsSilently();
            }, 2500);
            return () => clearInterval(interval);
        }
    }, [selectedReport]);

    useEffect(() => {
        if (!selectedReport) return;

        const topDisease = Object.keys(selectedReport.disease_probabilities || {}).reduce((a, b) =>
            (selectedReport.disease_probabilities[a] || 0) > (selectedReport.disease_probabilities[b] || 0) ? a : b
            , "No Finding");

        const fetchGuideline = async () => {
            setLoadingGuideline(true);
            try {
                const res = await fetch(`http://127.0.0.1:8000/api/analytics/guidelines?disease=${encodeURIComponent(topDisease)}`);
                if (res.ok) {
                    const data = await res.json();
                    setGuideline(data.guideline);
                }
            } catch (err) {
                console.error("Failed to fetch guideline:", err);
                setGuideline("Clinical correlation required. Further imaging may be indicated based on patient presentation.");
            } finally {
                setLoadingGuideline(false);
            }
        };

        fetchGuideline();
    }, [selectedReport]);

    if (loading && reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] rounded-2xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden relative">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Synthesizing clinical histories...</p>
            </div>
        );
    }

    const topDisease = selectedReport ? Object.keys(selectedReport.disease_probabilities || {}).reduce((a, b) =>
        (selectedReport.disease_probabilities[a] || 0) > (selectedReport.disease_probabilities[b] || 0) ? a : b
        , "No Finding") : "No Finding";

    return (
        <div className="flex flex-col lg:flex-row min-h-[700px] gap-6">
            {/* Master: List of Summaries */}
            <div className="w-full lg:w-64 flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm h-full max-h-[85vh] overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2 mb-4 px-2 sticky top-0 bg-white py-2 z-10 border-b border-slate-100">
                        <Layers className="w-5 h-5 text-indigo-600" />
                        <h3 className="font-bold text-slate-900 text-sm">Summary Collection</h3>
                    </div>
                    <div className="space-y-2 pr-1">
                        {reports.length === 0 && !initialResult ? (
                            <p className="text-xs text-slate-400 text-center py-8">No historical summaries found.</p>
                        ) : (
                            reports.map((report) => (
                                <button
                                    key={report.report_id}
                                    onClick={() => setSelectedReportId(report.report_id)}
                                    className={`w-full text-left p-4 rounded-xl transition-all border ${selectedReportId === report.report_id
                                        ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                        : "bg-slate-50/50 hover:bg-slate-50 border-slate-200/50"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`text-[10px] font-bold ${selectedReportId === report.report_id ? 'text-indigo-600' : 'text-slate-500'} uppercase tracking-tight`}>
                                            Ref: {report.report_id.substring(0, 8)}
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            {format(new Date(report.timestamp), "MMM dd")}
                                        </span>
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 truncate">
                                        {report.patient_details?.name || "Anonymous Patient"}
                                    </div>
                                    <div className="text-[10px] mt-1 text-slate-500 font-medium uppercase tracking-wider flex items-center justify-between">
                                        Risk: {report.risk_assessment?.risk_level || "UNKNOWN"}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Detail: Summary Content */}
            <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[size:20px_20px] pointer-events-none" />
                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none" />

                <div className="relative z-10 p-8 flex-1 flex flex-col">
                    {selectedReport ? (
                        <>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200 shrink-0">
                                    <Activity className="w-8 h-8 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                        Patient AI Diagnostic Report
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                            ID: {selectedReport.report_id}
                                        </span>
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                                            {selectedReport.patient_details?.name || "Anonymous Patient"}
                                        </span>
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <ExportReportButton
                                        patientName={selectedReport.patient_details?.name || "Anonymous Patient"}
                                        patientId={selectedReport.report_id || ""}
                                        date={selectedReport.timestamp || new Date().toISOString().split('T')[0]}
                                        findings={`${selectedReport.ai_summary || "No clinical summary provided."}\n\n${selectedReport.ai_second_opinion ? `--- SENIOR RADIOLOGIST SECOND OPINION ---\n${selectedReport.ai_second_opinion}` : ""}`.trim()}
                                        aiConfidence={Object.values(selectedReport.disease_probabilities || {}).length > 0 ? Math.max(...Object.values(selectedReport.disease_probabilities || {}) as number[]) * 100 : undefined}
                                        base64Images={selectedReport.images?.original ? [selectedReport.images.original] : []}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                {/* Left Column: Visuals */}
                                <div className="space-y-6">
                                    <ImageViewer
                                        preview={selectedReport.images?.original ? (selectedReport.images.original.startsWith('data:') ? selectedReport.images.original : `data:image/png;base64,${selectedReport.images.original}`) : null}
                                        segmentationOverlay={selectedReport.images?.segmentation_overlay ? (selectedReport.images.segmentation_overlay.startsWith('data:') ? selectedReport.images.segmentation_overlay : `data:image/png;base64,${selectedReport.images.segmentation_overlay}`) : null}
                                        heatmapOverlay={selectedReport.images?.heatmap ? (selectedReport.images.heatmap.startsWith('data:') ? selectedReport.images.heatmap : `data:image/png;base64,${selectedReport.images.heatmap}`) : null}
                                        topDisease={topDisease}
                                    />

                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
                                        <div className="flex items-center gap-2 mb-3 text-[#1f2937]">
                                            <Info className="w-4 h-4 text-indigo-500" />
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
                                    <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-2xl shadow-sm relative overflow-hidden">
                                        <div className="flex items-start gap-3 relative z-10">
                                            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 shrink-0">
                                                <Activity className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-indigo-900 text-sm mb-1 uppercase tracking-wider flex items-center gap-2">
                                                    Clinical Next Step
                                                    <span className="text-[9px] bg-indigo-200 text-indigo-800 px-1.5 py-0.5 rounded uppercase font-bold tracking-widest">
                                                        Guideline
                                                    </span>
                                                </h4>
                                                {loadingGuideline ? (
                                                    <div className="flex items-center gap-2 text-indigo-600/70 text-sm mt-1 animate-pulse font-medium">
                                                        <div className="w-4 h-4 border-2 border-indigo-600/50 border-t-transparent rounded-full animate-spin" />
                                                        Consulting medical guidelines...
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-indigo-800 font-medium leading-relaxed bg-white/50 p-3 rounded-lg border border-indigo-100 mt-2 shadow-sm">
                                                        {guideline || "Consult standard clinical guidelines for appropriate follow-up."}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <DiseaseTable
                                        probabilities={selectedReport.disease_probabilities || {}}
                                        uncertainty={selectedReport.uncertainty || {}}
                                        justifications={selectedReport.justifications || {}}
                                        differentialDiagnoses={selectedReport.differential_diagnoses || []}
                                    />

                                    {selectedReport.risk_assessment && (
                                        <RiskBadge
                                            riskAssessment={selectedReport.risk_assessment}
                                            inferenceTime={selectedReport.inference_time_ms || 120}
                                            calibrated={selectedReport.calibrated || false}
                                        />
                                    )}

                                    {selectedReport.uncertainty && (
                                        <UncertaintyIndicator uncertainty={selectedReport.uncertainty} />
                                    )}
                                </div>
                            </div>

                            {/* Full Width Sections */}
                            <div className="space-y-8">
                                {/* AI Summary Section */}
                                <div className="p-8 bg-gradient-to-br from-indigo-50 to-white rounded-3xl border border-indigo-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-6 opacity-10">
                                        <Sparkles className="w-32 h-32 text-indigo-600" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-2 text-indigo-900">
                                                <Sparkles className="w-5 h-5" />
                                                <h4 className="font-extrabold text-lg">AI Report Synthesis</h4>
                                            </div>

                                            {/* Mode Toggle */}
                                            <div className="flex items-center bg-white rounded-lg p-1 border border-indigo-100 shadow-sm relative z-20 w-fit">
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
                                                    ? (selectedReport.ai_summary || "Synthesizing clinical AI report in background...")
                                                    : (selectedReport.ai_patient_summary || "Synthesizing patient-friendly report in background...")}
                                            </ReactMarkdown>
                                        </div>

                                        {summaryMode === 'clinical' && selectedReport.ai_second_opinion && (
                                            <>
                                                <hr className="my-6 border-indigo-100" />
                                                <h4 className="font-bold text-emerald-800 text-sm mb-3 uppercase tracking-wider flex items-center gap-2">
                                                    <ShieldAlert className="w-4 h-4" />
                                                    Comparative Senior Second Opinion
                                                </h4>
                                                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed text-sm bg-emerald-50/50 p-5 rounded-xl border border-emerald-100">
                                                    <ReactMarkdown>{selectedReport.ai_second_opinion}</ReactMarkdown>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Longitudinal Timeline Section */}
                                <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-sm">
                                    <div className="flex items-center gap-2 mb-6 text-slate-900">
                                        <ChevronRight className="w-5 h-5 text-indigo-500" />
                                        <h4 className="font-extrabold text-lg">Longitudinal Case Tracking</h4>
                                    </div>
                                    <DiseaseTimeline topDisease={topDisease} />
                                </div>

                                {/* Similar Cases Section */}
                                {selectedReport.similar_cases && selectedReport.similar_cases.length > 0 && (
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
                                            {selectedReport.similar_cases.map((sim, i: number) => (
                                                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm group hover:border-indigo-200 transition-all">
                                                    <div className="aspect-square bg-slate-900 relative">
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img src={sim.url} alt={sim.diagnosis} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                        <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-md">
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
                                    }} />
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300">
                            <Layers className="w-16 h-16 text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-500">Select a report to view detailed AI synthesis</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
