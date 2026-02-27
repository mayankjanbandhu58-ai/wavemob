import { useState, useEffect } from "react";
import { Layers, Sparkles, AlertTriangle, Loader2, Database, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getReports } from "@/lib/api";
import type { PredictionResponse, Report } from "@/types";
import { format } from "date-fns";

interface AiSummaryProps {
    initialResult?: PredictionResponse | null;
}

export function AiSummary({ initialResult }: AiSummaryProps) {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReportId, setSelectedReportId] = useState<string | null>(initialResult?.report_id || null);

    useEffect(() => {
        const fetchAll = async () => {
            try {
                setLoading(true);
                const data = await getReports();
                // Sort by date desc
                data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
                setReports(data);
                if (!selectedReportId && data.length > 0) {
                    setSelectedReportId(data[0].report_id);
                }
            } catch (err) {
                console.error("Failed to fetch reports for AI Summary", err);
            } finally {
                setLoading(false);
            }
        };
        fetchAll();
    }, [selectedReportId]);

    const selectedReport = reports.find(r => r.report_id === selectedReportId) || initialResult?.report;

    if (loading && reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[600px] rounded-2xl border border-[#e2e8f0] bg-white shadow-sm overflow-hidden relative">
                <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Synthesizing clinical histories...</p>
            </div>
        );
    }
    return (
        <div className="flex flex-col lg:flex-row min-h-[700px] gap-6">
            {/* Master: List of Summaries */}
            <div className="w-full lg:w-80 flex flex-col gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        <h3 className="font-bold text-slate-900 text-sm">Summary Collection</h3>
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto custom-scrollbar pr-1">
                        {reports.length === 0 && !initialResult ? (
                            <p className="text-xs text-slate-400 text-center py-8">No historical summaries found.</p>
                        ) : (
                            reports.map((report) => (
                                <button
                                    key={report.report_id}
                                    onClick={() => setSelectedReportId(report.report_id)}
                                    className={`w-full text-left p-3 rounded-xl transition-all border ${selectedReportId === report.report_id
                                        ? "bg-indigo-50 border-indigo-200 shadow-sm"
                                        : "hover:bg-slate-50 border-transparent"
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tighter">
                                            {report.report_id}
                                        </span>
                                        <span className="text-[10px] text-slate-400">
                                            {format(new Date(report.timestamp), "MMM dd")}
                                        </span>
                                    </div>
                                    <div className="text-sm font-bold text-slate-800 truncate">
                                        {report.patient_details?.name || "Anonymous Patient"}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-medium">
                                        {report.risk_assessment.risk_level}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Detail: Summary Content */}
            <div className="flex-1 flex flex-col bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[size:20px_20px]" />
                <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none" />

                <div className="relative z-10 p-8 flex-1 flex flex-col">
                    {selectedReport ? (
                        <>
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg relative shrink-0">
                                    <Sparkles className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-900 to-purple-800 bg-clip-text text-transparent">
                                        Patient AI Summary
                                    </h2>
                                    <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                                        Ref: {selectedReport.report_id} • {selectedReport.patient_details?.name || "Anonymous"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex-1 flex flex-col xl:flex-row gap-6 overflow-hidden">
                                {/* Left Column: Visuals & Probabilities */}
                                <div className="w-full xl:w-[350px] flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                                    {/* Image Card */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
                                        <h4 className="font-bold text-slate-800 text-sm mb-3">Analyzed Radiograph</h4>
                                        <div className="aspect-square bg-slate-200 rounded-xl overflow-hidden relative">
                                            {selectedReport.images?.original ? (
                                                <img
                                                    src={`data:image/png;base64,${selectedReport.images.original}`}
                                                    alt="Original X-Ray"
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                                                    <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                                    <span className="text-xs font-medium">Image unavailable in history</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Probabilities Card */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
                                        <h4 className="font-bold text-slate-800 text-sm mb-3">Top AI Detections</h4>
                                        <div className="space-y-3">
                                            {Object.entries(selectedReport.disease_probabilities)
                                                .sort(([, a], [, b]) => b - a)
                                                .slice(0, 4)
                                                .map(([disease, prob]) => (
                                                    <div key={disease}>
                                                        <div className="flex justify-between text-xs font-bold mb-1">
                                                            <span className="text-slate-700">{disease}</span>
                                                            <span className={prob > 0.5 ? "text-amber-600" : "text-slate-500"}>
                                                                {(prob * 100).toFixed(1)}%
                                                            </span>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${prob > 0.5 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                                                                style={{ width: `${Math.min(prob * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Insights & Similar Cases */}
                                <div className="flex-1 flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
                                    {/* Clinical Synthesis */}
                                    <div className="bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200 p-6 shadow-sm">
                                        <h4 className="font-bold text-indigo-900 text-lg mb-4 flex items-center gap-2">
                                            <Sparkles className="w-5 h-5" />
                                            Clinical Synthesis
                                        </h4>
                                        {selectedReport.ai_summary ? (
                                            <div className="prose prose-slate prose-indigo prose-strong:text-indigo-900 prose-strong:font-bold prose-p:mb-4 max-w-none text-slate-700 leading-relaxed text-sm">
                                                <ReactMarkdown>{selectedReport.ai_summary}</ReactMarkdown>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-slate-500 text-sm">
                                                <AlertTriangle className="w-4 h-4" />
                                                No clinical summary available.
                                            </div>
                                        )}

                                        {selectedReport.ai_second_opinion && (
                                            <>
                                                <hr className="my-6 border-slate-100" />
                                                <h4 className="font-bold text-emerald-800 text-sm mb-3 uppercase tracking-wider">Comparative Senior Second Opinion</h4>
                                                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed text-sm bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                                                    <ReactMarkdown>{selectedReport.ai_second_opinion}</ReactMarkdown>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Similar Cases Visualizer */}
                                    {selectedReport.similar_cases && selectedReport.similar_cases.length > 0 && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-sm">
                                            <h4 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2">
                                                <Database className="w-4 h-4 text-indigo-500" />
                                                Visually Similar External Cases (NIH Core)
                                            </h4>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {selectedReport.similar_cases.slice(0, 4).map((simCase, i) => (
                                                    <div key={i} className="flex flex-col gap-2">
                                                        <div className="aspect-square bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm relative group">
                                                            <img
                                                                src={simCase.url}
                                                                alt={simCase.diagnosis}
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                            />
                                                            <div className="absolute top-1 right-1 bg-black/60 text-white text-[10px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md">
                                                                {(simCase.similarity * 100).toFixed(0)}% Match
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-[11px] font-bold text-slate-800 leading-tight">{simCase.diagnosis}</div>
                                                            <div className="text-[10px] text-slate-500 uppercase">{simCase.gender}, {simCase.age}y</div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center flex-1 text-center">
                            <Layers className="w-16 h-16 text-slate-200 mb-4" />
                            <h3 className="text-lg font-bold text-slate-400">Select a report to view AI summary</h3>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
