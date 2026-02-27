"use client";

import { useState, useCallback, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle, BarChart2, ScanLine, History, Info, Waves, Clock, Zap, CheckCircle2, TrendingUp, Users, FileText } from "lucide-react";
import { UploadZone } from "@/components/upload-zone";
import { PatientForm } from "@/components/patient-form";
import { AnalysisScreen } from "@/components/analysis-screen";
import { AiReport } from "@/components/ai-report";
import { generateSimulatedReport, type PatientData, type SimulatedReport } from "@/lib/dataset";

type ViewType = "new-scan" | "history" | "analytics" | "about";
type AppState = "idle" | "preview" | "analyzing" | "results";

interface ScanRecord {
    id: string;
    timestamp: string;
    patientData: PatientData;
    report: SimulatedReport;
    preview: string;
}

const EMPTY_PATIENT: PatientData = {
    name: "", age: "", gender: "", phone: "", address: "", symptoms: "", smoking_history: "Never",
};

const NAV = [
    { id: "new-scan" as ViewType, label: "New Scan", icon: ScanLine },
    { id: "history" as ViewType, label: "History", icon: History },
    { id: "analytics" as ViewType, label: "Analytics", icon: BarChart2 },
    { id: "about" as ViewType, label: "About", icon: Info },
];

export default function Dashboard() {
    const [currentView, setCurrentView] = useState<ViewType>("new-scan");
    const [appState, setAppState] = useState<AppState>("idle");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [patient, setPatient] = useState<PatientData>({ ...EMPTY_PATIENT });
    const [report, setReport] = useState<SimulatedReport | null>(null);
    const [history, setHistory] = useState<ScanRecord[]>([]);
    const [selectedHistory, setSelectedHistory] = useState<ScanRecord | null>(null);
    const previewBlobRef = useRef<string | null>(null);

    const isFormValid = patient.name.trim() && patient.age.trim() && patient.gender;

    const handleFileSelect = useCallback((f: File) => {
        if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
        const url = URL.createObjectURL(f);
        previewBlobRef.current = url;
        setFile(f); setPreview(url); setAppState("preview");
    }, []);

    const handleAnalyze = useCallback(() => {
        if (!file || !isFormValid) return;
        setAppState("analyzing");
    }, [file, isFormValid]);

    const handleAnalysisComplete = useCallback(() => {
        if (!file || !preview) return;
        const sim = generateSimulatedReport(file.name, patient);
        setReport(sim);
        const record: ScanRecord = {
            id: sim.reportId,
            timestamp: new Date().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }),
            patientData: { ...patient },
            report: sim,
            preview,
        };
        setHistory(prev => [record, ...prev]);
        setAppState("results");
    }, [file, preview, patient]);

    const handleReset = useCallback(() => {
        setFile(null); setPreview(null); setAppState("idle"); setReport(null);
        setPatient({ ...EMPTY_PATIENT });
    }, []);

    const handleNewScan = useCallback(() => { handleReset(); setCurrentView("new-scan"); }, [handleReset]);

    const headerTitle = currentView === "new-scan" ? "New Scan" :
        currentView === "history" ? "Scan History" :
            currentView === "analytics" ? "Analytics" : "About";

    const headerSub = currentView === "new-scan" ? "AI-powered chest X-ray analysis" :
        currentView === "history" ? `${history.length} scan${history.length !== 1 ? "s" : ""} this session` :
            currentView === "analytics" ? "Session overview" : "System info";

    return (
        <div style={{ background: "#F7F7F3", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

            {/* ── Top Header ──────────────────────────────── */}
            <header style={{
                position: "sticky", top: 0, zIndex: 40,
                background: "#FFFFFF",
                borderBottom: "1px solid #E8E8E0",
                boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                paddingTop: "env(safe-area-inset-top, 0px)",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{
                            width: 36, height: 36, borderRadius: 10,
                            background: "linear-gradient(135deg,#636B2F,#7a8438)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            boxShadow: "0 2px 8px rgba(99,107,47,0.3)",
                        }}>
                            <Waves style={{ width: 18, height: 18, color: "#fff" }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.1 }}>{headerTitle}</h1>
                            <p style={{ fontSize: 11, color: "#888888", marginTop: 1 }}>{headerSub}</p>
                        </div>
                    </div>

                    {currentView === "new-scan" && appState !== "results" && (
                        <div style={{
                            display: "flex", alignItems: "center", gap: 6,
                            padding: "5px 10px", borderRadius: 99,
                            background: "#ECFDF5", border: "1px solid #A7F3D0",
                        }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", animation: "pulse 2s infinite" }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#065F46" }}>AI Ready</span>
                        </div>
                    )}
                    {currentView === "history" && history.length > 0 && (
                        <div style={{
                            padding: "4px 10px", borderRadius: 99,
                            background: "#EEF0E0", border: "1px solid #C5CC9A",
                        }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#636B2F" }}>{history.length} scans</span>
                        </div>
                    )}
                </div>

                {/* Disclaimer */}
                <div style={{ background: "#FFFBEB", borderTop: "1px solid #FDE68A", padding: "7px 20px", display: "flex", alignItems: "center", gap: 7 }}>
                    <AlertTriangle style={{ width: 12, height: 12, color: "#D97706", flexShrink: 0 }} />
                    <p style={{ fontSize: 10, color: "#92400E", fontWeight: 500 }}>
                        Clinical decision support only — findings must be verified by a qualified physician.
                    </p>
                </div>
            </header>

            {/* ── Main scrollable area ─────────────────────── */}
            <main style={{ flex: 1, overflowY: "auto", paddingBottom: "calc(70px + env(safe-area-inset-bottom, 0px))" }}>
                <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>
                    <AnimatePresence mode="wait">

                        {/* NEW SCAN */}
                        {currentView === "new-scan" && (
                            <motion.div key="new-scan" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                {(appState === "idle" || appState === "preview") && (<>
                                    <PatientForm data={patient} onChange={setPatient} disabled={false} />
                                    <UploadZone onFileSelect={handleFileSelect} file={file} preview={preview} onReset={handleReset} />
                                    {!isFormValid && appState === "idle" && (
                                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14 }}>
                                            <span style={{ fontSize: 14 }}>🔒</span>
                                            <p style={{ fontSize: 12, color: "#92400E", fontWeight: 500 }}>Fill in patient name, age and gender to unlock image upload</p>
                                        </div>
                                    )}
                                    {appState === "preview" && file && isFormValid && (
                                        <motion.button
                                            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                                            whileTap={{ scale: 0.98 }} onClick={handleAnalyze}
                                            className="btn-primary"
                                            style={{ fontSize: 16, padding: "16px 20px" }}
                                        >
                                            <Activity style={{ width: 20, height: 20 }} />
                                            Run AI Analysis
                                        </motion.button>
                                    )}
                                </>)}

                                {appState === "results" && report && preview && (
                                    <AiReport report={report} imagePreview={preview} onNewScan={handleNewScan} />
                                )}
                            </motion.div>
                        )}

                        {/* HISTORY */}
                        {currentView === "history" && (
                            <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <HistoryView history={history} onOpenScan={setSelectedHistory} />
                            </motion.div>
                        )}

                        {/* ANALYTICS */}
                        {currentView === "analytics" && (
                            <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <AnalyticsView history={history} />
                            </motion.div>
                        )}

                        {/* ABOUT */}
                        {currentView === "about" && (
                            <motion.div key="about" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                <AboutView />
                            </motion.div>
                        )}

                    </AnimatePresence>
                </div>
            </main>

            {/* ── Bottom Navigation ───────────────────────── */}
            <nav className="bottom-nav">
                {NAV.map(item => {
                    const active = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id)}
                            style={{
                                flex: 1, display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                gap: 4, padding: "10px 0 12px",
                                background: "none", border: "none", cursor: "pointer",
                                transition: "all 0.15s",
                            }}
                        >
                            <div style={{
                                width: 40, height: 28, borderRadius: 10,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: active ? "#EEF0E0" : "transparent",
                                transition: "background 0.15s",
                            }}>
                                <item.icon style={{ width: 20, height: 20, color: active ? "#636B2F" : "#AAAAAA" }} />
                            </div>
                            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? "#636B2F" : "#AAAAAA" }}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>

            {/* ── Analysis overlay ────────────────────────── */}
            <AnimatePresence>
                {appState === "analyzing" && file && preview && (
                    <AnalysisScreen imagePreview={preview} fileName={file.name} onComplete={handleAnalysisComplete} />
                )}
            </AnimatePresence>

            {/* ── History detail modal ─────────────────────── */}
            <AnimatePresence>
                {selectedHistory && (
                    <HistoryModal scan={selectedHistory} onClose={() => setSelectedHistory(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ══════════════════════════════════════════════
   HISTORY VIEW
   ══════════════════════════════════════════════ */
function HistoryView({ history, onOpenScan }: { history: ScanRecord[]; onOpenScan: (s: ScanRecord) => void }) {
    if (history.length === 0) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", background: "#FFFFFF", borderRadius: 20, border: "2px dashed #E5E5DC" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "#F5F5EF", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                    <History style={{ width: 28, height: 28, color: "#CCCCBC" }} />
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#555555", marginBottom: 6 }}>No Scans This Session</h3>
                <p style={{ fontSize: 12, color: "#999999", textAlign: "center", maxWidth: 200, lineHeight: 1.5 }}>
                    Complete a scan to see your history here.
                </p>
            </div>
        );
    }

    const riskStyle: Record<string, { color: string; bg: string; border: string }> = {
        "High Suspicion": { color: "#991B1B", bg: "#FEE2E2", border: "#FECACA" },
        "Moderate Risk": { color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
        "Low Risk": { color: "#065F46", bg: "#D1FAE5", border: "#A7F3D0" },
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {history.map((scan, i) => {
                const rs = riskStyle[scan.report.riskLevel] ?? riskStyle["Low Risk"];
                return (
                    <motion.div key={scan.id}
                        initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => onOpenScan(scan)}
                        style={{
                            display: "flex", alignItems: "center", gap: 14,
                            padding: "14px 16px", background: "#FFFFFF",
                            borderRadius: 18, border: "1px solid #E8E8E0",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                            cursor: "pointer",
                        }}
                    >
                        <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", background: "#111", border: "1px solid #E5E5DC", flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={scan.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#111111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {scan.patientData.name || "Anonymous"}
                            </p>
                            <p style={{ fontSize: 11, color: "#888888", marginTop: 2 }}>
                                {scan.timestamp} · Age {scan.patientData.age}
                            </p>
                            <p style={{ fontSize: 10, color: "#636B2F", fontFamily: "monospace", marginTop: 2 }}>{scan.id}</p>
                        </div>
                        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                                {scan.report.riskLevel.split(" ")[0]}
                            </span>
                            <span style={{ fontSize: 10, color: "#AAAAAA" }}>Tap to view →</span>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════════════════
   HISTORY MODAL
   ══════════════════════════════════════════════ */
function HistoryModal({ scan, onClose }: { scan: ScanRecord; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 env(safe-area-inset-bottom,0px)" }}
        >
            <motion.div
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ width: "100%", maxWidth: 520, background: "#FFFFFF", borderRadius: "24px 24px 0 0", maxHeight: "92dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #E8E8E0", flexShrink: 0, background: "#FFFFFF" }}>
                    <div>
                        <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}>Scan Report</h3>
                        <p style={{ fontSize: 11, color: "#888888", marginTop: 1 }}>{scan.patientData.name} · {scan.timestamp}</p>
                    </div>
                    <button onClick={onClose} style={{ padding: "6px 12px", borderRadius: 10, background: "#F5F5EF", border: "1px solid #E5E5DC", fontSize: 12, fontWeight: 600, color: "#555555", cursor: "pointer" }}>
                        Close ✕
                    </button>
                </div>
                <div style={{ overflowY: "auto", padding: 16 }}>
                    <AiReport report={scan.report} imagePreview={scan.preview} onNewScan={onClose} />
                </div>
            </motion.div>
        </motion.div>
    );
}

/* ══════════════════════════════════════════════
   ANALYTICS VIEW
   ══════════════════════════════════════════════ */
function AnalyticsView({ history }: { history: ScanRecord[] }) {
    const total = history.length;
    const high = history.filter(s => s.report.riskLevel === "High Suspicion").length;
    const mod = history.filter(s => s.report.riskLevel === "Moderate Risk").length;
    const low = history.filter(s => s.report.riskLevel === "Low Risk").length;
    const avgConf = total > 0 ? history.reduce((a, s) => a + s.report.confidenceScore, 0) / total : 0;
    const avgTime = total > 0 ? history.reduce((a, s) => a + s.report.inferenceTimeMs, 0) / total : 0;

    const diseaseMap = history.reduce((acc: Record<string, number>, s) => {
        acc[s.report.topDisease] = (acc[s.report.topDisease] || 0) + 1;
        return acc;
    }, {});
    const topDx = Object.entries(diseaseMap).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "—";

    if (total === 0) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 20px", background: "#FFFFFF", borderRadius: 20, border: "2px dashed #E5E5DC" }}>
                <BarChart2 style={{ width: 44, height: 44, color: "#DDDDDD", marginBottom: 12 }} />
                <h3 style={{ fontSize: 15, fontWeight: 700, color: "#555555", marginBottom: 6 }}>No Data Yet</h3>
                <p style={{ fontSize: 12, color: "#999999", textAlign: "center" }}>Run at least one scan to see analytics.</p>
            </div>
        );
    }

    const statCards = [
        { label: "Total Scans", value: total.toString(), color: "#636B2F", bg: "#EEF0E0", icon: Users },
        { label: "High Suspicion", value: high.toString(), color: "#DC2626", bg: "#FEE2E2", icon: AlertTriangle },
        { label: "Moderate Risk", value: mod.toString(), color: "#D97706", bg: "#FEF3C7", icon: ScanLine },
        { label: "Low Risk", value: low.toString(), color: "#059669", bg: "#D1FAE5", icon: CheckCircle2 },
        { label: "Avg Confidence", value: `${avgConf.toFixed(1)}%`, color: "#4F46E5", bg: "#EEF2FF", icon: Zap },
        { label: "Avg Inference", value: `${(avgTime / 1000).toFixed(2)}s`, color: "#0891B2", bg: "#ECFEFF", icon: Clock },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Stats 2x3 grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {statCards.map((s, i) => (
                    <motion.div key={s.label}
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        style={{ background: s.bg, border: `1px solid ${s.color}22`, borderRadius: 16, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 6 }}
                    >
                        <s.icon style={{ width: 16, height: 16, color: s.color }} />
                        <span style={{ fontSize: 20, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</span>
                        <span style={{ fontSize: 9, fontWeight: 600, color: "#777777", lineHeight: 1.3 }}>{s.label}</span>
                    </motion.div>
                ))}
            </div>

            {/* Risk distribution */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E8E8E0", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <TrendingUp style={{ width: 16, height: 16, color: "#636B2F" }} />
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: "#111111", textTransform: "uppercase", letterSpacing: "0.06em" }}>Risk Distribution</h3>
                </div>
                <div style={{ height: 12, borderRadius: 99, overflow: "hidden", display: "flex", gap: 2, marginBottom: 12 }}>
                    {high > 0 && <div style={{ flex: high, background: "#EF4444", borderRadius: 99 }} />}
                    {mod > 0 && <div style={{ flex: mod, background: "#F59E0B", borderRadius: 99 }} />}
                    {low > 0 && <div style={{ flex: low, background: "#10B981", borderRadius: 99 }} />}
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                    {[{ label: "High", color: "#EF4444", count: high }, { label: "Moderate", color: "#F59E0B", count: mod }, { label: "Low", color: "#10B981", count: low }].map(r => (
                        <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color }} />
                            <span style={{ fontSize: 11, color: "#555555", fontWeight: 600 }}>{r.label} ({r.count})</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Top finding */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                style={{ background: "#EEF0E0", borderRadius: 18, border: "1.5px solid #C5CC9A", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <p style={{ fontSize: 11, color: "#636B2F", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>Most Common Finding</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#2a3010" }}>{topDx}</p>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#636B2F", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText style={{ width: 22, height: 22, color: "#fff" }} />
                </div>
            </motion.div>

            {/* Scan log */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E8E8E0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: "14px 20px", background: "#F7F7F3", borderBottom: "1px solid #EEEEEA" }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: "#555555", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Scans</h3>
                </div>
                {history.slice(0, 6).map((scan, i) => (
                    <div key={scan.id} style={{
                        display: "flex", alignItems: "center", gap: 12, padding: "12px 20px",
                        borderBottom: i < Math.min(history.length, 6) - 1 ? "1px solid #F0F0EA" : "none"
                    }}>
                        <span style={{ fontSize: 12, color: "#CCCCBC", width: 16, fontWeight: 700 }}>{i + 1}</span>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#222222", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {scan.patientData.name || "Anonymous"}
                        </p>
                        <p style={{ fontSize: 10, color: "#888888", flexShrink: 0, maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scan.report.topDisease}</p>
                        <span style={{
                            fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 99, flexShrink: 0,
                            background: scan.report.riskLevel === "High Suspicion" ? "#FEE2E2" : scan.report.riskLevel === "Moderate Risk" ? "#FEF3C7" : "#D1FAE5",
                            color: scan.report.riskLevel === "High Suspicion" ? "#991B1B" : scan.report.riskLevel === "Moderate Risk" ? "#92400E" : "#065F46",
                        }}>
                            {scan.report.riskLevel.split(" ")[0]}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   ABOUT VIEW
   ══════════════════════════════════════════════ */
function AboutView() {
    const specs = [
        { label: "AI Model", value: "DenseNet-121 + EfficientNet-B4 Ensemble" },
        { label: "Training Data", value: "NIH ChestX-ray14 (112,120 images)" },
        { label: "Pathologies", value: "8 multi-label conditions detected" },
        { label: "Inference", value: "On-device, fully offline" },
        { label: "Uncertainty", value: "Monte Carlo Dropout (n=50)" },
        { label: "Calibration", value: "Platt Scaling applied" },
        { label: "Report Format", value: "Structured PDF + AI Narrative" },
        { label: "Version", value: "2.1.0 — Mobile Demo" },
    ];

    const features = ["Multi-label pathology detection", "Confidence scoring per finding", "Clinical + patient report modes", "Grad-CAM heatmap simulation", "Longitudinal tracking", "PDF report download", "Session analytics dashboard"];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Hero */}
            <div style={{ background: "#FFFFFF", borderRadius: 22, border: "1px solid #E8E8E0", padding: 24, textAlign: "center", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#636B2F,#7a8438)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 4px 20px rgba(99,107,47,0.3)" }}>
                    <span style={{ fontSize: 28 }}>🫁</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111111", marginBottom: 8 }}>Wavelength AI</h3>
                <p style={{ fontSize: 13, color: "#666666", lineHeight: 1.6, maxWidth: 280, margin: "0 auto" }}>
                    AI-powered multi-disease chest X-ray screening for rapid clinical decision support.
                </p>
            </div>

            {/* Features */}
            <div style={{ background: "#EEF0E0", borderRadius: 20, border: "1.5px solid #C5CC9A", padding: "18px 20px" }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: "#636B2F", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 14 }}>Key Features</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {features.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                            style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <CheckCircle2 style={{ width: 16, height: 16, color: "#636B2F", flexShrink: 0 }} />
                            <span style={{ fontSize: 13, color: "#2a3010", fontWeight: 500 }}>{f}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Tech specs */}
            <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E8E8E0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: "14px 20px", background: "#F7F7F3", borderBottom: "1px solid #EEEEEA" }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: "#555555", textTransform: "uppercase", letterSpacing: "0.06em" }}>Technical Specifications</h3>
                </div>
                {specs.map((spec, i) => (
                    <motion.div key={i}
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < specs.length - 1 ? "1px solid #F0F0EA" : "none", gap: 12 }}>
                        <span style={{ fontSize: 12, color: "#888888", flexShrink: 0 }}>{spec.label}</span>
                        <span style={{ fontSize: 12, color: "#222222", fontWeight: 600, textAlign: "right" }}>{spec.value}</span>
                    </motion.div>
                ))}
            </div>

            {/* Dataset info */}
            <div style={{ background: "#EFF6FF", borderRadius: 18, border: "1px solid #BFDBFE", padding: "16px 20px" }}>
                <h3 style={{ fontSize: 11, fontWeight: 700, color: "#1D4ED8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Dataset</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                        { k: "Images", v: "20 annotated chest X-rays" },
                        { k: "Labels", v: "High / Moderate / Low risk" },
                        { k: "Reports", v: "Pre-generated PDF for each scan" },
                        { k: "Source", v: "NIH ChestX-ray14 derived subset" },
                    ].map(row => (
                        <div key={row.k} style={{ display: "flex", justifyContent: "space-between" }}>
                            <span style={{ fontSize: 12, color: "#3B82F6" }}>{row.k}</span>
                            <span style={{ fontSize: 12, color: "#1D4ED8", fontWeight: 600 }}>{row.v}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Disclaimer */}
            <div style={{ background: "#FFFBEB", borderRadius: 16, border: "1px solid #FDE68A", padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: "#92400E", lineHeight: 1.6, textAlign: "center" }}>
                    <strong>⚠ Offline Demo.</strong> Analysis is simulated using pre-generated reports matched by filename. In production, Wavelength AI uses a Python FastAPI backend with real-time DenseNet inference.
                </p>
            </div>
        </div>
    );
}
