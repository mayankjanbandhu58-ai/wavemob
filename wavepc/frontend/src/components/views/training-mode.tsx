import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Award, RefreshCw, CheckCircle, XCircle, ChevronRight, Activity } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { getTutorFeedback } from "@/lib/api";

const TRAINING_CASES = [
    { img: "/dataset/CHNCXR_0065_0.png", trueLabel: "Mass", desc: "Large mass in the left upper lobe, suspicious for malignancy. Notice the defined borders." },
    { img: "/dataset/CHNCXR_0036_0.png", trueLabel: "Cardiomegaly", desc: "Enlarged cardiac silhouette with CTR > 0.5. The heart spans more than half the thoracic width." },
    { img: "/dataset/CHNCXR_0040_0.png", trueLabel: "Effusion", desc: "Blunting of the costophrenic angles indicative of pleural fluid collection." },
    { img: "/dataset/CHNCXR_0185_0.png", trueLabel: "Pneumonia", desc: "Alveolar consolidation in the mid lung zone with air bronchograms." },
    { img: "/dataset/CHNCXR_0193_0.png", trueLabel: "Atelectasis", desc: "Volume loss in the upper lobe. Note the compensative hyperexpansion of adjacent tissue." },
    { img: "/dataset/CHNCXR_0488_1.png", trueLabel: "Cardiomegaly", desc: "Massive 'water-bottle' shaped heart typical of pericardial effusion or severe cardiomegaly." },
    { img: "/dataset/CHNCXR_0561_1.png", trueLabel: "Pneumonia", desc: "Dense opacification covering major portions of the right lobe. Complete lobar consolidation." },
    { img: "/dataset/CHNCXR_0211_0.png", trueLabel: "Effusion", desc: "Meniscus sign perfectly visible against the lateral thoracic wall." }
];

const LABELS = ["No Finding", "Atelectasis", "Cardiomegaly", "Effusion", "Infiltration", "Mass", "Nodule", "Pneumonia"];

export function TrainingMode() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [score, setScore] = useState({ correct: 0, total: 0 });
    const [guess, setGuess] = useState<string | null>(null);
    const [tutorFeedback, setTutorFeedback] = useState<string | null>(null);
    const [loadingTutor, setLoadingTutor] = useState(false);

    const activeCase = TRAINING_CASES[currentIndex];
    const isRevealed = guess !== null;
    const isCorrect = guess === activeCase.trueLabel;

    const handleGuess = async (label: string) => {
        if (isRevealed) return;
        setGuess(label);
        const correct = label === activeCase.trueLabel;
        setScore(curr => ({
            correct: curr.correct + (correct ? 1 : 0),
            total: curr.total + 1
        }));

        setLoadingTutor(true);
        setTutorFeedback(null);
        try {
            const res = await getTutorFeedback(label, activeCase.trueLabel, activeCase.desc);
            setTutorFeedback(res.feedback);
        } catch (e) {
            setTutorFeedback("Tutor is currently unavailable.");
        } finally {
            setLoadingTutor(false);
        }
    };

    const nextCase = () => {
        setGuess(null);
        setTutorFeedback(null);
        setCurrentIndex((prev) => (prev + 1) % TRAINING_CASES.length);
    };

    return (
        <div className="flex flex-col h-full relative">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Resident Training Ground</h2>
                    <p className="text-slate-500 font-medium">Test your radiologic diagnostic acumen against NIH verified cases.</p>
                </div>

                {/* Score and Controls */}
                <div className="flex flex-col sm:flex-row shadow-sm gap-4 items-center sm:items-stretch">
                    <button
                        onClick={nextCase}
                        className="bg-white px-5 rounded-2xl border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 hover:border-slate-300 transition-colors flex items-center justify-center gap-2"
                    >
                        Next Case <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-slate-200">
                        <div className="flex items-center gap-2">
                            <Award className="w-6 h-6 text-yellow-500" />
                            <div>
                                <div className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-0.5">Accuracy</div>
                                <div className="text-2xl font-black text-slate-900 leading-none">
                                    {score.total === 0 ? "0%" : `${Math.round((score.correct / score.total) * 100)}%`}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">

                {/* Image Panel */}
                <div className="bg-slate-900 rounded-3xl overflow-hidden relative border border-slate-200 shadow-sm flex items-center justify-center min-h-[500px]">
                    <AnimatePresence mode="wait">
                        <motion.img
                            key={activeCase.img}
                            src={activeCase.img}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.4 }}
                            className={`w-full h-full object-contain p-4 ${isRevealed ? "" : "grayscale"}`}
                            alt="Training Case"
                        />
                    </AnimatePresence>

                    {/* HUD Overlay */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        <div className="bg-black/60 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border border-white/20">
                            Case #{currentIndex + 1}
                        </div>
                        {isRevealed && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border flex items-center gap-1 ${isCorrect ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/50" : "bg-red-500/20 text-red-400 border-red-500/50"}`}
                            >
                                {isCorrect ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                {isCorrect ? "Correct Diagnosis" : "Misdiagnosis"}
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Interaction Panel */}
                <div className="flex flex-col gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
                            <Target className="w-5 h-5 text-indigo-500" />
                            Primary Finding
                        </h3>
                        <p className="text-sm text-slate-500 mb-6">Analyze the radiograph and select the dominant pathology.</p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {LABELS.map(lbl => (
                                <button
                                    key={lbl}
                                    onClick={() => handleGuess(lbl)}
                                    disabled={isRevealed}
                                    className={`relative p-3 rounded-xl border-2 text-sm font-bold transition-all text-left overflow-hidden ${!isRevealed
                                        ? "border-slate-100 bg-slate-50 text-slate-700 hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-sm"
                                        : guess === lbl
                                            ? isCorrect
                                                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                                                : "border-red-500 bg-red-50 text-red-700"
                                            : lbl === activeCase.trueLabel
                                                ? "border-emerald-500 border-dashed bg-emerald-50/50 text-emerald-600"
                                                : "border-slate-100 bg-white text-slate-400 opacity-50"
                                        }`}
                                >
                                    {lbl}
                                </button>
                            ))}
                        </div>
                    </div>

                    <AnimatePresence>
                        {isRevealed && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-slate-900 rounded-3xl p-6 shadow-xl relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Activity className="w-32 h-32 text-white" />
                                </div>
                                <div className="relative z-10">
                                    <span className="text-indigo-400 font-bold text-xs uppercase tracking-widest mb-1 block">Ground Truth</span>
                                    <h3 className="text-2xl font-black text-white mb-2">{activeCase.trueLabel}</h3>
                                    <p className="text-slate-300 font-medium leading-relaxed mb-6">
                                        {activeCase.desc}
                                    </p>

                                    {/* Socratic Tutor Panel */}
                                    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 mb-6 relative">
                                        <h4 className="flex items-center gap-2 text-emerald-400 font-bold mb-3 text-sm uppercase tracking-wider">
                                            <span className="text-lg">🧑‍🏫</span> Clinical Tutor Feedback
                                            <span className="text-[9px] bg-slate-700/50 px-2 py-0.5 rounded text-slate-400">Mistral 7B</span>
                                        </h4>
                                        {loadingTutor ? (
                                            <div className="flex flex-col items-center justify-center py-4">
                                                <RefreshCw className="w-5 h-5 text-slate-500 animate-spin mb-2" />
                                                <span className="text-xs text-slate-500 font-medium">Dr. Mistral is analyzing your diagnosis...</span>
                                            </div>
                                        ) : (
                                            <div className="prose prose-sm prose-invert text-slate-300 max-w-none prose-p:mb-2 prose-p:leading-relaxed">
                                                <ReactMarkdown>{tutorFeedback || ""}</ReactMarkdown>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

            </div>
        </div>
    );
}
