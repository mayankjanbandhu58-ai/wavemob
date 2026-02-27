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
        if (!["image/png", "image/jpeg", "image/jpg"].includes(f.type)) return;
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

    /* Preview */
    if (preview && file) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-2xl overflow-hidden"
                style={{ border: "1px solid #E5E5DC", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
            >
                <div className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="X-Ray" className="w-full object-cover" style={{ maxHeight: 240 }} />

                    {/* Corner brackets */}
                    {["top-2 left-2 border-t-2 border-l-2", "top-2 right-2 border-t-2 border-r-2",
                        "bottom-2 left-2 border-b-2 border-l-2", "bottom-2 right-2 border-b-2 border-r-2"
                    ].map((cls, i) => (
                        <div key={i} className={`absolute ${cls} w-5 h-5 border-white/80 rounded-sm`} />
                    ))}

                    {/* Scan line */}
                    <div className="animate-scan-line" style={{
                        background: "linear-gradient(90deg, transparent, rgba(99,107,47,0.6), transparent)",
                        filter: "blur(1px)"
                    }} />

                    {/* Remove button */}
                    <button onClick={onReset}
                        className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/90 border border-gray-200 flex items-center justify-center shadow-sm">
                        <X className="w-4 h-4 text-gray-600" />
                    </button>
                </div>

                <div className="px-4 py-3 flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 shrink-0" style={{ color: "#636B2F" }} />
                    <span className="text-sm font-medium text-gray-700 truncate">{file.name}</span>
                    <div className="ml-auto flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs text-emerald-600 font-semibold">Ready</span>
                    </div>
                </div>
            </motion.div>
        );
    }

    /* Drop zone */
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            className="bg-white rounded-2xl p-8 flex flex-col items-center text-center cursor-pointer transition-all"
            style={{
                border: "2px dashed #C5CC9A",
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
            }}
        >
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/jpg" className="hidden" onChange={handleChange} />

            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 animate-pulse-glow"
                style={{ background: "#EEF0E0", border: "1.5px solid #C5CC9A" }}>
                <Upload className="w-7 h-7" style={{ color: "#636B2F" }} />
            </div>

            <h3 className="text-sm font-bold text-gray-800 mb-1">Upload Chest X-Ray</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-[200px] leading-relaxed">
                Tap to select a scan from your dataset folder
            </p>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                style={{ background: "#F5F5F0", border: "1px solid #E0E0D8" }}>
                <FileWarning className="w-3 h-3 text-gray-400" />
                <span className="text-[10px] text-gray-500 font-medium">PNG, JPG accepted</span>
            </div>
        </motion.div>
    );
}
