"use client";

import { motion } from "framer-motion";
import { Activity, Play, Info, Mail, Phone, User, ArrowRight, Shield, Database, Cpu, Zap, Microscope } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import SimulationAnimation from "@/components/animations/SimulationAnimation";

// Use dynamic import for Three.js component to avoid SSR issues
const WaveAnimation = dynamic(() => import("@/components/animations/WaveAnimation"), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#fdfcfa]" />
});

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-[#fdfcfa] text-[#1a1c29] selection:bg-blue-100 overflow-x-hidden font-sans">
      {/* Three.js Background */}
      <WaveAnimation />

      {/* Header / Nav */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-[#1e3a8a] flex items-center justify-center shadow-lg shadow-blue-900/10">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-black tracking-tighter uppercase italic text-[#1e3a8a]">Wavelength</span>
        </div>
        <div className="hidden md:flex gap-8 items-center">
          <Link href="/how-it-works" className="text-sm font-bold text-[#1e3a8a]/70 hover:text-[#1e3a8a] transition-colors">User Guide</Link>
          <Link href="/dashboard?view=new-scan">
            <motion.button
              whileHover={{ scale: 1.05 }}
              className="bg-[#3f6212] text-white px-5 py-2 rounded-full text-sm font-bold shadow-md hover:bg-[#365314] transition-colors"
            >
              Open Dashboard
            </motion.button>
          </Link>
        </div>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col items-center pt-20 pb-32 px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center"
        >
          {/* Tagline */}
          <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[1.1] tracking-tighter max-w-5xl mx-auto text-[#1a1c29]">
            Advanced <span className="text-[#1e3a8a]">Chest X-Ray</span> Screening AI
          </h2>

          <p className="text-lg md:text-xl text-slate-500 font-medium mb-12 max-w-2xl mx-auto leading-relaxed">
            Instantaneous, clinically-validated diagnostic support leveraging state-of-the-art ensemble architectures.
          </p>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-24">
            <Link href="/dashboard?view=new-scan">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full bg-[#1e3a8a] text-white font-bold text-lg shadow-xl shadow-blue-900/20 hover:bg-[#1e40af] transition-colors flex items-center gap-2"
              >
                Start Analysis
              </motion.button>
            </Link>

            <Link href="/dashboard?view=training">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full bg-white border border-slate-200 text-[#1e3a8a] font-bold text-lg hover:bg-slate-50 transition-colors flex items-center gap-2"
              >
                <Play className="w-5 h-5 fill-current" />
                View Demo
              </motion.button>
            </Link>

            <Link href="/how-it-works">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 rounded-full bg-[#3f6212] text-white font-bold text-lg shadow-xl shadow-green-900/10 hover:bg-[#365314] transition-colors flex items-center gap-2"
              >
                <Info className="w-5 h-5" />
                User Manual
              </motion.button>
            </Link>
          </div>

          {/* Simulation Section */}
          <div className="w-full max-w-4xl mx-auto mb-40">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-[0.3em] mb-12">System Pipeline Visualization</h3>
            <SimulationAnimation />
          </div>
        </motion.div>

        {/* Detailed Process Section */}
        <section className="w-full max-w-7xl mx-auto pt-20 border-t border-slate-100">
          <div className="text-center mb-20">
            <h3 className="text-3xl font-black text-[#1e3a8a] mb-4">The Wavelength Workflow</h3>
            <p className="text-slate-500 max-w-xl mx-auto font-medium">How our system translates raw DICOM/PNG data into actionable clinical insights.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            <ProcessStep
              icon={Microscope}
              title="Image Normalization"
              desc="Raw scans are pre-processed using histogram equalization and lung field cropping to ensure model consistency across varying exposures."
            />
            <ProcessStep
              icon={Cpu}
              title="Ensemble Analysis"
              desc="Parallel processing through DenseNet121 and EfficientNet-B4 backbones evaluates 14 distinct pathologies simultaneously."
            />
            <ProcessStep
              icon={Zap}
              title="Uncertainty Quantification"
              desc="Monte Carlo Dropout estimations provide a safety buffer, alerting clinicians when AI confidence is statistically low."
            />
            <ProcessStep
              icon={Shield}
              title="Platt Calibration"
              desc="Internal probabilities are calibrated against NIH ground-truth sets to map binary scores to empirical clinical outcomes."
            />
            <ProcessStep
              icon={Database}
              title="FHIR Integration"
              desc="Diagnostic outputs are formatted into HL7/FHIR compliant resources, ready for immediate EMR push-notifications."
            />
            <ProcessStep
              icon={ArrowRight}
              title="Radiology Triage"
              desc="Critical findings automatically elevate patient records in the Intelligent Triage Worklist for expedited review."
            />
          </div>
        </section>
      </main>

      {/* Contact Section */}
      <footer className="relative z-10 py-24 px-6 border-t border-slate-100 bg-white shadow-[0_-1px_10px_rgba(0,0,0,0.02)]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <h3 className="text-4xl font-black mb-6 text-[#1e3a8a]">Let's evolve <span className="text-[#3f6212]">radiology</span> together.</h3>
              <p className="text-slate-500 font-medium max-w-md">
                Wavelength is an open-source clinical decision support tool designed for rapid integration into existing hospital networks.
              </p>
            </div>

            <div className="space-y-4">
              <ContactItem icon={User} text="Nishchal Soni" />
              <ContactItem icon={Phone} text="9243334046" />
              <ContactItem icon={Mail} text="witcher22710@gmail.com" />
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-slate-400 text-sm font-medium">© 2026 Wavelength AI. All rights reserved.</p>
            <div className="flex gap-8 text-slate-400 text-xs font-bold">
              <Link href="/how-it-works" className="hover:text-[#1e3a8a] transition-colors">Documentation</Link>
              <a href="#" className="hover:text-[#1e3a8a] transition-colors">Privacy</a>
              <a href="#" className="hover:text-[#1e3a8a] transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProcessStep({ icon: Icon, title, desc }: { icon: any, title: string, desc: string }) {
  return (
    <div className="flex flex-col gap-4">
      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100">
        <Icon className="w-6 h-6 text-[#1e3a8a]" />
      </div>
      <h4 className="text-xl font-bold text-[#1a1c29]">{title}</h4>
      <p className="text-slate-500 font-medium leading-relaxed text-sm">{desc}</p>
    </div>
  );
}

function ContactItem({ icon: Icon, text }: { icon: any, text: string }) {
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 hover:border-blue-200 transition-colors shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#1e3a8a]" />
      </div>
      <span className="font-bold text-slate-700">{text}</span>
    </div>
  );
}
