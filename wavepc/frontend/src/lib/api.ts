/**
 * Wavelength API Client
 *
 * Handles communication with the FastAPI backend.
 */

import type { PredictionResponse, BatchResponse, Report, PatientDetails } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

/**
 * Analyze a single chest X-ray image.
 */
export async function predictImage(file: File, patientDetails?: PatientDetails): Promise<PredictionResponse> {
    const formData = new FormData();
    formData.append("file", file);

    if (patientDetails) {
        if (patientDetails.name) formData.append("patient_name", patientDetails.name);
        if (patientDetails.age) formData.append("patient_age", patientDetails.age);
        if (patientDetails.gender) formData.append("patient_gender", patientDetails.gender);
        if (patientDetails.phone) formData.append("patient_phone", patientDetails.phone);
        if (patientDetails.address) formData.append("patient_address", patientDetails.address);
    }

    const response = await fetch(`${API_BASE}/predict`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Analyze multiple chest X-ray images.
 */
export async function batchPredict(files: File[]): Promise<BatchResponse> {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append("files", file);
    });

    const response = await fetch(`${API_BASE}/batch-predict`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unknown error" }));
        throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
}

/**
 * Retrieve a generated report.
 */
export async function getReport(reportId: string): Promise<Report> {
    const response = await fetch(`${API_BASE}/report/${reportId}`);

    if (!response.ok) {
        throw new Error(`Report not found: ${reportId}`);
    }

    return response.json();
}

/**
 * Retrieve all generated reports.
 */
export async function getReports(): Promise<Report[]> {
    const response = await fetch(`${API_BASE}/reports`);

    if (!response.ok) {
        throw new Error("Failed to fetch reports");
    }

    const data = await response.json();
    return data.reports || [];
}

/**
 * Download PDF report.
 */
export async function downloadReportPdf(reportId: string): Promise<Blob> {
    const response = await fetch(`${API_BASE}/report/${reportId}/pdf`);

    if (!response.ok) {
        throw new Error("Failed to download PDF");
    }

    return response.blob();
}

/**
 * Fetch demographic risk analytics from NIH dataset.
 */
export async function getDemographics(ageGroup: string = "all", gender: string = "all"): Promise<{ pathology_distribution: { name: string, percentage: number, value: number }[], total_cases: number }> {
    const params = new URLSearchParams();
    if (ageGroup !== "all") params.append("age_group", ageGroup);
    if (gender !== "all") params.append("gender", gender);

    const qs = params.toString();
    const url = `${API_BASE}/analytics/demographics${qs ? "?" + qs : ""}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to fetch demographics");
    }
    return response.json();
}

/**
 * Fetch ML-synthesized demographic risk alert from NIH dataset via Ollama.
 */
export async function getDemographicRiskAlert(age: string, gender: string): Promise<{ alert: string }> {
    const params = new URLSearchParams();
    if (age) params.append("age", age);
    if (gender) params.append("gender", gender);

    const qs = params.toString();
    const url = `${API_BASE}/analytics/demographic-risk${qs ? "?" + qs : ""}`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error("Failed to fetch demographic risk alert");
    }
    return response.json();
}

/**
 * Fetch Socratic tutor feedback from Mistral 7B.
 */
export async function getTutorFeedback(guess: string, trueLabel: string, desc: string): Promise<{ feedback: string }> {
    const response = await fetch(`${API_BASE}/analytics/tutor`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guess, true_label: trueLabel, desc }),
    });

    if (!response.ok) {
        throw new Error("Failed to fetch tutor feedback");
    }
    return response.json();
}

/**
 * Send a message to the Global AI Assistant.
 */
export async function sendChatMessage(message: string, history: { role: string, content: string }[] = []): Promise<{ reply: string }> {
    const response = await fetch(`${API_BASE}/analytics/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
    });

    if (!response.ok) {
        throw new Error("Chat sequence failed");
    }
    return response.json();
}

/**
 * Fetch Disease Progression Timeline data.
 */
export async function getDiseaseProgression(disease: string): Promise<{ stages: { stage: string, url: string }[], explanation: string, error?: string }> {
    const params = new URLSearchParams({ disease });
    const response = await fetch(`${API_BASE}/analytics/progression?${params.toString()}`);
    if (!response.ok) throw new Error("Failed to fetch progression");
    return response.json();
}

/**
 * Check API health.
 */
export async function checkHealth(): Promise<{ status: string; models_ready: boolean }> {
    const response = await fetch(`${API_BASE.replace("/api", "")}/health`);
    return response.json();
}
