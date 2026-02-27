import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Check, X, AlertCircle, Eye, Filter } from "lucide-react";

// Mock pending QA cases
const qaQueue: { id: string, patient: string, date: string, aiDiagnosis: string, priority: string, status: string }[] = [];

export function QaReview() {
    const [activeFilter, setActiveFilter] = useState('All');

    const filteredQueue = qaQueue.filter(item => {
        if (activeFilter === 'Pending') return item.status === 'Flagged' || item.status === 'Uncertain';
        if (activeFilter === 'Reviewed') return item.status === 'Agreed' || item.status === 'Overridden';
        return true;
    });

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <Stethoscope className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Radiologist QA Queue</h2>
                        <p className="text-sm font-medium text-slate-500">Human-in-the-loop review for model reinforcement</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {['All', 'Pending', 'Reviewed'].map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${activeFilter === filter
                                ? 'bg-slate-900 text-white shadow-md'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                        >
                            {filter}
                        </button>
                    ))}
                    <button className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 flex items-center gap-2 shadow-sm font-bold text-sm">
                        <Filter className="w-4 h-4" />
                        Sort
                    </button>
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
                        <span className="text-xl font-black text-amber-700">0</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-amber-900">Pending Reviews</h4>
                        <p className="text-xs font-medium text-amber-700/80">Requires expert validation</p>
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-xl font-black text-emerald-700">0</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-emerald-900">Model Agreement</h4>
                        <p className="text-xs font-medium text-emerald-700/80">Last 7 days accuracy mapping</p>
                    </div>
                </div>
                <div className="p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center">
                        <span className="text-xl font-black text-rose-700">0</span>
                    </div>
                    <div>
                        <h4 className="font-bold text-rose-900">Model Overrides</h4>
                        <p className="text-xs font-medium text-rose-700/80">Flagged for retraining dataset</p>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 font-bold">
                                <th className="p-4 pl-6">Case ID</th>
                                <th className="p-4">Time</th>
                                <th className="p-4">AI Finding</th>
                                <th className="p-4">Priority</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right pr-6">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <AnimatePresence>
                                {filteredQueue.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-slate-500 font-medium">
                                            No cases currently requiring review.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredQueue.map((item, idx) => (
                                        <motion.tr
                                            key={item.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="hover:bg-blue-50/50 transition-colors group cursor-pointer"
                                        >
                                            <td className="p-4 pl-6">
                                                <p className="font-bold text-slate-900">{item.id}</p>
                                                <p className="text-xs font-medium text-slate-500">{item.patient}</p>
                                            </td>
                                            <td className="p-4 text-sm font-medium text-slate-600">{item.date}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${item.aiDiagnosis.includes('Normal') ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                                    }`}>
                                                    {item.aiDiagnosis}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center gap-1.5">
                                                    {item.priority === 'High' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                                                    <span className={`text-sm font-bold ${item.priority === 'High' ? 'text-rose-600' : item.priority === 'Medium' ? 'text-amber-600' : 'text-slate-500'
                                                        }`}>{item.priority}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                {item.status === 'Agreed' && <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-2 py-1 rounded-md">Agreed</span>}
                                                {item.status === 'Overridden' && <span className="text-rose-600 font-bold text-sm bg-rose-50 px-2 py-1 rounded-md">Overridden</span>}
                                                {item.status === 'Flagged' && <span className="text-amber-600 font-bold text-sm bg-amber-50 px-2 py-1 rounded-md">Flagged</span>}
                                                {item.status === 'Uncertain' && <span className="text-blue-600 font-bold text-sm bg-blue-50 px-2 py-1 rounded-md">Uncertain</span>}
                                            </td>
                                            <td className="p-4 pr-6 flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {item.status === 'Agreed' || item.status === 'Overridden' ? (
                                                    <button className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-600 transition-colors">
                                                        <Eye className="w-4 h-4" />
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button className="p-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-xl transition-colors font-bold flex items-center gap-1 text-xs">
                                                            <Check className="w-4 h-4" /> Approve
                                                        </button>
                                                        <button className="p-2 bg-rose-100 hover:bg-rose-200 text-rose-700 rounded-xl transition-colors font-bold flex items-center gap-1 text-xs">
                                                            <X className="w-4 h-4" /> Override
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
