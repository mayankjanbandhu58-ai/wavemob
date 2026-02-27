"use client";

import { motion } from "framer-motion";
import { UserPlus, ActivitySquare } from "lucide-react";
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

    const inputCls =
        "w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-olive/20 focus:border-olive transition-all outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl card-elevated overflow-hidden"
        >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-olive flex items-center justify-center shadow-md">
                    <UserPlus className="w-4 h-4 text-white" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-900">Patient Registration</h3>
                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">Step 1 of 2 — Clinical Demographics</p>
                </div>
            </div>

            {/* Form body */}
            <div className="p-5 space-y-4">
                {/* Full Name */}
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={data.name}
                        onChange={handle}
                        disabled={disabled}
                        placeholder="e.g., Rahul Sharma"
                        className={inputCls}
                    />
                </div>

                {/* Age + Gender row */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Age <span className="text-red-400">*</span>
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
                            className={inputCls}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Gender <span className="text-red-400">*</span>
                        </label>
                        <select
                            name="gender"
                            value={data.gender}
                            onChange={handle}
                            disabled={disabled}
                            className={inputCls + " appearance-none"}
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
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                        Phone Number <span className="text-gray-300">(optional)</span>
                    </label>
                    <input
                        type="tel"
                        name="phone"
                        value={data.phone ?? ""}
                        onChange={handle}
                        disabled={disabled}
                        placeholder="+91 98765 43210"
                        className={inputCls}
                    />
                </div>

                {/* Clinical context divider */}
                <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-3">
                        <ActivitySquare className="w-3.5 h-3.5 text-olive" />
                        <span className="text-[10px] font-bold text-olive uppercase tracking-wider">
                            Clinical Context
                        </span>
                    </div>

                    {/* Symptoms */}
                    <div className="mb-3">
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Current Symptoms <span className="text-gray-300">(optional)</span>
                        </label>
                        <input
                            type="text"
                            name="symptoms"
                            value={data.symptoms ?? ""}
                            onChange={handle}
                            disabled={disabled}
                            placeholder="e.g., persistent cough, fever, shortness of breath"
                            className={inputCls}
                        />
                    </div>

                    {/* Smoking history */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">Smoking History</label>
                        <select
                            name="smoking_history"
                            value={data.smoking_history}
                            onChange={handle}
                            disabled={disabled}
                            className={inputCls + " appearance-none"}
                        >
                            <option value="Never">Never Smoked</option>
                            <option value="Former">Former Smoker</option>
                            <option value="Current (Occasional)">Current (Occasional)</option>
                            <option value="Current (Heavy)">Current (Heavy)</option>
                        </select>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
