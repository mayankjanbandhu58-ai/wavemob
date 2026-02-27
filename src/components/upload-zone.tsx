"use client";

import { useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Upload, X, Image as ImageIcon } from "lucide-react";

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

    /* ── Preview state ─── */
    if (preview && file) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
                style={{ background: "#FFFFFF", borderRadius: 20, overflow: "hidden", border: "1px solid #E8E8E0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
                <div style={{ position: "relative" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="X-Ray" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />

                    {/* Gradient overlay */}
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 60%)" }} />

                    {/* Corner brackets */}
                    {[
                        { top: 12, left: 12, borderTop: "2.5px solid rgba(255,255,255,0.7)", borderLeft: "2.5px solid rgba(255,255,255,0.7)" },
                        { top: 12, right: 12, borderTop: "2.5px solid rgba(255,255,255,0.7)", borderRight: "2.5px solid rgba(255,255,255,0.7)" },
                        { bottom: 12, left: 12, borderBottom: "2.5px solid rgba(255,255,255,0.7)", borderLeft: "2.5px solid rgba(255,255,255,0.7)" },
                        { bottom: 12, right: 12, borderBottom: "2.5px solid rgba(255,255,255,0.7)", borderRight: "2.5px solid rgba(255,255,255,0.7)" },
                    ].map((s, i) => (
                        <div key={i} style={{ position: "absolute", width: 20, height: 20, borderRadius: 3, ...s }} />
                    ))}

                    {/* Scan line */}
                    <div className="animate-scan-line" style={{ background: "linear-gradient(90deg, transparent, rgba(99,107,47,0.8), transparent)" }} />

                    {/* Remove button */}
                    <button onClick={onReset} style={{ position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 10, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", backdropFilter: "blur(4px)" }}>
                        <X style={{ width: 14, height: 14, color: "#333333" }} />
                    </button>

                    {/* File info */}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                        <ImageIcon style={{ width: 14, height: 14, color: "rgba(255,255,255,0.8)", flexShrink: 0 }} />
                        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 600, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#22C55E" }} />
                            <span style={{ fontSize: 11, color: "#4ADE80", fontWeight: 700 }}>Ready</span>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 4, borderRadius: 99, background: "#EEEEEA", overflow: "hidden" }}>
                        <div style={{ width: "100%", height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#636B2F,#8A9340)" }} />
                    </div>
                    <span style={{ fontSize: 11, color: "#636B2F", fontWeight: 700 }}>Image loaded — tap Analyze</span>
                </div>
            </motion.div>
        );
    }

    /* ── Drop zone ─── */
    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onDrop={handleDrop}
            onDragOver={e => e.preventDefault()}
            onClick={() => inputRef.current?.click()}
            style={{
                background: "#FFFFFF", borderRadius: 20, border: "2px dashed #C5CC9A",
                padding: "36px 24px", display: "flex", flexDirection: "column",
                alignItems: "center", textAlign: "center", cursor: "pointer",
                transition: "all 0.2s",
            }}
        >
            <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/jpg" style={{ display: "none" }} onChange={handleChange} />

            <div style={{ width: 64, height: 64, borderRadius: 20, background: "#EEF0E0", border: "1.5px solid #C5CC9A", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Upload style={{ width: 28, height: 28, color: "#636B2F" }} />
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111111", marginBottom: 6 }}>Upload Chest X-Ray</h3>
            <p style={{ fontSize: 13, color: "#777777", lineHeight: 1.5, marginBottom: 16, maxWidth: 220 }}>
                Tap to choose a scan from your dataset folder
            </p>

            <div style={{ display: "flex", gap: 8 }}>
                {["PNG", "JPG"].map(fmt => (
                    <span key={fmt} style={{ fontSize: 11, fontWeight: 600, padding: "4px 10px", borderRadius: 99, background: "#F5F5EF", border: "1px solid #E5E5DC", color: "#666666" }}>
                        {fmt}
                    </span>
                ))}
            </div>
        </motion.div>
    );
}
