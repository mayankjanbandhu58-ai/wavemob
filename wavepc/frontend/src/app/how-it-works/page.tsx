"use client";

import { motion } from "framer-motion";
import {
    ArrowLeft, BrainCircuit, Database, ShieldCheck, Zap, Network, Scale,
    LayoutDashboard, FileText, BarChart3, Binary, Settings, UserPlus,
    BookOpen, Search, HelpCircle, Activity, ArrowRight, MousePointer2,
    Upload, FileSearch
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function UserManual() {
    const [activeSection, setActiveSection] = useState("quick-start");

    const navigation = [
        { id: "quick-start", label: "Quick Start", icon: Zap },
        { id: "navigation", label: "Dashboard Navigation", icon: LayoutDashboard },
        { id: "ai-logic", label: "AI & Clinical Logic", icon: BrainCircuit },
        { id: "technical", label: "Technical Specs", icon: Binary },
        { id: "faq", label: "Support & FAQ", icon: HelpCircle },
    ];

    return (
        <div className="min-h-screen bg-[#fdfcfa] text-[#1a1c29] font-sans selection:bg-blue-100">
            {/* Header / Nav */}
            <nav className="fixed top-0 left-0 right-0 z-50 p-6 bg-white/80 backdrop-blur-md border-b border-slate-100">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <Link href="/" className="flex items-center gap-2 group transition-all">
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform text-[#1e3a8a]" />
                        <span className="font-bold tracking-tight text-[#1e3a8a]">Return home</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">v1.2.0 Manual</span>
                    </div>
                </div>
            </nav>

            <div className="flex pt-24 max-w-7xl mx-auto min-h-screen">
                {/* Secondary Sidebar (Manual Nav) */}
                <aside className="w-64 fixed left-auto p-8 hidden lg:block h-[calc(100vh-6rem)] overflow-y-auto border-r border-slate-50">
                    <div className="space-y-2">
                        {navigation.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActiveSection(item.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${activeSection === item.id
                                        ? "bg-[#1e3a8a] text-white shadow-lg shadow-blue-900/10"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-[#1e3a8a]"
                                    }`}
                            >
                                <item.icon className="w-4 h-4" />
                                {item.label}
                            </button>
                        ))}
                    </div>

                    <div className="mt-12 p-6 rounded-2xl bg-slate-50 border border-slate-100 italic">
                        <p className="text-xs text-slate-500 leading-relaxed">
                            "The goal of Wavelength is not to replace the radiologist, but to provide a second pair of eyes that never gets tired."
                        </p>
                    </div>
                </aside>

                {/* Main Content Area */}
                <main className="flex-1 lg:ml-72 p-8 lg:p-12">
                    <div className="max-w-3xl">
                        {activeSection === "quick-start" && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                <div>
                                    <h1 className="text-5xl font-black text-[#1e3a8a] mb-6 tracking-tighter">Quick Start Guide</h1>
                                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                        Learn how to use Wavelength to analyze your first chest radiograph in under 60 seconds.
                                    </p>
                                </div>

                                <div className="space-y-8">
                                    <GuideStep num="1" title="Upload Image" icon={Upload}>
                                        Navigate to the **New Patient** or **Quick Analysis** view and drag your image (PNG/JPG) onto the dropzone.
                                    </GuideStep>
                                    <GuideStep num="2" title="Run Analysis" icon={Binary}>
                                        Click the **Run AI Analysis** button. The system will process the image through the ensemble pipeline.
                                    </GuideStep>
                                    <GuideStep num="3" title="Review Findings" icon={FileSearch}>
                                        Analyze the probability table. High-confidence findings are highlighted in red for triage prioritization.
                                    </GuideStep>
                                    <GuideStep num="4" title="Verify Anatomically" icon={Search}>
                                        Use the **Grad-CAM Heatmap** to see exactly where the AI identified pathological features.
                                    </GuideStep>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "navigation" && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                <div>
                                    <h1 className="text-5xl font-black text-[#1e3a8a] mb-6 tracking-tighter">Dashboard Navigation</h1>
                                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                        Wavelength is divided into specialized views for clinical, educational, and administrative tasks.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <NavCard
                                        icon={LayoutDashboard}
                                        title="Worklist"
                                        desc="An AI-prioritized queue. Patients with critical findings (e.g., Pneumothorax) are automatically triaged to the top."
                                    />
                                    <NavCard
                                        icon={UserPlus}
                                        title="New Patient"
                                        desc="Register demographics and link X-ray data for longitudinal patient tracking."
                                    />
                                    <NavCard
                                        icon={FileText}
                                        title="Patient Database"
                                        desc="Archive of all historical reports, FHIR resources, and generated clinical summaries."
                                    />
                                    <NavCard
                                        icon={BarChart3}
                                        title="Analytics"
                                        desc="Deep-dive into hospital-wide pathology trends, throughput metrics, and model performance KPIs."
                                    />
                                    <NavCard
                                        icon={BookOpen}
                                        title="Clinical Knowledge"
                                        desc="Interactive educational hub for learning pathologies and radiograph interpretation."
                                    />
                                    <NavCard
                                        icon={Settings}
                                        title="EHR Sync"
                                        desc="Configure HL7/FHIR endpoints for pushing data to Epic, Cerner, or local HIS."
                                    />
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "ai-logic" && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                <div>
                                    <h1 className="text-5xl font-black text-[#1e3a8a] mb-6 tracking-tighter">Understanding AI Insights</h1>
                                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                        Wavelength provides multiple layers of explainability to support clinical decision-making.
                                    </p>
                                </div>

                                <div className="p-8 rounded-3xl bg-blue-50 border border-blue-100 space-y-6">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-[#1e3a8a] rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-blue-900/10">
                                            <Search className="text-white w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-[#1e3a8a] mb-2">Grad-CAM Heatmaps</h3>
                                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                                Gradient-weighted Class Activation Mapping (Grad-CAM) highlights the regions of the image that the AI weighted most heavily. This allows you to verify if the AI's "attention" matches actual anatomical abnormalities.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-green-900/10">
                                            <Scale className="text-white w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-green-800 mb-2">Calibrated Probabilities</h3>
                                            <p className="text-slate-600 text-sm font-medium leading-relaxed">
                                                Standard AI models often overstate confidence. Wavelength uses Platt Scaling to ensure that an "80% confidence" score truly means the disease is present in 8 out of 10 historical cases.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "technical" && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                <div>
                                    <h1 className="text-5xl font-black text-[#1e3a8a] mb-6 tracking-tighter">Technical Architecture</h1>
                                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                        Built on a robust, scalable stack designed for modern healthcare environments.
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Backbone Model</h3>
                                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                            <p className="text-sm font-bold text-[#1e3a8a]">DenseNet121 + EffNetB4 Ensemble</p>
                                            <p className="text-xs text-slate-500 mt-2 font-medium">Combination of global spatial features and local texture analysis.</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Dataset</h3>
                                        <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                                            <p className="text-sm font-bold text-[#1e3a8a]">NIH ChestX-ray14</p>
                                            <p className="text-xs text-slate-500 mt-2 font-medium">112,000+ expert-annotated frontal radiographs.</p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeSection === "faq" && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-12">
                                <div>
                                    <h1 className="text-5xl font-black text-[#1e3a8a] mb-6 tracking-tighter">Support & FAQ</h1>
                                    <p className="text-lg text-slate-500 font-medium leading-relaxed">
                                        Common questions about Wavelength's operation and integration.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <FaqItem question="Is this a diagnostic tool?" answer="No. Wavelength is a Clinical Decision Support (CDS) tool. It provides suggestions and triage data to be reviewed by qualified radiologists." />
                                    <FaqItem question="Can I integrate with my HIS?" answer="Yes. Wavelength supports HL7 v2 and FHIR R4 interfaces for seamless EMR integration." />
                                    <FaqItem question="What file formats are supported?" answer="Currently, we support PNG and JPG files. DICOM support is available via our backend server's conversion pipeline." />
                                </div>
                            </motion.div>
                        )}
                    </div>
                </main>
            </div>

            {/* Simple Footer */}
            <footer className="border-t border-slate-50 py-12 px-8">
                <div className="max-w-7xl mx-auto flex justify-between items-center text-slate-400 text-xs font-bold">
                    <p>© 2026 Wavelength AI Manual</p>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-[#1e3a8a]">Support Center</a>
                        <a href="#" className="hover:text-[#1e3a8a]">API Docs</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

function GuideStep({ num, title, icon: Icon, children }: { num: string, title: string, icon: any, children: any }) {
    return (
        <div className="flex gap-6">
            <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-black text-[#1e3a8a]">
                    {num}
                </div>
                <div className="flex-1 w-px bg-slate-100 my-2" />
            </div>
            <div className="flex-1 pb-8">
                <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-[#1e3a8a]" />
                    <h3 className="text-xl font-bold text-[#1e3a8a]">{title}</h3>
                </div>
                <div className="text-slate-500 font-medium leading-relaxed prose prose-slate text-sm">
                    {children}
                </div>
            </div>
        </div>
    );
}

function NavCard({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 transition-all shadow-sm group">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center mb-4 group-hover:bg-[#1e3a8a]/10 transition-colors">
                <Icon className="w-5 h-5 text-[#1e3a8a]" />
            </div>
            <h4 className="font-bold text-[#1e3a8a] mb-2">{title}</h4>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
        </div>
    );
}

function FaqItem({ question, answer }: { question: string, answer: string }) {
    return (
        <div className="p-6 rounded-2xl bg-white border border-slate-100">
            <h4 className="font-bold text-[#1e3a8a] mb-2">{question}</h4>
            <p className="text-sm text-slate-500 font-medium leading-relaxed">{answer}</p>
        </div>
    );
}
