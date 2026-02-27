"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X, Image as ImageIcon, FileWarning } from "lucide-react";

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
    file: File | null;
    preview: string | null;
    onReset: () => void;
}

export function UploadZone({ onFileSelect, file, preview, onReset }: UploadZoneProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback((f: File) => {
        const ok = ["image/png", "image/jpeg", "image/jpg"].includes(f.type);
        if (!ok) return;
        onFileSelect(f);
    }, [onFileSelect]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, [handleFile]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const f = e.target.files?.[0];
        if (f) handleFile(f);
    }, [handleFile]);

    /* ── Preview state ─────────────────────────────── */
    if (preview && file) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass rounded-2xl overflow-hidden relative"
            >
                <div className="relative aspect-square max-h-64">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="X-Ray" className="w-full h-full object-cover" />

                    {/* Dark gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#070d1f]/90 via-[#070d1f]/20 to-transparent" />

                    {/* Corner scan brackets */}
                    {[
                        "top-3 left-3 border-t-2 border-l-2",
                        "top-3 right-3 border-t-2 border-r-2",
                        "bottom-3 left-3 border-b-2 border-l-2",
                        "bottom-3 right-3 border-b-2 border-r-2",
                    ].map((cls, i) => (
                        <div key={i} className={`absolute ${cls} w-5 h-5 border-blue-400/60 rounded-sm`} />
                    ))}

                    {/* File name at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-blue-300" />
                            <span className="text-xs text-white/80 font-medium truncate max-w-[180px]">{file.name}</span>
                        </div>
                        <button
                            onClick={onReset}
                            className="w-7 h-7 rounded-lg bg-white/10 backdrop-blur-sm border border-white/15 flex items-center justify-center"
                        >
                            <X className="w-3.5 h-3.5 text-white/70" />
                        </button>
                    </div>
                </div>

                <div className="px-4 py-3 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                    <span className="text-xs text-emerald-400 font-medium">X-ray loaded — ready to analyze</span>
                </div>
            </motion.div>
        );
    }

    /* ── Drop zone ─────────────────────────────────── */
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="glass rounded-2xl border border-dashed border-blue-500/20 p-8 flex flex-col items-center text-center cursor-pointer hover:bg-white/5 hover:border-blue-500/40 transition-all duration-300 group"
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg"
                className="hidden"
                onChange={handleChange}
            />

            {/* Upload icon with glow */}
            <div className="relative mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600/20 to-cyan-600/10 border border-blue-500/25 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                    <Upload className="w-7 h-7 text-blue-400" />
                </div>
                <div className="absolute inset-0 rounded-2xl bg-blue-500/10 blur-lg group-hover:bg-blue-500/20 transition-all" />
            </div>

            {/* Text */}
            <h3 className="text-sm font-bold text-white/80 mb-1">Upload Chest X-Ray</h3>
            <p className="text-xs text-white/35 mb-4 max-w-[200px] leading-relaxed">
                Tap to select a scan from your dataset
            </p>

            {/* Format badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/4 border border-white/8">
                <FileWarning className="w-3 h-3 text-white/30" />
                <span className="text-[10px] text-white/30 font-medium">PNG, JPG accepted</span>
            </div>
        </motion.div>
    );
}
