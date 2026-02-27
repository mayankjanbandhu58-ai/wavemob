import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Download, FileText, Loader2, AlertCircle, Eye, X, Activity, TrendingUp, TrendingDown } from "lucide-react";
import { getReports, downloadReportPdf } from "@/lib/api";
import type { Report } from "@/types";
import { Portal } from "@/components/ui/portal";

export function PatientReports() {
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloadingId, setDownloadingId] = useState<string | null>(null);
    const [viewingId, setViewingId] = useState<string | null>(null);
    const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await getReports();
            const namedPatientData = data.filter(r => r.patient_details?.name);
            namedPatientData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setReports(namedPatientData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load reports");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async (reportId: string) => {
        try {
            setDownloadingId(reportId);
            const blob = await downloadReportPdf(reportId);

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `Wavelength_Report_${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert("Failed to download PDF report. Please try again.");
        } finally {
            setDownloadingId(null);
        }
    };

    const handleView = async (reportId: string) => {
        try {
            setViewingId(reportId);
            const blob = await downloadReportPdf(reportId);
            const url = window.URL.createObjectURL(blob);
            setViewPdfUrl(url);
        } catch (err) {
            alert("Failed to load PDF report for viewing.");
        } finally {
            setViewingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px]">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Loading patient history...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[600px] text-red-600">
                <AlertCircle className="w-10 h-10 mb-2" />
                <p className="font-bold">{error}</p>
                <button
                    onClick={fetchReports}
                    className="mt-4 px-4 py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 font-medium"
                >
                    Try Again
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-sm overflow-hidden">
            <div className="p-6 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Patient Directory</h2>
                        <p className="text-sm text-slate-500">Comprehensive list of all AI analyzed cases.</p>
                    </div>
                </div>
                <div className="px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-bold text-slate-600 shadow-sm">
                    {reports.length} Records
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-slate-500">Date/Time</th>
                            <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-slate-500">Report ID</th>
                            <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-slate-500">Patient Info</th>
                            <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-slate-500">Risk Assessment</th>
                            <th className="py-4 px-6 font-bold text-xs uppercase tracking-wider text-slate-500 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {reports.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-500 font-medium">
                                    No patient reports found in the database.
                                </td>
                            </tr>
                        ) : (
                            reports.map((report) => (
                                <tr key={report.report_id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <div className="text-sm font-bold text-slate-800">
                                            {format(new Date(report.timestamp), "MMM dd, yyyy")}
                                        </div>
                                        <div className="text-xs text-slate-500 font-medium">
                                            {format(new Date(report.timestamp), "hh:mm a")}
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <span className="font-mono text-sm bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200">
                                            {report.report_id}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        {report.patient_details?.name ? (
                                            <div>
                                                <button
                                                    onClick={() => setSelectedPatient(report.patient_details?.name || null)}
                                                    className="text-sm font-bold text-indigo-600 hover:text-indigo-800 underline decoration-indigo-200 underline-offset-4 text-left focus:outline-none"
                                                >
                                                    {report.patient_details.name}
                                                </button>
                                                <div className="text-xs text-slate-500 font-medium mt-0.5">
                                                    {report.patient_details.age ? `${report.patient_details.age}y` : ''}
                                                    {report.patient_details.gender ? ` • ${report.patient_details.gender}` : ''}
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-sm italic text-slate-400">Anonymous Scan</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: report.risk_assessment.risk_color }} />
                                            <span className="text-sm font-bold text-slate-700">
                                                {report.risk_assessment.risk_level}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 px-6 whitespace-nowrap text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => handleView(report.report_id)}
                                                disabled={viewingId === report.report_id}
                                                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                            >
                                                {viewingId === report.report_id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Eye className="w-4 h-4" />
                                                )}
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleDownload(report.report_id)}
                                                disabled={downloadingId === report.report_id}
                                                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-[#1e3a8a] hover:bg-blue-50 hover:border-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                            >
                                                {downloadingId === report.report_id ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Download className="w-4 h-4" />
                                                )}
                                                Export
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {viewPdfUrl && (
                <Portal>
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-indigo-600" />
                                    Clinical Report Preview
                                </h3>
                                <button
                                    onClick={() => {
                                        window.URL.revokeObjectURL(viewPdfUrl);
                                        setViewPdfUrl(null);
                                    }}
                                    className="p-2 hover:bg-slate-200 rounded-full transition-colors group"
                                >
                                    <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
                                </button>
                            </div>
                            <iframe src={viewPdfUrl} className="w-full flex-1 border-0" title="PDF Report Preview" />
                        </div>
                    </div>
                </Portal>
            )}

            {/* Longitudinal Progression Modal */}
            {selectedPatient && (() => {
                const timeline = reports.filter(r => r.patient_details?.name === selectedPatient).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
                return (
                    <Portal>
                        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
                            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
                                <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                        <Activity className="w-6 h-6 text-indigo-600" />
                                        Longitudinal Progression: {selectedPatient}
                                    </h3>
                                    <button onClick={() => setSelectedPatient(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors group focus:outline-none">
                                        <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50 space-y-8">
                                    {timeline.map((rpt, idx) => {
                                        const prevRpt = idx > 0 ? timeline[idx - 1] : null;
                                        // Hack to access severity_index via risk_assessment any, or optional chaining
                                        const currentRSI = rpt.risk_assessment?.severity_index;
                                        const prevRSI = prevRpt?.risk_assessment?.severity_index;

                                        let rsiDelta = null;
                                        if (currentRSI !== undefined && prevRSI !== undefined) {
                                            rsiDelta = currentRSI - prevRSI;
                                        }

                                        return (
                                            <div key={rpt.report_id} className="relative pl-8">
                                                {/* Connecting Line */}
                                                {idx !== timeline.length - 1 && (
                                                    <div className="absolute left-[3px] top-8 bottom-[-2rem] w-[2px] bg-indigo-100" />
                                                )}
                                                {/* Dot */}
                                                <div className="absolute left-[-2px] top-6 w-3 h-3 rounded-full bg-indigo-500 ring-4 ring-slate-50" />

                                                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm transition-shadow hover:shadow-md">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <div>
                                                            <div className="text-sm font-bold text-slate-500 mb-1">{format(new Date(rpt.timestamp), "MMM dd, yyyy • hh:mm a")}</div>
                                                            <h4 className="text-lg font-extrabold text-slate-800">Scan ID: {rpt.report_id}</h4>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 rounded-full mb-2">
                                                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: rpt.risk_assessment?.risk_color }} />
                                                                <span className="text-xs font-bold text-slate-700">{rpt.risk_assessment?.risk_level}</span>
                                                            </div>
                                                            {currentRSI !== undefined && (
                                                                <div className="text-sm font-bold text-slate-600 flex items-center justify-end gap-2">
                                                                    <span>RSI: {Number(currentRSI).toFixed(1)}</span>
                                                                    {rsiDelta !== null && Math.abs(rsiDelta) > 0.1 && (
                                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-extrabold ${rsiDelta > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                                                                            {rsiDelta > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                                            {Math.abs(rsiDelta).toFixed(1)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Primary Findings & Confidence</span>
                                                            <div className="flex flex-wrap gap-2">
                                                                {Object.entries(rpt.disease_probabilities || {}).filter(([_, p]) => p > 0.5).map(([d, p]) => (
                                                                    <span key={d} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-bold text-slate-700 shadow-sm">
                                                                        {d} ({(p * 100).toFixed(1)}%)
                                                                    </span>
                                                                ))}
                                                                {Object.entries(rpt.disease_probabilities || {}).filter(([_, p]) => p > 0.5).length === 0 && (
                                                                    <span className="text-sm font-medium text-slate-500 italic">No acute findings.</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-2">AI Clinical Synthesis</span>
                                                            <p className="text-sm font-medium text-slate-700 line-clamp-3">
                                                                {rpt.ai_summary ? rpt.ai_summary.substring(0, 150) + "..." : "AI Summary unavailable or currently synthesizing."}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Portal>
                );
            })()}
        </div>
    );
}
