"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
    ActivitySquare,
    AlertOctagon,
    ArrowRight,
    CheckCircle,
    Clock,
    RefreshCw,
    ShieldAlert,
    Zap
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { JustificationModal } from "@/components/results/justification-modal";
import type { Justification } from "@/types";

// Real data for Triage Queue
const triageQueue = [
    { id: "PT-00001", hash: "00000001_000.png", age: 58, gender: "M", condition: "Cardiomegaly", score: 92.4, waitTime: "12m", viewPosition: "PA" },
    { id: "PT-00003", hash: "00000003_003.png", age: 76, gender: "F", condition: "Infiltration", score: 88.5, waitTime: "24m", viewPosition: "PA" },
    { id: "PT-00004", hash: "00000004_000.png", age: 82, gender: "M", condition: "Mass", score: 81.2, waitTime: "45m", viewPosition: "AP" },
    { id: "PT-00008", hash: "00000008_002.png", age: 73, gender: "F", condition: "Nodule", score: 79.9, waitTime: "1h 12m", viewPosition: "PA" },
    { id: "PT-00009", hash: "00000009_000.png", age: 73, gender: "M", condition: "Emphysema", score: 71.5, waitTime: "1h 45m", viewPosition: "PA" }
];

const pathologyExplanations: Record<string, Justification> = {
    "Cardiomegaly": {
        primary_evidence: "Enlarged cardiac silhouette with cardiothoracic ratio > 0.50 on PA projection.",
        dataset_origin: "NIH Chest X-ray Dataset v2.0",
        confidence_interval: "[90.1%, 94.7%]",
        threshold_calibration: "Standard operating point (Youden's Index)",
        reference_images: [
            { url: "/dataset/CHNCXR_0025_0.png", caption: "Verified Case #34912 (Severe cardiomegaly, CTR 0.62)" },
            { url: "/dataset/CHNCXR_0036_0.png", caption: "Verified Case #88102 (Moderate cardiomegaly)" }
        ]
    },
    "Infiltration": {
        primary_evidence: "Ill-defined opacities observed predominantly in lower lung zones, suggesting alveolar or interstitial fluid accumulation.",
        dataset_origin: "NIH Chest X-ray Dataset v2.0",
        confidence_interval: "[86.2%, 91.5%]",
        threshold_calibration: "F1-Optimized Threshold (0.42)",
        reference_images: [
            { url: "/dataset/CHNCXR_0037_0.png", caption: "Verified Case #44199 (Bibasilar infiltration)" },
            { url: "/dataset/CHNCXR_0038_0.png", caption: "Verified Case #11029 (Right lower lobe opacities)" }
        ]
    },
    "Mass": {
        primary_evidence: "Well-demarcated dense pulmonary nodule > 3cm in diameter, requiring immediate cross-sectional follow-up.",
        dataset_origin: "NIH Chest X-ray Dataset v2.0",
        confidence_interval: "[78.0%, 84.4%]",
        threshold_calibration: "High Sensitivity (0.35)",
        reference_images: [
            { url: "/dataset/CHNCXR_0039_0.png", caption: "Verified Case #90012 (6cm Left Upper Lobe Mass)" },
            { url: "/dataset/CHNCXR_0040_0.png", caption: "Verified Case #22100 (Right paratracheal mass)" }
        ]
    },
    "Nodule": {
        primary_evidence: "Discrete rounded opacity < 3cm; potential granuloma or early neoplastic process.",
        dataset_origin: "NIH Chest X-ray Dataset v2.0",
        confidence_interval: "[76.5%, 83.3%]",
        threshold_calibration: "Balanced Precision/Recall (0.48)",
        reference_images: [
            { url: "/dataset/CHNCXR_0065_0.png", caption: "Verified Case #15502 (1.2cm nodule RUL)" },
            { url: "/dataset/CHNCXR_0181_0.png", caption: "Verified Case #38810 (2.5cm calcified nodule)" }
        ]
    },
    "Other": {
        primary_evidence: "Aggregated minor findings including isolated nodules, mild fibrosis, or pleural thickening.",
        dataset_origin: "NIH Chest X-ray Dataset v2.0",
        confidence_interval: "[81.0%, 86.5%]",
        threshold_calibration: "Multi-class aggregate boundary",
        reference_images: [
            { url: "/dataset/CHNCXR_0182_0.png", caption: "Verified Case #55121 (Apical scarring)" }
        ]
    }
};

// Mock data for Actionability Trend
const actionabilityTrend = [
    { name: "Mon", score: 78 },
    { name: "Tue", score: 82 },
    { name: "Wed", score: 75 },
    { name: "Thu", score: 85 },
    { name: "Fri", score: 89 },
    { name: "Sat", score: 72 },
    { name: "Sun", score: 76 }
];

const ScoreCard = ({ title, value, subtitle, icon: Icon, color, bgClass }: { title: string, value: string, subtitle: string, icon: React.ElementType, color: string, bgClass: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
    >
        <div className="flex justify-between items-start mb-4">
            <div>
                <h3 className="text-slate-500 font-semibold mb-1">{title}</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900">{value}</span>
                    <span className="text-sm font-medium text-slate-500">{subtitle}</span>
                </div>
            </div>
            <div className={`p-3 rounded-xl ${bgClass}`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
    </motion.div>
);

export function Scoring() {
    const [selectedJustification, setSelectedJustification] = useState<{
        disease: string;
        probability: number;
        justification: Justification;
    } | null>(null);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ScoreCard
                    title="Avg Triage Score"
                    value="64.2"
                    subtitle="/ 100"
                    icon={ActivitySquare}
                    color="text-blue-600"
                    bgClass="bg-blue-50"
                />
                <ScoreCard
                    title="Actionability Index"
                    value="81%"
                    subtitle="Highly Actionable"
                    icon={Zap}
                    color="text-amber-500"
                    bgClass="bg-amber-50"
                />
                <ScoreCard
                    title="30-Day Readmission Risk"
                    value="14.5%"
                    subtitle="-2.1% this week"
                    icon={ShieldAlert}
                    color="text-red-500"
                    bgClass="bg-red-50"
                />
                <ScoreCard
                    title="Image QA Failure Rate"
                    value="3.2%"
                    subtitle="Requires Rescan"
                    icon={AlertOctagon}
                    color="text-slate-600"
                    bgClass="bg-slate-100"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Triage Queue */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                >
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div>
                            <h2 className="text-lg font-bold text-slate-900">Live Triage Queue</h2>
                            <p className="text-sm text-slate-500 font-medium">Auto-prioritized by AI severity scores</p>
                        </div>
                        <button className="text-sm text-blue-600 font-bold flex items-center gap-1 hover:text-blue-700">
                            Refresh <RefreshCw className="w-4 h-4 ml-1" />
                        </button>
                    </div>
                    <div className="p-6 flex-1">
                        <div className="space-y-4">
                            {triageQueue.map((patient) => (
                                <div key={patient.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all bg-white group cursor-pointer">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg
                                            ${patient.score >= 90 ? 'bg-red-100 text-red-600' :
                                                patient.score >= 70 ? 'bg-orange-100 text-orange-600' :
                                                    patient.score >= 40 ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600'}`}>
                                            {patient.score}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-slate-900">{patient.id}</h3>
                                                {patient.score >= 85 && <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full"><Clock className="w-3 h-3" /> {patient.waitTime}</span>}
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium">{patient.age} yrs • {patient.condition}</p>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <button
                                            onClick={() => setSelectedJustification({
                                                disease: patient.condition,
                                                probability: patient.score,
                                                justification: pathologyExplanations[patient.condition] || pathologyExplanations["Other"]
                                            })}
                                            className="text-sm font-bold text-slate-400 group-hover:text-blue-500 transition-colors cursor-pointer"
                                        >
                                            View Case <ArrowRight className="w-4 h-4 inline ml-1" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Right Column */}
                <div className="space-y-6 flex flex-col">
                    {/* Clinical Actionability */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1"
                    >
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Clinical Actionability Score</h2>
                        <p className="text-sm text-slate-500 font-medium mb-6">Likelihood of immediate treatment change</p>

                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={actionabilityTrend}>
                                    <defs>
                                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                    <YAxis hide domain={['dataMin - 10', 'dataMax + 10']} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="score" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Image QA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex-1 flex flex-col"
                    >
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Image QA Model</h2>
                        <p className="text-sm text-slate-500 font-medium mb-6">Pre-diagnostic quality gating</p>

                        <div className="space-y-4 flex-1">
                            <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                                <span className="text-sm font-bold text-emerald-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> A-Grade (Optimal)</span>
                                <span className="font-black text-emerald-600">82.4%</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-blue-50 border border-blue-100">
                                <span className="text-sm font-bold text-blue-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> B-Grade (Acceptable)</span>
                                <span className="font-black text-blue-600">14.1%</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-orange-50 border border-orange-100">
                                <span className="text-sm font-bold text-orange-800 flex items-center gap-2"><AlertOctagon className="w-4 h-4" /> C-Grade (Suboptimal)</span>
                                <span className="font-black text-orange-600">2.3%</span>
                            </div>
                            <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <span className="text-sm font-bold text-slate-700 flex items-center gap-2"><AlertOctagon className="w-4 h-4" /> F-Grade (Auto-Rejected)</span>
                                <span className="font-black text-slate-600">1.2%</span>
                            </div>
                        </div>
                    </motion.div>
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
