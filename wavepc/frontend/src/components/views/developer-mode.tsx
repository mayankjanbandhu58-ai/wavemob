"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ActivitySquare, Database, Cpu, Server, Hexagon, Zap, ShieldCheck, Network, UploadCloud, DownloadCloud, Play } from "lucide-react";

export function DeveloperMode() {
    // Quantization State
    const [precision, setPrecision] = useState<'FP32' | 'INT8'>('FP32');
    const [qLogs, setQLogs] = useState<string[]>([
        "[SYSTEM] Wavelength Telemetry Engine v2.1.0 Initialized",
        "[INFO] Loaded DenseNet-121 in FP32 format.",
    ]);

    // Derived metrics based on precision
    const metrics = {
        vram: precision === 'FP32' ? "4.15 GB" : "1.24 GB",
        latency: precision === 'FP32' ? "142 ms" : "48 ms",
        throughput: precision === 'FP32' ? "24 req/s" : "85 req/s",
        size: precision === 'FP32' ? "28.5 MB" : "7.2 MB",
        temp: precision === 'FP32' ? "72 °C" : "54 °C",
    };

    const addLog = (msg: string) => {
        setQLogs((prev) => {
            const next = [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]} ${msg}`];
            return next.slice(-15);
        });
    };

    const handleQuantize = (p: 'FP32' | 'INT8') => {
        if (p === precision) return;
        setPrecision(p);
        if (p === 'INT8') {
            addLog("[WARN] Initiating dynamic post-training quantization to INT8...");
            setTimeout(() => addLog("[INFO] Calibrating activations using representative dataset..."), 500);
            setTimeout(() => addLog("[INFO] Quantization complete. Memory footprint reduced by 4x."), 1500);
        } else {
            addLog("[INFO] Reloading FP32 precision weights...");
            setTimeout(() => addLog("[DEBUG] Allocated 4.15GB VRAM for full-precision model."), 500);
        }
    };

    // Federated Learning State
    const [flStatus, setFlStatus] = useState<'IDLE' | 'TRAINING' | 'AGGREGATING' | 'COMPLETE'>('IDLE');
    const [globalEpoch, setGlobalEpoch] = useState(12);
    const [nodes, setNodes] = useState([
        { id: "Node A (NY)", data: 1450, status: "Idle", progress: 0 },
        { id: "Node B (LN)", data: 820, status: "Idle", progress: 0 },
        { id: "Node C (TK)", data: 2100, status: "Idle", progress: 0 },
    ]);

    const runFLRound = () => {
        if (flStatus !== 'IDLE' && flStatus !== 'COMPLETE') return;
        setFlStatus('TRAINING');
        addLog(`[FL-SERVER] Commencing Global Epoch ${globalEpoch + 1}`);
        addLog("[FL-SERVER] Simulating Edge Secure Aggregation (SecAgg). Distributing global weights...");

        // Simulate training on nodes
        setNodes(n => n.map(x => ({ ...x, status: "Training (Local Data)", progress: 0 })));

        let p = 0;
        const interval = setInterval(() => {
            p += Math.random() * 15 + 10;
            if (p >= 100) {
                p = 100;
                clearInterval(interval);
                setNodes(n => n.map(x => ({ ...x, status: "Computing Gradient Delta...", progress: 100 })));
                setTimeout(() => {
                    setFlStatus('AGGREGATING');
                    addLog("[FL-SERVER] Receiving gradient updates (no raw data transferred)...");
                    setNodes(n => n.map(x => ({ ...x, status: "Uploading Encrypted Delta", progress: 100 })));

                    setTimeout(() => {
                        setGlobalEpoch(e => e + 1);
                        setFlStatus('COMPLETE');
                        addLog(`[FL-SERVER] Global Epoch ${globalEpoch + 1} finalized via Federated Averaging (FedAvg).`);
                        setNodes(n => n.map(x => ({ ...x, status: "Idle, awaiting next round.", progress: 0 })));
                    }, 2000);
                }, 1000);
            } else {
                setNodes(n => n.map(x => ({ ...x, progress: p })));
            }
        }, 300);
    };


    return (
        <div className="h-full flex flex-col space-y-8 bg-slate-50 p-6 rounded-2xl overflow-y-auto custom-scrollbar">

            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3">
                        <TerminalWindowIcon /> Developer Sandbox
                    </h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">Interactive simulations for Edge Deployment & Privacy-Preserving AI</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">

                {/* Quantization Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="relative z-10 flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Cpu className="w-5 h-5 text-indigo-600" />
                            <h3 className="font-bold text-slate-800 text-lg">Edge AI Quantization</h3>
                        </div>
                        <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                            <button
                                onClick={() => handleQuantize('FP32')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${precision === 'FP32' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                FP32 (Cloud)
                            </button>
                            <button
                                onClick={() => handleQuantize('INT8')}
                                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${precision === 'INT8' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                INT8 (Edge)
                            </button>
                        </div>
                    </div>

                    <p className="text-sm text-slate-600 mb-6 font-medium">
                        Simulate compiling the PyTorch model for edge devices using Post-Training Quantization. INT8 dramatically reduces footprint for low-power hospital systems.
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <MetricCard label="VRAM Usage" value={metrics.vram} icon={Database} color="indigo" />
                        <MetricCard label="Inference Latency" value={metrics.latency} icon={Zap} color="amber" />
                        <MetricCard label="Throughput" value={metrics.throughput} icon={ActivitySquare} color="emerald" />
                        <MetricCard label="Network Size" value={metrics.size} icon={Hexagon} color="rose" />
                    </div>
                </div>

                {/* Federated Learning Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative flex flex-col">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-10 -mt-10" />

                    <div className="relative z-10 flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <Network className="w-5 h-5 text-emerald-600" />
                            <h3 className="font-bold text-slate-800 text-lg">Federated Learning Sim</h3>
                        </div>
                        <button
                            onClick={runFLRound}
                            disabled={flStatus === 'TRAINING' || flStatus === 'AGGREGATING'}
                            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
                        >
                            <Play className="w-3 h-3" fill="currentColor" />
                            {flStatus === 'IDLE' || flStatus === 'COMPLETE' ? "Run Global Epoch" : "Running..."}
                        </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-between relative z-10">

                        {/* Central Server */}
                        <div className="flex flex-col items-center mb-6">
                            <div className={`p-4 rounded-2xl border-2 transition-colors ${flStatus === 'AGGREGATING' ? 'border-emerald-500 bg-emerald-50 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-slate-200 bg-white'}`}>
                                <Server className={`w-8 h-8 ${flStatus === 'AGGREGATING' ? 'text-emerald-600 animate-pulse' : 'text-slate-400'}`} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 mt-2 uppercase tracking-widest">Global SecAgg Server</span>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 mt-1 font-mono">Epoch: {globalEpoch}</span>
                        </div>

                        {/* Connection Lines & Cloud */}
                        <div className="relative h-12 flex justify-center w-full">
                            {flStatus === 'TRAINING' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex justify-center items-center text-emerald-500">
                                    <DownloadCloud className="w-6 h-6 animate-bounce" />
                                </motion.div>
                            )}
                            {flStatus === 'AGGREGATING' && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex justify-center items-center text-rose-500">
                                    <UploadCloud className="w-6 h-6 animate-bounce" />
                                </motion.div>
                            )}
                        </div>

                        {/* Nodes */}
                        <div className="grid grid-cols-3 gap-4">
                            {nodes.map((node, i) => (
                                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center relative overflow-hidden">
                                    {/* Progress Bar Background */}
                                    <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 transition-all duration-300" style={{ width: `${node.progress}%` }} />

                                    <ShieldCheck className="w-5 h-5 text-slate-400 mx-auto mb-2" />
                                    <h4 className="text-xs font-bold text-slate-700">{node.id}</h4>
                                    <p className="text-[10px] text-slate-500 mb-1">{node.data} Scans (Private)</p>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${node.progress > 0 && node.progress < 100 ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {node.status}
                                    </span>
                                </div>
                            ))}
                        </div>

                    </div>
                </div>

            </div>

            {/* Terminal Window */}
            <div className="bg-[#0f172a] rounded-xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden h-64 shrink-0">
                <div className="h-8 border-b border-slate-800 bg-[#020617] flex items-center px-4 justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 ml-4 font-bold flex items-center gap-2 uppercase tracking-widest">
                            Server Logs
                        </span>
                    </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto custom-scrollbar font-mono text-xs flex flex-col justify-end">
                    <div className="space-y-1">
                        {qLogs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`
                                    ${log.includes('[ERROR]') ? 'text-rose-400' :
                                        log.includes('[WARN]') ? 'text-amber-400' :
                                            log.includes('[DEBUG]') ? 'text-slate-500' :
                                                log.includes('[FL-SERVER]') ? 'text-emerald-400 font-bold' :
                                                    log.includes('[SYSTEM]') ? 'text-cyan-400 font-bold' :
                                                        'text-indigo-300'
                                    } leading-relaxed
                                `}
                            >
                                <span className="opacity-50 text-slate-600 mr-2">root@node:~#</span>
                                {log}
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
}

function TerminalWindowIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-600">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
        </svg>
    )
}

function MetricCard({ label, value, icon: Icon, color }: { label: string, value: string, icon: React.ElementType, color: 'indigo' | 'amber' | 'emerald' | 'rose' }) {

    const colorClasses = {
        indigo: 'text-indigo-600 bg-indigo-50 border-indigo-100',
        amber: 'text-amber-600 bg-amber-50 border-amber-100',
        emerald: 'text-emerald-600 bg-emerald-50 border-emerald-100',
        rose: 'text-rose-600 bg-rose-50 border-rose-100',
    };

    return (
        <div className={`p-4 rounded-xl border ${colorClasses[color]} transition-all duration-500`}>
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-4 h-4 ${colorClasses[color].split(' ')[0]}`} />
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{label}</span>
            </div>
            <motion.div
                key={value}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl font-extrabold font-mono"
            >
                {value}
            </motion.div>
        </div>
    );
}

