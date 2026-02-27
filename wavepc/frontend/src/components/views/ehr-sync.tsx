import { Link, RefreshCcw, Database, ShieldCheck, Activity } from "lucide-react";

export function EhrSync() {
    return (
        <div className="space-y-6">

            <div className="bg-gradient-to-r from-blue-900 to-indigo-900 rounded-2xl p-8 text-white relative overflow-hidden flex items-center justify-between">
                <div className="relative z-10 w-2/3">
                    <h2 className="text-2xl font-black mb-2 flex items-center gap-3">
                        <Link className="w-7 h-7 text-blue-400" />
                        EHR / EMR Interoperability
                    </h2>
                    <p className="text-blue-100 font-medium leading-relaxed">
                        Configure HL7 and FHIR v4 endpoint connections to seamlessly push AI diagnostic reports to central hospital systems like Epic, Cerner, and Allscripts.
                    </p>
                </div>
                <div className="relative z-10 w-1/3 flex flex-col items-end">
                    <button className="px-5 py-2.5 bg-blue-500 hover:bg-blue-600 transition-colors rounded-xl font-bold text-sm shadow-md flex items-center gap-2">
                        <RefreshCcw className="w-4 h-4" /> Sync Now
                    </button>
                </div>

                <div className="absolute right-0 top-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <Database className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">FHIR API Configuration</h3>
                            <p className="text-xs font-medium text-slate-500">Fast Healthcare Interoperability Resources</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Endpoint URL</label>
                            <input type="text" placeholder="https://fhir.hospital-network.local/api/v4" disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1.5">Authentication Token</label>
                            <input type="password" placeholder="************************" disabled className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-500 font-mono text-sm" />
                        </div>
                        <div className="flex items-center gap-3 pt-2">
                            <div className="flex-1 px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                                <Activity className="w-5 h-5 text-slate-400" />
                                <div>
                                    <p className="text-sm font-bold text-slate-600">Disconnected</p>
                                    <p className="text-xs font-medium text-slate-500">Awaiting Endpoint Configuration</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">Data Mapping & Compliance</h3>
                            <p className="text-xs font-medium text-slate-500">Payload transmission rules</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">Auto-Push Reports</p>
                                <p className="text-xs text-slate-500 font-medium">Send directly to unassigned queue upon generation</p>
                            </div>
                            <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer shadow-inner">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">Include Confidence Scores</p>
                                <p className="text-xs text-slate-500 font-medium">Map AI probability floats to EHR text fields</p>
                            </div>
                            <div className="w-10 h-6 bg-emerald-500 rounded-full relative cursor-pointer shadow-inner">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                            <div>
                                <p className="font-bold text-slate-800 text-sm">Attach Grad-CAM Heatmaps</p>
                                <p className="text-xs text-slate-500 font-medium">Encode overlays as base64 diagnostic media</p>
                            </div>
                            <div className="w-10 h-6 bg-slate-300 rounded-full relative cursor-pointer shadow-inner">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
