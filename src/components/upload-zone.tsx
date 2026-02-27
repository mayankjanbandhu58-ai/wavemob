"use client";

import { useCallback, useRef, useState } from "react";
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
    const [isDragging, setIsDragging] = useState(false);

    const handleFile = useCallback(
        (f: File) => {
            if (f.type.startsWith("image/")) {
                onFileSelect(f);
            }
        },
        [onFileSelect]
    );

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const f = e.dataTransfer.files[0];
            if (f) handleFile(f);
        },
        [handleFile]
    );

    const handleChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
        },
        [handleFile]
    );

    /* ── If image is loaded, show preview ───────── */
    if (file && preview) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden card-elevated"
            >
                {/* Preview image */}
                <div className="relative aspect-square max-h-[320px] w-full bg-gray-50 flex items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={preview}
                        alt="X-Ray Preview"
                        className="w-full h-full object-contain"
                    />
                    {/* Scan overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 border border-olive/20 rounded-lg m-3" />
                        <div
                            className="absolute left-3 right-3 h-0.5 bg-gradient-to-r from-transparent via-olive/50 to-transparent animate-scan-line"
                        />
                    </div>
                </div>

                {/* File info bar */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 min-w-0">
                        <ImageIcon className="w-4 h-4 text-olive shrink-0" />
                        <span className="text-xs font-medium text-gray-800 truncate">
                            {file.name}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">
                            {(file.size / 1024).toFixed(0)} KB
                        </span>
                    </div>
                    <button
                        onClick={onReset}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                </div>
            </motion.div>
        );
    }

    /* ── Drop zone ──────────────────────────────── */
    return (
        <div
            onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed
        transition-all duration-300 overflow-hidden bg-white
        ${isDragging
                    ? "border-olive bg-olive/5 scale-[1.01]"
                    : "border-gray-200 hover:border-olive/40 hover:bg-gray-50"
                }
      `}
        >
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                onChange={handleChange}
                className="hidden"
            />

            <div className="flex flex-col items-center justify-center py-12 px-6">
                <motion.div
                    animate={isDragging ? { scale: 1.1, y: -4 } : { scale: 1, y: 0 }}
                    className="w-16 h-16 rounded-2xl gradient-olive flex items-center justify-center mb-4 shadow-lg"
                >
                    <Upload className="w-7 h-7 text-white" />
                </motion.div>

                <p className="text-sm font-semibold text-gray-800 mb-1">
                    {isDragging ? "Drop X-Ray here" : "Upload Chest X-Ray"}
                </p>
                <p className="text-xs text-gray-400 text-center max-w-[220px]">
                    Drag & drop or tap to select a scan from the dataset
                </p>

                <div className="flex items-center gap-1.5 mt-4 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-200">
                    <FileWarning className="w-3 h-3 text-gray-400" />
                    <span className="text-[10px] text-gray-400 font-medium">
                        PNG, JPG accepted
                    </span>
                </div>
            </div>
        </div>
    );
}
