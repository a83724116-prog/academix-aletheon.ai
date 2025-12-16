
import React, { useState, useRef, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { ResearchSource, ChatMessage } from '../types';
import { 
  Globe, Search, Sparkles, Send, 
  BookOpen, Link as LinkIcon, 
  Loader2, ArrowRight, Plus, 
  LayoutGrid, Image as ImageIcon, 
  Headphones, Layers, Presentation, Check, 
  Play, Pause, X, BrainCircuit, Bot, Youtube, 
  Telescope, BarChart3, Code, Lightbulb, MessageSquare,
  Gamepad2, Upload, FileText, Info, MoreVertical, Sidebar,
  Video, Mic, FileAudio, StopCircle, Trash2, Paperclip, Music,
  Eye, ExternalLink, RefreshCw, Zap, RotateCcw, ChevronLeft, ChevronRight, Mic2, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';

// --- Audio Helper Functions ---
function base64ToUint8Array(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// --- Diagram Modal Component ---
const DiagramModal: React.FC<{ query: string; onClose: () => void }> = ({ query, onClose }) => {
    // Generate a visual representation using Pollinations.ai for educational diagrams
    const diagramUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(query + " educational diagram, clear labels, white background, detailed infographic style")}?width=1024&height=768&nologo=true&model=flux`;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in">
            <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-[#333] w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl relative overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-[#333] flex justify-between items-center bg-gray-50 dark:bg-[#252525]">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <ImageIcon size={18} className="text-indigo-500"/> Visual Explainer: {query}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-[#333] rounded-full text-gray-500 dark:text-gray-400"><X size={20}/></button>
                </div>
                <div className="flex-1 overflow-auto bg-gray-100 dark:bg-black p-4 flex items-center justify-center">
                    <img 
                        src={diagramUrl} 
                        alt={query} 
                        className="max-w-full max-h-full object-contain shadow-lg rounded-lg" 
                        loading="lazy"
                    />
                </div>
                <div className="p-4 bg-gray-50 dark:bg-[#252525] border-t border-gray-200 dark:border-[#333] text-center text-xs text-gray-500">
                    AI Generated Visual Representation based on context.
                </div>
            </div>
        </div>
    );
};

export const DeepResearch: React.FC = () => {
  // --- STATE ---
  const [sources, setSources] = useState<ResearchSource[]>([]);
  const [selectedSourceIds, setSelectedSourceIds] = useState<string[]>([]);
  
  // Research Mode State - ALWAYS ON
  const [isDeepResearch, setIsDeepResearch] = useState(true);
  
  // Chat
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  
  // Audio Input & Menu
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'link' | 'record'>('upload');
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  // Input Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Link Input
  const [linkInput, setLinkInput] = useState('');

  // Processing State
  const [isProcessingSource, setIsProcessingSource] = useState(false);
  const [sourceStatus, setSourceStatus] = useState('');

  // Studio
  const [generatedArtifact, setGeneratedArtifact] = useState<{type: string, content: any} | null>(null);
  const [artifactLoading, setArtifactLoading] = useState(false);
  const [loadingTimer, setLoadingTimer] = useState(0);
  const [loadingArtifactType, setLoadingArtifactType] = useState<string>('');
  
  // QA State
  const [expandedQA, setExpandedQA] = useState<number | null>(null);

  // Diagrams
  const [activeDiagram, setActiveDiagram] = useState<string | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, isProcessingSource]);

  // Cleanup Audio Context
  useEffect(() => {
      return () => { stopAudio(); };
  }, []);

  // Timer Effect for Studio Loading
  useEffect(() => {
    let interval: any;
    if (artifactLoading) {
      setLoadingTimer(0);
      interval = setInterval(() => {
        setLoadingTimer(prev => prev + 0.1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [artifactLoading]);

  const playAudio = async (base64Audio: string) => {
      stopAudio(); 
      try {
          if (!audioContextRef.current) {
              audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
          }
          if (audioContextRef.current.state === 'suspended') await audioContextRef.current.resume();

          const arrayBuffer = base64ToUint8Array(base64Audio).buffer;
          const int16 = new Int16Array(arrayBuffer);
          const float32 = new Float32Array(int16.length);
          for(let i=0; i<int16.length; i++) {
              float32[i] = int16[i] / 32768;
          }
          
          const buffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
          buffer.getChannelData(0).set(float32);
          
          const source = audioContextRef.current.createBufferSource();
          source.buffer = buffer;
          source.connect(audioContextRef.current.destination);
          source.onended = () => setIsPlayingAudio(false);
          source.start();
          audioSourceRef.current = source;
          setIsPlayingAudio(true);
      } catch (e) {
          console.error("Audio playback error", e);
          setIsPlayingAudio(false);
      }
  };

  const stopAudio = () => {
      if (audioSourceRef.current) {
          audioSourceRef.current.stop();
          audioSourceRef.current = null;
      }
      setIsPlayingAudio(false);
  };

  // --- SOURCE HANDLERS ---

  const addSourceToState = (source: ResearchSource) => {
      setSources(prev => [source, ...prev]);
      // Automatically select new sources so Studio is ready immediately
      setSelectedSourceIds(prev => [source.id, ...prev]);
      
      // If this is the first source, init chat
      if (sources.length === 0) {
          setChatHistory([{
              id: Date.now().toString(),
              role: 'model',
              text: `I've added **${source.title}** to your sources. \n\nI can summarize it, extract key points, or you can ask specific questions about it. What would you like to do?`,
              timestamp: Date.now()
          }]);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      setIsProcessingSource(true);
      setSourceStatus(`Processing ${file.name}...`);
      setShowAddModal(false);

      try {
          const reader = new FileReader();
          reader.onload = async (event) => {
              const base64 = event.target?.result as string;
              
              if (file.type.startsWith('audio/')) {
                  const cleanBase64 = base64.split(',')[1] || base64;
                  const transcript = await GeminiService.transcribeAudio(cleanBase64, file.type);
                  if (transcript) {
                      addSourceToState({
                          id: `src-${Date.now()}`,
                          type: 'audio',
                          title: file.name,
                          content: transcript,
                          timestamp: Date.now(),
                          url: '#'
                      });
                  }
              } else {
                  // Document / Image
                  const result = await GeminiService.processDocument(base64, file.type);
                  if (result) {
                      addSourceToState({
                          id: `src-${Date.now()}`,
                          type: 'file',
                          title: result.title || file.name,
                          content: result.content || result.summary,
                          summary: result.summary,
                          timestamp: Date.now(),
                          url: '#'
                      });
                  } else {
                      alert("Failed to process document.");
                  }
              }
              setIsProcessingSource(false);
              setSourceStatus('');
          };
          reader.readAsDataURL(file);
      } catch (error) {
          console.error(error);
          setIsProcessingSource(false);
          setSourceStatus('');
      } finally {
          if (fileInputRef.current) fileInputRef.current.value = '';
      }
  };

  const handleLinkSubmit = async () => {
      if (!linkInput.trim()) return;
      setIsProcessingSource(true);
      setSourceStatus('Conducting Deep Research...'); 
      setShowAddModal(false);
      
      try {
          // Check if it's a direct URL
          const isUrl = linkInput.match(/^(http|https):\/\/[^ "]+$/);
          
          if (!isUrl) {
               // WEB SEARCH MODE
               const result = await GeminiService.searchWebForSource(linkInput, isDeepResearch ? 'reasoning' : 'fast');
               
               // Extract Sources from Grounding Metadata
               const chunks = result.groundingMetadata?.groundingChunks || [];
               const webSources = chunks
                   .filter((c: any) => c.web?.uri && c.web?.title)
                   .map((c: any) => ({ title: c.web.title, uri: c.web.uri }));
               
               // Remove duplicates based on URI
               const uniqueSources = Array.from(new Map(webSources.map((item:any) => [item.uri, item])).values());

               // Add individual web sources to the list
               const newWebSources = uniqueSources.map((s: any, idx) => ({
                   id: `src-${Date.now()}-${idx}`,
                   type: 'web' as const,
                   title: s.title,
                   content: `Source from ${s.uri}`, 
                   url: s.uri,
                   timestamp: Date.now()
               }));

               // Add the main report as a thinking source - THIS IS KEY FOR STUDIO
               const reportSource: ResearchSource = {
                   id: `src-${Date.now()}-report`,
                   type: 'thinking',
                   title: `Report: ${linkInput}`,
                   content: result.text,
                   timestamp: Date.now(),
                   url: '#'
               };

               const allNewSources = [...newWebSources, reportSource];
               
               // IMPORTANT: Add to sources AND automatically select them so Studio works immediately
               setSources(prev => [...allNewSources, ...prev]);
               setSelectedSourceIds(prev => [...allNewSources.map(s => s.id), ...prev]);

               // Push Report to Chat
               setChatHistory(prev => [...prev, {
                   id: Date.now().toString(),
                   role: 'model',
                   text: result.text,
                   timestamp: Date.now()
               }]);

          } else {
               // Direct URL Processing
               const result = await GeminiService.processLink(linkInput);
               if (result) {
                   addSourceToState({
                       id: `src-${Date.now()}`,
                       type: result.type as any,
                       title: result.title,
                       content: result.content,
                       summary: result.summary,
                       timestamp: Date.now(),
                       url: linkInput,
                       metadata: result.metadata
                   });
               }
          }
      } catch (e) {
          console.error(e);
          alert("Could not process link/search.");
      } finally {
          setIsProcessingSource(false);
          setSourceStatus('');
          setLinkInput('');
      }
  };

  // --- RECORDING ---

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
              if (event.data.size > 0) {
                  audioChunksRef.current.push(event.data);
              }
          };

          mediaRecorder.start();
          setIsRecording(true);
          setRecordingDuration(0);
          timerIntervalRef.current = setInterval(() => {
              setRecordingDuration(prev => prev + 1);
          }, 1000);

      } catch (error) {
          alert("Microphone access denied.");
      }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          mediaRecorderRef.current.onstop = async () => {
              clearInterval(timerIntervalRef.current);
              const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
              setIsRecording(false);
              setShowAddModal(false);
              setIsProcessingSource(true);
              setSourceStatus('Transcribing voice note...');

              const reader = new FileReader();
              reader.readAsDataURL(audioBlob);
              reader.onloadend = async () => {
                  const base64String = reader.result as string;
                  const cleanBase64 = base64String.split(',')[1] || base64String;
                  const transcript = await GeminiService.transcribeAudio(cleanBase64, 'audio/webm');
                  
                  if (transcript) {
                      addSourceToState({
                          id: `src-${Date.now()}`,
                          type: 'audio',
                          title: `Voice Note (${new Date().toLocaleTimeString()})`,
                          content: transcript,
                          timestamp: Date.now(),
                          url: '#'
                      });
                  }
                  setIsProcessingSource(false);
                  setSourceStatus('');
                  mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
              };
          };
      }
  };

  // --- CHAT ---

  const handleChat = async () => {
      if (!chatInput.trim()) return;
      
      const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: chatInput, timestamp: Date.now() };
      setChatHistory(prev => [...prev, userMsg]);
      setChatInput('');
      setIsChatting(true);

      try {
          // If no sources, maybe user wants a general search?
          let finalSources = sources.filter(s => selectedSourceIds.includes(s.id));
          const contextStrings = finalSources.map(s => `[Source: ${s.title}]\n${s.content}`);
          
          const historyForModel = chatHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] }));
          
          const response = await GeminiService.chatWithSources(
              historyForModel, 
              userMsg.text, 
              contextStrings, 
              isDeepResearch,
              true // Allow web search fallback
          );
          
          setChatHistory(prev => [...prev, { 
              id: (Date.now()+1).toString(), 
              role: 'model', 
              text: response || "I couldn't generate a response.", 
              timestamp: Date.now() 
          }]);

      } catch (e) {
          setChatHistory(prev => [...prev, { id: Date.now().toString(), role: 'model', text: "Error connecting to AI.", timestamp: Date.now() }]);
      } finally {
          setIsChatting(false);
      }
  };

  const handleGenerateArtifact = async (type: 'flashcards' | 'quiz' | 'mindmap' | 'infographic' | 'qa', regenerate = false) => {
      const activeSources = sources.filter(s => selectedSourceIds.includes(s.id));
      if (activeSources.length === 0) {
          alert("Please select sources first. Run a 'Deep Research' to get content.");
          return;
      }

      setArtifactLoading(true);
      setLoadingArtifactType(type);
      if (!regenerate) setGeneratedArtifact(null); 
      
      try {
          const combinedContext = activeSources.map(s => s.content).join('\n\n').substring(0, 50000);
          const result = await GeminiService.generateArtifact(type, combinedContext);
          setGeneratedArtifact({ type, content: result });
      } catch (e) {
          alert("Could not generate artifact.");
      } finally {
          setArtifactLoading(false);
      }
  };

  // --- RENDERERS ---

  const renderMessageContent = (text: string) => {
      // Basic Markdown Parsing for better readability
      let html = text
          // Headers
          .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-indigo-400 mt-6 mb-2 border-b border-indigo-500/30 pb-1">$1</h3>')
          .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
          .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-white mt-8 mb-4 border-b border-gray-700 pb-2 tracking-tight">$1</h1>')
          // Bold/Italic
          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
          .replace(/\*(.*?)\*/g, '<em class="text-gray-300">$1</em>')
          // Links [Title](Url)
          .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 font-medium bg-blue-500/10 px-1 rounded">$1 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>')
          // Bullet Lists
          .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-gray-300 mb-1 pl-1 marker:text-gray-500">$1</li>')
          // Diagram Request Handling (Visuals)
          .replace(/<DIAGRAM_REQUEST>(.*?)<\/DIAGRAM_REQUEST>/g, '<button data-diagram="$1" class="diagram-trigger flex items-center gap-2 bg-indigo-900/40 border border-indigo-500/30 text-indigo-200 px-4 py-3 rounded-xl my-4 font-bold hover:bg-indigo-900/60 transition-colors w-full"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-indigo-400"><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path><line x1="21" y1="1" x2="1" y2="21" stroke-opacity="0"></line><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> View Visual: $1</button>')
          // Line Breaks
          .replace(/\n/g, '<br/>');

      const parts = text.split(/(<DIAGRAM_REQUEST>.*?<\/DIAGRAM_REQUEST>)/g);

      return (
        <div className="prose prose-invert prose-headings:text-white prose-a:text-blue-400 max-w-none">
            {parts.map((part, idx) => {
                if (part.startsWith('<DIAGRAM_REQUEST>') && part.endsWith('</DIAGRAM_REQUEST>')) {
                    const query = part.replace('<DIAGRAM_REQUEST>', '').replace('</DIAGRAM_REQUEST>', '');
                    return (
                        <button 
                            key={idx}
                            onClick={() => setActiveDiagram(query)}
                            className="flex items-center gap-3 bg-[#1e1e1e] border border-[#333] hover:border-indigo-500/50 text-indigo-200 px-4 py-3 rounded-xl my-4 font-medium hover:bg-[#252525] transition-all w-full group shadow-md"
                        >
                            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <ImageIcon size={18} />
                            </div>
                            <span className="flex-1 text-left">View Diagram: <span className="text-white font-bold">{query}</span></span>
                            <ArrowRight size={16} className="text-gray-500 group-hover:text-white" />
                        </button>
                    );
                }
                return (
                    <span 
                        key={idx} 
                        dangerouslySetInnerHTML={{ 
                            __html: part
                                .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-indigo-300 mt-6 mb-2 border-b border-gray-700/50 pb-1">$1</h3>')
                                .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-white mt-8 mb-3">$1</h2>')
                                .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-black text-white mt-8 mb-4 border-b border-gray-700 pb-2 tracking-tight">$1</h1>')
                                .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" class="text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center gap-1 font-medium bg-blue-500/10 px-1 rounded">$1 <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg></a>')
                                .replace(/^\s*-\s+(.*$)/gim, '<li class="ml-4 list-disc text-gray-300 mb-1 pl-1 marker:text-gray-500">$1</li>')
                                .replace(/\n/g, '<br/>')
                        }} 
                    />
                );
            })}
        </div>
      );
  };

  const renderArtifactModal = () => {
      if (!generatedArtifact) return null;
      const { type, content } = generatedArtifact;

      // QA Modal
      if (type === 'qa') {
          return (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in">
                  <div className="bg-[#1e1e1e] border border-[#333] w-full max-w-4xl max-h-[90vh] rounded-3xl flex flex-col shadow-2xl relative overflow-hidden">
                      <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#252525]">
                          <h3 className="font-bold text-white flex items-center gap-2">
                              <HelpCircle size={18} className="text-emerald-500"/> Important Q&A
                          </h3>
                          <div className="flex gap-2">
                              <button onClick={() => handleGenerateArtifact('qa', true)} className="p-2 hover:bg-[#333] rounded-full text-indigo-400 hover:text-white" title="Regenerate">
                                  {artifactLoading ? <Loader2 size={20} className="animate-spin" /> : <RotateCcw size={20}/>}
                              </button>
                              <button onClick={() => setGeneratedArtifact(null)} className="p-2 hover:bg-[#333] rounded-full text-gray-400 hover:text-white"><X size={20}/></button>
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-6 bg-[#1a1a1a]">
                          <div className="space-y-4">
                              {Array.isArray(content) && content.map((item: any, idx: number) => (
                                  <div key={idx} className="bg-[#252525] rounded-xl border border-[#333] overflow-hidden">
                                      <button 
                                        onClick={() => setExpandedQA(expandedQA === idx ? null : idx)}
                                        className="w-full text-left p-4 flex justify-between items-center hover:bg-[#2a2a2a] transition-colors"
                                      >
                                          <span className="font-bold text-gray-200 text-sm flex gap-3">
                                              <span className="text-emerald-500">Q{idx+1}.</span> {item.question}
                                          </span>
                                          {expandedQA === idx ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>}
                                      </button>
                                      {expandedQA === idx && (
                                          <div className="p-4 pt-0 border-t border-[#333] bg-[#222]">
                                              <div className="mt-3 text-sm text-gray-300 leading-relaxed pl-8 border-l-2 border-emerald-500/30">
                                                  {item.answer}
                                              </div>
                                          </div>
                                      )}
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          );
      }

      // Default Modal for other Artifacts
      return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6 animate-in fade-in">
              <div className="bg-[#1e1e1e] border border-[#333] w-full max-w-3xl max-h-[85vh] rounded-3xl flex flex-col shadow-2xl relative overflow-hidden">
                  <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#252525]">
                      <h3 className="font-bold text-white capitalize flex items-center gap-2">
                          <Sparkles size={18}/> {type}
                      </h3>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => handleGenerateArtifact(type as any, true)}
                            disabled={artifactLoading}
                            className="p-2 hover:bg-[#333] rounded-full text-indigo-400 hover:text-white disabled:opacity-50"
                            title="Regenerate with AI"
                          >
                              {artifactLoading ? <Loader2 size={20} className="animate-spin" /> : <RotateCcw size={20}/>}
                          </button>
                          <button onClick={() => { setGeneratedArtifact(null); stopAudio(); }} className="p-2 hover:bg-[#333] rounded-full text-gray-400 hover:text-white"><X size={20}/></button>
                      </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#1a1a1a]">
                      {(type === 'infographic') && (
                          <div className="space-y-4">
                              <div className="bg-black border border-[#333] rounded-xl overflow-hidden p-2 flex justify-center">
                                  {/* Check if content is base64 string (Nano Banana Output) */}
                                  {typeof content === 'string' && content.startsWith('data:image') ? (
                                      <img src={content} alt="Generated Infographic" className="max-w-full rounded-lg shadow-lg" />
                                  ) : (
                                      <pre className="text-white">{content}</pre> 
                                  )}
                              </div>
                              <p className="text-xs text-gray-500 text-center">Powered by Gemini 2.5 Flash Image (Nano Banana)</p>
                          </div>
                      )}
                      {(type !== 'infographic' && type !== 'qa') && (
                          <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono bg-[#252525] p-6 rounded-xl border border-[#333]">
                              {JSON.stringify(content, null, 2)}
                          </pre>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex h-full bg-[#131313] text-gray-200 font-sans overflow-hidden">
        {renderArtifactModal()}
        {activeDiagram && <DiagramModal query={activeDiagram} onClose={() => setActiveDiagram(null)} />}

        {/* Add Source Modal */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in zoom-in duration-200" onClick={() => setShowAddModal(false)}>
                <div className="bg-[#1e1e1e] w-full max-w-lg rounded-3xl border border-[#333] shadow-2xl flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                    <div className="p-4 border-b border-[#333] flex justify-between items-center bg-[#252525]">
                        <h3 className="font-bold text-white">Add Source</h3>
                        <button onClick={() => setShowAddModal(false)}><X size={20} className="text-gray-400 hover:text-white"/></button>
                    </div>
                    
                    <div className="flex p-2 bg-[#1a1a1a] gap-2">
                        {[
                            { id: 'upload', icon: Upload, label: 'Upload' },
                            { id: 'link', icon: Globe, label: 'Link' },
                            { id: 'record', icon: Mic, label: 'Record' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${activeTab === tab.id ? 'bg-[#333] text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <tab.icon size={16} /> {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="p-8 min-h-[200px] flex flex-col justify-center">
                        {activeTab === 'upload' && (
                            <div className="border-2 border-dashed border-[#444] rounded-2xl p-8 text-center hover:border-indigo-500 hover:bg-[#252525] transition-all cursor-pointer relative group">
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept=".pdf,.txt,.md,.jpg,.png,.mp3,.wav"
                                />
                                <div className="w-16 h-16 bg-[#333] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                    <Upload size={24} className="text-indigo-400" />
                                </div>
                                <p className="font-bold text-white mb-1">Click to Upload</p>
                                <p className="text-xs text-gray-500">PDF, Audio, Images, Text</p>
                            </div>
                        )}

                        {activeTab === 'link' && (
                            <div className="space-y-4">
                                <div className="bg-[#252525] p-3 rounded-xl flex items-center gap-2 border border-[#333] focus-within:border-indigo-500 transition-colors">
                                    <Globe size={18} className="text-gray-400" />
                                    <input 
                                        value={linkInput}
                                        onChange={e => setLinkInput(e.target.value)}
                                        placeholder="Paste URL or Topic..."
                                        className="bg-transparent border-none outline-none flex-1 text-white text-sm font-medium"
                                    />
                                </div>
                                <button onClick={handleLinkSubmit} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2">
                                    Add Source <ArrowRight size={16} />
                                </button>
                            </div>
                        )}

                        {activeTab === 'record' && (
                            <div className="text-center">
                                <div className="mb-6">
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all ${isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-[#333]'}`}>
                                        <Mic size={40} className={isRecording ? "text-red-500" : "text-gray-400"} />
                                    </div>
                                    {isRecording && <p className="mt-4 font-mono text-xl font-bold text-red-400">{Math.floor(recordingDuration/60)}:{String(recordingDuration%60).padStart(2,'0')}</p>}
                                </div>
                                <button 
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`px-8 py-3 rounded-full font-bold flex items-center gap-2 mx-auto ${isRecording ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-white text-black hover:bg-gray-200'}`}
                                >
                                    {isRecording ? <><StopCircle size={18}/> Stop Recording</> : <><Mic size={18}/> Start Recording</>}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* LEFT SIDEBAR: SOURCES */}
        <div className="w-80 flex flex-col border-r border-[#333] bg-[#1e1e1e] p-4 gap-4 z-20 shadow-lg relative">
            <div className="flex justify-between items-center px-1">
                <h2 className="font-medium text-lg text-gray-200">Sources</h2>
                <Sidebar size={20} className="text-gray-500 cursor-pointer hover:text-white" />
            </div>

            {/* Add Sources Button */}
            <button 
                onClick={() => setShowAddModal(true)}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-full border border-[#444] hover:bg-[#2a2a2a] transition-all text-sm font-medium text-gray-300 hover:text-white group bg-[#1e1e1e]"
            >
                <Plus size={18} className="text-gray-400 group-hover:text-white" /> Add sources
            </button>

            {/* Combined Search & Settings */}
            <div className="space-y-3">
                {/* Deep Research Toggle - Always Active Visual */}
                <div 
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all bg-[#252525] border-blue-500/50 cursor-default`}
                >
                    <div className="flex items-center gap-2">
                        <Sparkles size={16} className="text-blue-400" />
                        <span className="text-sm font-bold text-blue-100">Deep Research</span>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                </div>

                {/* Web Search Box */}
                <div className="bg-[#252525] rounded-xl p-1 border border-[#333] flex flex-col">
                    <div className="flex items-center gap-2 px-2 py-1.5">
                        <Search size={16} className="text-gray-400" />
                        <input 
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
                            placeholder="Search web for new sources..." 
                            className="bg-transparent border-none outline-none text-xs font-medium w-full text-white placeholder:text-gray-500"
                        />
                    </div>
                    <div className="flex justify-between items-center px-2 pb-1 border-t border-[#333] pt-1">
                        <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold uppercase"><Globe size={10} /> Web</span>
                        <button onClick={handleLinkSubmit} disabled={!linkInput.trim()} className="bg-[#333] p-1 rounded-md hover:bg-white hover:text-black transition-all disabled:opacity-50">
                            <ArrowRight size={12} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Select All Row */}
            <div className="flex items-center justify-between px-2 pt-2 border-t border-[#333]">
                <span className="text-xs text-gray-400 font-medium">Discovered Resources</span>
                <div 
                    onClick={() => {
                        if (selectedSourceIds.length === sources.length) {
                            setSelectedSourceIds([]);
                        } else {
                            setSelectedSourceIds(sources.map(s => s.id));
                        }
                    }}
                    className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer ${selectedSourceIds.length === sources.length && sources.length > 0 ? 'bg-blue-600 border-blue-600' : 'border-gray-600 bg-transparent'}`}
                >
                    {selectedSourceIds.length === sources.length && sources.length > 0 && <Check size={10} className="text-white" />}
                </div>
            </div>

            {/* Sources List */}
            <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1">
                {sources.length === 0 && !isProcessingSource ? (
                    <div className="flex flex-col items-center justify-center h-32 text-center opacity-40 mt-4">
                        <FileText size={32} className="mb-2" />
                        <p className="text-xs">Saved sources appear here</p>
                    </div>
                ) : (
                    sources.map(source => (
                        <div 
                            key={source.id} 
                            onClick={() => setSelectedSourceIds(prev => prev.includes(source.id) ? prev.filter(x=>x!==source.id) : [...prev, source.id])}
                            className={`group flex items-start gap-3 p-3 rounded-xl cursor-pointer border transition-all ${selectedSourceIds.includes(source.id) ? 'bg-[#2a2a2a] border-blue-500/30' : 'border-transparent hover:bg-[#252525]'}`}
                        >
                            <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${selectedSourceIds.includes(source.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-600'}`}>
                                {selectedSourceIds.includes(source.id) && <Check size={10} className="text-white" />}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="text-sm text-gray-200 font-medium leading-tight mb-1 line-clamp-2">{source.title}</div>
                                <div className="flex items-center gap-2 text-[10px] text-gray-500 capitalize">
                                    {source.type === 'web' ? <Globe size={10} className="text-blue-400"/> : source.type === 'audio' ? <FileAudio size={10} className="text-red-400"/> : source.type === 'video' ? <Video size={10} className="text-purple-400"/> : <FileText size={10} className="text-green-400"/>}
                                    <span className="truncate max-w-[100px]">{source.type}</span>
                                </div>
                            </div>
                            {source.type === 'web' && (
                                <a href={source.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="opacity-0 group-hover:opacity-100 hover:bg-[#333] p-1 rounded transition-all text-gray-400 hover:text-white">
                                    <ExternalLink size={12} />
                                </a>
                            )}
                        </div>
                    ))
                )}
                {isProcessingSource && (
                    <div className="flex items-center gap-3 p-3 opacity-50 bg-[#252525] rounded-xl border border-[#333]">
                        <Loader2 size={16} className="animate-spin text-blue-400" />
                        <span className="text-xs text-gray-300">{sourceStatus || 'Processing...'}</span>
                    </div>
                )}
            </div>
        </div>

        {/* CENTER COLUMN: CHAT */}
        <div className="flex-1 flex flex-col relative bg-[#131313]">
            {/* Header */}
            <div className="h-14 flex items-center justify-between px-6 border-b border-[#333]">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-medium text-gray-200">Research Assistant</h2>
                    {isDeepResearch && <span className="bg-blue-900/50 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-800 flex items-center gap-1"><BrainCircuit size={10}/> Thinking Mode</span>}
                </div>
                <div className="flex gap-2 text-gray-400">
                    <MoreVertical size={20} className="hover:text-white cursor-pointer" />
                </div>
            </div>

            {/* Content Canvas */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12 lg:p-20 custom-scrollbar scroll-smooth">
                {sources.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center pb-20">
                        <div className="w-16 h-16 rounded-full bg-[#1e1e1e] flex items-center justify-center mb-6 shadow-xl border border-[#333]">
                            <Upload size={24} className="text-blue-500" />
                        </div>
                        <h2 className="text-2xl font-normal text-white mb-3">Add a source to get started</h2>
                        <button 
                            onClick={() => setShowAddModal(true)}
                            className="bg-[#1e1e1e] hover:bg-[#2a2a2a] text-white px-6 py-2.5 rounded-full text-sm font-medium border border-[#333] transition-colors"
                        >
                            Upload a source
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8 max-w-3xl mx-auto pb-10">
                        {chatHistory.map(msg => (
                            <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                {msg.role === 'model' && (
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-blue-500/20">
                                        <Sparkles size={14} className="text-white"/>
                                    </div>
                                )}
                                <div className={`max-w-[90%] text-sm leading-relaxed ${msg.role === 'user' ? 'bg-[#2a2a2a] text-white p-4 rounded-2xl rounded-tr-none' : 'text-gray-300 pt-1'}`}>
                                    {msg.role === 'model' ? renderMessageContent(msg.text) : msg.text}
                                </div>
                            </div>
                        ))}
                        {isChatting && (
                            <div className="flex gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#252525] flex items-center justify-center"><Loader2 size={14} className="animate-spin text-gray-500"/></div>
                                <div className="text-sm text-gray-500 pt-2 flex gap-1 items-center">Thinking<span className="animate-pulse">...</span></div>
                            </div>
                        )}
                        <div ref={chatBottomRef} />
                    </div>
                )}
            </div>

            {/* Input Bar */}
            <div className="p-6 md:px-20 bg-[#131313]">
                <div className="max-w-3xl mx-auto bg-[#1e1e1e] rounded-full p-2 pl-4 flex items-center gap-2 border border-[#333] shadow-lg focus-within:border-gray-500 transition-colors">
                    <input 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleChat()}
                        placeholder={sources.length === 0 ? "Upload a source to get started" : "Ask about your sources..."}
                        disabled={sources.length === 0}
                        className="flex-1 bg-transparent text-sm text-white placeholder:text-gray-500 outline-none h-10 disabled:opacity-50"
                    />
                    {sources.length > 0 && (
                        <div className="text-gray-500 text-xs px-2 hidden sm:block">{sources.length} sources</div>
                    )}
                    <button 
                        onClick={handleChat}
                        disabled={!chatInput.trim() || isChatting}
                        className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ArrowRight size={18} />
                    </button>
                </div>
            </div>
        </div>

        {/* RIGHT SIDEBAR: STUDIO */}
        <div className="w-80 flex flex-col border-l border-[#333] bg-[#1e1e1e] p-4 z-20 shadow-lg">
            <div className="flex justify-between items-center mb-6 px-1">
                <h2 className="font-medium text-lg text-gray-200">Studio</h2>
                <LayoutGrid size={20} className="text-gray-500" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                {/* Removed Audio Overview Card */}

                {/* Tools Grid */}
                <div className="grid grid-cols-2 gap-3">
                    {[
                        { id: 'mindmap', label: 'Mind Map', icon: BrainCircuit },
                        { id: 'flashcards', label: 'Flashcards', icon: Layers },
                        { id: 'quiz', label: 'Quiz', icon: Gamepad2 },
                        { id: 'infographic', label: 'Infographic', icon: ImageIcon },
                        { id: 'qa', label: 'Q&A Bank', icon: HelpCircle }, // Added Q&A
                    ].map(tool => (
                        <button
                            key={tool.id}
                            onClick={() => handleGenerateArtifact(tool.id as any)}
                            disabled={artifactLoading || sources.length === 0}
                            className="bg-[#2a2a2a] p-3 rounded-xl border border-transparent hover:border-gray-600 hover:bg-[#333] text-left transition-all flex flex-col gap-2 min-h-[90px] disabled:opacity-30 disabled:cursor-not-allowed group"
                        >
                            <tool.icon size={18} className="text-gray-400 group-hover:text-white transition-colors" />
                            <span className="text-xs font-medium text-gray-300 mt-auto">{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="mt-auto pt-4 border-t border-[#333]">
                {artifactLoading ? (
                    <div className="bg-[#2a2a2a] p-4 rounded-xl border border-indigo-500/30 shadow-lg animate-in slide-in-from-bottom-2">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-xs font-bold text-indigo-300 capitalize flex items-center gap-2">
                                <Loader2 size={12} className="animate-spin" /> {loadingArtifactType}
                            </span>
                            <span className="text-xs font-mono text-white bg-black/30 px-2 py-0.5 rounded">
                                {loadingTimer.toFixed(1)}s
                            </span>
                        </div>
                        <div className="w-full bg-[#1a1a1a] h-1.5 rounded-full overflow-hidden mb-2">
                            <div className="h-full bg-indigo-500 w-1/3 rounded-full animate-[progress_1s_ease-in-out_infinite] relative">
                                <div className="absolute inset-0 bg-white/20"></div>
                            </div>
                        </div>
                        <p className="text-[10px] text-gray-400 text-center animate-pulse">
                            Synthesizing knowledge...
                        </p>
                    </div>
                ) : (
                    <p className="text-[10px] text-gray-500 text-center">Select sources to enable Studio tools.</p>
                )}
            </div>
            
            <style>{`
                @keyframes progress {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(300%); }
                }
            `}</style>
        </div>
    </div>
  );
};
