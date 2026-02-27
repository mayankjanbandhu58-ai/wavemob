import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Bot, User, Database, Cpu, Activity, ShieldCheck, Sparkles, Loader2 } from "lucide-react";
import { sendChatMessage } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello Dr. Jenkins. I am Wavelength's Global AI Assistant powered by LLaMA-3. I have full access to our local NIH curated dataset containing 112,000+ patient records, as well as the active DenseNet classification models. How can I assist your clinical workflow today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      // Pass the previous messages (up to a limit if we wanted) as history
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await sendChatMessage(userMsg.content, history);

      setMessages(prev => [...prev, { role: "assistant", content: response.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "I'm currently unable to connect to the LLM backend. Please check if the Ollama service is running."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] w-full rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5">
        <Sparkles className="w-64 h-64 text-blue-900" />
      </div>

      {/* Header */}
      <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white relative z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20 relative">
            <Bot className="w-6 h-6 text-white" />
            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Global Clinical Assistant</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-indigo-500" /> LLaMA-3 8B</span>
              <span className="flex items-center gap-1"><Database className="w-3 h-3 text-emerald-500" /> NIH Curated Data</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-blue-500" /> HIPAA Compliant Local Secure</span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-full">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Active Runtime</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/50 relative z-10 hide-scrollbar">
        {messages.map((msg, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex gap-4 max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
              {/* Avatar */}
              <div className="shrink-0">
                {msg.role === "assistant" ? (
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md">
                    <Bot className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-slate-200 flex items-center justify-center border border-slate-300">
                    <User className="w-5 h-5 text-slate-600" />
                  </div>
                )}
              </div>

              {/* Message Bubble */}
              <div className={`
                p-5 rounded-2xl text-sm leading-relaxed shadow-sm
                ${msg.role === "user"
                  ? "bg-slate-900 text-white rounded-tr-none"
                  : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"}
              `}>
                {msg.role === "assistant" ? (
                  <div className="prose prose-sm max-w-none prose-p:mb-3 prose-p:leading-relaxed prose-strong:text-indigo-900 prose-strong:font-bold prose-ul:my-2 prose-li:my-0 text-slate-800">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <div className="flex gap-4 max-w-[80%]">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-md shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="p-5 rounded-2xl rounded-tl-none bg-white border border-slate-200 shadow-sm flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
                <span className="text-sm font-medium text-slate-500">Synthesizing clinical response...</span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-6 bg-white border-t border-slate-100 relative z-10">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="relative flex items-end gap-3"
        >
          <div className="relative flex-1 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Ask about patient records, diagnostic models, or dataset statistics..."
              className="w-full bg-transparent p-4 outline-none resize-none min-h-[60px] max-h-[200px] text-sm text-slate-700 placeholder:text-slate-400"
              rows={1}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="w-[60px] h-[60px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow-md shadow-indigo-500/20 shrink-0"
          >
            <Send className="w-5 h-5 ml-1" />
          </button>
        </form>
        <p className="text-center mt-3 text-[10px] uppercase tracking-widest font-bold text-slate-400">
          Wavelength AI responses are generated locally. No patient data leaves this environment.
        </p>
      </div>
    </div>
  );
}
