"use client";

import { motion } from "framer-motion";
import { UserPlus, Activity } from "lucide-react";
import type { PatientData } from "@/lib/dataset";

interface PatientFormProps {
    data: PatientData;
    onChange: (data: PatientData) => void;
    disabled?: boolean;
}

export function PatientForm({ data, onChange, disabled }: PatientFormProps) {
    const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onChange({ ...data, [e.target.name]: e.target.value });
    };

    const inputStyle: React.CSSProperties = {
        width: "100%",
        padding: "13px 16px",
        border: "1.5px solid #DDDDD5",
        borderRadius: 14,
        background: "#FFFFFF",
        color: "#1a1a1a",
        fontSize: 15,
        fontWeight: 500,
        fontFamily: "Inter, sans-serif",
        outline: "none",
        WebkitAppearance: "none",
        appearance: "none" as const,
        boxSizing: "border-box" as const,
        transition: "border-color 0.15s",
    };

    const labelStyle: React.CSSProperties = {
        display: "block",
        fontSize: 12,
        fontWeight: 700,
        color: "#555555",
        marginBottom: 8,
        textTransform: "uppercase" as const,
        letterSpacing: "0.06em",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ background: "#FFFFFF", borderRadius: 20, overflow: "hidden", border: "1px solid #E8E8E0", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        >
            {/* Header */}
            <div style={{ padding: "16px 20px", background: "#F7F7F3", borderBottom: "1px solid #EEEEEA", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg,#636B2F,#7a8438)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(99,107,47,0.3)" }}>
                    <UserPlus style={{ width: 20, height: 20, color: "#fff" }} />
                </div>
                <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: "#111111" }}>Patient Registration</h3>
                    <p style={{ fontSize: 10, color: "#636B2F", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", marginTop: 2 }}>
                        Step 1 of 2 — Clinical Demographics
                    </p>
                </div>
            </div>

            {/* Fields */}
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Name */}
                <div>
                    <label style={labelStyle}>Full Name <span style={{ color: "#DC2626" }}>*</span></label>
                    <input
                        type="text" name="name" value={data.name} onChange={handle} disabled={disabled}
                        placeholder="Enter full name"
                        style={{ ...inputStyle, border: data.name ? "1.5px solid #C5CC9A" : "1.5px solid #DDDDD5" }}
                        onFocus={e => { e.target.style.borderColor = "#636B2F"; e.target.style.boxShadow = "0 0 0 3px rgba(99,107,47,0.1)"; }}
                        onBlur={e => { e.target.style.borderColor = data.name ? "#C5CC9A" : "#DDDDD5"; e.target.style.boxShadow = "none"; }}
                    />
                </div>

                {/* Age + Gender row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                        <label style={labelStyle}>Age <span style={{ color: "#DC2626" }}>*</span></label>
                        <input
                            type="number" name="age" value={data.age} onChange={handle} disabled={disabled}
                            placeholder="Years" min="1" max="120"
                            style={inputStyle}
                            onFocus={e => { e.target.style.borderColor = "#636B2F"; e.target.style.boxShadow = "0 0 0 3px rgba(99,107,47,0.1)"; }}
                            onBlur={e => { e.target.style.borderColor = "#DDDDD5"; e.target.style.boxShadow = "none"; }}
                        />
                    </div>
                    <div>
                        <label style={labelStyle}>Gender <span style={{ color: "#DC2626" }}>*</span></label>
                        <select name="gender" value={data.gender} onChange={handle} disabled={disabled}
                            style={{ ...inputStyle, color: data.gender ? "#1a1a1a" : "#BCBCB0" }}
                            onFocus={e => { e.target.style.borderColor = "#636B2F"; e.target.style.boxShadow = "0 0 0 3px rgba(99,107,47,0.1)"; }}
                            onBlur={e => { e.target.style.borderColor = "#DDDDD5"; e.target.style.boxShadow = "none"; }}
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
                    <label style={labelStyle}>Phone <span style={{ fontSize: 10, color: "#AAAAAA", textTransform: "none" as const, letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                    <input
                        type="tel" name="phone" value={data.phone ?? ""} onChange={handle} disabled={disabled}
                        placeholder="Phone number" style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = "#636B2F"; e.target.style.boxShadow = "0 0 0 3px rgba(99,107,47,0.1)"; }}
                        onBlur={e => { e.target.style.borderColor = "#DDDDD5"; e.target.style.boxShadow = "none"; }}
                    />
                </div>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ flex: 1, height: 1, background: "#EEEEEA" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", borderRadius: 99, background: "#EEF0E0", border: "1px solid #C5CC9A" }}>
                        <Activity style={{ width: 12, height: 12, color: "#636B2F" }} />
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#636B2F", textTransform: "uppercase" as const, letterSpacing: "0.06em" }}>Clinical Context</span>
                    </div>
                    <div style={{ flex: 1, height: 1, background: "#EEEEEA" }} />
                </div>

                {/* Symptoms */}
                <div>
                    <label style={labelStyle}>Symptoms <span style={{ fontSize: 10, color: "#AAAAAA", textTransform: "none" as const, letterSpacing: 0, fontWeight: 400 }}>(optional)</span></label>
                    <input
                        type="text" name="symptoms" value={data.symptoms ?? ""} onChange={handle} disabled={disabled}
                        placeholder="Cough, fever, breathlessness..." style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = "#636B2F"; e.target.style.boxShadow = "0 0 0 3px rgba(99,107,47,0.1)"; }}
                        onBlur={e => { e.target.style.borderColor = "#DDDDD5"; e.target.style.boxShadow = "none"; }}
                    />
                </div>

                {/* Smoking */}
                <div>
                    <label style={labelStyle}>Smoking History</label>
                    <select name="smoking_history" value={data.smoking_history} onChange={handle} disabled={disabled}
                        style={inputStyle}
                        onFocus={e => { e.target.style.borderColor = "#636B2F"; e.target.style.boxShadow = "0 0 0 3px rgba(99,107,47,0.1)"; }}
                        onBlur={e => { e.target.style.borderColor = "#DDDDD5"; e.target.style.boxShadow = "none"; }}
                    >
                        <option value="Never">Never Smoked</option>
                        <option value="Former">Former Smoker</option>
                        <option value="Current (Occasional)">Current — Occasional</option>
                        <option value="Current (Heavy)">Current — Heavy</option>
                    </select>
                </div>
            </div>
        </motion.div>
    );
}
