"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    Upload,
    Waves,
    Trash2,
    Play,
    ArrowLeft,
    CheckCircle,
    XCircle,
    Loader2,
    FileImage,
    Shield,
    AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { batchPredict } from "@/lib/api";
import type { BatchResult } from "@/types";

export default function BatchPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [results, setResults] = useState<BatchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selected = Array.from(e.target.files || []);
        setFiles((prev) => [...prev, ...selected].slice(0, 20));
        setResults([]);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const dropped = Array.from(e.dataTransfer.files).filter((f) =>
            f.type.startsWith("image/")
        );
        setFiles((prev) => [...prev, ...dropped].slice(0, 20));
        setResults([]);
    }, []);

    const removeFile = useCallback((idx: number) => {
        setFiles((prev) => prev.filter((_, i) => i !== idx));
    }, []);

    const handleAnalyze = useCallback(async () => {
        if (files.length === 0) return;
        setLoading(true);
        setError(null);

        try {
            const response = await batchPredict(files);
            setResults(response.results);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Batch analysis failed");
        } finally {
            setLoading(false);
        }
    }, [files]);

    function getRiskBadgeStyle(level: string) {
        switch (level) {
            case "Low Risk":
                return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
            case "Moderate Risk":
                return "bg-amber-500/10 text-amber-400 border-amber-500/20";
            case "High Suspicion":
                return "bg-red-500/10 text-red-400 border-red-500/20";
            default:
                return "bg-slate-500/10 text-slate-400 border-slate-500/20";
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
            {/* Header */}
            <header className="border-b border-white/5 backdrop-blur-xl bg-slate-950/60">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Waves className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                                Batch Analysis
                            </h1>
                            <p className="text-[11px] text-slate-500 uppercase tracking-widest">
                                Multi-Image Screening
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-sm text-slate-400 hover:text-blue-400 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Dashboard
                    </Link>
                </div>
            </header>

            {/* Disclaimer */}
            <div className="bg-amber-500/5 border-b border-amber-500/10">
                <div className="max-w-5xl mx-auto px-6 py-2 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <p className="text-[11px] text-amber-400/80">
                        For clinical decision support only. All findings must be reviewed by qualified medical personnel.
                    </p>
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
                {/* Upload Area */}
                <div className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm p-6 shadow-2xl">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Upload className="w-4 h-4 text-blue-400" />
                        </div>
                        <h2 className="text-lg font-semibold text-white">Upload Images</h2>
                        <span className="text-xs text-slate-500 ml-auto">
                            {files.length}/20 images
                        </span>
                    </div>

                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleDrop}
                        className="relative rounded-xl border-2 border-dashed border-white/5 p-8 text-center hover:border-blue-500/20 transition-colors"
                    >
                        <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleFilesSelect}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <Upload className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                        <p className="text-sm text-slate-400">
                            Drop multiple X-ray images here
                        </p>
                        <p className="text-xs text-slate-600 mt-1">
                            Up to 20 images per batch
                        </p>
                    </div>

                    {/* File List */}
                    {files.length > 0 && (
                        <div className="mt-4 space-y-2">
                            {files.map((f, i) => (
                                <motion.div
                                    key={`${f.name}-${i}`}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-slate-800/50"
                                >
                                    <FileImage className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm text-slate-300 flex-1 truncate">
                                        {f.name}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {(f.size / 1024).toFixed(0)}KB
                                    </span>
                                    <button
                                        onClick={() => removeFile(i)}
                                        className="p-1 hover:bg-red-500/10 rounded transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5 text-slate-500 hover:text-red-400" />
                                    </button>
                                </motion.div>
                            ))}

                            <button
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold text-sm hover:from-blue-500 hover:to-cyan-400 transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Processing {files.length} images...
                                    </>
                                ) : (
                                    <>
                                        <Play className="w-4 h-4" />
                                        Analyze All ({files.length})
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                            {error}
                        </div>
                    )}
                </div>

                {/* Results */}
                <AnimatePresence>
                    {results.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-2xl border border-white/5 bg-slate-900/50 backdrop-blur-sm p-6 shadow-2xl"
                        >
                            <h3 className="text-lg font-semibold text-white mb-5">
                                Batch Results
                            </h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-white/5">
                                            <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">
                                                File
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">
                                                Status
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">
                                                Risk
                                            </th>
                                            <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">
                                                Top Finding
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((r, i) => {
                                            const topDisease = r.disease_probabilities
                                                ? Object.entries(r.disease_probabilities).sort(
                                                    ([, a], [, b]) => b - a
                                                )[0]
                                                : null;

                                            return (
                                                <motion.tr
                                                    key={i}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ delay: i * 0.05 }}
                                                    className="border-b border-white/5 hover:bg-white/[0.02]"
                                                >
                                                    <td className="py-3 px-4 text-slate-300 font-medium truncate max-w-[200px]">
                                                        {r.filename}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {r.success ? (
                                                            <CheckCircle className="w-4 h-4 text-emerald-400" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-red-400" />
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        {r.risk_assessment ? (
                                                            <span
                                                                className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRiskBadgeStyle(
                                                                    r.risk_assessment.risk_level
                                                                )}`}
                                                            >
                                                                {r.risk_assessment.risk_level}
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-600 text-xs">
                                                                {r.error || "N/A"}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4 text-xs text-slate-400">
                                                        {topDisease
                                                            ? `${topDisease[0]} (${(topDisease[1] * 100).toFixed(1)}%)`
                                                            : "—"}
                                                    </td>
                                                </motion.tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="border-t border-white/5 mt-16">
                <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-xs text-slate-600">
                            Clinical Decision Support Only
                        </span>
                    </div>
                    <span className="text-xs text-slate-700">Wavelength v1.0.0</span>
                </div>
            </footer>
        </div>
    );
}
