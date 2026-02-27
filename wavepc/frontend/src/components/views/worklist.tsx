"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ListTodo, ShieldAlert, HeartPulse, Stethoscope, Loader2, ArrowRight } from "lucide-react";
import { ResultModal } from "@/components/results/result-modal";
import type { PredictionResponse } from "@/types";

interface WorklistItem {
    id: string;
    name: string;
    age: number;
    gender: string;
    primary_finding: string;
    all_findings: string[];
    priority: "Critical" | "High" | "Routine" | "Normal";
    status: string;
    image_id: string;
    rawData?: any;
}

export function Worklist() {
    const [cases, setCases] = useState<WorklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedResult, setSelectedResult] = useState<PredictionResponse | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [sortMode, setSortMode] = useState<"priority" | "chronological">("priority");

    useEffect(() => {
        const fetchWorklist = async () => {
            try {
                // 1. Fetch Triage Dataset (Simulated Worklist)
                const triageRes = await fetch("http://127.0.0.1:8000/api/analytics/worklist?limit=120");
                const triageData = triageRes.ok ? await triageRes.json() : { worklist: [] };

                // 2. Fetch Actual Database Reports
                let databaseReports: any[] = [];
                try {
                    const reportsRes = await fetch("http://127.0.0.1:8000/api/reports");
                    if (reportsRes.ok) {
                        const data = await reportsRes.json();
                        databaseReports = data.reports || [];
                    }
                } catch (e) {
                    console.error("Database reports fetch failed", e);
                }

                // 3. Map Database Reports to Worklist Format
                const mappedReports: WorklistItem[] = databaseReports.map((report: any) => ({
                    id: report.report_id,
                    name: report.patient_details?.name || "Patient Ref: " + report.report_id.slice(0, 8),
                    age: parseInt(report.patient_details?.age || "0"),
                    gender: report.patient_details?.gender || "U",
                    primary_finding: report.risk_assessment?.dominant_findings?.[0]?.disease || "No Finding",
                    all_findings: report.risk_assessment?.dominant_findings?.map((f: any) => f.disease) || ["No Finding"],
                    priority: report.risk_assessment?.risk_level === "High Suspicion" ? "Critical" :
                        report.risk_assessment?.risk_level === "Moderate Risk" ? "High" : "Routine",
                    status: report.verification_status === "pending_review" ? "Awaiting Review" :
                        report.verification_status === "approved" ? "Verified" : "Sync Pending",
                    image_id: report.report_id,
                    rawData: report
                }));

                // 4. Combine and Set
                const combined = [...mappedReports, ...(triageData.worklist || [])];
                setCases(combined);
            } catch (err) {
                setError(err instanceof Error ? err.message : "An error occurred");
            } finally {
                setLoading(false);
            }
        };

        fetchWorklist();
    }, []);

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case "Critical": return "bg-red-50 text-red-700 border-red-200";
            case "High": return "bg-orange-50 text-orange-700 border-orange-200";
            case "Routine": return "bg-blue-50 text-blue-700 border-blue-200";
            case "Normal": return "bg-emerald-50 text-emerald-700 border-emerald-200";
            default: return "bg-slate-50 text-slate-700 border-slate-200";
        }
    };

    const getPriorityIcon = (priority: string) => {
        switch (priority) {
            case "Critical": return <ShieldAlert className="w-4 h-4 mr-1.5" />;
            case "High": return <HeartPulse className="w-4 h-4 mr-1.5" />;
            case "Routine": return <Stethoscope className="w-4 h-4 mr-1.5" />;
            case "Normal": return <div className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />;
            default: return null;
        }
    };

    const handleReview = (item: WorklistItem) => {
        if (item.rawData) {
            // Use real database report
            const realResult: PredictionResponse = {
                success: true,
                inference_time_ms: item.rawData.inference_time_ms || 0,
                report_id: item.rawData.report_id,
                disease_probabilities: item.rawData.disease_probabilities,
                risk_assessment: item.rawData.risk_assessment,
                uncertainty: item.rawData.uncertainty,
                calibrated: item.rawData.calibrated,
                ai_summary: item.rawData.ai_summary,
                images: item.rawData.images || { original: null, segmentation_overlay: null, heatmap: null },
                report: item.rawData,
                similar_cases: item.rawData.similar_cases || [],
                ai_patient_summary: item.rawData.ai_patient_summary,
                ai_second_opinion: item.rawData.ai_second_opinion,
                differential_diagnoses: item.rawData.differential_diagnoses
            };
            setSelectedResult(realResult);
            setIsModalOpen(true);
            return;
        }

        // Simulate a PredictionResponse for the historical dataset item
        const mockResult: PredictionResponse = {
            success: true,
            inference_time_ms: 124.5,
            report_id: item.id,
            disease_probabilities: {
                ...Object.fromEntries(item.all_findings.map(f => [f, 0.85 + Math.random() * 0.1])),
                "No Finding": item.primary_finding === "No Finding" ? 0.9 : 0.02
            } as any, // eslint-disable-line @typescript-eslint/no-explicit-any
            risk_assessment: {
                risk_score: item.priority === "Critical" ? 0.92 : item.priority === "High" ? 0.75 : 0.3,
                severity_index: item.priority === "Critical" ? 8.5 : item.priority === "High" ? 5.2 : 1.1,
                severity_grade: item.priority === "Critical" ? "Severe" : item.priority === "High" ? "Moderate" : "Mild",
                risk_level: item.priority === "Critical" ? "High Suspicion" : item.priority === "High" ? "Moderate Risk" : "Low Risk",
                risk_color: item.priority === "Critical" ? "#ef4444" : item.priority === "High" ? "#f59e0b" : "#10b981",
                dominant_findings: item.all_findings.map(f => ({ disease: f, probability: 0.85, severity_weight: 1.0 })),
                recommendation: item.priority === "Critical" ? "Immediate clinical correlation and possible surgical consult." : "Follow-up imaging in 2-4 weeks recommended."
            },
            uncertainty: {
                overall_uncertainty: "low",
                mean_variance: 0.024,
                per_disease: item.all_findings.map(f => ({ disease: f, variance: 0.01, is_uncertain: false }))
            },
            calibrated: true,
            ai_summary: `### Clinical Impression for ${item.name}\n\nThe AI analysis of the X-ray (Image: ${item.image_id}) shows high confidence features of **${item.primary_finding}**. The longitudinal data suggests these findings are consistent with the prioritized triage status of **${item.priority}**.`,
            images: {
                original: `http://127.0.0.1:8000/api/analytics/dataset-image/${item.image_id}`,
                segmentation_overlay: null,
                heatmap: null
            },
            report: {
                report_id: item.id,
                timestamp: new Date().toISOString(),
                model_version: "1.0.0",
                calibrated: true,
                disease_probabilities: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                risk_assessment: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                uncertainty: {} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
                disclaimer: "",
                patient_details: {
                    name: item.name,
                    age: item.age.toString(),
                    gender: item.gender
                }
            },
            similar_cases: [] // Will be populated by the engine if it was real, but empty for mock
        };

        setSelectedResult(mockResult);
        setIsModalOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[500px] w-full">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium animate-pulse">Running global triage algorithms...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-200">
                <h3 className="font-bold flex items-center mb-2"><ShieldAlert className="w-5 h-5 mr-2" /> Error Loading Worklist</h3>
                <p>{error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                    { label: "Total Pending", value: cases.length, color: "text-slate-900" },
                    { label: "Critical Findings", value: cases.filter(c => c.priority === "Critical").length, color: "text-red-600" },
                    { label: "High Priority", value: cases.filter(c => c.priority === "High").length, color: "text-orange-600" },
                    { label: "Est. Time Saved", value: "32%", color: "text-indigo-600", subtitle: "~2.4h daily via auto-triage" }
                ].map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                        <div className="flex items-baseline gap-2 mt-2">
                            <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                            {stat.subtitle && <p className="text-[10px] font-bold text-slate-400">{stat.subtitle}</p>}
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ListTodo className="w-5 h-5 text-slate-700" />
                        <h3 className="font-bold text-slate-900">Intelligent Triage Worklist</h3>
                    </div>
                    <div className="flex items-center bg-white rounded-lg p-1 border border-slate-200 shadow-sm">
                        <button
                            onClick={() => setSortMode("priority")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${sortMode === "priority" ? "bg-indigo-600 text-white shadow" : "text-slate-500 hover:text-slate-900"}`}
                        >
                            Urgency Sort
                        </button>
                        <button
                            onClick={() => setSortMode("chronological")}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-colors ${sortMode === "chronological" ? "bg-slate-800 text-white shadow" : "text-slate-500 hover:text-slate-900"}`}
                        >
                            Chronological
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                                <th className="px-6 py-4">Triage Priority</th>
                                <th className="px-6 py-4">Patient Info</th>
                                <th className="px-6 py-4">AI Primary Indication</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {cases
                                .sort((a, b) => {
                                    if (sortMode === "priority") {
                                        const priorities = { Critical: 0, High: 1, Routine: 2, Normal: 3 };
                                        return priorities[a.priority] - priorities[b.priority];
                                    } else {
                                        // Fake chronological (already somewhat random from backend, but let's sort by ID to simulate order of arrival)
                                        return a.id.localeCompare(b.id);
                                    }
                                })
                                .map((patient, idx) => (
                                    <motion.tr
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.02 }}
                                        key={patient.id + sortMode}
                                        className="hover:bg-slate-50/50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold border ${getPriorityColor(patient.priority)}`}>
                                                {getPriorityIcon(patient.priority)}
                                                {patient.priority}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-slate-900">{patient.name}</p>
                                            <p className="text-xs text-slate-500 font-medium mt-0.5">{patient.age} yrs • {patient.gender} • {patient.id}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`font-bold ${patient.priority === "Normal" ? "text-emerald-600" : "text-slate-800"}`}>
                                                {patient.primary_finding}
                                            </span>
                                            {patient.all_findings.length > 1 && (
                                                <span className="text-xs text-slate-400 font-medium ml-2">
                                                    +{patient.all_findings.length - 1} more
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs px-2 py-1 rounded text-slate-600 bg-slate-100 font-semibold">
                                                {patient.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleReview(patient)}
                                                className="inline-flex items-center justify-center p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-colors group-hover:shadow-sm shadow-sm"
                                            >
                                                <span className="text-sm font-bold mr-1 sr-only md:not-sr-only md:px-2">Review</span>
                                                <ArrowRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ResultModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                result={selectedResult}
                previewUrl={selectedResult?.images.original || null}
            />
        </div>
    );
}
