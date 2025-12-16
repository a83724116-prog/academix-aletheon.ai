
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { ChatMessage } from '../types';
import { 
  Send, User, Bot, Loader2, Sparkles, Bell, Search, 
  Mic, FileText, Lightbulb, BookOpen, ChevronLeft, 
  Plus, MoreHorizontal, Image as ImageIcon, Headphones,
  Zap, PenTool, GraduationCap, X, Settings, RefreshCw, Quote, ArrowRight, ChevronDown, BrainCircuit, Upload
} from 'lucide-react';

const TUTORS = [
  { id: 'nova', name: 'Dr. Nova', role: 'Science Expert', image: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_25.png', instruction: 'You are Dr. Nova, an enthusiastic science expert. Explain things using analogies and practical examples.' },
  { id: 'atlas', name: 'Atlas', role: 'History Buff', image: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_10.png', instruction: 'You are Atlas, a history professor. Focus on timelines, cause-and-effect, and historical context.' },
  { id: 'logic', name: 'Logic', role: 'Math Whiz', image: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_3.png', instruction: 'You are Logic, a math tutor. Break down problems step-by-step and show your work clearly.' },
  { id: 'muse', name: 'Muse', role: 'Creative Writing', image: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_32.png', instruction: 'You are Muse, a creative writing coach. Focus on vocabulary, tone, and storytelling structure.' },
  { id: 'poly', name: 'Poly', role: 'Language Coach', image: 'https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_18.png', instruction: 'You are Poly, a language expert. Correct grammar gently and provide synonyms.' },
];

const FUN_FACTS = [
    "Honey never spoils. Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old and still edible.",
    "Octopuses have three hearts. Two pump blood to the gills, and one pumps it to the rest of the body.",
    "Bananas are curved because they grow towards the sun. This process is known as negative geotropism.",
    "A day on Venus is longer than a year on Venus. It takes Venus 243 Earth days to rotate once but only 225 Earth days to orbit the Sun.",
    "Wombat poop is cube-shaped. This prevents it from rolling away and marks their territory."
];

export const MentorChat: React.FC = () => {
  const [view, setView] = useState<'home' | 'chat'>('home');
  const [activeTutor, setActiveTutor] = useState(TUTORS[0]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [factIndex, setFactIndex] = useState(0);
  const [isFactExpanded, setIsFactExpanded] = useState(false);
  
  // NEW STATES FOR FEATURES
  const [useThinking, setUseThinking] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (view === 'chat') {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, view]);

  const startChat = (initialMessage?: string) => {
      setMessages([
          { 
              id: 'init', 
              role: 'model', 
              text: initialMessage || `Hi! I'm ${activeTutor.name}. How can I help you master ${activeTutor.role.split(' ')[0]} today?`, 
              timestamp: Date.now() 
          }
      ]);
      setView('chat');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
              setUploadedImage(event.target?.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSend = async () => {
    if (!input.trim() && !uploadedImage) return;
    
    // Construct User Message
    const userText = input;
    const userMsg: ChatMessage = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: userText, 
        timestamp: Date.now() 
    };
    
    // Add image preview to message logic if needed, strictly text for now in local state
    setMessages(prev => [...prev, userMsg]);
    
    // Clear inputs
    setInput('');
    setLoading(true);
    
    const imageToSend = uploadedImage;
    setUploadedImage(null);

    try {
      let responseText = '';

      if (imageToSend) {
          // IMAGE ANALYSIS MODE (Gemini 3 Pro)
          responseText = await GeminiService.analyzeImage(imageToSend, userText);
      } else if (useThinking) {
          // REASONING MODE (Gemini 3 Pro Thinking)
          // Format history for Gemini API
          const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }));
          responseText = await GeminiService.reasoningChat(history, userText);
      } else {
          // STANDARD MODE
          const history = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }]
          }));
          const systemContext = `[System: ${activeTutor.instruction}]`;
          const contextHistory = [{ role: 'user', parts: [{ text: systemContext }] }, ...history];
          responseText = await GeminiService.getMentorResponse(contextHistory, userText);
      }
      
      const botMsg: ChatMessage = { 
        id: (Date.now() + 1).toString(), 
        role: 'model', 
        text: responseText || "I'm having trouble thinking right now.", 
        timestamp: Date.now() 
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Connection error. Please try again.", timestamp: Date.now() }]);
    } finally {
      setLoading(false);
    }
  };

  const nextFact = () => {
      setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
  };

  // --- HOME DASHBOARD VIEW ---
  if (view === 'home') {
      return (
        <div className="h-full bg-slate-900 text-white overflow-y-auto font-sans relative custom-scrollbar">
            {/* Smooth Teal to Reddish-Purple Gradient Background */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-20%] w-[90%] h-[90%] bg-teal-600/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[80%] bg-rose-500/20 rounded-full blur-[120px]"></div>
                <div className="absolute top-[40%] right-[10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[100px]"></div>
            </div>

            <div className="relative z-10 p-6 md:p-8 max-w-md mx-auto min-h-full flex flex-col pb-20">
                
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full border-2 border-white/20 p-0.5 relative">
                            <img src="https://cdn.jsdelivr.net/gh/alohe/avatars/png/memo_29.png" alt="User" className="w-full h-full rounded-full object-cover bg-indigo-200" />
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-slate-900"></div>
                        </div>
                        <div>
                            <h2 className="font-bold text-xl leading-tight">Hi, Alex!</h2>
                            <p className="text-xs text-white/60 font-medium">How can I assist you today?</p>
                        </div>
                    </div>
                    <button className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md border border-white/10 relative">
                        <Bell size={20} />
                        <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full"></div>
                    </button>
                </div>

                <h1 className="text-4xl font-bold mb-8 leading-tight tracking-tight">
                    Explore new <br/>
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">concepts clearly.</span>
                </h1>

                {/* New Chat Button */}
                <button 
                    onClick={() => startChat()}
                    className="w-full flex items-center justify-center gap-2 bg-white/10 border border-white/10 hover:bg-white/20 px-6 py-4 rounded-full font-bold shadow-lg hover:scale-[1.02] transition-all mb-8 backdrop-blur-md group"
                >
                    <Plus size={20} className="group-hover:rotate-90 transition-transform"/> New Chat
                </button>

                {/* Featured Tutors */}
                <div className="pb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-white/90">Featured Tutors</h3>
                        <button className="text-xs text-white/50 hover:text-white font-medium">See All</button>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                        {TUTORS.map(tutor => (
                            <div 
                                key={tutor.id} 
                                onClick={() => setActiveTutor(tutor)}
                                className={`flex flex-col items-center gap-2 cursor-pointer min-w-[70px] group transition-all ${activeTutor.id === tutor.id ? 'opacity-100 scale-105' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <div className={`w-16 h-16 rounded-full p-0.5 ${activeTutor.id === tutor.id ? 'bg-gradient-to-b from-teal-400 to-rose-500' : 'bg-transparent group-hover:bg-white/20'}`}>
                                    <div className="w-full h-full rounded-full border-2 border-slate-900 overflow-hidden bg-slate-800">
                                        <img src={tutor.image} alt={tutor.name} className="w-full h-full object-cover" />
                                    </div>
                                </div>
                                <span className={`text-xs font-medium ${activeTutor.id === tutor.id ? 'text-white' : 'text-white/60'}`}>{tutor.name.split(' ')[0]}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      );
  }

  // --- CHAT INTERFACE VIEW ---
  return (
    <div className="h-full flex flex-col bg-slate-900 text-white font-sans relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-rose-500/10 rounded-full blur-[120px]"></div>
            <div className="absolute bottom-[10%] left-[-10%] w-[50%] h-[50%] bg-teal-500/10 rounded-full blur-[120px]"></div>
        </div>

        {/* Header */}
        <div className="relative z-20 p-4 flex items-center justify-between bg-white/5 backdrop-blur-xl border-b border-white/5 pt-6 pb-4">
            <div className="flex items-center gap-3">
                <button onClick={() => setView('home')} className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
                    <ChevronLeft size={24} />
                </button>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full border border-white/20 overflow-hidden relative">
                        <img src={activeTutor.image} className="w-full h-full object-cover" alt="Tutor"/>
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full"></div>
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight">{activeTutor.name}</h3>
                        <p className="text-[10px] text-white/50 font-medium">Online</p>
                    </div>
                </div>
            </div>
            
            {/* Thinking Toggle */}
            <button 
                onClick={() => setUseThinking(!useThinking)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${useThinking ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/50' : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'}`}
            >
                <BrainCircuit size={14} />
                Deep Think
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 relative z-10 scroll-smooth">
            {messages.map(m => (
                <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                    {m.role === 'model' && (
                        <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden mr-2 self-end mb-1">
                            <img src={activeTutor.image} className="w-full h-full object-cover" alt="Tutor"/>
                        </div>
                    )}
                    <div className={`
                        max-w-[80%] p-4 rounded-[1.5rem] shadow-sm backdrop-blur-md border relative
                        ${m.role === 'user' 
                            ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white rounded-br-none border-teal-400/50' 
                            : 'bg-white/10 text-white rounded-bl-none border-white/10'}
                    `}>
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                        <p className={`text-[10px] mt-2 text-right ${m.role === 'user' ? 'text-teal-100' : 'text-white/40'}`}>{new Date(m.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                </div>
            ))}
            {loading && (
                <div className="flex justify-start">
                    <div className="w-8 h-8 rounded-full border border-white/10 overflow-hidden mr-2 self-end mb-1">
                        <img src={activeTutor.image} className="w-full h-full object-cover" alt="Tutor"/>
                    </div>
                    <div className="bg-white/10 border border-white/10 p-4 rounded-[1.5rem] rounded-bl-none flex items-center gap-2">
                        {useThinking ? (
                            <span className="text-xs text-blue-300 flex items-center gap-2 font-bold animate-pulse"><BrainCircuit size={14}/> Reasoning deeply...</span>
                        ) : (
                            <div className="flex gap-1 h-3 items-center">
                                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 bg-white/60 rounded-full animate-bounce delay-200"></div>
                            </div>
                        )}
                    </div>
                </div>
            )}
            <div ref={bottomRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 relative z-20 bg-gradient-to-t from-slate-900 to-transparent pt-10">
            {uploadedImage && (
                <div className="mx-auto max-w-sm mb-2 relative">
                    <img src={uploadedImage} alt="Upload Preview" className="h-20 rounded-xl border border-white/20 object-cover shadow-lg" />
                    <button onClick={() => setUploadedImage(null)} className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 text-white hover:bg-red-600"><X size={12}/></button>
                </div>
            )}
            
            <div className="bg-white/10 backdrop-blur-xl border border-white/10 rounded-[2rem] p-1.5 flex items-center gap-2 shadow-2xl">
                {/* Image Upload Button */}
                <button onClick={() => fileInputRef.current?.click()} className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                    <ImageIcon size={20} />
                </button>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />

                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={uploadedImage ? "Ask about this image..." : "Type a message..."}
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder:text-white/30 text-sm font-medium h-10 px-2"
                />
                
                {!input.trim() && !uploadedImage ? (
                    <button className="p-3 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <Mic size={20} />
                    </button>
                ) : (
                    <button
                        onClick={handleSend}
                        disabled={loading}
                        className="p-3 bg-white text-slate-900 rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        <Send size={18} fill="currentColor" />
                    </button>
                )}
            </div>
        </div>
    </div>
  );
};
