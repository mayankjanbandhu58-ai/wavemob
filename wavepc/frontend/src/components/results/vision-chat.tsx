"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
}

interface VisionChatProps {
    reportId: string | undefined;
    topDisease: string | undefined;
}

export function VisionChat({ reportId, topDisease }: VisionChatProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "system-1",
            role: "assistant",
            content: "Hello Doctor. I am the Wavelength Vision Assistant. I have analyzed the current scan and am ready to answer any specific questions you have about the findings."
        }
    ]);
    const [input, setInput] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const diseaseContext = topDisease && topDisease !== "No Finding"
        ? `The primary differential is ${topDisease}.`
        : "There are no major pathological findings.";

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // Simulate network/VLM thinking delay
        setTimeout(() => {
            let aiResponse = "";
            const query = userMsg.content.toLowerCase();

            if (query.includes("mass") || query.includes("dimension")) {
                aiResponse = "Based on the segmentation map, the detected mass measures approximately 4.2cm x 3.8cm. It exhibits irregular, spiculated margins, which increases the probability of malignancy. I recommend correlation with a contrast-enhanced CT.";
            } else if (query.includes("compare") || query.includes("previous")) {
                aiResponse = "I have queried the EHR. The patient has a prior scan from 6 months ago. The current opacity in the right lower lobe represents a **new** finding. There were no infiltrates present previously.";
            } else if (query.includes("effusion") || query.includes("fluid")) {
                aiResponse = `I detect blunting of the right costophrenic angle. ${diseaseContext} The estimated fluid volume is moderate (approx 300-400mL). Thoracentesis may be indicated depending on patient presentation.`;
            } else {
                aiResponse = `Analyzing visual features... ${diseaseContext} The tensor activations in this region strongly correlate with typical radiographic presentations of this pathology. Would you like me to highlight the exact bounding box?`;
            }

            setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: "assistant", content: aiResponse }]);
            setIsTyping(false);
        }, 1500 + Math.random() * 1000); // 1.5 - 2.5s delay
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 border-l border-slate-200 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 text-sm">Vision Assistant</h3>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">Multimodal QA Active</p>
                    </div>
                </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex gap-3 max-w-[90%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                        >
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${msg.role === "user" ? "bg-slate-200 text-slate-600" : "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"}`}>
                                {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                            </div>
                            <div className={`p-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-slate-800 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"}`}>
                                {msg.content}
                            </div>
                        </motion.div>
                    ))}
                    {isTyping && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex gap-3 max-w-[80%]"
                        >
                            <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-md">
                                <Bot className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5 h-10 px-4">
                                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                                <motion.div animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-200">
                <div className="flex flex-wrap gap-2 mb-3">
                    <button onClick={() => setInput("What are the exact dimensions?")} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-full hover:bg-indigo-100 transition-colors">Dimensions?</button>
                    <button onClick={() => setInput("Compare with previous scan.")} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-full hover:bg-indigo-100 transition-colors">Compare History</button>
                    <button onClick={() => setInput("Is there fluid buildup?")} className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-1 rounded-full hover:bg-indigo-100 transition-colors">Fluid buildup?</button>
                </div>
                <form onSubmit={handleSend} className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask the visual model about this scan..."
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                        disabled={isTyping}
                    />
                    <button
                        type="submit"
                        disabled={!input.trim() || isTyping}
                        className="absolute right-1.5 top-1.5 bottom-1.5 w-10 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-lg transition-colors"
                    >
                        <Send className="w-4 h-4 ml-0.5" />
                    </button>
                </form>
            </div>
        </div>
    );
}
