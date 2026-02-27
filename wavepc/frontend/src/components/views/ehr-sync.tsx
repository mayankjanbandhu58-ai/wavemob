import { useState, useEffect, useRef } from "react";
import { Link, RefreshCcw, Database, Activity, ArrowRight, Code2, Server, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MOCK_PAYLOADS = [
    `{"resourceType":"Observation","status":"final","code":{"coding":[{"system":"http://loinc.org","code":"28684-9","display":"Chest X-Ray Dx"}]},"valueString":"Pneumothorax detected with high confidence (0.94)"}`,
    `{"resourceType":"ImagingStudy","status":"available","subject":{"reference":"Patient/12345"},"numberOfSeries":1,"numberOfInstances":1,"series":[{"uid":"urn:oid:1.2.840.113619.2.1","bodySite":{"coding":[{"system":"http://snomed.info/sct","code":"80891009","display":"Chest"}]}}]}`,
    `MSH|^~\\&|WAVELENGTH_AI|RAD_DEPT|EPIC_RECV|MAIN_HOSP|202310241430||ORU^R01|MSG12345|P|2.5`,
    `PID|1||123456^^^MRN||DOE^JOHN^^^MR||19800101|M`,
    `OBR|1||||CHEST_XRAY_PA_LAT||202310241400||||||||||||||||||F`,
    `OBX|1|TX|FINDINGS^AI_ANALYSIS||AI identified 4.2cm lesion in RUL. Correlate clinically.||||||F`,
    `{"resourceType":"DiagnosticReport","status":"final","category":[{"coding":[{"system":"http://terminology.hl7.org/CodeSystem/v2-0074","code":"RAD","display":"Radiology"}]}],"code":{"coding":[{"system":"http://loinc.org","code":"36643-5","display":"Chest AP+LAT"}]}}`
];

export function EhrSync() {
    const [isSyncing, setIsSyncing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    const handleSync = () => {
        setIsSyncing(true);
        setLogs([]);

        // Simulate streaming mapping process
        let step = 0;
        const interval = setInterval(() => {
            if (step < MOCK_PAYLOADS.length) {
                setLogs(prev => [...prev, MOCK_PAYLOADS[step]]);
                step++;
            } else {
                clearInterval(interval);
                setTimeout(() => setIsSyncing(false), 1500);
            }
        }, 800);
    };

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-20">

            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 to-[#0B1528] rounded-2xl p-8 text-white relative overflow-hidden flex items-center justify-between border border-slate-700 shadow-xl">
                <div className="relative z-10 w-2/3">
                    <div className="flex items-center gap-3 mb-3 text-indigo-400">
                        <Link className="w-6 h-6" />
                        <span className="text-xs font-bold uppercase tracking-widest bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">Enterprise HL7 / FHIR Bridge</span>
                    </div>
                    <h2 className="text-3xl font-black mb-3">
                        Seamless EHR Interoperability
                    </h2>
                    <p className="text-slate-400 font-medium leading-relaxed max-w-xl text-sm">
                        Watch AI findings traverse the boundary. We map dense computer vision output directly into unstructured clinical notes and structured HL7v2 / FHIR R4 Observational data.
                    </p>
                </div>
                <div className="relative z-10 w-1/3 flex flex-col items-end">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={`px-8 py-4 rounded-xl font-extrabold text-sm shadow-xl flex items-center gap-3 transition-all duration-300 ${isSyncing ? 'bg-indigo-600/50 cursor-not-allowed scale-95' : 'bg-indigo-600 hover:bg-indigo-500 hover:scale-105 shadow-indigo-500/25 border border-indigo-400'}`}
                    >
                        {isSyncing ? (
                            <>
                                <RefreshCcw className="w-5 h-5 animate-spin" />
                                Synchronizing Data Hub...
                            </>
                        ) : (
                            <>
                                <Server className="w-5 h-5" />
                                Run Simulated Data Push
                            </>
                        )}
                    </button>
                    {isSyncing && (
                        <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-widest animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            Active Connection String
                        </div>
                    )}
                </div>

                {/* Abstract Data Rings */}
                <div className="absolute -right-20 -top-20 w-96 h-96 border-[40px] border-indigo-500/10 rounded-full blur-xl pointer-events-none" />
                <div className="absolute right-10 -bottom-10 w-64 h-64 border-[20px] border-blue-500/10 rounded-full blur-lg pointer-events-none" />
            </div>

            {/* The Animated Sync Diagram */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm p-8">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-8 relative">

                    {/* Wavelength AI Origin */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 relative">
                        <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-600 text-white rounded-xl shadow-lg flex items-center justify-center font-bold text-sm">1</div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                                <Activity className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-slate-900 text-lg">Wavelength Pipeline</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Source AI JSON</p>
                            </div>
                        </div>
                        <div className={`space-y-3 transition-opacity duration-500 ${isSyncing ? 'opacity-50' : 'opacity-100'}`}>
                            <div className="h-8 bg-white border border-slate-200 shadow-sm rounded-lg w-3/4 flex items-center px-4 font-mono text-[10px] font-bold text-slate-500">finding: &quot;Pneumothorax&quot;</div>
                            <div className="h-8 bg-white border border-slate-200 shadow-sm rounded-lg w-5/6 flex items-center px-4 font-mono text-[10px] font-bold text-slate-500">confidence: 0.942</div>
                            <div className="h-8 bg-white border border-slate-200 shadow-sm rounded-lg w-full flex items-center px-4 font-mono text-[10px] font-bold text-slate-500">location: &quot;Right Upper Lobe&quot;</div>
                        </div>
                    </div>

                    {/* The Mapping Bridge (Animated) */}
                    <div className="flex flex-col items-center justify-center space-y-4 px-4 w-32 relative">
                        {isSyncing && (
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 0.5 }}
                                className="absolute top-1/2 left-0 h-1 bg-indigo-500 z-0 opacity-50 shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                                style={{ translateY: "-50%" }}
                            />
                        )}
                        <div className={`relative z-10 p-4 rounded-xl border-2 transition-all duration-300 ${isSyncing ? 'bg-indigo-50 border-indigo-400 text-indigo-600 shadow-lg shadow-indigo-100 scale-110' : 'bg-white border-slate-200 text-slate-400'}`}>
                            <ArrowRight className={`w-8 h-8 ${isSyncing ? 'animate-pulse' : ''}`} />
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest text-center transition-colors ${isSyncing ? 'text-indigo-600' : 'text-slate-400'}`}>
                            Transformation<br />Engine
                        </p>
                    </div>

                    {/* EPIC Systems Dest */}
                    <div className="bg-[#f0f4f8] border border-[#d1e0ec] rounded-2xl p-6 relative">
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-center font-bold text-sm">2</div>
                        <div className="flex items-center gap-3 mb-4 flex-row-reverse text-right">
                            <div className="p-3 bg-white rounded-xl shadow-sm border border-[#d1e0ec]">
                                <Database className="w-6 h-6 text-[#1e3a8a]" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-[#111827] text-lg">Epic Hyperspace</h4>
                                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target FHIR R4</p>
                            </div>
                        </div>
                        <div className={`space-y-3 transition-opacity duration-500 flex flex-col items-end ${isSyncing ? 'opacity-100' : 'opacity-20'}`}>
                            <div className="h-8 bg-white border border-[#d1e0ec] shadow-sm rounded-lg w-5/6 flex items-center px-4 font-mono text-[10px] font-bold text-slate-600">Observation.valueString</div>
                            <div className="h-8 bg-white border border-[#d1e0ec] shadow-sm rounded-lg w-3/4 flex items-center px-4 font-mono text-[10px] font-bold text-slate-600">ImagingStudy.series</div>
                            <div className="h-8 bg-white border border-[#d1e0ec] shadow-sm rounded-lg w-full flex items-center px-4 font-mono text-[10px] font-bold text-slate-600">DiagnosticReport.status</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Live Terminal Output */}
            <div className="bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
                <div className="px-4 py-3 bg-[#1e293b] border-b border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Code2 className="w-4 h-4 text-emerald-400" />
                        <span className="font-mono text-xs font-bold text-slate-300">data-pipeline.log</span>
                    </div>
                    <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-400/20 border border-red-500/50" />
                        <div className="w-3 h-3 rounded-full bg-amber-400/20 border border-amber-500/50" />
                        <div className="w-3 h-3 rounded-full bg-emerald-400/20 border border-emerald-500/50" />
                    </div>
                </div>
                <div className="p-4 h-80 overflow-y-auto font-mono text-[11px] lg:text-xs leading-relaxed custom-scrollbar">
                    {logs.length === 0 && !isSyncing && (
                        <div className="h-full flex items-center justify-center text-slate-600 font-medium">
                            Awaiting sync initiation... // Hit &quot;Run Simulated Data Push&quot;
                        </div>
                    )}
                    <AnimatePresence>
                        {logs.map((log, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="mb-2"
                            >
                                <span className="text-slate-500 mr-3">[{new Date().toISOString().split('T')[1].slice(0, 12)}]</span>
                                {log.startsWith('MSH') || log.startsWith('PID') || log.startsWith('OBR') || log.startsWith('OBX') ? (
                                    <span className="text-blue-300">{log}</span>
                                ) : (
                                    <span className="text-emerald-300">{log}</span>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isSyncing && (
                        <motion.div
                            animate={{ opacity: [1, 0, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="text-slate-500 mt-2"
                        >
                            <span className="mr-3">[{new Date().toISOString().split('T')[1].slice(0, 12)}]</span>
                            Building payload mappings_
                        </motion.div>
                    )}
                    <div ref={logsEndRef} />
                </div>
                {logs.length === MOCK_PAYLOADS.length && (
                    <div className="px-4 py-2 bg-emerald-900/50 border-t border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        Successfully pushed 1 payload array (REST FHIR + HL7v2 Fallback) to target 192.168.1.55
                    </div>
                )}
            </div>
        </div>
    );
}
