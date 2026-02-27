"use client";

import { motion } from "framer-motion";
import {
    FileSearch, Cpu, CheckCircle2, ChevronRight,
    Layers, Scan, Eye, Activity, Binary
} from "lucide-react";

export default function SimulationAnimation() {
    return (
        <div className="relative w-full max-w-5xl mx-auto p-4 md:p-10 bg-white border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.02)]">
            <div className="flex flex-wrap md:flex-nowrap justify-between items-center gap-2 md:gap-4 relative z-10">
                {/* Step 1: Scan */}
                <Step
                    icon={FileSearch}
                    label="Input Scan"
                    delay={0}
                />

                <Arrow delay={0.3} />

                {/* INTERMEDIATE: Normalization */}
                <Step
                    icon={Scan}
                    label="Normalization"
                    delay={0.6}
                />

                <Arrow delay={0.9} />

                {/* Step 2: AI Processing (Backbone) */}
                <Step
                    icon={Layers}
                    label="Feature Extraction"
                    delay={1.2}
                    animatePulse
                />

                <Arrow delay={1.5} />

                {/* INTERMEDIATE: Classification */}
                <Step
                    icon={Binary}
                    label="Classifying"
                    delay={1.8}
                />

                <Arrow delay={2.1} />

                {/* INTERMEDIATE: Explainability */}
                <Step
                    icon={Eye}
                    label="Grad-CAM Map"
                    delay={2.4}
                />

                <Arrow delay={2.7} />

                {/* Step 3: Result */}
                <Step
                    icon={CheckCircle2}
                    label="Diagnostics"
                    delay={3}
                />
            </div>

            {/* Background glowing line */}
            <div className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-100 to-transparent -translate-y-1/2 hidden md:block" />
        </div>
    );
}

function Step({ icon: Icon, label, delay, animatePulse }: { icon: any, label: string, delay: number, animatePulse?: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay, duration: 0.5 }}
            className="flex flex-col items-center gap-3 flex-1 min-w-[80px]"
        >
            <motion.div
                animate={animatePulse ? {
                    boxShadow: ["0 0 0px 0px rgba(30, 58, 138, 0)", "0 0 20px 5px rgba(30, 58, 138, 0.1)", "0 0 0px 0px rgba(30, 58, 138, 0)"]
                } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center relative shadow-sm group hover:border-blue-200 transition-colors"
            >
                <Icon className="w-6 h-6 md:w-8 md:h-8 text-[#1e3a8a]" />
            </motion.div>
            <span className="text-[8px] md:text-[10px] font-bold text-slate-400 group-hover:text-[#1e3a8a] uppercase tracking-widest text-center">{label}</span>
        </motion.div>
    );
}

function Arrow({ delay }: { delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay, duration: 0.5 }}
            className="hidden sm:block"
        >
            <ChevronRight className="w-4 h-4 text-slate-200" />
        </motion.div>
    );
}
