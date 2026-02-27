import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FastForward, Presentation, RefreshCw, AlertTriangle } from "lucide-react";
import { getDiseaseProgression } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface DiseaseTimelineProps {
    topDisease: string;
}

export function DiseaseTimeline({ topDisease }: DiseaseTimelineProps) {
    const [progression, setProgression] = useState<{ stages: { stage: string, url: string }[], explanation: string } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStage, setSelectedStage] = useState<number>(0);

    useEffect(() => {
        if (!topDisease || topDisease === "No Finding") return;
        setSelectedStage(0);

        const fetchData = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getDiseaseProgression(topDisease);
                if (data.error || data.stages.length === 0) {
                    setError(data.error || "No progression data found.");
                } else {
                    setProgression(data as unknown as { stages: { stage: string, url: string }[], explanation: string });
                }
            } catch {
                setError("Failed to fetch progression data.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [topDisease]);

    if (topDisease === "No Finding") return null;

    return (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center border border-violet-200 shadow-inner">
                    <FastForward className="w-6 h-6 text-violet-600" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Disease Progression Timeline</h3>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mt-1">
                        NIH Dataset Precedents • {topDisease}
                    </p>
                </div>
            </div>

            <div className="p-6 min-h-[300px] flex items-center justify-center">
                {loading ? (
                    <div className="flex flex-col items-center gap-3">
                        <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" />
                        <span className="text-sm font-medium text-slate-500">Synthesizing timeline from LLaMA-3...</span>
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center gap-3 text-amber-600">
                        <AlertTriangle className="w-8 h-8 opacity-50" />
                        <span className="text-sm font-medium">Timeline visualization unavailable for {topDisease}</span>
                    </div>
                ) : progression ? (
                    <div className="w-full flex flex-col lg:flex-row gap-8">
                        {/* Image Viewer & Slider */}
                        <div className="flex-1 flex flex-col gap-6">
                            <div className="aspect-[4/3] w-full bg-slate-900 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200">
                                <AnimatePresence mode="wait">
                                    <motion.img
                                        key={selectedStage}
                                        src={progression.stages[selectedStage].url}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 1.05 }}
                                        transition={{ duration: 0.4 }}
                                        className="w-full h-full object-contain p-2"
                                        alt={`Stage ${selectedStage}`}
                                    />
                                </AnimatePresence>
                                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full border border-white/20">
                                    <span className="text-xs font-bold text-white tracking-widest uppercase">
                                        {progression.stages[selectedStage].stage} Stage
                                    </span>
                                </div>
                            </div>

                            {/* Slider Controls */}
                            <div className="relative px-4">
                                <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 -translate-y-1/2 rounded-full" />
                                <div className="relative flex justify-between">
                                    {progression.stages.map((stage, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setSelectedStage(idx)}
                                            className="flex flex-col items-center gap-3 group focus:outline-none"
                                        >
                                            <div className={`w-6 h-6 rounded-full border-4 flex items-center justify-center transition-all duration-300 z-10 ${selectedStage === idx ? 'bg-violet-600 border-white shadow-[0_0_0_2px_rgba(124,58,237,1)] scale-125' : 'bg-slate-300 border-white shadow-[0_0_0_2px_rgba(203,213,225,1)] group-hover:bg-violet-400'}`} />
                                            <span className={`text-xs font-bold tracking-widest uppercase transition-colors ${selectedStage === idx ? 'text-violet-700' : 'text-slate-400 group-hover:text-violet-500'}`}>
                                                {stage.stage}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* AI Explanation Panel */}
                        <div className="w-full lg:w-80 shrink-0 bg-violet-50/50 rounded-2xl p-6 border border-violet-100 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                                <Presentation className="w-24 h-24 text-violet-900" />
                            </div>
                            <div className="flex items-center gap-2 mb-4 relative z-10">
                                <div className="w-6 h-6 rounded bg-violet-600 flex items-center justify-center">
                                    <span className="text-[10px] font-bold text-white">AI</span>
                                </div>
                                <span className="text-xs font-bold text-violet-900 uppercase tracking-widest">
                                    Clinical Summary
                                </span>
                            </div>
                            <div className="prose prose-sm prose-violet prose-p:leading-relaxed text-slate-700 font-medium relative z-10">
                                <ReactMarkdown>{progression.explanation}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
