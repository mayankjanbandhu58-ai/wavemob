// ─────────────────────────────────────────────────────────────
//  Dataset utilities for Wavelength AI mobile demo
//  All "AI" data is simulated from the filename & patient info
// ─────────────────────────────────────────────────────────────

export interface PatientData {
    name: string;
    age: string;
    gender: string;
    phone?: string;
    address?: string;
    symptoms?: string;
    smoking_history: "Never" | "Former" | "Current (Occasional)" | "Current (Heavy)";
}

export interface DiseaseScore {
    disease: string;
    icon: string;
    probability: number;
    isUncertain: boolean;
    icd10: string;
}

export interface SimulatedReport {
    patientData: PatientData;
    fileName: string;
    riskLevel: "High Suspicion" | "Moderate Risk" | "Low Risk";
    riskColor: "red" | "amber" | "green";
    diseases: DiseaseScore[];
    topDisease: string;
    confidenceScore: number;
    inferenceTimeMs: number;
    aiSummaryClinical: string;
    aiSummaryPatient: string;
    clinicalGuideline: string;
    reportId: string;
    pdfUrl: string;
}

// ── Terminal logs shown during analysis animation ────────────
export const TERMINAL_LOGS: { time: string; text: string }[] = [
    { time: "00:00", text: "Initializing Wavelength inference pipeline..." },
    { time: "00:00", text: "Loading DenseNet-121 + EfficientNet-B4 ensemble weights..." },
    { time: "00:01", text: "Applying CLAHE histogram normalization..." },
    { time: "00:01", text: "Detecting lung field boundaries via U-Net segmentation..." },
    { time: "01:02", text: "Running multi-label pathology classifier (14 classes)..." },
    { time: "01:05", text: "Generating Grad-CAM++ activation heatmaps..." },
    { time: "01:08", text: "Applying Monte Carlo Dropout (n=50 passes)..." },
    { time: "01:12", text: "Calibrating risk probabilities via Platt scaling..." },
    { time: "01:15", text: "Scoring pathological confidence intervals..." },
    { time: "02:00", text: "Synthesizing clinical narrative via LLM..." },
    { time: "02:05", text: "Generating differential diagnosis mapping..." },
    { time: "02:08", text: "Compiling structured PDF report..." },
    { time: "02:10", text: "✓ Analysis complete. Report ID generated." },
];

// ── Disease metadata ─────────────────────────────────────────
const DISEASES = [
    { name: "Pneumonia", icon: "🦠", icd10: "J18.9" },
    { name: "Infiltration", icon: "🔬", icd10: "J98.4" },
    { name: "Atelectasis", icon: "🫁", icd10: "J98.11" },
    { name: "Effusion", icon: "💧", icd10: "J90" },
    { name: "Cardiomegaly", icon: "❤️", icd10: "I51.7" },
    { name: "Nodule", icon: "🔴", icd10: "R91.1" },
    { name: "Mass", icon: "⭕", icd10: "R91.8" },
    { name: "Pneumothorax", icon: "💨", icd10: "J93.9" },
];

// ── Seeded pseudo-random from string ─────────────────────────
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash);
}

function seededRandom(seed: number, index: number): number {
    const x = Math.sin(seed + index * 9301 + 49297) * 233280;
    return x - Math.floor(x);
}

// ── Derive risk from filename ─────────────────────────────────
function getRiskFromFilename(name: string): "High Suspicion" | "Moderate Risk" | "Low Risk" {
    const lower = name.toLowerCase();
    if (lower.includes("high") || lower.includes("sus")) return "High Suspicion";
    if (lower.includes("mod") || lower.includes("moderate") || lower.includes(" m")) return "Moderate Risk";
    return "Low Risk";
}

// ── Generate simulated disease scores ─────────────────────────
function generateDiseaseScores(filename: string, risk: "High Suspicion" | "Moderate Risk" | "Low Risk"): DiseaseScore[] {
    const seed = hashString(filename);

    return DISEASES.map((d, i) => {
        let raw = seededRandom(seed, i);

        // Bias scores based on risk level
        if (risk === "High Suspicion") {
            raw = i < 3 ? raw * 0.4 + 0.55 : raw * 0.35;  // first 3 conditions are high
        } else if (risk === "Moderate Risk") {
            raw = i < 2 ? raw * 0.3 + 0.35 : raw * 0.3;
        } else {
            raw = raw * 0.25;  // all low
        }

        // clip to [0.01, 0.98]
        const probability = Math.min(0.98, Math.max(0.01, raw));
        return {
            disease: d.name,
            icon: d.icon,
            probability,
            isUncertain: probability > 0.3 && probability < 0.55,
            icd10: d.icd10,
        };
    }).sort((a, b) => b.probability - a.probability);
}

// ── AI narrative texts ───────────────────────────────────────
const CLINICAL_NARRATIVES: Record<"High Suspicion" | "Moderate Risk" | "Low Risk", string> = {
    "High Suspicion": `## Primary Findings\n\nThe ensemble model identifies **high-probability pathological findings** in this radiograph. Multiple focal areas of parenchymal consolidation are noted in the lower lung zones bilaterally. The pattern is consistent with **lobar pneumonia** with possible superimposed interstitial infiltration.\n\n## Radiological Assessment\n\nGrad-CAM activation heatmaps demonstrate peak attention in the right lower lobe, with secondary foci in the left mid-zone. The cardiomediastinal silhouette appears mildly enlarged. No overt pneumothorax is identified, though subtle pleural effusion cannot be excluded.\n\n## Clinical Correlation\n\nUrgent clinical correlation is recommended. The pattern warrants **immediate attention**. Sputum culture, CBC, CRP and PCT measurements are advised. Consider referral to pulmonology if symptoms persist beyond 48h of antibiotic therapy.`,
    "Moderate Risk": `## Primary Findings\n\nThe ensemble model identifies **moderate-probability findings** warranting clinical attention. Subtle interstitial markings are present bilaterally, with mild perihilar prominence. The pattern may represent early pneumonic consolidation or atypical infection.\n\n## Radiological Assessment\n\nGrad-CAM activation maps show distributed attention across bilateral lung fields with emphasis on the perihilar regions. No significant cardiomegaly is detected. Costophrenic angles are preserved. No pleural effusion.\n\n## Clinical Correlation\n\nCorrelation with clinical symptoms and laboratory findings is recommended. Repeat radiograph in **48–72 hours** if symptomatic. Broad-spectrum antibiotics may be considered empirically based on clinical presentation.`,
    "Low Risk": `## Primary Findings\n\nThe ensemble model identifies **low-probability pathological findings**. The lung parenchyma appears clear bilaterally. No focal consolidation, effusion, or pleural abnormality is detected.\n\n## Radiological Assessment\n\nGrad-CAM activation maps show uniformly distributed attention with no high-probability foci. Cardiac silhouette is within normal limits. Visualized bony thorax is intact. No acute cardiopulmonary abnormality identified.\n\n## Clinical Correlation\n\nNo immediate radiological intervention required. Continue clinical monitoring as per standard protocol. Repeat imaging only if clinical status deteriorates.`,
};

const PATIENT_NARRATIVES: Record<"High Suspicion" | "Moderate Risk" | "Low Risk", string> = {
    "High Suspicion": `## What We Found\n\nThe AI system has detected signs that look **concerning** in your chest X-ray. There are some cloudy areas in your lungs that suggest a possible **lung infection** (pneumonia).\n\n## What This Means\n\nYour lungs are showing signs that need **prompt attention from a doctor**. This does not mean there is definitely something seriously wrong, but it does mean a qualified physician should review these findings as soon as possible.\n\n## Next Steps\n\nPlease **see a doctor today or go to the nearest clinic**. Mention this report to them. They may want to do additional blood tests or a follow-up scan.`,
    "Moderate Risk": `## What We Found\n\nThe AI system has found some mild changes in your chest X-ray that **could indicate an early infection or inflammation**. The findings are not severe, but they need attention.\n\n## What This Means\n\nYou may have an early-stage lung issue that a doctor should look into. With the right care, these conditions are very manageable.\n\n## Next Steps\n\nPlease **schedule an appointment with your doctor within the next 1–2 days**. Bring this report with you. Rest, stay hydrated, and monitor your symptoms.`,
    "Low Risk": `## What We Found\n\nGreat news — the AI system has found **no significant changes** in your chest X-ray. Your lungs appear clear and healthy.\n\n## What This Means\n\nThere are no immediate signs of pneumonia, infection, or other major lung conditions at this time.\n\n## Next Steps\n\nNo immediate action is required. Continue your usual health routines. If you feel unwell despite this result, consult a doctor — symptoms are always important even when imaging looks normal.`,
};

const GUIDELINES: Record<"High Suspicion" | "Moderate Risk" | "Low Risk", string> = {
    "High Suspicion": "START empirical broad-spectrum antibiotics (e.g., Amoxicillin-Clavulanate + Azithromycin). Order CBC, CRP, and sputum culture immediately. Admit to observation if O₂ saturation falls below 95%.",
    "Moderate Risk": "Consider empirical antibiotic therapy. Order CBC and CRP. Schedule follow-up chest X-ray in 48–72 hours. If fever persists, escalate to higher-spectrum antibiotics.",
    "Low Risk": "No immediate antibiotic therapy indicated. Supportive care recommended. Follow-up only if symptoms worsen. Standard respiratory hygiene advised.",
};

// ── Generate a unique report ID from filename ─────────────────
function generateReportId(filename: string): string {
    const seed = hashString(filename).toString(16).toUpperCase().padStart(8, "0");
    return `WL-${seed.slice(0, 4)}-${seed.slice(4, 8)}`;
}

// ── Main export: generate full simulated report ───────────────
export function generateSimulatedReport(
    filename: string,
    patientData: PatientData
): SimulatedReport {
    const risk = getRiskFromFilename(filename);
    const diseases = generateDiseaseScores(filename, risk);
    const topDisease = diseases[0].disease;
    const seed = hashString(filename);
    const confidenceScore = 85 + seededRandom(seed, 99) * 12; // 85–97%
    const inferenceTimeMs = 1800 + Math.floor(seededRandom(seed, 100) * 800); // 1800–2600ms

    return {
        patientData,
        fileName: filename,
        riskLevel: risk,
        riskColor: risk === "High Suspicion" ? "red" : risk === "Moderate Risk" ? "amber" : "green",
        diseases,
        topDisease,
        confidenceScore,
        inferenceTimeMs,
        aiSummaryClinical: CLINICAL_NARRATIVES[risk],
        aiSummaryPatient: PATIENT_NARRATIVES[risk],
        clinicalGuideline: GUIDELINES[risk],
        reportId: generateReportId(filename),
        pdfUrl: `/dataset/reports/${encodeURIComponent(filename.replace(/\.(png|jpg|jpeg)$/i, ""))}.pdf`,
    };
}

// ── Simple helpers ────────────────────────────────────────────
export function getReportUrl(imageFilename: string): string {
    const base = imageFilename.replace(/\.(png|jpg|jpeg)$/i, "");
    return `/dataset/reports/${encodeURIComponent(base)}.pdf`;
}

export function getDisplayName(imageFilename: string): string {
    return imageFilename.replace(/\.(png|jpg|jpeg)$/i, "").replace(/_/g, " ");
}
