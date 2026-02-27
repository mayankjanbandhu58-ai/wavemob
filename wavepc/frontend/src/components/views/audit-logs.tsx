import { ShieldCheck } from "lucide-react";

export function AuditLogs() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200">
                    <ShieldCheck className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-slate-900">Compliance & Audit Trail</h2>
                    <p className="text-sm font-medium text-slate-500">Immutable system access records (HIPAA/GDPR)</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-200">
                            <th className="p-4 pl-6">Timestamp</th>
                            <th className="p-4">Actor</th>
                            <th className="p-4">Event Context</th>
                            <th className="p-4">Risk Level</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        <tr>
                            <td colSpan={4} className="p-8 text-center text-slate-500 font-medium whitespace-nowrap">
                                No audit records found.
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
