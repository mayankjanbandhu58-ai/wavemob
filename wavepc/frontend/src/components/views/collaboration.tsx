import { MessageSquare, Flag } from "lucide-react";

export function Collaboration() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100">
                    <MessageSquare className="w-6 h-6 text-indigo-700" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Tumor Board Collaboration</h2>
                    <p className="text-sm font-medium text-slate-500">Cross-departmental case discussions and second opinions</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 border border-slate-200 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col h-[600px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50">
                        <h3 className="font-bold text-slate-800 flex items-center gap-2">
                            <Flag className="w-4 h-4 text-rose-500" /> Flagged Cases
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        <div className="p-6 text-center text-slate-500 font-medium text-sm">
                            No flagged cases require discussion.
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 border border-slate-200 bg-white rounded-2xl shadow-sm h-[600px] flex flex-col overflow-hidden">
                    <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50/50">
                        <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
                        <p className="text-slate-500 font-medium">Select a case to view the discussion.</p>
                    </div>

                    <div className="p-4 border-t border-slate-100 bg-white">
                        <div className="flex items-center gap-2">
                            <input type="text" placeholder="Type your clinical assessment..." className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20" />
                            <button className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm">
                                Post
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
