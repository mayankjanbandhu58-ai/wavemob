"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Stethoscope, CheckCircle2, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AmbientDictationProps {
    onSaveNotes: (notes: string) => void;
}

export function AmbientDictation({ onSaveNotes }: AmbientDictationProps) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [isFormatting, setIsFormatting] = useState(false);
    const [formattedNotes, setFormattedNotes] = useState<string | null>(null);

    // Use a ref to store the SpeechRecognition instance
    const recognitionRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any

    useEffect(() => {
        // Initialize Web Speech API if supported
        if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; // eslint-disable-line @typescript-eslint/no-explicit-any
            recognitionRef.current = new SpeechRec();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;

            recognitionRef.current.onresult = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                let currentTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    currentTranscript += event.results[i][0].transcript;
                }
                setTranscript(currentTranscript);
            };

            recognitionRef.current.onerror = (event: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
                console.error("Speech recognition error", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, []);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            setTranscript("");
            setFormattedNotes(null);
            try {
                recognitionRef.current?.start();
                setIsListening(true);
            } catch (err) {
                console.error("Failed to start listening", err);
            }
        }
    };

    const formatToSoap = async () => {
        setIsFormatting(true);
        // Simulate LLM structuring the messy voice input
        setTimeout(() => {
            const simulatedSoap = `**Subjective:** Patient presents following AI triage flag. Staff reports mild shortness of breath.\n\n**Objective:** Reviewed AP Chest Radiograph. AI indicates high probability of pathology.\n\n**Assessment:** Correlated with AI findings. Findings are consistent with early stage infiltration.\n\n**Plan:** Will order stat CT without contrast to specify margins. Prescribe broad-spectrum antibiotics pending blood culture.`;
            setFormattedNotes(simulatedSoap);
            setIsFormatting(false);
            onSaveNotes(simulatedSoap);
        }, 2000);
    };

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <Stethoscope className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Ambient Clinical Dictation</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Voice-to-SOAP Powered by LLM</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Microphone Toggle Button */}
                    <button
                        onClick={toggleListening}
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
                            ? "bg-red-50 text-red-600 border border-red-200 shadow-inner shadow-red-200"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20"
                            }`}
                    >
                        {isListening ? (
                            <>
                                <motion.div
                                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 1.5 }}
                                    className="absolute inset-0 rounded-full bg-red-400"
                                />
                                <MicOff className="w-5 h-5 relative z-10" />
                            </>
                        ) : (
                            <Mic className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-4 bg-white min-h-[140px] relative">
                <AnimatePresence mode="wait">
                    {!isListening && !transcript && !formattedNotes && !isFormatting && (
                        <motion.div
                            key="empty"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center text-slate-400"
                        >
                            <Mic className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-sm font-medium">Click the mic to begin ambient dictation</p>
                        </motion.div>
                    )}

                    {(isListening || (transcript && !formattedNotes && !isFormatting)) && (
                        <motion.div
                            key="transcribing"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-4"
                        >
                            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 min-h-[100px]">
                                <p className="text-sm text-slate-700 leading-relaxed font-medium italic">
                                    {transcript || "Listening..."}
                                </p>
                                {isListening && (
                                    <span className="inline-block w-1.5 h-4 ml-1 bg-emerald-500 animate-pulse align-middle" />
                                )}
                            </div>
                            {!isListening && transcript && (
                                <button
                                    onClick={formatToSoap}
                                    className="w-full py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 border border-indigo-200"
                                >
                                    <Sparkles className="w-4 h-4" />
                                    Structure into Medical Note
                                </button>
                            )}
                        </motion.div>
                    )}

                    {isFormatting && (
                        <motion.div
                            key="formatting"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 pl-16 flex flex-col items-start justify-center bg-white/80 backdrop-blur-sm z-10"
                        >
                            <div className="flex items-center gap-3 text-indigo-600 mb-2">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="font-bold text-sm">LLM Processing Audio...</span>
                            </div>
                            <div className="flex gap-1">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Inferring Context</span>
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded">Formatting Standard</span>
                            </div>
                        </motion.div>
                    )}

                    {formattedNotes && !isFormatting && (
                        <motion.div
                            key="formatted"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-1.5 text-indigo-700">
                                    <CheckCircle2 className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Structured SOAP Note</span>
                                </div>
                                <button
                                    onClick={() => { setTranscript(""); setFormattedNotes(null); }}
                                    className="text-[10px] text-slate-500 hover:text-slate-700 font-bold uppercase underline"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="prose prose-sm prose-slate max-w-none text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                                {formattedNotes}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
