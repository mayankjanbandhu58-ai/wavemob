"use client";

import { motion } from "framer-motion";
import { UserPlus, Activity } from "lucide-react";
import type { PatientData } from "@/lib/dataset";

interface PatientFormProps {
    data: PatientData;
    onChange: (data: PatientData) => void;
    disabled?: boolean;
}

const inputCls = "w-full px-4 py-3 rounded-xl text-sm text-gray-900 font-medium placeholder-gray-400 transition-all outline-none border-[1.5px] border-gray-200 bg-white focus:border-[#636B2F] focus:ring-2 focus:ring-[#636B2F]/15 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed appearance-none";

export function PatientForm({ data, onChange, disabled }: PatientFormProps) {
    const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange({ ...data, [e.target.name]: e.target.value });
    };

    return (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl overflow-hidden"
            style={{ border: "1px solid #E5E5DC", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}
        >
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: "#F5F5EF", borderBottom: "1px solid #E5E5DC" }}>
                <div className="w-10 h-10 rounded-xl gradient-olive flex items-center justify-center">
                    <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Patient Registration</h3>
                    <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "#636B2F" }}>
                        Step 1 of 2 — Clinical Demographics
                    </p>
                </div>
            </div>

            {/* Form */}
            <div className="p-5 space-y-4">
                {/* Full Name */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Full Name <span className="text-red-500 normal-case">*</span>
                    </label>
                    <input
                        type="text" name="name" value={data.name} onChange={handle} disabled={disabled}
                        placeholder="e.g., Rahul Sharma" className={inputCls}
                    />
                </div>

                {/* Age + Gender */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Age <span className="text-red-500 normal-case">*</span>
                        </label>
                        <input
                            type="number" name="age" value={data.age} onChange={handle} disabled={disabled}
                            placeholder="Years" min="1" max="120" className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Gender <span className="text-red-500 normal-case">*</span>
                        </label>
                        <select name="gender" value={data.gender} onChange={handle} disabled={disabled} className={inputCls}>
                            <option value="" disabled>Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                {/* Phone */}
                <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                        Phone <span className="text-gray-400 normal-case text-[10px]">(optional)</span>
                    </label>
                    <input
                        type="tel" name="phone" value={data.phone ?? ""} onChange={handle} disabled={disabled}
                        placeholder="+91 98765 43210" className={inputCls}
                    />
                </div>

                {/* Clinical Context */}
                <div className="pt-2">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1" style={{ background: "#E5E5DC" }} />
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                            style={{ background: "#EEF0E0", color: "#636B2F", border: "1px solid #C5CC9A" }}>
                            <Activity className="w-3 h-3" />
                            Clinical Context
                        </div>
                        <div className="h-px flex-1" style={{ background: "#E5E5DC" }} />
                    </div>

                    <div className="mb-3">
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Symptoms <span className="text-gray-400 normal-case text-[10px]">(optional)</span>
                        </label>
                        <input
                            type="text" name="symptoms" value={data.symptoms ?? ""} onChange={handle} disabled={disabled}
                            placeholder="Cough, fever, shortness of breath..." className={inputCls}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                            Smoking History
                        </label>
                        <select name="smoking_history" value={data.smoking_history} onChange={handle} disabled={disabled} className={inputCls}>
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
