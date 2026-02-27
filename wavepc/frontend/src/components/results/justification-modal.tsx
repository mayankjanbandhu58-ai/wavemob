import { motion, AnimatePresence } from "framer-motion";
import { X, Info, ShieldCheck, Database, GitBranch, AlertTriangle, Image as ImageIcon } from "lucide-react";
import type { Justification } from "@/types";

interface JustificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    disease: string;
    probability: number;
    justification: Justification | null;
}

export function JustificationModal({ isOpen, onClose, disease, probability, justification }: JustificationModalProps) {
    if (!isOpen || !justification) return null;

    return (
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

                        {/* Similar Historical Cases (Proof) */}
                        {justification.reference_images && justification.reference_images.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <ImageIcon className="w-4 h-4 text-slate-700" />
                                    <h4 className="font-bold text-slate-900">Similar Verified Cases (Dataset Proof)</h4>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {justification.reference_images.map((img, idx) => (
                                        <div key={idx} className="relative rounded-xl overflow-hidden border border-slate-200 group bg-slate-900">
                                            <div className="aspect-[4/3] w-full relative">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={img.url}
                                                    alt={img.caption}
                                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                                                />
                                                {/* Overlay Gradient */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 p-3">
                                                <p className="text-xs text-white font-medium leading-tight">
                                                    {img.caption}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

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
    );
}
