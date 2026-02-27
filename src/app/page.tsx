"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, AlertTriangle, BarChart2, ScanLine, History, Info, Waves, Clock, Zap, CheckCircle2, TrendingUp, Users, FileText, ChevronRight } from "lucide-react";
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

/* ── Count-up hook ─────────────────────────── */
function useCountUp(target: number, duration = 800) {
    const [count, setCount] = useState(0);
    useEffect(() => {
        if (target === 0) { setCount(0); return; }
        let start = 0;
        const step = target / (duration / 16);
        const t = setInterval(() => {
            start += step;
            if (start >= target) { setCount(target); clearInterval(t); } else { setCount(Math.floor(start)); }
        }, 16);
        return () => clearInterval(t);
    }, [target, duration]);
    return count;
}

/* ── Skeleton card ─────────────────────────── */
function SkeletonCard() {
    return (
        <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E8E8E0", padding: 20 }} className="spring-in">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                    <div className="skeleton-text" style={{ width: "60%", marginBottom: 8 }} />
                    <div className="skeleton-text" style={{ width: "40%", height: 10 }} />
                </div>
            </div>
            <div className="skeleton-text" style={{ marginBottom: 10 }} />
            <div className="skeleton-text" style={{ width: "80%", marginBottom: 10 }} />
            <div className="skeleton-text" style={{ width: "60%" }} />
        </div>
    );
}

export default function Dashboard() {
    const [currentView, setCurrentView] = useState<ViewType>("new-scan");
    const [appState, setAppState] = useState<AppState>("idle");
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [patient, setPatient] = useState<PatientData>({ ...EMPTY_PATIENT });
    const [report, setReport] = useState<SimulatedReport | null>(null);
    const [history, setHistory] = useState<ScanRecord[]>([]);
    const [selectedHistory, setSelectedHistory] = useState<ScanRecord | null>(null);
    const [viewLoading, setViewLoading] = useState(false);
    const previewBlobRef = useRef<string | null>(null);

    const isFormValid = patient.name.trim() && patient.age.trim() && patient.gender;

    /* step: 1 = form, 2 = upload, 3 = result */
    const currentStep = appState === "results" ? 3 : appState === "preview" ? 2 : 1;

    const handleFileSelect = useCallback((f: File) => {
        // Don't revoke old blob URLs — they may be in use by history records
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

        // Guaranteed to work on all platforms WITHOUT CORS issues:
        // Use an Image object to load the local blob URL, draw it to a canvas,
        // and extract it explicitly as "image/jpeg". FileReader can sometimes
        // return "application/octet-stream" on Android which breaks jsPDF and <img>.
        const img = new Image();
        img.onload = () => {
            // Cap size to prevent massive base64 strings crashing the WebView state
            const MAX_DIM = 1200;
            let w = img.naturalWidth;
            let h = img.naturalHeight;
            if (w > MAX_DIM || h > MAX_DIM) {
                const ratio = Math.min(MAX_DIM / w, MAX_DIM / h);
                w = Math.round(w * ratio);
                h = Math.round(h * ratio);
            }

            const canvas = document.createElement("canvas");
            canvas.width = w;
            canvas.height = h;
            const ctx = canvas.getContext("2d");
            if (ctx) ctx.drawImage(img, 0, 0, w, h);

            // Force valid JPEG data URL
            const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

            const sim = generateSimulatedReport(file.name, patient);
            setReport(sim);

            const record: ScanRecord = {
                id: sim.reportId,
                timestamp: new Date().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }),
                patientData: { ...patient },
                report: sim,
                preview: dataUrl,
            };
            setHistory(prev => [record, ...prev]);

            // Unify all references to the guaranteed valid Data URL
            setPreview(dataUrl);
            setAppState("results");
        };
        img.onerror = () => {
            // Extreme fallback just in case image loading fails entirely
            console.warn("Image canvas conversion failed, falling back to original blob URL.");
            const sim = generateSimulatedReport(file.name, patient);
            setReport(sim);
            const record: ScanRecord = {
                id: sim.reportId,
                timestamp: new Date().toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }),
                patientData: { ...patient },
                report: sim,
                preview, // fallback to blob URL (might vanish if revoked, but at least we have state)
            };
            setHistory(prev => [record, ...prev]);
            setAppState("results");
        };
        img.src = preview;
    }, [file, preview, patient]);

    const handleReset = useCallback(() => {
        setFile(null); setPreview(null); setAppState("idle"); setReport(null);
        setPatient({ ...EMPTY_PATIENT });
    }, []);

    const handleNewScan = useCallback(() => { handleReset(); setCurrentView("new-scan"); }, [handleReset]);

    const handleChangeView = useCallback((v: ViewType) => {
        setViewLoading(true);
        setTimeout(() => { setCurrentView(v); setViewLoading(false); }, 180);
    }, []);

    const headerTitle = currentView === "new-scan" ? "New Scan" :
        currentView === "history" ? "Scan History" :
            currentView === "analytics" ? "Analytics" : "About";

    const headerSub = currentView === "new-scan" ? "AI-powered chest X-ray analysis" :
        currentView === "history" ? `${history.length} scan${history.length !== 1 ? "s" : ""} this session` :
            currentView === "analytics" ? "Session overview" : "System info";

    return (
        <div style={{ background: "#F7F7F3", minHeight: "100dvh", display: "flex", flexDirection: "column" }}>

            {/* ── Top Header ────────────────── */}
            <header style={{
                position: "sticky", top: 0, zIndex: 40,
                background: "#FFFFFF", borderBottom: "1px solid #E8E8E0",
                boxShadow: "0 1px 8px rgba(0,0,0,0.06)",
                paddingTop: "env(safe-area-inset-top, 0px)",
            }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#636B2F,#7a8438)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(99,107,47,0.3)" }}>
                            <Waves style={{ width: 18, height: 18, color: "#fff" }} />
                        </div>
                        <div>
                            <h1 style={{ fontSize: 16, fontWeight: 800, color: "#1a1a1a", lineHeight: 1.1 }}>{headerTitle}</h1>
                            <p style={{ fontSize: 11, color: "#888888", marginTop: 1 }}>{headerSub}</p>
                        </div>
                    </div>
                    {currentView === "new-scan" && appState === "idle" && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 99, background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#059669", animation: "pulse 2s infinite" }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: "#065F46" }}>AI Ready</span>
                        </div>
                    )}
                    {currentView === "history" && history.length > 0 && (
                        <div style={{ padding: "4px 10px", borderRadius: 99, background: "#EEF0E0", border: "1px solid #C5CC9A" }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#636B2F" }}>{history.length} scans</span>
                        </div>
                    )}
                </div>

                {/* Disclaimer */}
                <div style={{ background: "#FFFBEB", borderTop: "1px solid #FDE68A", padding: "6px 20px", display: "flex", alignItems: "center", gap: 7 }}>
                    <AlertTriangle style={{ width: 11, height: 11, color: "#D97706", flexShrink: 0 }} />
                    <p style={{ fontSize: 10, color: "#92400E", fontWeight: 500 }}>
                        Clinical decision support only — verify all findings with a qualified physician.
                    </p>
                </div>

                {/* ── Step progress bar (new-scan only) ── */}
                {currentView === "new-scan" && appState !== "analyzing" && (
                    <StepProgress current={currentStep} />
                )}
            </header>

            {/* ── Main ──────────────────────────────────── */}
            <main style={{ flex: 1, overflowY: "auto", paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}>
                <div style={{ maxWidth: 520, margin: "0 auto", padding: "20px 16px" }}>

                    {/* Skeleton during view transition */}
                    {viewLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <SkeletonCard />
                            <SkeletonCard />
                        </motion.div>
                    )}

                    {!viewLoading && (
                        <AnimatePresence mode="wait">

                            {/* NEW SCAN */}
                            {currentView === "new-scan" && (
                                <motion.div key="new-scan"
                                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } }}
                                    exit={{ opacity: 0, y: -8 }}
                                    style={{ display: "flex", flexDirection: "column", gap: 16 }}
                                >
                                    {(appState === "idle" || appState === "preview") && (<>
                                        {/* Hero (only when idle & no form filled) */}
                                        {appState === "idle" && !patient.name && (
                                            <HeroSection />
                                        )}

                                        <PatientForm data={patient} onChange={setPatient} disabled={false} />

                                        <UploadZone onFileSelect={handleFileSelect} file={file} preview={preview} onReset={handleReset} />

                                        {!isFormValid && appState === "idle" && (
                                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                                style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#FFFBEB", border: "1px solid #FDE68A", borderRadius: 14 }}>
                                                <span style={{ fontSize: 16 }}>🔒</span>
                                                <p style={{ fontSize: 12, color: "#92400E", fontWeight: 500, lineHeight: 1.4 }}>Complete patient name, age and gender to unlock image upload</p>
                                            </motion.div>
                                        )}

                                        {appState === "preview" && file && isFormValid && (
                                            <motion.button
                                                initial={{ opacity: 0, scale: 0.9 }}
                                                animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 400, damping: 20 } }}
                                                whileTap={{ scale: 0.97 }}
                                                onClick={handleAnalyze}
                                                style={{ width: "100%", padding: "16px 20px", borderRadius: 18, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#636B2F,#7a8438)", color: "#fff", fontSize: 16, fontWeight: 700, fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 6px 24px rgba(99,107,47,0.3)" }}
                                            >
                                                <Activity style={{ width: 20, height: 20 }} />
                                                Run AI Analysis
                                            </motion.button>
                                        )}
                                    </>)}

                                    {appState === "results" && report && preview && (<>
                                        {/* New scan button — TOP */}
                                        <motion.button
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleNewScan}
                                            style={{ width: "100%", padding: "14px 20px", borderRadius: 16, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#636B2F,#7a8438)", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 16px rgba(99,107,47,0.25)" }}
                                        >
                                            <ScanLine style={{ width: 18, height: 18 }} />
                                            Start New Scan
                                        </motion.button>

                                        <AiReport report={report} imagePreview={preview} onNewScan={handleNewScan} />

                                        {/* New scan button — BOTTOM */}
                                        <motion.button
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0, transition: { delay: 0.2, type: "spring", stiffness: 300, damping: 24 } }}
                                            whileTap={{ scale: 0.97 }}
                                            onClick={handleNewScan}
                                            style={{ width: "100%", padding: "14px 20px", borderRadius: 16, border: "none", cursor: "pointer", background: "linear-gradient(135deg,#636B2F,#7a8438)", color: "#fff", fontSize: 15, fontWeight: 700, fontFamily: "Inter,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 4px 16px rgba(99,107,47,0.25)" }}
                                        >
                                            <ScanLine style={{ width: 18, height: 18 }} />
                                            Analyze Another Scan
                                        </motion.button>
                                    </>)}
                                </motion.div>
                            )}

                            {/* HISTORY */}
                            {currentView === "history" && (
                                <motion.div key="history" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } }} exit={{ opacity: 0 }}>
                                    <HistoryView history={history} onOpenScan={setSelectedHistory} />
                                </motion.div>
                            )}

                            {/* ANALYTICS */}
                            {currentView === "analytics" && (
                                <motion.div key="analytics" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } }} exit={{ opacity: 0 }}>
                                    <AnalyticsView history={history} />
                                </motion.div>
                            )}

                            {/* ABOUT */}
                            {currentView === "about" && (
                                <motion.div key="about" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 28 } }} exit={{ opacity: 0 }}>
                                    <AboutView />
                                </motion.div>
                            )}

                        </AnimatePresence>
                    )}
                </div>
            </main>

            {/* ── Bottom Nav ────────────────────────────── */}
            <nav className="bottom-nav">
                {NAV.map(item => {
                    const active = currentView === item.id;
                    return (
                        <button key={item.id} onClick={() => handleChangeView(item.id)}
                            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, padding: "10px 0 12px", background: "none", border: "none", cursor: "pointer", transition: "all 0.15s" }}>
                            <motion.div
                                animate={{ scale: active ? 1.05 : 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                                style={{ width: 40, height: 28, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "#EEF0E0" : "transparent", transition: "background 0.15s" }}>
                                <item.icon style={{ width: 20, height: 20, color: active ? "#636B2F" : "#AAAAAA" }} />
                            </motion.div>
                            <span style={{ fontSize: 10, fontWeight: active ? 700 : 500, color: active ? "#636B2F" : "#AAAAAA" }}>{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Analysis overlay */}
            <AnimatePresence>
                {appState === "analyzing" && file && preview && (
                    <AnalysisScreen imagePreview={preview} fileName={file.name} onComplete={handleAnalysisComplete} />
                )}
            </AnimatePresence>

            {/* History modal */}
            <AnimatePresence>
                {selectedHistory && (
                    <HistoryModal scan={selectedHistory} onClose={() => setSelectedHistory(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

/* ══════════════════════════════════
   STEP PROGRESS PILL
   ══════════════════════════════════ */
function StepProgress({ current }: { current: number }) {
    const steps = ["Patient Info", "Upload Scan", "AI Report"];
    return (
        <div style={{ padding: "10px 20px 12px", background: "#FAFAF7", borderTop: "1px solid #EEEEEA", display: "flex", alignItems: "center", gap: 0 }}>
            {steps.map((label, i) => {
                const step = i + 1;
                const done = current > step;
                const active = current === step;
                const pending = current < step;
                return (
                    <div key={label} style={{ display: "flex", alignItems: "center", flex: step < steps.length ? 1 : undefined }}>
                        {/* Circle */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                            <motion.div
                                animate={{ scale: active ? 1.1 : 1 }}
                                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                                style={{
                                    width: 24, height: 24, borderRadius: "50%",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: done ? "#636B2F" : active ? "#636B2F" : "#E8E8E0",
                                    border: active ? "2.5px solid #8A9340" : "2px solid transparent",
                                    boxShadow: active ? "0 0 0 3px rgba(99,107,47,0.12)" : "none",
                                    transition: "all 0.25s",
                                }}
                            >
                                {done ? (
                                    <CheckCircle2 style={{ width: 13, height: 13, color: "#fff" }} />
                                ) : (
                                    <span style={{ fontSize: 10, fontWeight: 800, color: active ? "#fff" : "#AAAAAA" }}>{step}</span>
                                )}
                            </motion.div>
                            <span style={{ fontSize: 9, fontWeight: active ? 700 : 500, color: active ? "#636B2F" : pending ? "#BBBBBB" : "#636B2F", whiteSpace: "nowrap" }}>
                                {label}
                            </span>
                        </div>
                        {/* Connector line */}
                        {step < steps.length && (
                            <div style={{ flex: 1, height: 2, background: done ? "#636B2F" : "#E8E8E0", marginBottom: 18, transition: "background 0.4s", borderRadius: 99 }} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════
   HERO SECTION
   ══════════════════════════════════ */
function HeroSection() {
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0, transition: { type: "spring", stiffness: 280, damping: 24 } }}
            style={{ background: "linear-gradient(135deg,#636B2F 0%,#7a8438 60%,#8A9340 100%)", borderRadius: 22, padding: "24px 24px 20px", color: "#fff", position: "relative", overflow: "hidden" }}
        >
            {/* Background texture rings */}
            <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.1)" }} />
            <div style={{ position: "absolute", top: -10, right: -10, width: 90, height: 90, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.15)" }} />

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div style={{ flex: 1 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 99, background: "rgba(255,255,255,0.15)", marginBottom: 12, border: "1px solid rgba(255,255,255,0.2)" }}>
                        <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#86EFAC", animation: "pulse 2s infinite" }} />
                        <span style={{ fontSize: 10, fontWeight: 700 }}>DenseNet-121 Ensemble Active</span>
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.2, marginBottom: 6 }}>
                        Chest X-Ray<br />AI Screening
                    </h2>
                    <p style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.55, maxWidth: 200 }}>
                        Upload a scan, get a detailed multi-disease report in seconds.
                    </p>

                    <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                        {[{ v: "8", l: "Diseases" }, { v: "~3s", l: "Inference" }, { v: "95%", l: "Accuracy" }].map(s => (
                            <div key={s.l} style={{ textAlign: "center" as const }}>
                                <p style={{ fontSize: 16, fontWeight: 900 }}>{s.v}</p>
                                <p style={{ fontSize: 9, opacity: 0.65, fontWeight: 600 }}>{s.l}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Animated X-ray SVG illustration */}
                <div className="animate-wave" style={{ width: 80, height: 80, flexShrink: 0 }}>
                    <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="4" y="4" width="72" height="72" rx="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                        {/* Lung left */}
                        <path d="M20 22 Q14 28 14 38 Q14 52 22 56 Q28 52 28 40 Q28 30 24 22Z" fill="rgba(255,255,255,0.55)" />
                        {/* Lung right */}
                        <path d="M60 22 Q66 28 66 38 Q66 52 58 56 Q52 52 52 40 Q52 30 56 22Z" fill="rgba(255,255,255,0.55)" />
                        {/* Spine */}
                        <rect x="37" y="20" width="6" height="40" rx="3" fill="rgba(255,255,255,0.25)" />
                        {/* Heart */}
                        <ellipse cx="40" cy="42" rx="7" ry="8" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                        {/* Ribs */}
                        {[0, 1, 2, 3].map(i => (
                            <g key={i}>
                                <path d={`M30 ${27 + i * 9} Q34 ${25 + i * 9} 37 ${26 + i * 9}`} stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                                <path d={`M50 ${27 + i * 9} Q46 ${25 + i * 9} 43 ${26 + i * 9}`} stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                            </g>
                        ))}
                        {/* Scan line */}
                        <line x1="8" y1="40" x2="72" y2="40" stroke="rgba(134,239,172,0.5)" strokeWidth="1" strokeDasharray="4 3" />
                    </svg>
                </div>
            </div>

            <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 6 }}>
                <p style={{ fontSize: 11, opacity: 0.7 }}>Begin by filling in patient details below</p>
                <ChevronRight style={{ width: 12, height: 12, opacity: 0.6 }} />
            </div>
        </motion.div>
    );
}


/* ══════════════════════════════════
   HISTORY VIEW
   ══════════════════════════════════ */
function HistoryView({ history, onOpenScan }: { history: ScanRecord[]; onOpenScan: (s: ScanRecord) => void }) {
    if (history.length === 0) {
        return (
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 280, damping: 24 } }}>
                <EmptyState
                    icon={
                        <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
                            <rect x="4" y="10" width="56" height="44" rx="8" fill="#EEF0E0" stroke="#C5CC9A" strokeWidth="1.5" />
                            <rect x="12" y="18" width="16" height="16" rx="4" fill="#C5CC9A" />
                            <rect x="34" y="20" width="16" height="3" rx="1.5" fill="#D5D8B5" />
                            <rect x="34" y="26" width="10" height="3" rx="1.5" fill="#D5D8B5" />
                            <rect x="12" y="40" width="40" height="3" rx="1.5" fill="#E5E8D0" />
                            <rect x="12" y="46" width="28" height="3" rx="1.5" fill="#E5E8D0" />
                        </svg>
                    }
                    title="No Scans Yet"
                    subtitle="Complete a scan from the New Scan tab to see your history appear here."
                />
            </motion.div>
        );
    }

    const riskStyle: Record<string, { color: string; bg: string; border: string }> = {
        "High Suspicion": { color: "#991B1B", bg: "#FEE2E2", border: "#FECACA" },
        "Moderate Risk": { color: "#92400E", bg: "#FEF3C7", border: "#FDE68A" },
        "Low Risk": { color: "#065F46", bg: "#D1FAE5", border: "#A7F3D0" },
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 12, color: "#888888", fontWeight: 500, paddingBottom: 4 }}>
                {history.length} scan{history.length !== 1 ? "s" : ""} recorded this session — tap to view full report
            </p>
            {history.map((scan, i) => {
                const rs = riskStyle[scan.report.riskLevel] ?? riskStyle["Low Risk"];
                return (
                    <motion.div key={scan.id}
                        initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05, type: "spring", stiffness: 280, damping: 24 }}
                        onClick={() => onOpenScan(scan)}
                        whileTap={{ scale: 0.98 }}
                        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", background: "#FFFFFF", borderRadius: 18, border: "1px solid #E8E8E0", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", cursor: "pointer" }}
                    >
                        <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", background: "#111", border: "1px solid #E5E5DC", flexShrink: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={scan.preview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 14, fontWeight: 700, color: "#111111", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{scan.patientData.name || "Anonymous"}</p>
                            <p style={{ fontSize: 11, color: "#888888", marginTop: 2 }}>{scan.timestamp} · Age {scan.patientData.age}</p>
                            <p style={{ fontSize: 10, color: "#636B2F", fontFamily: "monospace", marginTop: 2 }}>{scan.id}</p>
                        </div>
                        <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 99, background: rs.bg, color: rs.color, border: `1px solid ${rs.border}` }}>
                                {scan.report.riskLevel.split(" ")[0]}
                            </span>
                            <ChevronRight style={{ width: 14, height: 14, color: "#CCCCBC" }} />
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}

/* ══════════════════════════════════
   HISTORY MODAL
   ══════════════════════════════════ */
function HistoryModal({ scan, onClose }: { scan: ScanRecord; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "flex-end", padding: "0 0 env(safe-area-inset-bottom,0px)" }}
        >
            <motion.div
                initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 30 } }}
                exit={{ y: 80, opacity: 0 }}
                onClick={e => e.stopPropagation()}
                style={{ width: "100%", maxWidth: 520, margin: "0 auto", background: "#FFFFFF", borderRadius: "24px 24px 0 0", maxHeight: "92dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #E8E8E0", flexShrink: 0 }}>
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

/* ══════════════════════════════════
   ANALYTICS VIEW
   ══════════════════════════════════ */
function StatCard({ label, value, color, bg, Icon, delay }: { label: string; value: number | string; color: string; bg: string; Icon: React.ElementType; delay: number }) {
    const isNum = typeof value === "number";
    const counted = useCountUp(isNum ? value : 0, 900);
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, type: "spring", stiffness: 300, damping: 22 }}
            style={{ background: bg, border: `1px solid ${color}22`, borderRadius: 16, padding: "14px 12px", display: "flex", flexDirection: "column", gap: 7 }}
        >
            <Icon style={{ width: 17, height: 17, color }} />
            <span style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>
                {isNum ? counted : value}
            </span>
            <span style={{ fontSize: 9.5, fontWeight: 600, color: "#666666", lineHeight: 1.3 }}>{label}</span>
        </motion.div>
    );
}

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
            <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 280, damping: 24 } }}>
                <EmptyState
                    icon={
                        <svg viewBox="0 0 64 64" fill="none" width="64" height="64">
                            <rect x="8" y="40" width="10" height="16" rx="3" fill="#EEF0E0" stroke="#C5CC9A" strokeWidth="1.5" />
                            <rect x="22" y="30" width="10" height="26" rx="3" fill="#C5CC9A" stroke="#8A9340" strokeWidth="1.5" />
                            <rect x="36" y="20" width="10" height="36" rx="3" fill="#EEF0E0" stroke="#C5CC9A" strokeWidth="1.5" />
                            <rect x="50" y="10" width="10" height="46" rx="3" fill="#C5CC9A" stroke="#8A9340" strokeWidth="1.5" />
                            <line x1="4" y1="58" x2="60" y2="58" stroke="#E5E5DC" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                    }
                    title="No Analytics Yet"
                    subtitle="Run at least one scan from the New Scan tab to see your session analytics here."
                />
            </motion.div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <StatCard label="Total Scans" value={total} color="#636B2F" bg="#EEF0E0" Icon={Users} delay={0} />
                <StatCard label="High Suspicion" value={high} color="#DC2626" bg="#FEE2E2" Icon={AlertTriangle} delay={0.05} />
                <StatCard label="Moderate Risk" value={mod} color="#D97706" bg="#FEF3C7" Icon={ScanLine} delay={0.1} />
                <StatCard label="Low Risk" value={low} color="#059669" bg="#D1FAE5" Icon={CheckCircle2} delay={0.15} />
                <StatCard label="Avg Confidence" value={`${avgConf.toFixed(1)}%`} color="#4F46E5" bg="#EEF2FF" Icon={Zap} delay={0.2} />
                <StatCard label="Avg Inference" value={`${(avgTime / 1000).toFixed(2)}s`} color="#0891B2" bg="#ECFEFF" Icon={Clock} delay={0.25} />
            </div>

            {/* Risk distribution */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, type: "spring", stiffness: 280, damping: 24 }}
                style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E8E8E0", padding: "18px 20px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <TrendingUp style={{ width: 15, height: 15, color: "#636B2F" }} />
                    <h3 style={{ fontSize: 12, fontWeight: 700, color: "#111111", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Risk Distribution</h3>
                </div>
                <div style={{ height: 12, borderRadius: 99, overflow: "hidden", display: "flex", gap: 2, marginBottom: 12 }}>
                    {high > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(high / total) * 100}%` }} transition={{ delay: 0.4, duration: 0.7 }} style={{ background: "#EF4444", borderRadius: 99, height: "100%" }} />}
                    {mod > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(mod / total) * 100}%` }} transition={{ delay: 0.5, duration: 0.7 }} style={{ background: "#F59E0B", borderRadius: 99, height: "100%" }} />}
                    {low > 0 && <motion.div initial={{ width: 0 }} animate={{ width: `${(low / total) * 100}%` }} transition={{ delay: 0.6, duration: 0.7 }} style={{ background: "#10B981", borderRadius: 99, height: "100%" }} />}
                </div>
                <div style={{ display: "flex", gap: 16 }}>
                    {[{ l: "High", c: "#EF4444", n: high }, { l: "Moderate", c: "#F59E0B", n: mod }, { l: "Low", c: "#10B981", n: low }].map(r => (
                        <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.c }} />
                            <span style={{ fontSize: 11, color: "#555555", fontWeight: 600 }}>{r.l} ({r.n})</span>
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Top finding */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, type: "spring", stiffness: 280, damping: 24 }}
                style={{ background: "#EEF0E0", borderRadius: 18, border: "1.5px solid #C5CC9A", padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                    <p style={{ fontSize: 11, color: "#636B2F", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginBottom: 5 }}>Most Common Finding</p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: "#2a3010" }}>{topDx}</p>
                </div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: "#636B2F", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <FileText style={{ width: 22, height: 22, color: "#fff" }} />
                </div>
            </motion.div>

            {/* Scan log */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, type: "spring", stiffness: 280, damping: 24 }}
                style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E8E8E0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: "13px 20px", background: "#F7F7F3", borderBottom: "1px solid #EEEEEA" }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: "#555555", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Scan Log</h3>
                </div>
                {history.slice(0, 6).map((scan, i) => (
                    <div key={scan.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: i < Math.min(history.length, 6) - 1 ? "1px solid #F0F0EA" : "none" }}>
                        <span style={{ fontSize: 12, color: "#CCCCBC", width: 18, fontWeight: 700, flexShrink: 0 }}>#{i + 1}</span>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "#222222", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scan.patientData.name || "Anonymous"}</p>
                        <p style={{ fontSize: 10, color: "#888888", flexShrink: 0, maxWidth: 90, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{scan.report.topDisease}</p>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 99, flexShrink: 0, background: scan.report.riskLevel === "High Suspicion" ? "#FEE2E2" : scan.report.riskLevel === "Moderate Risk" ? "#FEF3C7" : "#D1FAE5", color: scan.report.riskLevel === "High Suspicion" ? "#991B1B" : scan.report.riskLevel === "Moderate Risk" ? "#92400E" : "#065F46" }}>
                            {scan.report.riskLevel.split(" ")[0]}
                        </span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}

/* ══════════════════════════════════
   ABOUT VIEW
   ══════════════════════════════════ */
function AboutView() {
    const specs = [
        { label: "AI Model", value: "DenseNet-121 + EfficientNet-B4" },
        { label: "Training Data", value: "NIH ChestX-ray14 (112,120 imgs)" },
        { label: "Pathologies", value: "8 multi-label conditions" },
        { label: "Inference", value: "On-device, fully offline" },
        { label: "Uncertainty", value: "Monte Carlo Dropout (n=50)" },
        { label: "Calibration", value: "Platt Scaling" },
        { label: "Report Format", value: "PDF + AI Narrative (2 modes)" },
        { label: "Version", value: "2.1.0 — Mobile Demo" },
    ];
    const features = ["Multi-label pathology detection", "Calibrated confidence scores", "Clinical + patient report modes", "Grad-CAM heatmap simulation", "Longitudinal scan tracking", "PDF report download per scan", "Session analytics dashboard", "Fully offline — no data sent"];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1, transition: { type: "spring", stiffness: 280, damping: 24 } }}
                style={{ background: "#FFFFFF", borderRadius: 22, border: "1px solid #E8E8E0", padding: 24, textAlign: "center" as const, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <div className="animate-wave" style={{ width: 64, height: 64, borderRadius: 18, background: "linear-gradient(135deg,#636B2F,#7a8438)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", boxShadow: "0 4px 20px rgba(99,107,47,0.3)" }}>
                    <span style={{ fontSize: 28 }}>🫁</span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: "#111111", marginBottom: 8 }}>Wavelength AI</h3>
                <p style={{ fontSize: 13, color: "#666666", lineHeight: 1.65, maxWidth: 280, margin: "0 auto" }}>
                    AI-powered multi-disease chest X-ray screening for rapid clinical decision support.
                </p>
            </motion.div>

            <div style={{ background: "#EEF0E0", borderRadius: 20, border: "1.5px solid #C5CC9A", padding: "18px 20px" }}>
                <h3 style={{ fontSize: 12, fontWeight: 700, color: "#636B2F", textTransform: "uppercase" as const, letterSpacing: "0.08em", marginBottom: 14 }}>Key Features</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                    {features.map((f, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04, type: "spring", stiffness: 280, damping: 24 }}
                            style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 18, height: 18, borderRadius: "50%", background: "#636B2F", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                <CheckCircle2 style={{ width: 11, height: 11, color: "#fff" }} />
                            </div>
                            <span style={{ fontSize: 13, color: "#2a3010", fontWeight: 500, lineHeight: 1.4 }}>{f}</span>
                        </motion.div>
                    ))}
                </div>
            </div>

            <div style={{ background: "#FFFFFF", borderRadius: 20, border: "1px solid #E8E8E0", overflow: "hidden", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
                <div style={{ padding: "13px 20px", background: "#F7F7F3", borderBottom: "1px solid #EEEEEA" }}>
                    <h3 style={{ fontSize: 11, fontWeight: 700, color: "#555555", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Technical Specifications</h3>
                </div>
                {specs.map((spec, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                        style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", padding: "12px 20px", borderBottom: i < specs.length - 1 ? "1px solid #F0F0EA" : "none", gap: 16 }}>
                        <span style={{ fontSize: 12, color: "#888888", flexShrink: 0 }}>{spec.label}</span>
                        <span style={{ fontSize: 12, color: "#222222", fontWeight: 600, textAlign: "right" as const }}>{spec.value}</span>
                    </motion.div>
                ))}
            </div>

            <div style={{ background: "#FFFBEB", borderRadius: 16, border: "1px solid #FDE68A", padding: "14px 18px" }}>
                <p style={{ fontSize: 11, color: "#92400E", lineHeight: 1.65, textAlign: "center" as const }}>
                    <strong>⚠ Offline Demo.</strong> Analysis is simulated via pre-generated reports matched by filename. Production uses FastAPI + DenseNet real-time inference.
                </p>
            </div>
        </div>
    );
}

/* ══════════════════════════════════
   ILLUSTRATED EMPTY STATE
   ══════════════════════════════════ */
function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "56px 24px", background: "#FFFFFF", borderRadius: 22, border: "2px dashed #E5E5DC", textAlign: "center" as const }}>
            <div style={{ marginBottom: 20, filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.06))" }}>{icon}</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#444444", marginBottom: 8 }}>{title}</h3>
            <p style={{ fontSize: 13, color: "#888888", maxWidth: 240, lineHeight: 1.6 }}>{subtitle}</p>
        </div>
    );
}
