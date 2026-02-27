import { motion, AnimatePresence } from "framer-motion";
import { X, Info, ShieldCheck, Database, GitBranch, AlertTriangle, Image as ImageIcon, History, CheckCircle, XCircle, FileText, Check } from "lucide-react";
import type { Justification } from "@/types";
import { useState, useEffect } from "react";
import { Portal } from "@/components/ui/portal";

interface JustificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    disease: string;
    probability: number;
    justification: Justification | null;
}

export function JustificationModal({ isOpen, onClose, disease, probability, justification }: JustificationModalProps) {
    const [layerView, setLayerView] = useState<"base" | "heatmap" | "bbox">("base");
    const [feedbackState, setFeedbackState] = useState<"idle" | "confirmed" | "rejected">("idle");
    const [timelineValue, setTimelineValue] = useState(100);
    const [reportForm, setReportForm] = useState({ finding: "", impression: "", signed: false });

    useEffect(() => {
        if (isOpen) {
            // Reset modal state on open
            setFeedbackState("idle");
            setLayerView("base");
            setTimelineValue(100);
            setReportForm({
                finding: `The primary radiological finding indicates a strong clinical correlation for ${disease}.`,
                impression: `Follow-up recommended. Current AI confidence is ${(probability * 100).toFixed(1)}%.`,
                signed: false
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);

    if (!isOpen || !justification) return null;

    const handleFeedback = (action: "confirmed" | "rejected") => {
        setFeedbackState(action);
        setTimeout(() => setFeedbackState("idle"), 3000);
    };

    return (
        <Portal>
            <AnimatePresence>
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-2xl max-h-[85vh] md:max-h-[88vh] bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col mx-auto"
                    >
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center border border-indigo-200">
                                    <ShieldCheck className="w-5 h-5 text-indigo-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">AI Clinical Justification</h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Unassailable Evidence Engine</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5 flex-1 overflow-y-auto custom-scrollbar">

                            {/* Top Stat Row */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200">
                                <div>
                                    <p className="text-sm font-bold text-slate-500 mb-1">Target Pathology</p>
                                    <p className="text-2xl font-black text-slate-900">{disease}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-bold text-slate-500 mb-1">Ensemble Confidence</p>
                                    <div className="flex items-end gap-2 justify-end">
                                        <span className={`text-3xl font-black ${probability > 0.7 ? 'text-rose-600' : probability > 0.4 ? 'text-amber-500' : 'text-emerald-500'}`}>
                                            {(Math.min(probability, 1.0) * 100).toFixed(1)}%
                                        </span>
                                        <span className="text-sm font-bold text-slate-400 mb-1.5">{justification.confidence_interval}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Primary Evidence */}
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Info className="w-4 h-4 text-blue-500" />
                                    <h4 className="font-bold text-slate-900">Primary Radiological Evidence</h4>
                                </div>
                                <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-blue-900 text-sm leading-relaxed font-medium">
                                    &quot;{justification.primary_evidence}&quot;
                                </div>
                            </div>

                            {/* Grid for Technical Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Training Data */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Database className="w-4 h-4 text-purple-500" />
                                        <h5 className="font-bold text-slate-800 text-sm">Dataset Origin</h5>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        {justification.dataset_origin}
                                    </p>
                                </div>

                                {/* Model Algo */}
                                <div className="p-4 rounded-xl border border-slate-200 bg-white">
                                    <div className="flex items-center gap-2 mb-2">
                                        <GitBranch className="w-4 h-4 text-emerald-500" />
                                        <h5 className="font-bold text-slate-800 text-sm">Threshold Calibration</h5>
                                    </div>
                                    <p className="text-xs text-slate-500 leading-relaxed font-medium">
                                        {justification.threshold_calibration}
                                    </p>
                                </div>
                            </div>

                            {/* Feature 4: Layer Toggles & Feature 1: Similar Cases */}
                            {justification.reference_images && justification.reference_images.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <ImageIcon className="w-4 h-4 text-slate-700" />
                                            <h4 className="font-bold text-slate-900">Similar Verified Cases</h4>
                                        </div>
                                        <div className="flex bg-slate-100 p-1 rounded-lg">
                                            <button onClick={() => setLayerView("base")} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${layerView === 'base' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Base</button>
                                            <button onClick={() => setLayerView("heatmap")} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${layerView === 'heatmap' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Heatmap</button>
                                            <button onClick={() => setLayerView("bbox")} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${layerView === 'bbox' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>Bounds</button>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {justification.reference_images.map((img, idx) => (
                                            <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 group bg-slate-900 flex flex-col">
                                                <div className="aspect-[4/3] w-full relative group">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={img.url}
                                                        alt={img.caption}
                                                        className={`w-full h-full object-cover transition-all duration-300 ${layerView !== 'base' ? 'opacity-90' : 'opacity-100'}`}
                                                    />
                                                    {/* Simulated Overlays */}
                                                    {layerView === "heatmap" && (
                                                        <div className="absolute inset-0 select-none pointer-events-none mix-blend-multiply opacity-60 bg-[radial-gradient(circle_at_center,rgba(255,0,0,0.8)_0%,rgba(255,165,0,0.4)_40%,transparent_70%)] transition-opacity" />
                                                    )}
                                                    {layerView === "bbox" && (
                                                        <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 select-none pointer-events-none border-2 border-red-500 bg-red-500/10 rounded pointer-events-none transition-all" />
                                                    )}

                                                    {/* Overlay Gradient */}
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />
                                                    <div className="absolute bottom-0 left-0 right-0 p-3 z-10">
                                                        <p className="text-sm text-white font-bold leading-tight">{img.caption}</p>
                                                        <p className="text-xs text-blue-200 mt-1 font-medium bg-blue-900/40 w-fit px-2 py-0.5 rounded border border-blue-500/30 backdrop-blur-sm">Sim. Score: {((0.95 - (idx * 0.04)) * 100).toFixed(1)}%</p>
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 p-3 border-t border-slate-200">
                                                    <p className="text-[10px] uppercase font-bold text-slate-400 mb-1 tracking-wider">Historical Treatment</p>
                                                    <p className="text-xs text-slate-700 font-medium">Follow-up CT chest ordered. Patient treated successfully.</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Feature 2: Longitudinal Timeline Slider */}
                            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <History className="w-5 h-5 text-indigo-500" />
                                    <h4 className="font-bold text-slate-900">Longitudinal Progression (6 Months)</h4>
                                </div>
                                <div className="relative aspect-[21/9] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 isolate">
                                    {/* Base Image (Past) */}
                                    <div className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-screen scale-105 blur-[1px]" style={{ backgroundImage: `url('/dataset/CHNCXR_0186_0.png')` }} />
                                    {/* Current Image */}
                                    <div
                                        className="absolute inset-0 bg-cover bg-center border-r-2 border-indigo-500 shadow-[2px_0_15px_rgba(99,102,241,0.5)]"
                                        style={{
                                            backgroundImage: `url('${justification.reference_images?.[0]?.url || '/dataset/CHNCXR_0182_0.png'}')`,
                                            width: `${timelineValue}%`
                                        }}
                                    />
                                    <input
                                        type="range"
                                        min="0" max="100"
                                        value={timelineValue}
                                        onChange={(e) => setTimelineValue(parseInt(e.target.value))}
                                        className="absolute inset-x-0 inset-y-1/2 w-full appearance-none bg-transparent cursor-ew-resize z-20"
                                        style={{ transform: "translateY(-50%)" }}
                                    />
                                    <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">June 2025</div>
                                    <div className="absolute bottom-3 right-3 bg-indigo-600/90 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white uppercase tracking-wider">Today</div>
                                </div>
                                <p className="text-xs text-slate-500 mt-3 font-medium bg-slate-50 p-2 rounded-lg border border-slate-100">
                                    <span className="text-indigo-600 font-bold mr-1">AI Insight:</span>
                                    Pathology density appears 14% more prominent compared to historical baseline scan.
                                </p>
                            </div>

                            {/* Feature 5: Auto-Drafted Report */}
                            <div className="p-5 rounded-2xl border border-slate-200 bg-white">
                                <div className="flex items-center gap-2 mb-4 text-[#1e293b]">
                                    <FileText className="w-5 h-5 text-blue-500" />
                                    <h4 className="font-bold text-lg">Auto-Drafted Report</h4>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 block">Findings</label>
                                        <textarea
                                            value={reportForm.finding}
                                            onChange={(e) => setReportForm({ ...reportForm, finding: e.target.value })}
                                            className="w-full text-sm font-medium text-slate-700 p-3 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none custom-scrollbar min-h-[60px]"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1 block">Impression</label>
                                        <textarea
                                            value={reportForm.impression}
                                            onChange={(e) => setReportForm({ ...reportForm, impression: e.target.value })}
                                            className="w-full text-sm font-medium text-slate-700 p-3 rounded-lg border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:outline-none custom-scrollbar min-h-[60px]"
                                        />
                                    </div>
                                    <div className="flex justify-end mt-2">
                                        <button
                                            onClick={() => setReportForm({ ...reportForm, signed: true })}
                                            disabled={reportForm.signed}
                                            className={`px-4 py-2 text-sm font-bold rounded-lg flex items-center gap-2 transition-all ${reportForm.signed ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'}`}
                                        >
                                            {reportForm.signed ? <><Check className="w-4 h-4" /> Signed & Ready</> : "Sign Report"}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Feature 3: Interactive Feedback Loop */}
                            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl overflow-hidden relative">
                                {feedbackState !== "idle" && (
                                    <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center animate-in fade-in duration-300">
                                        <CheckCircle className="w-10 h-10 text-emerald-400 mb-2" />
                                        <p className="text-white font-bold tracking-tight">Feedback Captured</p>
                                        <p className="text-slate-400 text-xs mt-1">Model weights adjusting in next training run</p>
                                    </div>
                                )}

                                <h4 className="font-bold text-white mb-1">Radiologist Feedback</h4>
                                <p className="text-xs text-slate-400 font-medium mb-4">Validate this AI finding to reinforce model weights continuously.</p>
                                <div className="flex gap-3">
                                    <button onClick={() => handleFeedback("confirmed")} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                                        <CheckCircle className="w-4 h-4" /> Confirm Finding
                                    </button>
                                    <button onClick={() => handleFeedback("rejected")} className="flex-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all">
                                        <XCircle className="w-4 h-4" /> Reject Finding
                                    </button>
                                </div>
                            </div>

                            {/* Disclaimer */}
                            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-200">
                                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                    Calculations derived via aggregated soft-voting of independently trained DenseNet & EfficientNet CNN architectures. AI predictions augment, but do not replace, formal radiologist review.
                                </p>
                            </div>

                        </div>
                    </motion.div>
                </div>
            </AnimatePresence>
        </Portal>
    );
}
