"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, ImageIcon } from "lucide-react";

interface UploadZoneProps {
    onFileSelect: (file: File) => void;
    file: File | null;
    onReset: () => void;
}

export function UploadZone({ onFileSelect, file, onReset }: UploadZoneProps) {
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile && droppedFile.type.startsWith("image/")) {
                onFileSelect(droppedFile);
            }
        },
        [onFileSelect]
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFile = e.target.files?.[0];
            if (selectedFile) {
                onFileSelect(selectedFile);
            }
        },
        [onFileSelect]
    );

    if (file) {
        return (
            <div className="relative rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center border border-blue-200">
                        <ImageIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#1a1c29] truncate">
                            {file.name}
                        </p>
                        <p className="text-xs text-slate-500 font-medium">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                    </div>
                    <button
                        onClick={onReset}
                        className="w-8 h-8 rounded-lg bg-white border border-slate-200 hover:bg-red-50 hover:border-red-200 flex items-center justify-center transition-colors shadow-sm"
                    >
                        <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            animate={{
                borderColor: isDragging
                    ? "rgba(59, 130, 246, 0.5)"
                    : "rgba(226, 232, 240, 1)", // Tailwind slate-200
                backgroundColor: isDragging
                    ? "rgba(59, 130, 246, 0.02)"
                    : "rgba(248, 250, 252, 0.5)", // Tailwind slate-50
            }}
            className="relative rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 group"
        >
            <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                id="upload-input"
            />

            <div className="flex flex-col items-center gap-3">
                <motion.div
                    animate={{
                        scale: isDragging ? 1.1 : 1,
                        y: isDragging ? -4 : 0,
                    }}
                    className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:border-blue-200 group-hover:bg-blue-100 transition-colors shadow-sm"
                >
                    <Upload className="w-6 h-6 text-blue-600" />
                </motion.div>
                <div>
                    <p className="text-sm font-bold text-[#1a1c29]">
                        {isDragging ? "Drop your X-ray here" : "Drag & drop your chest X-ray"}
                    </p>
                    <p className="text-xs text-slate-500 mt-1 font-medium">
                        or click to browse • PNG, JPEG up to 20MB
                    </p>
                </div>
            </div>
        </motion.div>
    );
}
