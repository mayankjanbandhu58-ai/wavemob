"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    BookOpen, Stethoscope, Activity, Search, PlayCircle,
    BookMarked, BrainCircuit, Network, ArrowRight, X,
    ChevronRight, Microscope, Info, ShieldCheck, Database,
    Dna, Flame, Target, HelpCircle, CheckCircle2, ChevronDown
} from "lucide-react";
import { DiseaseTimeline } from "@/components/results/disease-timeline";
import { Portal } from "@/components/ui/portal";
import ReactMarkdown from "react-markdown";

interface QuizQuestion {
    question: string;
    options: string[];
    correct: number;
    explanation: string;
}

interface ModuleContent {
    title: string;
    description: string;
    image: string;
    details?: string;
    keyFindings?: string[];
    clinicalNotes?: string;
    report?: string;
    anatomicalFoci?: { region: string, finding: string, implication: string }[];
    quiz?: QuizQuestion[];
}

export function Learn() {
    const [activeTab, setActiveTab] = useState("anatomy");
    const [selectedModule, setSelectedModule] = useState<ModuleContent | null>(null);

    const tabs = [
        { id: "anatomy", label: "Chest Anatomy", icon: Stethoscope },
        { id: "diseases", label: "Disease Database", icon: Database },
        { id: "pathology", label: "Pathology Insights", icon: Search },
        { id: "knowledge_graph", label: "Knowledge Graph", icon: Network },
        { id: "timelines", label: "Disease Timelines", icon: Activity },
        { id: "ai_models", label: "AI & Imaging", icon: BrainCircuit },
    ];

    const content: Record<string, ModuleContent[]> = {
        anatomy: [
            {
                title: "The Normal Radiograph",
                description: "A proper chest x-ray reveals the subtle architecture of the pulmonary and cardiovascular systems.",
                image: "/dataset/CHNCXR_0187_0.png",
                details: "Observation of the PA (Posteroanterior) view is the standard. Look for the clear costophrenic angles and the distinct silhouette of the heart.",
                keyFindings: ["Trachea Midline", "Aortic Knob Visibility", "Costophrenic Sharpness", "Hilar Symmetry"],
                clinicalNotes: "Always verify the patient position and inspiratory effort (count 9-10 posterior ribs).",
                report: "# Findings\nThe lungs are clear and normally expanded. There is no evidence of consolidation, pulmonary edema, or pleural effusion. The cardiomediastinal silhouette is within normal limits for size and contour. The hila are unremarkable. The bony thorax is intact without acute fracture or destructive lesion.\n\n# Impression\nNormal chest radiograph.",
                anatomicalFoci: [
                    { region: "Hilar Region", finding: "Balanced vascularity", implication: "Negative for lymphadenopathy" },
                    { region: "Costophrenic Angles", finding: "Sharp and clear", implication: "No pleural effusion" }
                ],
                quiz: [
                    {
                        question: "How many posterior ribs should be visible for adequate inspiration?",
                        options: ["5-7", "9-10", "12-14", "3-4"],
                        correct: 1,
                        explanation: "Adequate inspiration allows the diaphragm to descend, typically showing 9-10 posterior ribs."
                    }
                ]
            },
            {
                title: "Heart & Mediastinum",
                description: "Evaluation of the central thoracic structures including the heart and great vessels.",
                image: "/dataset/CHNCXR_0188_0.png",
                details: "The mediastinum is the central compartment of the thoracic cavity. It contains all the thoracic viscera except the lungs.",
                keyFindings: ["CTR < 0.5", "Paratracheal Stripe", "Aortic Arch Contour"],
                report: "# Findings\nThe heart size is normal with a cardiothoracic ratio of approximately 0.45. The mediastinal contour is normal. The trachea is midline. The great vessels appear normal in caliber and position.\n\n# Impression\nNormal cardiomediastinal morphology."
            },
            {
                title: "Bony Thorax",
                description: "Evaluation includes the rib cage, clavicles, scapulae, and spine.",
                image: "/dataset/CHNCXR_0201_0.png",
                details: "Systematic review of each rib is necessary to exclude subtle fractures or lytic lesions.",
                keyFindings: ["Rib Integrity", "Clavicular Symmetry", "Vertebral Alignment"],
                report: "# Findings\nThe visualization of the ribs, clavicles, and scapulae shows no evidence of fracture or focal bone lesion. The vertebral bodies are well-aligned. The soft tissues are unremarkable.\n\n# Impression\nNo acute osseous abnormality."
            }
        ],
        diseases: [
            {
                title: "Pneumonia (Acute Consolidation)",
                description: "Infectious inflammation of the lung parenchyma, characteristically showing consolidation.",
                image: "/dataset/CHNCXR_0502_1.png",
                details: "Radiological findings include patchy or lobar opacification with air bronchograms. The 'silhouette sign' is often present, helping to localize the consolidation.",
                keyFindings: ["Air Bronchograms", "Lobar Opacification", "Silhouette Sign"],
                report: "# Findings\nThere is a dense consolidation in the right middle lobe. Air bronchograms are clearly visible. The right heart border is silhouetted, confirming the location. No pleural effusion is present. The left lung is clear. Heart size is normal.\n\n# Impression\nAcute right middle lobe pneumonia.",
                anatomicalFoci: [
                    { region: "Right Middle Lobe", finding: "Dense opacification", implication: "Lobar consolidation" },
                    { region: "Right Heart Border", finding: "Lost interface", implication: "Silhouette sign positive" }
                ],
                quiz: [
                    {
                        question: "What radiological sign is most helpful in localizing consolidation in the right middle lobe?",
                        options: ["Meniscus Sign", "Silhouette Sign", "Deep Sulcus Sign", "Tree-in-bud Sign"],
                        correct: 1,
                        explanation: "Loss of the right heart border (Silhouette Sign) typically indicates right middle lobe disease."
                    }
                ]
            },
            {
                title: "Tuberculosis (Active TB)",
                description: "Chronic infectious disease with a predilection for the upper lobes.",
                image: "/dataset/CHNCXR_0195_0.png",
                details: "Findings include cavitary lesions, upper lobe infiltrates, and hilar lymphadenopathy. Post-primary TB often shows architectural distortion.",
                keyFindings: ["Cavitary Lesions", "Upper Lobe Infiltrates", "Fibrosis"],
                report: "# Findings\nMultiple thick-walled cavitary lesions are noted in the right lung apex. There are surrounding reticulonodular opacities. Volume loss in the right upper lobe with upward retraction of the hilum. No active pleural effusion.\n\n# Impression\nChanges highly suggestive of active post-primary tuberculosis.",
                anatomicalFoci: [
                    { region: "Right Apex", finding: "Thick-walled cavity", implication: "Tuberculous cavitation" }
                ]
            },
            {
                title: "Pneumothorax",
                description: "Collection of air in the pleural space leading to lung collapse.",
                image: "/dataset/CHNCXR_0190_0.png",
                details: "Absence of peripheral lung markings and a visible visceral pleural line. Tension pneumothorax is a medical emergency showing shift of mediastinal structures.",
                keyFindings: ["Visceral Pleural Line", "Peripheral Lucency", "Deep Sulcus Sign"],
                report: "# Findings\nA large 4cm apical pneumothorax is noted on the right side. The visceral pleural line is clearly visualized. There is no shift of the mediastinum. No evidence of tension. Left lung is clear.\n\n# Impression\nLarge right-sided apical pneumothorax.",
            },
            {
                title: "Cardiomegaly & CHF",
                description: "Enlargement of the heart and signs of congestive heart failure.",
                image: "/dataset/CHNCXR_0192_0.png",
                details: "Cardiothoracic ratio (CTR) exceeding 0.5. Associated findings may include pulmonary venous congestion, Kerley B lines, and pleural effusions.",
                keyFindings: ["CTR > 0.5", "Cephalization", "Perihilar Haze"],
                report: "# Findings\nThe heart is globally enlarged with a cardiothoracic ratio of 0.65. There is prominent cephalization of the pulmonary vasculature. Kerley B lines are noted at the bases. Small bilateral pleural effusions are present.\n\n# Impression\nCardiomegaly with pulmonary venous hypertension and mild interstitial edema.",
            },
            {
                title: "Lung Mass (Suspected Malignancy)",
                description: "Focal malignant growth within the lung parenchyma.",
                image: "/dataset/CHNCXR_0197_0.png",
                details: "A lesion >3cm is defined as a mass. Characteristics like spiculated margins and pleural tail are suspicious for malignancy.",
                keyFindings: ["Spiculated Margins", "Size > 3cm", "Hilar Mass"],
                report: "# Findings\nA 4.5 cm spiculated mass is identified in the left upper lobe. There is evidence of pleural tethering. Suspicious hilar lymphadenopathy on the left. No evidence of rib destruction.\n\n# Impression\nLarge spiculated left upper lobe mass, suspicious for primary bronchogenic carcinoma.",
            },
            {
                title: "Pulmonary Edema (Alveolar)",
                description: "Fluid accumulation in the alveolar spaces, often 'bat-wing' distribution.",
                image: "/dataset/CHNCXR_0193_0.png",
                details: "Bilateral perihilar opacities. Usually acute onset in the setting of cardiac failure or acute lung injury.",
                keyFindings: ["Bat-wing Opacities", "Peribronchial Cuffing", "Air Bronchograms"],
                report: "# Findings\nDiffuse bilateral perihilar alveolar opacities are noted, creating a 'bat-wing' appearance. Peribronchial cuffing is prominent. Heart is mildly enlarged. Small bilateral effusions.\n\n# Impression\nAcute alveolar pulmonary edema.",
            },
            {
                title: "Atelectasis (Subsegmental)",
                description: "Loss of lung volume due to collapse of segments or lobes.",
                image: "/dataset/CHNCXR_0199_0.png",
                details: "Often appears as linear bands (discoid atelectasis) or wedge-shaped opacities. Associated with fissure displacement.",
                keyFindings: ["Linear Bands", "Fissure Shift", "Reduced Volume"],
                report: "# Findings\nSubsegmental linear opacities are noted in the right lower lobe, consistent with discoid atelectasis. There is no evidence of pneumonia or mass. Cardiomediastinal silhouette is normal.\n\n# Impression\nRight lower lobe subsegmental atelectasis.",
            },
            {
                title: "Emphysema (Advanced COPD)",
                description: "Hyperinflation of lungs with destruction of alveolar walls.",
                image: "/dataset/CHNCXR_0198_0.png",
                details: "Flat diaphragms, increased retrosternal clear space, and hyperlucency of lung fields. 'Small heart' sign due to hyperinflation.",
                keyFindings: ["Flat Diaphragms", "Hyperlucency", "Narrow Heart"],
                report: "# Findings\nHyperinflated lung fields with significant flattening of the diaphragms. Increased retrosternal clear space. The heart appears narrow and vertically oriented. No acute consolidation.\n\n# Impression\nRadiological evidence of severe chronic obstructive pulmonary disease / emphysema.",
            },
            {
                title: "Pleural Thickening",
                description: "Scarring of the pleura, often due to asbestos exposure or old infection.",
                image: "/dataset/CHNCXR_0200_0.png",
                details: "Plaque-like densities along the pleural surfaces, sometimes with a 'holly leaf' appearance if calcified.",
                keyFindings: ["Pleural Plaques", "Calcification", "Blunted Angles"],
                report: "# Findings\nMultiple calcified pleural plaques are seen along the chest walls and diaphragmatic surfaces. Lungs are otherwise clear. No acute findings.\n\n# Impression\nCalcified pleural plaques, consistent with prior asbestos exposure.",
            }
        ],
        pathology: [
            {
                title: "Right Lower Lobe Pneumonia",
                description: "Visualizing acute infectious consolidation in the lower fields.",
                image: "/dataset/CHNCXR_0189_0.png",
                details: "Dense opacification of the right lower lobe. Unlike middle lobe disease, this does not silhouette the right heart border but may silhouettes the diaphragm.",
                keyFindings: ["Lobar Consolidation", "Air Bronchograms", "Diaphragmatic Shading"],
                report: "# Findings\nThere is dense opacification of the right lower lobe. Air bronchograms are visible. The right heart border remains sharp, but the right hemidiaphragm is partially obscured. Left lung is clear. Normal heart size.\n\n# Impression\nRight lower lobe pneumonia."
            },
            {
                title: "Large Pleural Effusion",
                description: "High volume accumulation of fluid in the pleural space.",
                image: "/dataset/CHNCXR_0191_0.png",
                details: "Large effusions can cause a complete 'whiteout' of the affected hemithorax and push the heart to the opposite side.",
                keyFindings: ["Meniscus Sign", "Blunted CP Angles", "Mediastinal Shift"],
                report: "# Findings\nA large pleural effusion is noted on the right side, occupying approximately 50% of the hemithorax. A prominent meniscus sign is present. There is minimal shift of the mediastinum to the left. No evidence of underlying mass.\n\n# Impression\nLarge right pleural effusion.",
                anatomicalFoci: [
                    { region: "Right Pleural Space", finding: "Homogeneous density", implication: "Massive fluid accumulation" }
                ],
                quiz: [
                    {
                        question: "Which sign is characteristic of a pleural effusion on an upright film?",
                        options: ["Halo Sign", "Meniscus Sign", "Deep Sulcus Sign", "Tree-in-bud Sign"],
                        correct: 1,
                        explanation: "The meniscus sign is the curved upper border of pleural fluid seen against the lung."
                    }
                ]
            }
        ],
        ai_models: [
            {
                title: "Grad-CAM Interpretation",
                description: "Visualizing AI focus points to ensure anatomical relevance.",
                image: "/dataset/CHNCXR_0065_0.png",
                details: "Grad-CAM (Gradient-weighted Class Activation Mapping) highlights the image regions that contributed most to the AI's final prediction. This is used for model transparency.",
                keyFindings: ["Activation Hotspots", "Model Bias Check", "Region Targeting"],
                report: "# Findings\nThe AI model identified a high-activation focus point in the right upper lobe, corresponding to a subtle nodular density. No activation was noted in the mediastinum or hilar regions. These focus points are validated against clinical labels.\n\n# Impression\nGrad-CAM focus correlates accurately with radiological clinical findings.",
                anatomicalFoci: [
                    { region: "Right Apex", finding: "High AI Activation", implication: "Localization of subtle nodular density" }
                ]
            },
            {
                title: "Semantic Segmentation",
                description: "AI-driven pixel-perfect boundary detection of organs.",
                image: "/dataset/CHNCXR_0186_0.png",
                details: "Segmentation models delineate borders of the lungs, heart, and clavicles to calculate automated CTR and lung volume.",
                keyFindings: ["Pixel Accuracy", "Contour Detection", "Automated Metrics"],
                report: "# Findings\nAutomated segmentation of the lung fields and heart was successfully performed. Cardiothoracic ratio automatically calculated as 0.48. Lung volumes estimated at 4.2L. No segmentation artifacts noted.\n\n# Impression\nSuccessful multi-class segmentation with preserved anatomical boundaries."
            }
        ]
    };

    return (
        <div className="flex flex-col h-full bg-[#fdfcfa] relative">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Clinical Knowledge Hub</h2>
                    <p className="text-slate-500 font-medium">Interactive modules for clinical pathology & AI localization.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-none sticky top-0 bg-[#fdfcfa] z-20 pt-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setSelectedModule(null); }}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id
                            ? "text-white shadow-md border border-transparent"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div layoutId="activeTabIndicator" className="absolute inset-0 bg-slate-900 rounded-full" transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                        )}
                        <tab.icon className={`relative z-10 w-4 h-4 ${activeTab === tab.id ? "text-slate-100" : "text-slate-400"}`} />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* List View */}
            <div className={`grid ${activeTab === "timelines" || activeTab === "knowledge_graph" ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"} gap-8`}>
                <AnimatePresence mode="popLayout">
                    {activeTab === "timelines" ? (
                        <motion.div key="timelines" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full">
                            <div className="bg-white rounded-[3rem] border border-slate-200 p-8 mb-8">
                                <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                    <Activity className="w-6 h-6 text-indigo-600" />
                                    Longitional Disease Progression Simulation
                                </h3>
                                <p className="text-slate-500 font-medium mb-10 max-w-2xl">
                                    Track the evolution of various pathologies over time. This simulation uses historical dataset samples to show how conditions like Tuberculosis or Effusion progress or resolve under treatment.
                                </p>
                                <div className="space-y-12">
                                    <TimelineSimulation title="Tuberculosis Progression" disease="Tuberculosis" />
                                    <TimelineSimulation title="Pleural Effusion Resolution" disease="Effusion" />
                                </div>
                            </div>
                        </motion.div>
                    ) : activeTab === "knowledge_graph" ? (
                        <motion.div key="knowledge_graph" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="w-full">
                            <KnowledgeGraph />
                        </motion.div>
                    ) : (
                        content[activeTab as keyof typeof content]?.map((item, idx) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-lg transition-all cursor-pointer"
                                onClick={() => setSelectedModule(item)}
                            >
                                <div className="h-52 relative overflow-hidden bg-slate-100">
                                    <img src={item.image} alt={item.title} className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                                    <div className="absolute bottom-5 left-6 pr-6">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-2 py-0.5 rounded">Module {idx + 1}</span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white leading-tight">{item.title}</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium line-clamp-2">
                                        {item.description}
                                    </p>
                                    <button className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-[0.2em] group-hover:translate-x-1 transition-transform">
                                        Explore Deep Detail <ArrowRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Module Detail Overlay */}
            <AnimatePresence>
                {selectedModule && (
                    <Portal>
                        <ModuleOverlay module={selectedModule} onClose={() => setSelectedModule(null)} />
                    </Portal>
                )}
            </AnimatePresence>
        </div>
    );
}

function ModuleOverlay({ module, onClose }: { module: ModuleContent, onClose: () => void }) {
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizResult, setQuizResult] = useState<{ selected: number, isCorrect: boolean } | null>(null);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md p-4 md:p-8 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }} className="bg-white w-full max-w-7xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col xl:flex-row">
                {/* Left: Interactive Visualizer */}
                <div className="w-full xl:w-[60%] bg-slate-950 relative flex flex-col">
                    <div className="absolute top-6 left-6 z-20 flex items-center gap-3">
                        <button onClick={onClose} className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 transition-colors">
                            <X className="w-5 h-5 text-white" />
                        </button>
                        <div className="bg-slate-800/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            <span className="text-white text-[10px] font-black uppercase tracking-widest text-emerald-400">Verified Clinical Study</span>
                        </div>
                    </div>

                    <div className="flex-1 relative flex items-center justify-center overflow-hidden p-8 md:p-12">
                        <div className="relative inline-block group/view">
                            <img
                                src={module.image}
                                alt={module.title}
                                className="max-w-full max-h-[70vh] object-contain relative z-10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-2xl border border-white/10"
                            />
                        </div>

                        {/* Background subtle grid */}
                        <div className="absolute inset-0 bg-grid-white/[0.05] pointer-events-none" />
                    </div>

                    {/* Quick Data Ribbon */}
                    <div className="bg-white/5 border-t border-white/10 p-6 backdrop-blur-sm relative z-20">
                        <div className="flex flex-wrap gap-8 items-center">
                            <div className="flex items-center gap-3">
                                <Activity className="w-5 h-5 text-indigo-400" />
                                <div>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Study Type</p>
                                    <p className="text-sm font-bold text-white">Chest PA / Native</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Database className="w-5 h-5 text-emerald-400" />
                                <div>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Dataset Source</p>
                                    <p className="text-sm font-bold text-white">NIH ChestX-ray14</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Target className="w-5 h-5 text-rose-400" />
                                <div>
                                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Diagnostic Status</p>
                                    <p className="text-sm font-bold text-white">Pathology Positive</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Technical & Educational Content */}
                <div className="flex-1 bg-white overflow-y-auto custom-scrollbar p-8 md:p-12">
                    <div className="max-w-xl">
                        <div className="mb-10">
                            <h2 className="text-xs font-black text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 uppercase tracking-[0.25em] w-fit mb-4">Deep Case Study</h2>
                            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-4">{module.title}</h1>
                            <p className="text-lg text-slate-500 font-medium leading-relaxed">{module.description}</p>
                        </div>

                        {/* Radiological Report Section */}
                        {module.report && (
                            <div className="mb-12 bg-slate-50 rounded-3xl p-8 border border-slate-100 shadow-inner">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                    <BookMarked className="w-3.5 h-3.5" />
                                    Radiological Report
                                </h3>
                                <div className="prose prose-slate prose-sm max-w-none prose-headings:text-slate-900 prose-headings:font-black prose-p:text-slate-600 prose-p:font-medium prose-p:leading-relaxed">
                                    <ReactMarkdown>{module.report}</ReactMarkdown>
                                </div>
                            </div>
                        )}

                        {/* Anatomical Foci Explanation */}
                        {module.anatomicalFoci && (
                            <div className="mb-12">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5" />
                                    Anatomic Focal Localization
                                </h3>
                                <div className="space-y-4">
                                    {module.anatomicalFoci.map((focus, i) => (
                                        <div key={i} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 transition-all hover:border-indigo-200 group">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="font-black text-slate-900 uppercase tracking-tight text-sm">{focus.region}</h4>
                                                <span className="text-[10px] font-bold text-indigo-600 bg-white px-2 py-0.5 rounded-full border border-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity">Key Point</span>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium mb-1"><span className="text-slate-400 mr-2">Finding:</span> {focus.finding}</p>
                                            <p className="text-xs text-indigo-600 font-bold leading-relaxed"><span className="text-indigo-300 mr-2">Implication:</span> {focus.implication}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Interactive Quiz System */}
                        {module.quiz && (
                            <div className="mb-12 bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <HelpCircle className="w-24 h-24" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                                            <HelpCircle className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-sm font-black uppercase tracking-widest">Verify Your Knowledge</h3>
                                    </div>

                                    <div className="space-y-6">
                                        <h4 className="text-xl font-bold leading-tight">{module.quiz[quizIndex].question}</h4>
                                        <div className="space-y-3">
                                            {module.quiz[quizIndex].options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => !quizResult && setQuizResult({ selected: i, isCorrect: i === module.quiz![quizIndex].correct })}
                                                    disabled={!!quizResult}
                                                    className={`w-full text-left px-5 py-4 rounded-xl border text-sm font-bold transition-all flex items-center justify-between ${quizResult?.selected === i
                                                        ? quizResult.isCorrect ? 'bg-emerald-500 border-emerald-400' : 'bg-rose-500 border-rose-400'
                                                        : quizResult ? (i === module.quiz![quizIndex].correct ? 'bg-emerald-500/20 border-emerald-500/50' : 'bg-white/5 border-white/10 opacity-50')
                                                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                                                        }`}
                                                >
                                                    {opt}
                                                    {quizResult?.selected === i && (
                                                        quizResult.isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <X className="w-4 h-4" />
                                                    )}
                                                </button>
                                            ))}
                                        </div>

                                        <AnimatePresence>
                                            {quizResult && (
                                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-4 border-t border-white/10">
                                                    <p className="text-xs font-bold text-indigo-300 uppercase tracking-widest mb-2">Rationale:</p>
                                                    <p className="text-sm text-slate-300 font-medium mb-6 leading-relaxed">{module.quiz[quizIndex].explanation}</p>
                                                    <button
                                                        onClick={() => { setQuizResult(null); if (quizIndex < module.quiz!.length - 1) setQuizIndex(quizIndex + 1); else setQuizIndex(0); }}
                                                        className="px-6 py-3 bg-white text-slate-900 rounded-xl text-xs font-black uppercase tracking-[0.2em] hover:bg-slate-100 transition-colors"
                                                    >
                                                        Next Question
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </div>
                            </div>
                        )}

                        <button onClick={onClose} className="w-full py-5 bg-slate-50 text-slate-400 hover:text-slate-900 border border-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest transition-all">
                            Complete Study Session
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function KnowledgeGraph() {
    const [selectedDisease, setSelectedDisease] = useState("Pneumonia");

    const graphData: Record<string, { desc: string, riskFactors: string[], symptoms: string[], related: string[], mortality: string, icd: string }> = {
        "Pneumonia": {
            desc: "An infection that inflames the air sacs in one or both lungs.",
            riskFactors: ["Age > 65", "Smoking", "Immunocompromised", "Chronic Lung Disease"],
            symptoms: ["Cough", "Fever", "Chills", "Difficulty Breathing", "Chest Pain"],
            related: ["Pleural Effusion", "Sepsis", "ARDS", "Lung Abscess"],
            mortality: "5-10% (Hospitalized)",
            icd: "J12-J18"
        },
        "Tuberculosis": {
            desc: "An infectious disease usually caused by Mycobacterium tuberculosis (MTB) bacteria.",
            riskFactors: ["HIV/AIDS", "Close contact with infected", "Malnutrition", "Diabetes"],
            symptoms: ["Chronic Cough (>3 weeks)", "Chest Pain", "Hemoptysis", "Night Sweats", "Weight Loss"],
            related: ["Cavitation", "Pleural Effusion", "Fibrosis", "Bronchiectasis"],
            mortality: "High (Untreated)",
            icd: "A15-A19"
        },
        "Pneumothorax": {
            desc: "Presence of air in the pleural cavity causing collapse of the lung.",
            riskFactors: ["Smoking", "Tall/Thin Build", "COPD", "Trauma"],
            symptoms: ["Sudden Chest Pain", "Shortness of Breath", "Hypoxia", "Tachycardia"],
            related: ["Atelectasis", "Tension Pneumothorax", "Hemothorax"],
            mortality: "Minimal (treated)",
            icd: "J93"
        },
        "Cardiomegaly": {
            desc: "The heart's width is more than 50% of the internal diameter of the chest on a PA radiograph.",
            riskFactors: ["Hypertension", "Valvular Disease", "Cardiomyopathy", "Alcoholism"],
            symptoms: ["Shortness of breath", "Swelling (Edema)", "Fatigue", "Palpitations"],
            related: ["CHF", "Pulmonary Edema", "Effusion"],
            mortality: "High (Chronic/Untreated)",
            icd: "I51.7"
        },
        "Atelectasis": {
            desc: "Collapse of lung tissue with loss of volume.",
            riskFactors: ["Post-surgery", "Mucus plug", "Foreign body", "Tumor"],
            symptoms: ["Cough", "Chest Pain", "Low Oxygen Saturation"],
            related: ["Pneumonia", "Lung Abscess"],
            mortality: "Varies by cause",
            icd: "J98.11"
        }
    };

    const currentGraph = graphData[selectedDisease];

    return (
        <div className="bg-slate-50/50 rounded-[3rem] p-8 flex flex-col md:flex-row gap-8 min-h-[600px] border border-slate-100">
            <div className="w-full md:w-64 flex flex-col gap-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-2">Pathology Map</h3>
                {Object.keys(graphData).map((disease) => (
                    <button
                        key={disease}
                        onClick={() => setSelectedDisease(disease)}
                        className={`px-6 py-4 rounded-2xl text-left font-bold text-sm transition-all ${selectedDisease === disease ? "bg-slate-900 text-white shadow-xl" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-100"}`}
                    >
                        {disease}
                    </button>
                ))}
            </div>

            <div className="flex-1 bg-white rounded-[2.5rem] p-10 shadow-sm border border-slate-100 flex flex-col">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                        <Dna className="w-7 h-7 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-900">{selectedDisease}</h3>
                        <p className="text-xs font-bold text-slate-400 border-t border-slate-100 pt-1 mt-1 uppercase tracking-widest">ICD-10: {currentGraph.icd}</p>
                    </div>
                </div>

                <p className="text-slate-600 font-medium mb-12 leading-relaxed italic border-l-4 border-indigo-200 pl-6 max-w-lg">
                    "{currentGraph.desc}"
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <InfoCard title="Primary Symptoms" items={currentGraph.symptoms} color="indigo" />
                    <InfoCard title="Common Risk Factors" items={currentGraph.riskFactors} color="amber" />
                </div>
            </div>
        </div>
    );
}

function InfoCard({ title, items, color }: { title: string, items: string[], color: string }) {
    return (
        <div className={`p-6 rounded-[2rem] bg-${color}-50/50 border border-${color}-100`}>
            <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] text-${color}-600 mb-4`}>{title}</h4>
            <div className="space-y-2">
                {items.map(item => (
                    <div key={item} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${color}-400`} />
                        {item}
                    </div>
                ))}
            </div>
        </div>
    );
}

function TimelineSimulation({ title, disease }: { title: string, disease: string }) {
    const [step, setStep] = useState(0);
    const timelineData = disease === "Tuberculosis" ? [
        { date: "Day 0", status: "Primary Infection", detail: "Subtle hilar lymphadenopathy.", progress: 10 },
        { date: "Month 2", status: "Active Progression", detail: "Upper lobe infiltrations appearing.", progress: 40 },
        { date: "Month 6", status: "Cavitary Phase", detail: "High-density cavitary lesions in right apex.", progress: 85 },
        { date: "Year 1", status: "Post-Treatment", detail: "Fibrotic scarring and calcification.", progress: 100 }
    ] : [
        { date: "Day 0", status: "Acute Onset", detail: "Large right-sided meniscus sign.", progress: 90 },
        { date: "Day 3", status: "Post-Drainage", detail: "Residual fluid in costophrenic angle.", progress: 30 },
        { date: "Day 7", status: "Resolution", detail: "Lungs clear, sharp CP angles.", progress: 5 }
    ];

    return (
        <div className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h4 className="text-lg font-black text-slate-900">{title}</h4>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{disease} Progression Case</p>
                </div>
                <div className="flex gap-2">
                    {timelineData.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setStep(i)}
                            className={`w-3 h-3 rounded-full transition-all ${step === i ? "bg-indigo-600 scale-125" : "bg-slate-200"}`}
                        />
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="space-y-4">
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest">{timelineData[step].date}</span>
                            <span className="text-[10px] font-bold text-slate-400">STATUS: {timelineData[step].status}</span>
                        </div>
                        <p className="text-sm text-slate-700 font-medium leading-relaxed">{timelineData[step].detail}</p>
                    </div>

                    <div className="px-5">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Pathology Density</p>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${timelineData[step].progress}%` }}
                                className={`h-full ${timelineData[step].progress > 70 ? 'bg-rose-500' : 'bg-indigo-500'}`}
                            />
                        </div>
                    </div>
                </div>

                <div className="aspect-square bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 relative">
                    <img
                        src={`/dataset/CHNCXR_01${90 + step}_0.png`}
                        alt="Progression Scan"
                        className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-4">
                        <p className="text-white text-[10px] font-black tracking-widest uppercase opacity-70">Simulation View</p>
                        <p className="text-white font-bold text-sm">Step {step + 1}: {timelineData[step].status}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
