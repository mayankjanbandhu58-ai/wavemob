"use client";

import { motion } from "framer-motion";
import { UserPlus, ActivitySquare, Sparkles } from "lucide-react";
import type { PatientData } from "@/lib/dataset";

interface PatientFormProps {
    data: PatientData;
    onChange: (data: PatientData) => void;
    disabled?: boolean;
}

export function PatientForm({ data, onChange, disabled }: PatientFormProps) {
    const handle = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        onChange({ ...data, [e.target.name]: e.target.value });
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg animate-pulse-glow">
                    <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white">Patient Registration</h3>
                    <p className="text-[10px] text-blue-400/60 uppercase tracking-wider">Step 1 of 2 — Clinical Demographics</p>
                </div>
                <div className="ml-auto">
                    <Sparkles className="w-4 h-4 text-blue-400/30" />
                </div>
            </div>

            {/* Form body */}
            <div className="p-5 space-y-4">
                {/* Full Name */}
                <div>
                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                        Full Name <span className="text-red-400 normal-case">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={data.name}
                        onChange={handle}
                        disabled={disabled}
                        placeholder="e.g., Rahul Sharma"
                        className="input-glass"
                    />
                </div>

                {/* Age + Gender row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                            Age <span className="text-red-400 normal-case">*</span>
                        </label>
                        <input
                            type="number"
                            name="age"
                            value={data.age}
                            onChange={handle}
                            disabled={disabled}
                            placeholder="Years"
                            min="1"
                            max="120"
                            className="input-glass"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                            Gender <span className="text-red-400 normal-case">*</span>
                        </label>
                        <select
                            name="gender"
                            value={data.gender}
                            onChange={handle}
                            disabled={disabled}
                            className="input-glass"
                        >
                            <option value="" disabled>Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                        Phone <span className="text-white/20 normal-case text-[10px]">(optional)</span>
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={data.phone ?? ""}
                        onChange={handle}
                        disabled={disabled}
                        placeholder="+91 98765 43210"
                        className="input-glass"
                    />
                </div>

                {/* Clinical Context divider */}
                <div className="pt-1">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="flex-1 h-px bg-white/6" />
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20">
                            <ActivitySquare className="w-3 h-3 text-blue-400" />
                            <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">Clinical Context</span>
                        </div>
                        <div className="flex-1 h-px bg-white/6" />
                    </div>

                    {/* Symptoms */}
                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                            Symptoms <span className="text-white/20 normal-case text-[10px]">(optional)</span>
                        </label>
                        <input
                            type="text"
                            name="symptoms"
                            value={data.symptoms ?? ""}
                            onChange={handle}
                            disabled={disabled}
                            placeholder="Cough, fever, shortness of breath..."
                            className="input-glass"
                        />
                    </div>

                    {/* Smoking */}
                    <div>
                        <label className="block text-xs font-semibold text-white/50 mb-2 uppercase tracking-wider">
                            Smoking History
                        </label>
                        <select
                            name="smoking_history"
                            value={data.smoking_history}
                            onChange={handle}
                            disabled={disabled}
                            className="input-glass"
                        >
                            <option value="Never">Never Smoked</option>
                            <option value="Former">Former Smoker</option>
                            <option value="Current (Occasional)">Current — Occasional</option>
                            <option value="Current (Heavy)">Current — Heavy</option>
                        </select>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
