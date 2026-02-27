"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Download, FileText, Loader2 } from "lucide-react";
import { downloadReportPdf } from "@/lib/api";

interface ReportDownloadProps {
    reportId: string;
}

export function ReportDownload({ reportId }: ReportDownloadProps) {
    const [downloading, setDownloading] = useState(false);

    const handleDownload = async () => {
        setDownloading(true);
        try {
            const blob = await downloadReportPdf(reportId);
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `wavelength_report_${reportId}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Download failed:", error);
        } finally {
            setDownloading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="rounded-2xl border border-[#e2e8f0] bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
        >
            <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center shadow-sm">
                    <FileText className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-[#1a1c29]">Clinical Report</h3>
                    <p className="text-xs text-slate-500 font-medium">Session ID: <span className="text-slate-700">{reportId.substring(0, 8)}...</span></p>
                </div>
            </div>

            <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDownload}
                disabled={downloading}
                className="w-full py-3 rounded-xl bg-[#1e3a8a] text-white text-sm font-bold shadow-md shadow-blue-900/10 flex items-center justify-center gap-2 hover:bg-blue-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {downloading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating PDF...
                    </>
                ) : (
                    <>
                        <Download className="w-4 h-4" />
                        Download Detailed PDF
                    </>
                )}
            </motion.button>
        </motion.div>
    );
}
