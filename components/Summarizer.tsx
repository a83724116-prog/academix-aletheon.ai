
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { Play, Pause, Volume2, BookOpen, Layers, Type, Loader2, Sparkles, LayoutList, AlignLeft, MessageSquare, Send, ChevronDown, ChevronUp, Bot, User } from 'lucide-react';
import { ChatMessage } from '../types';

interface SummarizerProps {
  onSummarizeComplete?: () => void;
}

export const Summarizer: React.FC<SummarizerProps> = ({ onSummarizeComplete }) => {
  const [formData, setFormData] = useState({ class: '', subject: '', chapter: '' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState(1);
  
  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, showChat]);

  const handleSummarize = async () => {
    if (!formData.class || !formData.subject || !formData.chapter) return;
    setLoading(true);
    setResult(null);
    setChatHistory([]); // Reset chat for new topic
    
    try {
      const res = await GeminiService.summarizeChapter(formData.class, formData.subject, formData.chapter);
      setResult(res);
      // Init Chat
      setChatHistory([{
          id: 'init',
          role: 'model',
          text: `I've analyzed ${res.title}. Feel free to ask me any specific questions about this summary!`,
          timestamp: Date.now()
      }]);
      if (onSummarizeComplete) onSummarizeComplete(); 
    } catch (e) {
      alert("Error generating summary");
    } finally {
      setLoading(false);
    }
  };

  const handleChatSend = async () => {
      if (!chatInput.trim() || !result) return;
      
      const userMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'user',
          text: chatInput,
          timestamp: Date.now()
      };
      
      setChatHistory(prev => [...prev, userMsg]);
      setChatInput('');
      setIsChatting(true);

      try {
          // Format history for API
          const historyForApi = chatHistory.map(m => ({
              role: m.role,
              parts: [{ text: m.text }]
          }));
          
          const response = await GeminiService.summarizerChat(historyForApi, userMsg.text, result);
          
          setChatHistory(prev => [...prev, {
              id: (Date.now()+1).toString(),
              role: 'model',
              text: response,
              timestamp: Date.now()
          }]);
      } catch (e) {
          console.error(e);
      } finally {
          setIsChatting(false);
      }
  };

  const speak = () => {
    if (!result) return;
    window.speechSynthesis.cancel();
    const text = `${result.title}. Introduction. ${result.introduction}. ${result.sections?.map((s:any) => s.heading + ". " + s.paragraph).join(' ')}. Conclusion. ${result.conclusion}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const stop = () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-6 bg-slate-50 dark:bg-slate-900 p-4 md:p-6 overflow-hidden">
      
      {/* Input Section (Hidden if result exists on mobile to save space, shown on sidebar on desktop) */}
      <div className={`md:w-80 w-full flex-shrink-0 flex flex-col gap-4 ${result ? 'hidden md:flex' : 'flex'}`}>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 h-fit">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
            <BookOpen className="text-indigo-500" size={24} />
            Study Topic
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Class</label>
              <input
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                placeholder="e.g. 10"
                value={formData.class}
                onChange={e => setFormData({ ...formData, class: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Subject</label>
              <input
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                placeholder="e.g. History"
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Chapter</label>
              <input
                className="w-full p-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none font-medium"
                placeholder="e.g. The French Revolution"
                value={formData.chapter}
                onChange={e => setFormData({ ...formData, chapter: e.target.value })}
              />
            </div>
            <button
              onClick={handleSummarize}
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold hover:bg-indigo-700 transition-all flex justify-center items-center gap-2 shadow-lg shadow-indigo-500/30 active:scale-95 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18}/> Generate Summary</>}
            </button>
          </div>
        </div>

        {/* Chat Bot (Desktop Sidebar) */}
        {result && (
            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden min-h-[300px]">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200"><MessageSquare size={18} className="text-emerald-500"/> AI Tutor</h3>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-slate-900/30 custom-scrollbar">
                    {chatHistory.map(msg => (
                        <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {msg.role === 'user' ? <User size={16}/> : <Bot size={16}/>}
                            </div>
                            <div className={`p-3 rounded-2xl text-xs font-medium leading-relaxed max-w-[80%] ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white dark:bg-slate-700 dark:text-slate-200 shadow-sm border border-gray-100 dark:border-slate-600 rounded-tl-none'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isChatting && (
                        <div className="flex gap-2 items-center text-xs text-gray-400">
                            <Loader2 size={12} className="animate-spin"/> Thinking...
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>
                <div className="p-3 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex gap-2">
                        <input 
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleChatSend()}
                            placeholder="Ask follow-up..."
                            className="flex-1 bg-gray-100 dark:bg-slate-900 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 ring-indigo-500/50 dark:text-white"
                        />
                        <button onClick={handleChatSend} disabled={!chatInput.trim() || isChatting} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50">
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>

      {/* Output Section */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden relative">
        {!result ? (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center">
            {loading ? (
                <div className="flex flex-col items-center animate-pulse">
                    <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                        <Loader2 size={32} className="text-indigo-500 animate-spin" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Reading Chapter...</h3>
                    <p className="max-w-xs">Our AI is analyzing the text to create a structured summary for you.</p>
                </div>
            ) : (
                <>
                    <Layers size={64} className="mb-6 opacity-20" />
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Ready to Learn?</h3>
                    <p className="max-w-md">Enter your chapter details to get a paragraph-wise explanation with key takeaways.</p>
                </>
            )}
          </div>
        ) : (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
             {/* Toolbar */}
            <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm z-10 sticky top-0">
              <div className="flex items-center gap-3">
                  <span className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-2 rounded-lg">
                      <LayoutList size={20} />
                  </span>
                  <div>
                      <h2 className="font-bold text-slate-800 dark:text-white leading-tight">Summary View</h2>
                      <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">{result.sections?.length || 0} Sections</p>
                  </div>
              </div>
              
              <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-700/50 p-1 rounded-xl">
                 <button 
                   onClick={isSpeaking ? stop : speak}
                   className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-600 shadow-sm text-xs font-bold text-slate-700 dark:text-white hover:text-indigo-500 transition-colors"
                 >
                    {isSpeaking ? <><Pause size={14} className="animate-pulse text-red-500"/> Stop</> : <><Play size={14}/> Listen</>}
                 </button>
                 <div className="h-4 w-px bg-gray-300 dark:bg-slate-600"></div>
                 <div className="flex items-center gap-1 px-2">
                    <span className="text-[10px] font-bold text-gray-400">Rate</span>
                    <input 
                      type="range" min="0.5" max="2" step="0.1" 
                      value={rate} onChange={(e) => setRate(parseFloat(e.target.value))}
                      className="w-16 h-1 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                    />
                 </div>
              </div>
            </div>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar scroll-smooth">
               <div className="max-w-3xl mx-auto space-y-10 pb-20">
                  
                  {/* Hero Title */}
                  <div className="text-center space-y-6">
                      <h1 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
                          {result.title}
                      </h1>
                      <div className="relative">
                          <div className="absolute inset-0 bg-indigo-500/10 blur-2xl rounded-full transform -translate-y-1/2"></div>
                          <div className="relative bg-white dark:bg-slate-800 p-6 rounded-2xl border-l-4 border-indigo-500 shadow-sm text-left">
                              <QuoteIcon className="text-indigo-200 mb-2" size={32} />
                              <p className="text-lg text-slate-700 dark:text-slate-300 font-medium leading-relaxed italic">
                                  {result.introduction}
                              </p>
                          </div>
                      </div>
                  </div>

                  {/* Sections */}
                  <div className="space-y-8">
                      {result.sections?.map((section: any, idx: number) => (
                          <div key={idx} className="group">
                              <div className="flex items-center gap-4 mb-4">
                                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                                      {idx + 1}
                                  </div>
                                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                                      {section.heading}
                                  </h3>
                              </div>
                              
                              <div className="ml-4 pl-8 border-l-2 border-gray-100 dark:border-slate-700 space-y-4 pb-8 group-last:pb-0 group-last:border-0">
                                  <p className="text-slate-600 dark:text-slate-300 leading-8 text-lg">
                                      {section.paragraph}
                                  </p>
                                  {section.visualCue && (
                                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-200 text-xs font-bold border border-amber-100 dark:border-amber-900/30">
                                          <Sparkles size={14}/> 
                                          <span className="uppercase tracking-wide opacity-70">Visual Cue:</span> 
                                          {section.visualCue}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>

                  <hr className="border-gray-100 dark:border-slate-700 my-10"/>

                  {/* Conclusion & Key Points */}
                  <div className="grid md:grid-cols-2 gap-8">
                      <div className="bg-emerald-50 dark:bg-emerald-900/10 p-8 rounded-3xl border border-emerald-100 dark:border-emerald-900/30">
                          <h4 className="text-sm font-black text-emerald-800 dark:text-emerald-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                              <AlignLeft size={16}/> Conclusion
                          </h4>
                          <p className="text-emerald-900 dark:text-emerald-100 leading-relaxed font-medium">
                              {result.conclusion}
                          </p>
                      </div>

                      {result.keyPoints && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-3xl border border-slate-100 dark:border-slate-700">
                              <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Sparkles size={16}/> Key Takeaways
                              </h4>
                              <ul className="space-y-3">
                                  {result.keyPoints.map((point: string, i: number) => (
                                      <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-700 dark:text-slate-200">
                                          <CheckIcon className="w-5 h-5 text-indigo-500 shrink-0" />
                                          {point}
                                      </li>
                                  ))}
                              </ul>
                          </div>
                      )}
                  </div>

               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Simple Icons for pure UI needs
const QuoteIcon = ({ className, size }: { className?: string, size?: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
        <path d="M14.017 21L14.017 18C14.017 16.8954 14.9124 16 16.017 16H19.017C19.5693 16 20.017 15.5523 20.017 15V9C20.017 8.44772 19.5693 8 19.017 8H15.017C14.4647 8 14.017 8.44772 14.017 9V11C14.017 11.5523 13.5693 12 13.017 12H12.017V5H22.017V15C22.017 18.3137 19.3307 21 16.017 21H14.017ZM5.0166 21L5.0166 18C5.0166 16.8954 5.91203 16 7.0166 16H10.0166C10.5689 16 11.0166 15.5523 11.0166 15V9C11.0166 8.44772 10.5689 8 10.0166 8H6.0166C5.46432 8 5.0166 8.44772 5.0166 9V11C5.0166 11.5523 4.56889 12 4.0166 12H3.0166V5H13.0166V15C13.0166 18.3137 10.3303 21 7.0166 21H5.0166Z" />
    </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>
);
