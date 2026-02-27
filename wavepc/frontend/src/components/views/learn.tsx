import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Stethoscope, Activity, Search, PlayCircle, BookMarked, BrainCircuit } from "lucide-react";
import { DiseaseTimeline } from "@/components/results/disease-timeline";

export function Learn() {
    const [activeTab, setActiveTab] = useState("anatomy");

    const tabs = [
        { id: "anatomy", label: "Chest Anatomy", icon: Stethoscope },
        { id: "pathology", label: "Pathology Insights", icon: Search },
        { id: "timelines", label: "Disease Timelines", icon: Activity },
        { id: "ai_models", label: "AI & Imaging", icon: BrainCircuit },
    ];

    const content = {
        anatomy: [
            {
                title: "The Normal Radiograph",
                description: "A proper chest x-ray reveals the subtle architecture of the pulmonary and cardiovascular systems. Normal aeration allows detailed visualization of vascular markings.",
                image: "https://images.unsplash.com/photo-1542884748-2b87b36c6b90?q=80&w=2000&auto=format&fit=crop"
            },
            {
                title: "Trachea and Bronchi",
                description: "The right main bronchus travels more vertically than the left, influencing where aspirated objects tend to lodge.",
                image: "https://images.unsplash.com/photo-1559757175-5700dde675bc?q=80&w=2000&auto=format&fit=crop"
            }
        ],
        pathology: [
            {
                title: "Atelectasis (Collapse)",
                description: "Volume loss of the lung leading to shifting of mediastinal structures towards the side of collapse.",
                image: "https://images.unsplash.com/photo-1581594693702-fbdc51b2763b?q=80&w=2000&auto=format&fit=crop"
            },
            {
                title: "Pneumonia",
                description: "Appears as a consolidation consisting of water, pus, or blood inside the alveoli. Frequently shows air bronchograms.",
                image: "https://images.unsplash.com/photo-1551076805-e166946c9ebf?q=80&w=2000&auto=format&fit=crop"
            }
        ],
        ai_models: [
            {
                title: "Heatmap Generation (Grad-CAM)",
                description: "AI provides explainability via Gradient-weighted Class Activation Mapping, highlighting specific areas in the radiograph that influenced the outcome.",
                image: "https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=2000&auto=format&fit=crop"
            },
            {
                title: "Ensemble Models",
                description: "Combining DenseNet and EfficientNet architectures allows the AI to cover blind spots from individual algorithms.",
                image: "https://images.unsplash.com/photo-1589149098258-3e9102ca1812?q=80&w=2000&auto=format&fit=crop"
            }
        ]
    };

    return (
        <div className="flex flex-col h-full bg-[#fdfcfa]">
            <div className="flex items-center gap-3 mb-8 pb-4 border-b border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Knowledge Hub</h2>
                    <p className="text-slate-500 font-medium">Interactive learning modules for clinical pathology & AI.</p>
                </div>
            </div>

            <div className="flex gap-4 mb-8 overflow-x-auto pb-2 scrollbar-none">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all relative ${activeTab === tab.id
                            ? "text-white shadow-md border border-transparent"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                            }`}
                    >
                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTabIndicator"
                                className="absolute inset-0 bg-slate-900 rounded-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                        )}
                        <tab.icon className={`relative z-10 w-4 h-4 ${activeTab === tab.id ? "text-slate-300" : "text-slate-400"}`} />
                        <span className="relative z-10">{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className={`grid ${activeTab === "timelines" ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"} gap-8`}>
                <AnimatePresence mode="popLayout">
                    {activeTab === "timelines" ? (
                        <motion.div
                            key="timelines"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="w-full"
                        >
                            <DiseaseTimeline topDisease="No Finding" />
                        </motion.div>
                    ) : (
                        content[activeTab as keyof typeof content].map((item, idx) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.5, delay: idx * 0.1, type: "spring" }}
                                className="group cursor-pointer rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-all duration-500 relative"
                            >
                                <div className="h-64 relative overflow-hidden bg-slate-100">
                                    <img
                                        src={item.image}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale group-hover:grayscale-0 opacity-80 mix-blend-multiply"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />

                                    <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/20">
                                        <PlayCircle className="w-3.5 h-3.5 text-white" />
                                        <span className="text-white text-xs font-bold tracking-wider uppercase">Interactive</span>
                                    </div>
                                </div>

                                <div className="p-6 relative -mt-5 bg-white rounded-t-3xl transition-transform duration-300">
                                    <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-4 group-hover:w-16 transition-all" />
                                    <h3 className="text-2xl font-black text-slate-900 mb-3 group-hover:text-orange-600 transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="text-slate-600 leading-relaxed font-medium">
                                        {item.description}
                                    </p>
                                    <div className="mt-6 flex items-center justify-between">
                                        <button className="text-slate-500 font-bold text-sm tracking-wide uppercase hover:text-slate-900 flex items-center gap-2">
                                            Explore Module <motion.span animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>→</motion.span>
                                        </button>
                                        <BookMarked className="w-5 h-5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
