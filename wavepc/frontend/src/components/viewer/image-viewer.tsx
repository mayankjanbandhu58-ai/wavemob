"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, Scan, Flame, Info } from "lucide-react";
import { Typewriter } from "@/components/ui/typewriter";

interface ImageViewerProps {
    preview: string | null;
    segmentationOverlay: string | null;
    heatmapOverlay: string | null;
    topDisease?: string;
}

type ViewMode = "original" | "segmentation" | "heatmap";

const diseaseInsights: Record<string, { description: string, symptoms: string }> = {
    "Atelectasis": { description: "Collapse or incomplete expansion of the lung. The highlighted heatmap area indicates regions of reduced lung volume, architectural distortion, or focal opacities characteristic of atelectatic tissue pulling against normal structures.", symptoms: "Shortness of breath, rapid and shallow breathing, coughing, low oxygen saturation." },
    "Cardiomegaly": { description: "Enlargement of the heart. The highlighted heatmap actively traces the boundaries of the cardiac silhouette, showing the AI confirming a cardiothoracic ratio exceeding 0.50.", symptoms: "Breathlessness (especially during exertion or when lying flat), heart palpitations, swelling in legs or abdomen, fatigue." },
    "Effusion": { description: "Fluid build-up between the tissues that line the lungs and the chest. The heatmap focuses on pooling patterns, often highlighting blunting of the costophrenic angles or meniscus signs at the lung bases.", symptoms: "Chest pain that worsens with deep breathing or coughing, dry cough, orthopnea, shortness of breath." },
    "Infiltration": { description: "Substance denser than air, such as pus, blood, or protein, lingering within the parenchyma. The heatmap directly isolates these ill-defined airspace opacities and dense patchy regions.", symptoms: "Fever, chills, productive cough, chest discomfort, crackles upon auscultation." },
    "Mass": { description: "A localized pulmonary opacity greater than 3 cm in diameter. The heatmap aggressively highlights the specific dense geometric structure differentiating it from diffuse infiltration.", symptoms: "Persistent cough, hemoptysis (coughing up blood), unexplained weight loss, localized chest pain, wheezing." },
    "Nodule": { description: "A small localized pulmonary opacity less than 3 cm in diameter. The heatmap pinpoints this specific focal opacity, differentiating benign-looking granulomas from potentially malignant characteristics.", symptoms: "Often asymptomatic and found incidentally. May cause a chronic cough or minor respiratory irritation if growing." },
    "Pneumonia": { description: "Infection inflaming the air sacs in one or both lungs, possibly filling them with fluid or pus. The heatmap highlights lobar or broncho-pneumonic consolidation patterns, marking areas of active infection.", symptoms: "Productive cough with yellow/green phlegm, spiking fevers, shaking chills, distinct difficulty breathing, sharp pleuritic chest pain." },
    "Pneumothorax": { description: "Collapsed lung caused by air leaking into the pleural space. The heatmap traces the displaced visceral pleural line and the peripheral radiolucent space devoid of lung markings.", symptoms: "Sudden, sharp, one-sided chest pain, sudden shortness of breath, rapid heart rate, cyanosis in severe tension cases." },
    "No Finding": { description: "No major radiological abnormalities detected. The heatmap (if present) shows low-level background attention without localized high-confidence pathology.", symptoms: "N/A" }
};

export function ImageViewer({
    preview,
    segmentationOverlay,
    heatmapOverlay,
    topDisease,
}: ImageViewerProps) {
    const [viewMode, setViewMode] = useState<ViewMode>("original");
    const [isHovering, setIsHovering] = useState(false);

    const getCurrentImage = () => {
        switch (viewMode) {
            case "segmentation":
                return segmentationOverlay || preview;
            case "heatmap":
                return heatmapOverlay || preview;
            default:
                return preview;
        }
    };

    const currentImage = getCurrentImage();

    const tabs = [
        {
            id: "original" as ViewMode,
            label: "Original",
            icon: Eye,
            available: !!preview,
        },
        {
            id: "segmentation" as ViewMode,
            label: "Segmentation",
            icon: Scan,
            available: !!segmentationOverlay,
        },
        {
            id: "heatmap" as ViewMode,
            label: "Heatmap",
            icon: Flame,
            available: !!heatmapOverlay,
        },
    ];

    return (
        <div className="rounded-2xl border border-[#e2e8f0] bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Tab Bar */}
            <div className="flex border-b border-[#e2e8f0] bg-slate-50">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => tab.available && setViewMode(tab.id)}
                        disabled={!tab.available}
                        className={`flex-1 flex items-center justify-center gap-2 py-3.5 text-xs font-bold transition-all duration-200 relative ${viewMode === tab.id
                            ? "text-[#1e3a8a] bg-white"
                            : tab.available
                                ? "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                                : "text-slate-400 cursor-not-allowed"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                        {!tab.available && tab.id !== "original" && (
                            <span className="text-[9px] text-slate-400 ml-1 border border-slate-200 px-1 rounded">N/A</span>
                        )}
                        {viewMode === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1e3a8a]"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Image Display */}
            <div
                className="relative aspect-square bg-[#f8fafc] flex items-center justify-center p-2 overflow-hidden"
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
            >
                {currentImage ? (
                    <>
                        <motion.img
                            key={viewMode}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.3 }}
                            src={currentImage}
                            alt={`Chest X-Ray - ${viewMode}`}
                            className="max-w-full max-h-full object-contain rounded-xl shadow-sm border border-slate-200 cursor-crosshair"
                        />

                        {/* Interactive Heatmap Popover */}
                        <AnimatePresence>
                            {viewMode === "heatmap" && isHovering && topDisease && topDisease !== "No Finding" && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700 p-4 rounded-xl shadow-2xl pointer-events-none"
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-indigo-500/20 rounded-lg shrink-0">
                                            <Info className="w-5 h-5 text-indigo-400" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-sm mb-1">{topDisease} Highlight Region</h4>
                                            <div className="text-slate-300 text-xs leading-relaxed mb-3 h-[60px]">
                                                <Typewriter
                                                    text={diseaseInsights[topDisease]?.description || "The highlighted region indicates active consideration by the Grad-CAM tensor network."}
                                                    speed={20}
                                                />
                                            </div>

                                            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700/50">
                                                <h5 className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Common Clinical Symptoms</h5>
                                                <div className="text-slate-200 text-xs italic">
                                                    <Typewriter
                                                        text={diseaseInsights[topDisease]?.symptoms || "Symptoms vary by patient."}
                                                        delay={1000}
                                                        speed={20}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-2 border border-slate-200">
                            <Eye className="w-8 h-8 text-slate-300" />
                        </div>
                        <p className="text-sm font-medium">No image loaded</p>
                    </div>
                )}
            </div>
        </div>
    );
}
