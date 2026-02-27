import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Upload, AlertTriangle, Shield, CheckCircle, Image as ImageIcon, Sparkles, Database, ActivitySquare } from "lucide-react";
import { UploadZone } from "@/components/upload/upload-zone";
import { ImageViewer } from "@/components/viewer/image-viewer";
import { DiseaseTable } from "@/components/results/disease-table";
import { RiskBadge } from "@/components/results/risk-badge";
import { UncertaintyIndicator } from "@/components/results/uncertainty-indicator";
import { DiseaseTimeline } from "@/components/results/disease-timeline";
import { ReportDownload } from "@/components/report/report-download";
import { predictImage, getDemographicRiskAlert } from "@/lib/api";
import type { PredictionResponse, PatientDetails, ScanRecord } from "@/types";
import { ResultModal } from "@/components/results/result-modal";
import ReactMarkdown from "react-markdown";

interface NewScanProps {
    onAiSummaryClick: () => void;
    externalHistory: ScanRecord[];
    onHistoryUpdate: (history: ScanRecord[] | ((prev: ScanRecord[]) => ScanRecord[])) => void;
}

export function NewScan({ onAiSummaryClick, externalHistory, onHistoryUpdate }: NewScanProps) {
    const [patientData, setPatientData] = useState<PatientDetails>({
        name: "",
        age: "",
        gender: "",
        phone: "",
        address: ""
    });

    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [result, setResult] = useState<PredictionResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [demoAlert, setDemoAlert] = useState<string | null>(null);
    const [loadingDemoAlert, setLoadingDemoAlert] = useState(false);

    // Modal State (History is now external)
    const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => {
        if (patientData.age && patientData.gender && parseInt(patientData.age) > 0) {
            setLoadingDemoAlert(true);
            const debounceTimer = setTimeout(async () => {
                try {
                    const res = await getDemographicRiskAlert(patientData.age || "", patientData.gender || "");
                    if (res?.alert && !res.alert.includes("sufficient demographic data")) {
                        setDemoAlert(res.alert);
                    } else {
                        setDemoAlert(null);
                    }
                } catch {
                    setDemoAlert(null);
                } finally {
                    setLoadingDemoAlert(false);
                }
            }, 1000); // 1s debounce
            return () => clearTimeout(debounceTimer);
        } else {
            setDemoAlert(null);
        }
    }, [patientData.age, patientData.gender]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setPatientData(prev => ({ ...prev, [name]: value }));
    };

    const handleAnalyze = useCallback(async (selectedFile: File) => {
        if (!patientData.name || !patientData.age || !patientData.gender) {
            setError("Please fill in required patient details (Name, Age, Gender) before uploading an image.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await predictImage(selectedFile, patientData);
            setResult(response);

            // Add to history
            const newRecord: ScanRecord = {
                id: response.report_id,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                patientName: patientData.name || "Anonymous",
                result: response,
                preview: URL.createObjectURL(selectedFile)
            };
            onHistoryUpdate(prev => [newRecord, ...prev]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Analysis failed");
        } finally {
            setLoading(false);
        }
    }, [patientData]);

    const handleFileSelect = useCallback((selectedFile: File) => {
        setFile(selectedFile);
        setPreview(URL.createObjectURL(selectedFile));
        setResult(null);
        setError(null);
        handleAnalyze(selectedFile); // Auto triggers analysis upon file select
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [handleAnalyze]);

    const handleReset = useCallback(() => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
        setPatientData({
            name: "",
            age: "",
            gender: "",
            phone: "",
            address: ""
        });
    }, []);

    const handleAddMorePhotos = useCallback(() => {
        setFile(null);
        setPreview(null);
        setResult(null);
        setError(null);
    }, []);

    const handleViewReport = (scan: ScanRecord) => {
        setSelectedScan(scan);
        setIsModalOpen(true);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10 w-full mb-10">
            {/* ═══ LEFT PANEL (7 columns) ═══ */}
            <div className="lg:col-span-7 space-y-6">

                {/* AI Demographic Alert */}
                <AnimatePresence>
                    {(demoAlert || loadingDemoAlert) && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, scale: 0.95 }}
                            animate={{ opacity: 1, height: "auto", scale: 1 }}
                            exit={{ opacity: 0, height: 0, scale: 0.95 }}
                            className="overflow-hidden"
                        >
                            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 shadow-sm flex items-start gap-4">
                                <div className="mt-0.5">
                                    <AlertTriangle className={`w-5 h-5 ${loadingDemoAlert ? 'text-slate-400 animate-pulse' : 'text-amber-500'}`} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-2">
                                        ⚠️ AI Demographic Risk Alert
                                        <span className="bg-amber-100/80 text-amber-700 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">Local Dataset Analysis</span>
                                    </h4>
                                    <p className={`text-sm font-medium leading-relaxed ${loadingDemoAlert ? 'text-amber-700/50' : 'text-amber-800'}`}>
                                        {loadingDemoAlert ? 'Synthesizing NIH dataset risk patterns...' : demoAlert}
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Registration Form */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />

                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <UserPlus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Patient Registration</h3>
                            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Step 1: Clinical Demographics</p>
                        </div>
                    </div>

                    <form className="space-y-5">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={patientData.name}
                                onChange={handleInputChange}
                                disabled={loading || !!result}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                placeholder="e.g. Jane Doe"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Age *</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={patientData.age}
                                    onChange={handleInputChange}
                                    disabled={loading || !!result}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                    placeholder="Years"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Gender *</label>
                                <select
                                    name="gender"
                                    value={patientData.gender}
                                    onChange={handleInputChange}
                                    disabled={loading || !!result}
                                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none appearance-none"
                                >
                                    <option value="" disabled>Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Phone Number</label>
                            <input
                                type="tel"
                                name="phone"
                                value={patientData.phone}
                                onChange={handleInputChange}
                                disabled={loading || !!result}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                placeholder="+1 (555) 000-0000"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Residential Address (Optional)</label>
                            <textarea
                                name="address"
                                value={patientData.address}
                                onChange={handleInputChange}
                                disabled={loading || !!result}
                                rows={2}
                                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none resize-none"
                                placeholder="Enter address..."
                            />
                        </div>
                    </form>
                </div>

                {/* Upload Section */}
                <div className={`rounded-2xl border ${!patientData.name || !patientData.age || !patientData.gender ? 'border-dashed border-slate-300 bg-slate-50/50 opacity-60 pointer-events-none' : 'border-slate-200 bg-white shadow-sm'} p-6 transition-all duration-300 relative`}>
                    {(!patientData.name || !patientData.age || !patientData.gender) && !result && (
                        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-50/50 backdrop-blur-[1px] rounded-2xl">
                            <div className="bg-white px-4 py-2 rounded-full border border-slate-200 shadow-sm text-sm font-bold text-slate-500 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-emerald-500" />
                                Complete Profile First
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                                <Upload className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Upload Radiograph</h3>
                                <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Step 2: Auto-Analysis</p>
                            </div>
                        </div>
                    </div>

                    {!result && (
                        <UploadZone
                            onFileSelect={handleFileSelect}
                            file={file}
                            onReset={handleReset}
                        />
                    )}

                    {loading && (
                        <div className="mt-6 py-6 rounded-xl bg-blue-50/50 border border-blue-100 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="relative w-12 h-12">
                                <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                                <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                            </div>
                            <div>
                                <h4 className="text-sm text-blue-900 font-bold mb-1">Synthesizing AI Heatmaps</h4>
                                <p className="text-xs text-blue-700/80 font-medium">Running ensemble diagnostic models...</p>
                            </div>
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
                                <span className="font-bold border-b border-red-200">Processing Error</span>
                            </div>
                            {error}
                        </motion.div>
                    )}

                    {/* Success Actions */}
                    {result && !loading && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="mt-4 p-5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-4 shadow-inner"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-emerald-900">Processing Complete!</h4>
                                    <p className="text-xs text-emerald-700 font-medium">Report generated and securely logged.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-emerald-100/50">
                                <button
                                    onClick={handleReset}
                                    className="w-full py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                                >
                                    New Patient
                                </button>
                                <button
                                    onClick={handleAddMorePhotos}
                                    className="w-full py-2.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                                >
                                    Add Scans
                                </button>
                                <button
                                    onClick={onAiSummaryClick}
                                    className="w-full py-2.5 bg-indigo-600 border border-indigo-700 rounded-lg text-sm font-bold text-white hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
                                >
                                    AI Summary
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>

            </div>

            {/* ═══ RIGHT PANEL (5 columns) ═══ */}
            <div className="lg:col-span-5 space-y-6 sticky top-24">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                        <ActivitySquare className="w-5 h-5 text-indigo-600" />
                        Session Scan History
                    </h3>
                    <span className="px-2.5 py-1 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        {externalHistory.length} Scans Found
                    </span>
                </div>

                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {externalHistory.length > 0 ? (
                            externalHistory.map((scan) => (
                                <motion.div
                                    key={scan.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    layout
                                    className="group relative bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer"
                                    onClick={() => handleViewReport(scan)}
                                >
                                    <div className="flex gap-4">
                                        <div className="w-20 h-20 rounded-xl bg-slate-900 overflow-hidden border border-slate-100 flex-shrink-0">
                                            <img
                                                src={scan.preview}
                                                alt="X-ray preview"
                                                className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-1">
                                                <div>
                                                    <h4 className="font-bold text-slate-900 truncate pr-2">
                                                        {scan.patientName}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                        ID: {scan.id.substring(0, 8)}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">
                                                    {scan.timestamp}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-3 mt-2">
                                                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${scan.result.risk_assessment.risk_level === "High Suspicion"
                                                    ? "bg-red-50 text-red-600 border-red-100"
                                                    : scan.result.risk_assessment.risk_level === "Moderate Risk"
                                                        ? "bg-amber-50 text-amber-600 border-amber-100"
                                                        : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                    }`}>
                                                    {scan.result.risk_assessment.risk_level}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onAiSummaryClick();
                                                    }}
                                                    className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-500 uppercase hover:text-indigo-700 transition-colors"
                                                >
                                                    <Sparkles className="w-3 h-3" />
                                                    View Clinical Summary
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center">
                                            <Sparkles className="w-4 h-4 text-indigo-600" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-16 px-6 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50"
                            >
                                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                                    <ActivitySquare className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-sm font-bold text-slate-900 mb-1">No Scans This Session</h3>
                                <p className="text-slate-500 text-center text-xs font-medium max-w-[200px]">
                                    Complete a patient registration and upload an X-ray to see results here.
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Result Modal */}
            <ResultModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                result={selectedScan?.result || null}
                previewUrl={selectedScan?.preview || null}
            />
        </div>
    );
}
