/**
 * Wavelength API Type Definitions
 */

export interface PatientDetails {
  name?: string;
  age?: string;
  gender?: string;
  phone?: string;
  address?: string;
  symptoms?: string;
  smoking_history?: string;
}

export interface Justification {
  primary_evidence: string;
  dataset_origin: string;
  confidence_interval: string;
  threshold_calibration: string;
  reference_images?: {
    url: string;
    caption: string;
  }[];
}

export interface DiseaseMap {
  Atelectasis: number;
  Cardiomegaly: number;
  Effusion: number;
  Infiltration: number;
  Mass: number;
  Nodule: number;
  Pneumonia: number;
  Pneumothorax: number;
  [key: string]: number;
}

export interface RiskAssessment {
  risk_score: number;
  risk_level: "Low Risk" | "Moderate Risk" | "High Suspicion";
  risk_color: string;
  severity_index: number;
  severity_grade: "Mild" | "Moderate" | "Severe";
  dominant_findings: Array<{
    disease: string;
    probability: number;
    severity_weight: number;
  }>;
  recommendation: string;
}

export interface UncertaintyData {
  overall_uncertainty: "low" | "moderate" | "high";
  mean_variance: number;
  per_disease: Array<{
    disease: string;
    variance: number;
    is_uncertain: boolean;
  }>;
}

export interface Report {
  report_id: string;
  timestamp: string;
  model_version: string;
  calibrated: boolean;
  disease_probabilities: DiseaseMap;
  differential_diagnoses?: Array<{
    disease: string;
    probability: number;
    icd10: string;
  }>;
  justifications?: Record<string, Justification>;
  risk_assessment: RiskAssessment;
  uncertainty: UncertaintyData;
  disclaimer: string;
  verification_status?: "pending_review" | "approved" | "overridden";
  reviewer_notes?: string;
  ai_summary?: string;
  ai_second_opinion?: string;
  patient_details?: PatientDetails;
  inference_time_ms?: number;
  ai_patient_summary?: string;
  images?: {
    original: string | null;
    segmentation_overlay: string | null;
    heatmap: string | null;
  };
  similar_cases?: {
    filename: string;
    diagnosis: string;
    age: string;
    gender: string;
    similarity: number;
    url: string;
  }[];
}

export interface PredictionResponse {
  success: boolean;
  inference_time_ms: number;
  report_id: string;
  disease_probabilities: DiseaseMap;
  differential_diagnoses?: Array<{
    disease: string;
    probability: number;
    icd10: string;
  }>;
  justifications?: Record<string, Justification>;
  risk_assessment: RiskAssessment;
  uncertainty: UncertaintyData;
  calibrated: boolean;
  ai_summary?: string;
  ai_patient_summary?: string;
  ai_second_opinion?: string;
  images: {
    original: string | null;
    segmentation_overlay: string | null;
    heatmap: string | null;
  };
  report: Report;
  similar_cases?: {
    filename: string;
    diagnosis: string;
    age: string;
    gender: string;
    similarity: number;
    url: string;
  }[];
}

export interface BatchResult {
  filename: string;
  success: boolean;
  error?: string;
  disease_probabilities?: DiseaseMap;
  risk_assessment?: RiskAssessment;
}

export interface BatchResponse {
  success: boolean;
  total: number;
  processed: number;
  results: BatchResult[];
}

export interface ScanRecord {
  id: string;
  timestamp: string;
  patientName: string;
  result: PredictionResponse;
  preview: string;
}
