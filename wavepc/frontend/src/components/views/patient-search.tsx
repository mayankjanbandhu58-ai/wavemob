import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Filter, ArrowRight, Activity, CalendarDays, Hash, Info } from "lucide-react";
import { JustificationModal } from "@/components/results/justification-modal";
import type { Justification } from "@/types";
export function PatientSearch() {
    const [selectedJustification, setSelectedJustification] = useState<{
        disease: string;
        probability: number;
        justification: Justification;
    } | null>(null);

    const searchResults = [
        {
            id: "PT-00001",
            hash: "00000001_000.png",
            age: 58,
            gender: "M",
            findings: ["Cardiomegaly"],
            date: "2017-09-12",
            confidence: 92.4,
            viewPosition: "PA"
        },
        {
            id: "PT-00002",
            hash: "00000002_000.png",
            age: 81,
            gender: "M",
            findings: ["No Finding"],
            date: "2017-08-04",
            confidence: 96.1,
            viewPosition: "PA"
        },
        {
            id: "PT-00003",
            hash: "00000003_003.png",
            age: 76,
            gender: "F",
            findings: ["Hernia", "Infiltration"],
            date: "2017-10-21",
            confidence: 88.5,
            viewPosition: "PA"
        },
        {
            id: "PT-00004",
            hash: "00000004_000.png",
            age: 82,
            gender: "M",
            findings: ["Mass", "Nodule"],
            date: "2017-11-15",
            confidence: 81.2,
            viewPosition: "AP"
        },
        {
            id: "PT-00008",
            hash: "00000008_002.png",
            age: 73,
            gender: "F",
            findings: ["Nodule"],
            date: "2017-12-05",
            confidence: 89.9,
            viewPosition: "PA"
        },
        {
            id: "PT-00009",
            hash: "00000009_000.png",
            age: 73,
            gender: "M",
            findings: ["Emphysema"],
            date: "2018-01-14",
            confidence: 94.7,
            viewPosition: "PA"
        }
    ];
    return (
        <div className="space-y-6">

            {/* Header & Search Bar */}
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 rounded-2xl p-8 shadow-sm relative overflow-hidden">
                <div className="relative z-10 max-w-4xl mx-auto space-y-6 text-center">
                    <h2 className="text-3xl font-black text-white">Global Cohort Query</h2>
                    <p className="text-blue-200 font-medium max-w-2xl mx-auto">
                        Search transversally across the entire database for specific pathology traits, patient demographics, or AI model classifications.
                    </p>

                    <div className="bg-white/10 p-2 rounded-2xl border border-white/20 backdrop-blur-md flex items-center gap-3">
                        <Search className="w-6 h-6 text-blue-300 ml-4" />
                        <input
                            type="text"
                            placeholder="Search by ID, Name, Condition (e.g., 'Atrial Fibrillation'), or Model Hash..."
                            className="flex-1 bg-transparent text-white placeholder-blue-300/60 font-medium outline-none py-3"
                        />
                        <button className="px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center gap-2">
                            Query <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Abstract FX */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none translate-x-1/2 translate-y-1/2" />
            </div>

            <div className="flex gap-6">
                {/* Filters Sidebar */}
                <div className="w-64 shrink-0 space-y-6">
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-5">
                        <div className="flex items-center gap-2 text-slate-800 font-bold border-b border-slate-100 pb-3">
                            <Filter className="w-4 h-4" /> Advanced Filters
                        </div>

                        <div className="space-y-3">
                            <p className="text-xs font-bold text-slate-500 uppercase">Pathology Class</p>
                            {['Normal', 'Pneumonia', 'Cardiomegaly', 'Effusion'].map(p => (
                                <label key={p} className="flex items-center gap-3 cursor-pointer group">
                                    <div className="w-4 h-4 rounded border border-slate-300 group-hover:border-blue-500 transition-colors flex items-center justify-center">
                                        {/* Checkmark icon for active state would go here */}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{p}</span>
                                </label>
                            ))}
                        </div>

                        <div className="space-y-3 pt-4 border-t border-slate-100">
                            <p className="text-xs font-bold text-slate-500 uppercase">AI Confidence &gt; 80%</p>
                            <input type="range" className="w-full accent-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between text-sm text-slate-500 font-medium px-2">
                        <span>Showing {searchResults.length} results</span>
                        <span>Sort by: <strong className="text-slate-800 cursor-pointer">Relevance</strong></span>
                    </div>

                    <div className="space-y-4">
                        {searchResults.map((patient) => (
                            <motion.div
                                key={patient.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <User className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <h3 className="text-lg font-black text-slate-900">{patient.id}</h3>
                                                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold border border-slate-200 flex items-center gap-1">
                                                    <Hash className="w-3 h-3" /> {patient.hash}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-500 flex items-center gap-3">
                                                <span>{patient.age} yrs • {patient.gender} • {patient.viewPosition}</span>
                                                <span className="flex items-center gap-1"><CalendarDays className="w-4 h-4" /> {patient.date}</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="inline-flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-md text-xs font-bold mb-2">
                                            <Activity className="w-3 h-3" /> {patient.confidence}% AI Confidence
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    {patient.findings.map(finding => (
                                        <div key={finding} className="flex items-center gap-1">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${finding === 'No Finding' ? 'bg-slate-100 text-slate-600' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                {finding}
                                            </span>
                                            {finding !== 'No Finding' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedJustification({
                                                            disease: finding,
                                                            probability: patient.confidence,
                                                            justification: {
                                                                primary_evidence: `The AI model detected features consistent with ${finding} in the provided scan (${patient.viewPosition} view). Opacity detected in characteristic lung zones.`,
                                                                dataset_origin: "NIH Chest X-ray Dataset v2.0",
                                                                confidence_interval: `[${(patient.confidence - 2.1).toFixed(1)}%, ${(patient.confidence + 1.8).toFixed(1)}%]`,
                                                                threshold_calibration: "Standard operating point (Youden's Index)",
                                                                reference_images: [
                                                                    { url: `/dataset/CHNCXR_0196_0.png`, caption: `Verified Dataset Case (Typical ${finding} presentation)` },
                                                                    { url: `/dataset/CHNCXR_0197_0.png`, caption: `Verified Dataset Case (Atypical ${finding} presentation)` }
                                                                ]
                                                            }
                                                        });
                                                    }}
                                                    className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                                                    title={`View AI justification for ${finding}`}
                                                >
                                                    <Info className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

            <JustificationModal
                isOpen={!!selectedJustification}
                onClose={() => setSelectedJustification(null)}
                disease={selectedJustification?.disease || ""}
                probability={selectedJustification?.probability || 0}
                justification={selectedJustification?.justification || {
                    primary_evidence: "",
                    dataset_origin: "",
                    confidence_interval: "",
                    threshold_calibration: ""
                }}
            />
        </div>
    );
}
