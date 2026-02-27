import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Database, Cpu, Activity, ShieldCheck, Sparkles, Loader2, Trash2, ChevronRight, MessageSquare, History, Plus, X, Paperclip, XCircle, FileText } from "lucide-react";
import { sendChatMessage, generateSoapNote } from "@/lib/api";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
  image?: string; // Optional base64 image
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: number;
}

const SUGGESTED_QUERIES = [
  "What does a CTR > 0.5 indicate?",
  "Summarize the findings for Severe Cardiomegaly.",
  "How does the NIH dataset handle patient anonymity?",
  "What is the Radiographic Severity Index (RSI)?",
];

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  content: "Hello Dr. Krtika Soni. I am Wavelength's Global AI Assistant powered by LLaMA-3. I have full access to our local NIH curated dataset containing 112,000+ patient records, as well as the active DenseNet classification models. How can I assist your clinical workflow today?"
};

export function AiChat() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [attachment, setAttachment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("wavelength_chat_sessions");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setActiveSessionId(parsed[0].id);
        } else {
          createNewSession();
        }
      } catch (e) {
        console.error("Failed to parse chat sessions", e);
        createNewSession();
      }
    } else {
      createNewSession();
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem("wavelength_chat_sessions", JSON.stringify(sessions));
    }
  }, [sessions]);

  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession?.messages || [];

  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: "New Clinical Query",
      messages: [INITIAL_MESSAGE],
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
    setIsSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        return [{
          id: Date.now().toString(),
          title: "New Clinical Query",
          messages: [INITIAL_MESSAGE],
          updatedAt: Date.now()
        }];
      }
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAttachment(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
    // Reset input so the same file could be uploaded again if needed
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if ((!textToSend.trim() && !attachment) || isLoading || !activeSessionId) return;

    const currentAttachment = attachment; // capture current state
    const userMsg: Message = { role: "user", content: textToSend || "Uploaded an image for analysis.", image: currentAttachment || undefined };

    let newTitle = activeSession?.title;
    if (messages.length === 1) {
      newTitle = textToSend.slice(0, 30) + (textToSend.length > 30 ? "..." : (textToSend ? "" : "Image Analysis"));
    }

    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: newTitle || s.title,
          messages: [...s.messages, userMsg],
          updatedAt: Date.now()
        };
      }
      return s;
    }).sort((a, b) => b.updatedAt - a.updatedAt));

    if (!overrideInput) setInput("");
    setAttachment(null);
    setIsLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));

      // If we have an image, we send the base64 string to the backend
      // But only the raw base64 data without the data:image/png;base64, prefix if desired. 
      // Our API handles it correctly since it's just passing it into prompt context currently.
      const response = await sendChatMessage(userMsg.content, history, currentAttachment || undefined);

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, { role: "assistant", content: response.reply }],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } catch {
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, {
              role: "assistant",
              content: "I'm currently unable to connect to the LLM backend. Please check if the Ollama service is running."
            }],
            updatedAt: Date.now()
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportSoap = async () => {
    if (messages.length <= 1) return; // Only initial message

    setIsExporting(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await generateSoapNote(history);

      // Create a downloadable text file
      const blob = new Blob([response.soap], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `clinical_soap_note_${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export SOAP note", e);
      alert("Failed to synthesize SOAP note.");
    } finally {
      setIsExporting(false);
    }
  };

  const clearChat = () => {
    if (!activeSessionId) return;
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          title: "New Clinical Query",
          messages: [INITIAL_MESSAGE],
          updatedAt: Date.now()
        };
      }
      return s;
    }));
    setInput("");
    setAttachment(null);
  };

  return (
    <div className="flex h-[calc(100vh-140px)] w-full rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none z-0">
        <Sparkles className="w-64 h-64 text-indigo-900" />
      </div>

      {/* History Sidebar */}
      <AnimatePresence>
        {(isSidebarOpen || window.innerWidth > 1024) && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="h-full border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 overflow-hidden relative z-20 absolute lg:relative hidden lg:flex shadow-xl lg:shadow-none"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2 text-indigo-900 font-bold">
                <History className="w-5 h-5" />
                Chat History
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 shrink-0">
              <button
                onClick={createNewSession}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                New Consultation
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => { setActiveSessionId(session.id); setIsSidebarOpen(false); }}
                  className={`w-full text-left p-4 rounded-xl transition-all border group relative ${activeSessionId === session.id
                    ? "bg-white border-indigo-200 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-slate-200/50"
                    }`}
                >
                  <div className={`text-sm font-bold truncate pr-6 ${activeSessionId === session.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {session.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                    {new Date(session.updatedAt).toLocaleDateString()} • {session.messages.length - 1} msgs
                  </div>

                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 ${activeSessionId === session.id ? 'opacity-100' : ''}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm z-10 lg:hidden"
          />
        )}

        {/* Mobile Sidebar (Absolute positioned) */}
        {isSidebarOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="absolute top-0 left-0 bottom-0 w-80 border-r border-slate-200 bg-slate-50 flex flex-col shrink-0 overflow-hidden z-20 shadow-2xl lg:hidden"
          >
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2 text-indigo-900 font-bold">
                <History className="w-5 h-5" />
                Chat History
              </div>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 shrink-0">
              <button
                onClick={createNewSession}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md flex items-center justify-center gap-2 font-bold text-sm transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                New Consultation
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2 custom-scrollbar">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => { setActiveSessionId(session.id); setIsSidebarOpen(false); }}
                  className={`w-full text-left p-4 rounded-xl transition-all border group relative ${activeSessionId === session.id
                    ? "bg-white border-indigo-200 shadow-sm"
                    : "bg-transparent border-transparent hover:bg-slate-200/50"
                    }`}
                >
                  <div className={`text-sm font-bold truncate pr-6 ${activeSessionId === session.id ? 'text-indigo-900' : 'text-slate-700'}`}>
                    {session.title}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">
                    {new Date(session.updatedAt).toLocaleDateString()} • {session.messages.length - 1} msgs
                  </div>

                  {sessions.length > 1 && (
                    <button
                      onClick={(e) => deleteSession(e, session.id)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 ${activeSessionId === session.id ? 'opacity-100' : ''}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Header */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white/95 backdrop-blur-sm relative z-10 transition-all">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
              title="View History"
            >
              <History className="w-6 h-6" />
            </button>
            <div className="hidden sm:flex w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 items-center justify-center shadow-lg shadow-indigo-500/20 relative shrink-0">
              <Bot className="w-6 h-6 text-white" />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                Global Clinical Assistant
              </h2>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-500 mt-1">
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100"><Cpu className="w-3 h-3 text-indigo-500" /> LLaMA-3 8B</span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 hidden sm:flex"><Database className="w-3 h-3 text-emerald-500" /> NIH Curated Data</span>
                <span className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 hidden md:flex"><ShieldCheck className="w-3 h-3 text-blue-500" /> HIPAA Secure</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleExportSoap}
              disabled={isExporting || messages.length <= 1}
              className="p-2 sm:px-4 sm:py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              title="Export Conversation as SOAP Note"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
              <span className="hidden xl:inline">Export SOAP</span>
            </button>
            <button
              onClick={clearChat}
              className="p-2 sm:px-4 sm:py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 bg-white border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 shadow-sm"
              title="Clear Current Chat"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden xl:inline">Clear Chat</span>
            </button>
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
              <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-widest hidden xl:inline">Active Runtime</span>
            </div>
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-slate-50/50 relative z-10 custom-scrollbar">
          {messages.map((msg, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex w-full ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div className={`flex gap-3 sm:gap-4 max-w-[95%] sm:max-w-[85%] lg:max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                {/* Avatar */}
                <div className="shrink-0 mt-1">
                  {msg.role === "assistant" ? (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-slate-200 flex items-center justify-center border border-slate-300">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`
                    p-4 sm:p-5 rounded-2xl text-sm sm:text-base leading-relaxed shadow-sm flex flex-col gap-3
                    ${msg.role === "user"
                    ? "bg-indigo-900 text-white rounded-tr-none"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-none"}
                  `}>
                  {msg.image && (
                    <div className="w-48 sm:w-64 aspect-square rounded-xl overflow-hidden bg-slate-950 border border-slate-700/50 shadow-inner">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.image} alt="User attached medical image" className="w-full h-full object-cover" />
                    </div>
                  )}

                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm sm:prose-base max-w-none prose-p:mb-3 last:prose-p:mb-0 prose-p:leading-relaxed prose-strong:text-indigo-900 prose-strong:font-bold prose-ul:my-2 prose-li:my-0 prose-a:text-indigo-600 prose-a:no-underline hover:prose-a:underline text-slate-800">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap font-medium">{msg.content}</div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Suggested Queries - Only show if conversation just started */}
          {messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col gap-3 mt-8 ml-2 sm:ml-14 max-w-full sm:max-w-[80%]"
            >
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <MessageSquare className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Suggested Clinical Queries</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_QUERIES.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleSend(query)}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 font-medium hover:border-indigo-300 hover:text-indigo-700 hover:bg-indigo-50 transition-all text-left shadow-sm flex items-center justify-between gap-2 group w-full sm:w-auto"
                  >
                    {query}
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
              <div className="flex gap-4 max-w-[80%]">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shrink-0 mt-1">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className="p-5 rounded-2xl rounded-tl-none bg-white border border-slate-200 shadow-sm flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} className="w-2 h-2 bg-indigo-500 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} className="w-2 h-2 bg-indigo-400 rounded-full" />
                    <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} className="w-2 h-2 bg-indigo-300 rounded-full" />
                  </div>
                  <span className="text-sm font-bold text-indigo-600 uppercase tracking-widest">Synthesizing clinical response...</span>
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-4" />
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-slate-100 relative z-10 transition-all flex flex-col">

          {/* Image Attachment Preview */}
          <AnimatePresence>
            {attachment && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 12 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="flex items-center gap-4 bg-slate-50 border border-slate-200 p-3 rounded-2xl w-fit"
              >
                <div className="w-16 h-16 rounded-xl bg-slate-900 overflow-hidden relative border border-slate-300 shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={attachment} alt="Attachment Preview" className="w-full h-full object-cover" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-slate-800">Medical Image Attached</span>
                  <span className="text-xs text-slate-500 font-medium">Ready for multimodal synthesis</span>
                </div>
                <button
                  onClick={() => setAttachment(null)}
                  className="p-1 ml-4 text-slate-400 hover:text-rose-500 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-end gap-3 max-w-5xl mx-auto w-full"
          >
            <div className="relative flex-1 bg-slate-50 border border-slate-300 rounded-2xl overflow-hidden focus-within:ring-4 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all shadow-sm flex">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-4 text-slate-400 hover:text-indigo-600 transition-colors self-end mb-1"
                title="Attach Medical Image"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask about patient records or dataset statistics..."
                className="w-full bg-transparent py-4 pr-4 pl-0 outline-none resize-none min-h-[60px] max-h-[200px] text-sm sm:text-base text-slate-800 placeholder:text-slate-400 font-medium custom-scrollbar"
                rows={1}
              />
            </div>
            <button
              type="submit"
              disabled={(!input.trim() && !attachment) || isLoading}
              className="w-[60px] h-[60px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white flex items-center justify-center transition-all shadow-md active:scale-95 shrink-0"
            >
              {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6 ml-1" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
