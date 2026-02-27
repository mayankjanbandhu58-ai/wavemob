import { motion } from "framer-motion";
import { Cpu, CloudRain, GitBranch } from "lucide-react";

const models: { name: string, version: string, status: string, accuracy: string, latency: string, memory: string }[] = [];

export function MLOps() {
    return (
        <div className="space-y-6">

            {/* Top Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl p-8 text-white relative overflow-hidden flex items-center justify-between">
                <div className="relative z-10 w-2/3">
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                        <Cpu className="w-7 h-7 text-emerald-400" />
                        Model Health & Telemetry
                    </h2>
                    <p className="text-slate-300 font-medium leading-relaxed">
                        Monitoring ensemble drift, inference latencies, and real-time GPU utilization across the Wavelength AI diagnostic pipeline.
                    </p>
                </div>
                <div className="relative z-10 w-1/3 flex flex-col items-end">
                    <div className="px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center gap-2 mb-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-emerald-300 text-sm font-bold tracking-wide uppercase">All Systems Nominal</span>
                    </div>
                    <p className="text-xs font-bold text-slate-400">Uptime: 99.98% / 30d</p>
                </div>

                {/* Abstract Backgrounds */}
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute right-40 -top-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Model Metrics */}
                <div className="lg:col-span-2 space-y-6">
                    {models.length === 0 && (
                        <div className="p-8 rounded-2xl border border-slate-200 bg-slate-50 text-center text-slate-500 font-medium">
                            No models currently deployed to inference pipeline.
                        </div>
                    )}
                    {models.map((model, idx) => (
                        <motion.div
                            key={model.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            className={`p-6 rounded-2xl border ${model.status === 'Active' ? 'border-emerald-200 bg-white shadow-sm' : 'border-slate-200 bg-slate-50'}`}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${model.status === 'Active' ? 'bg-emerald-50' : 'bg-slate-200'}`}>
                                        <GitBranch className={`w-5 h-5 ${model.status === 'Active' ? 'text-emerald-600' : 'text-slate-400'}`} />
                                    </div>
                                    <div>
                                        <h3 className={`text-lg font-bold ${model.status === 'Active' ? 'text-slate-900' : 'text-slate-500'}`}>{model.name}</h3>
                                        <p className="text-xs font-bold text-slate-400">Version {model.version}</p>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${model.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {model.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 mb-1">Validation AUC</p>
                                    <p className="text-xl font-black text-slate-800">{model.accuracy}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 mb-1">Avg Latency (p95)</p>
                                    <p className="text-xl font-black text-slate-800">{model.latency}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                                    <p className="text-xs font-bold text-slate-500 mb-1">VRAM Footprint</p>
                                    <p className="text-xl font-black text-slate-800">{model.memory}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Drift Alerts */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">

                    <div className="flex items-center gap-3 mb-6">
                        <CloudRain className="w-5 h-5 text-indigo-500" />
                        <h3 className="text-lg font-bold text-slate-900">Data Drift Monitors</h3>
                    </div>

                    <div className="space-y-4 relative z-10">
                        <div className="p-8 rounded-xl border border-slate-100 bg-slate-50 text-center text-sm font-medium text-slate-500">
                            No telemetry alerts raised.
                        </div>
                    </div>

                    {/* Decorative Background */}
                    <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50 rounded-full opacity-50 pointer-events-none" />

                </div>

            </div>
        </div>
    );
}
