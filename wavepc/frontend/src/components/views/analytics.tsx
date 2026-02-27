import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { TrendingUp, Users, Activity, ScanLine, AlertCircle, BrainCircuit, Clock, Info, Filter } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { JustificationModal } from "@/components/results/justification-modal";
import type { Justification } from "@/types";
import { getDemographics } from "@/lib/api";

const volumeData = [
    { name: "Mon", scans: 4000, abnormal: 800 },
    { name: "Tue", scans: 4500, abnormal: 950 },
    { name: "Wed", scans: 4200, abnormal: 850 },
    { name: "Thu", scans: 4800, abnormal: 1000 },
    { name: "Fri", scans: 5100, abnormal: 1100 },
    { name: "Sat", scans: 4900, abnormal: 980 },
    { name: "Sun", scans: 4300, abnormal: 870 },
];

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6", "#64748b"];

const pathologyExplanations: Record<string, Justification> = {
    "No Finding": {
        primary_evidence: "No definitive radiologic evidence of acute cardiopulmonary abnormalities.",
        dataset_origin: "NIH Chest X-ray Dataset v2.0",
        confidence_interval: "[93.5%, 96.2%]",
        threshold_calibration: "Standard operating point (Youden's Index)",
        reference_images: [
            { url: "/dataset/CHNCXR_0187_0.png", caption: "Verified Case #00221 (Clear lungs, normal cardiac size)" },
            { url: "/dataset/CHNCXR_0188_0.png", caption: "Verified Case #00812 (No acute pulmonary disease)" }
        ]
    },
    "Infiltration": {
        primary_evidence: "Ill-defined opacities observed predominantly in lower lung zones, suggesting alveolar or interstitial fluid accumulation.",
        dataset_origin: "NIH Chest X-ray Dataset v2.0",
        confidence_interval: "[88.1%, 91.5%]",
        threshold_calibration: "F1-Optimized Threshold (0.42)",
        reference_images: [
            { url: "/dataset/CHNCXR_0189_0.png", caption: "Verified Case #44199 (Bibasilar infiltration)" },
            { url: "/dataset/CHNCXR_0190_0.png", caption: "Verified Case #11029 (Right lower lobe opacities)" }
        ]
    },
    "Effusion": {
        primary_evidence: "Blunting of the costophrenic angles and characteristic meniscus sign indicating pleural fluid collection.",
        dataset_origin: "NIH Chest X-ray Dataset v2.0",
        confidence_interval: "[89.4%, 93.8%]",
        threshold_calibration: "High Specificity (0.65)",
        reference_images: [
            { url: "/dataset/CHNCXR_0191_0.png", caption: "Verified Case #77102 (Large right pleural effusion)" },
            { url: "/dataset/CHNCXR_0192_0.png", caption: "Verified Case #99211 (Bilateral small effusions)" }
        ]
    },
    "Atelectasis": {
        primary_evidence: "Volume loss with ipsilateral mediastinal shift and localized increased opacity.",
        dataset_origin: "NIH Chest X-ray Dataset v2.0",
        confidence_interval: "[84.2%, 87.9%]",
        threshold_calibration: "Balanced Precision/Recall (0.48)",
        reference_images: [
            { url: "/dataset/CHNCXR_0193_0.png", caption: "Verified Case #50122 (Right upper lobe atelectasis)" },
            { url: "/dataset/CHNCXR_0194_0.png", caption: "Verified Case #28811 (Left base subsegmental atelectasis)" }
        ]
    },
    "Other": {
        primary_evidence: "Aggregated minor findings including isolated nodules, mild fibrosis, or pleural thickening.",
        dataset_origin: "NIH Chest X-ray Dataset v2.0",
        confidence_interval: "[81.0%, 86.5%]",
        threshold_calibration: "Multi-class aggregate boundary",
        reference_images: [
            { url: "/dataset/CHNCXR_0195_0.png", caption: "Verified Case #55121 (Apical scarring)" }
        ]
    }
};

const StatCard = ({ title, value, trend, icon: Icon, colorClass, subtitle }: { title: string, value: string, trend?: string, icon?: React.ElementType, colorClass?: string, subtitle?: string }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm"
    >
        <div className="flex items-center justify-between mb-4">
            {Icon && (
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass || 'bg-slate-50 text-slate-600'}`}>
                    <Icon className="w-6 h-6" />
                </div>
            )}
            {trend && (
                <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-sm font-bold">
                    <TrendingUp className="w-4 h-4" />
                    {trend}
                </div>
            )}
        </div>
        <h3 className="text-slate-500 text-sm font-bold tracking-wide uppercase mb-1">{title}</h3>
        <p className="text-3xl font-black text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </motion.div>
);

export function Analytics() {
    const [selectedJustification, setSelectedJustification] = useState<{
        disease: string;
        probability: number;
        justification: Justification;
    } | null>(null);

    const [demographics, setDemographics] = useState<{ pathology_distribution: { name: string, percentage: number, value: number }[], total_cases: number } | null>(null);
    const [ageFilter, setAgeFilter] = useState("all");
    const [genderFilter, setGenderFilter] = useState("all");
    const [loadingParams, setLoadingParams] = useState(true);

    useEffect(() => {
        async function fetchDemo() {
            setLoadingParams(true);
            try {
                const data = await getDemographics(ageFilter, genderFilter);
                setDemographics(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingParams(false);
            }
        }
        fetchDemo();
    }, [ageFilter, genderFilter]);

    // Prepare pie chart data
    const pieData = demographics?.pathology_distribution?.map((item: { name: string, percentage: number, value: number }, idx: number) => ({
        name: item.name,
        value: item.percentage,
        count: item.value,
        fill: COLORS[idx % COLORS.length]
    })) || [];

    const totalCases = demographics?.total_cases?.toLocaleString() || "0";

    return (
        <div className="space-y-6">

            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Scans (7d)" value="31,800" trend="12%" icon={ScanLine} colorClass="bg-blue-50 text-blue-600" />
                <StatCard title="High Risk Detected" value="6,750" trend="8%" icon={AlertCircle} colorClass="bg-red-50 text-red-600" />
                <StatCard title="Avg Processing Time" value="3.2s" trend="0.5s" icon={Activity} colorClass="bg-emerald-50 text-emerald-600" />
                <StatCard title="Active Radiologists" value="12" trend="2 New" icon={Users} colorClass="bg-indigo-50 text-indigo-600" />
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={Activity}
                    title="Total Scans Validated"
                    value={totalCases}
                    subtitle="Matched to active filters"
                />
                <StatCard
                    icon={Users}
                    title="Unique Patients"
                    value="112,120"
                    subtitle="In full NIH dataset"
                />
                <StatCard
                    icon={BrainCircuit}
                    title="Model Accuracy"
                    value="94.6%"
                    subtitle="On validation set"
                />
                <StatCard
                    icon={Clock}
                    title="Image Modality"
                    value="100%"
                    subtitle="PA/AP Chest X-Ray"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900">Scan Volume & Detection Rates</h3>
                            <p className="text-sm text-slate-500">Weekly operational throughput</p>
                        </div>
                        <select className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 rounded-lg px-3 py-2 outline-none">
                            <option>Last 7 Days</option>
                            <option>This Month</option>
                        </select>
                    </div>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={volumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorScans" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorAbnormal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Area type="monotone" dataKey="scans" name="Total Scans" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorScans)" />
                                <Area type="monotone" dataKey="abnormal" name="Anomalies Found" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorAbnormal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                {/* Pathology Config */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col"
                >
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 border-b-2 border-emerald-500 pb-1 inline-block">Demographic Risk</h3>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1"><Filter className="w-3 h-3" /> Filtered from NIH Dataset</p>
                        </div>
                        <div className="flex gap-2">
                            <select
                                value={ageFilter}
                                onChange={(e) => setAgeFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 rounded-lg px-2 py-1.5 outline-none"
                            >
                                <option value="all">All Ages</option>
                                <option value="0-20">0-20 Yrs</option>
                                <option value="20-40">20-40 Yrs</option>
                                <option value="40-60">40-60 Yrs</option>
                                <option value="60+">60+ Yrs</option>
                            </select>
                            <select
                                value={genderFilter}
                                onChange={(e) => setGenderFilter(e.target.value)}
                                className="bg-slate-50 border border-slate-200 text-sm font-bold text-slate-700 rounded-lg px-2 py-1.5 outline-none"
                            >
                                <option value="all">All Genders</option>
                                <option value="M">Male</option>
                                <option value="F">Female</option>
                            </select>
                        </div>
                    </div>

                    <div className={`transition-opacity duration-300 ${loadingParams ? 'opacity-50' : 'opacity-100'} flex-1`}>
                        {pieData.length > 0 ? (
                            <>
                                <div className="h-48 relative mb-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {pieData.map((entry: { name: string, value: number, fill: string }, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val) => `${val}%`} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px', fontWeight: 'bold' }} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="text-center">
                                            <span className="block text-2xl font-bold text-slate-800">{pieData[0]?.value}%</span>
                                            <span className="block text-xs font-bold text-slate-500 uppercase tracking-wider">{pieData[0]?.name}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-wrap justify-center items-center gap-2 mt-4 max-h-32 overflow-y-auto pr-1 hide-scrollbar">
                                    {pieData.map((entry: { name: string, value: number, fill: string }, index: number) => (
                                        <div key={index} className="flex items-center justify-between w-[48%] bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                                                <span className="text-xs font-bold text-slate-700 truncate max-w-[80px]" title={entry.name}>{entry.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-black text-slate-900">{entry.value}%</span>
                                                <button
                                                    onClick={() => setSelectedJustification({
                                                        disease: entry.name,
                                                        probability: entry.value,
                                                        justification: pathologyExplanations[entry.name] || pathologyExplanations["Other"]
                                                    })}
                                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-100/50 rounded transition-colors"
                                                    title={`View AI justification for ${entry.name}`}
                                                >
                                                    <Info className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <Activity className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm font-medium">No records match criteria</p>
                            </div>
                        )}
                    </div>

                </motion.div>

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
