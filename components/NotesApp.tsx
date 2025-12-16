import React, { useState, useRef, useEffect } from 'react';
import { Note, NoteFolder } from '../types';
import { GeminiService } from '../services/geminiService';
import { 
  Folder, Plus, Search, ChevronLeft, 
  PenTool, Type, Sparkles, Trash2, Save, 
  Highlighter, Eraser, Image as ImageIcon, 
  LayoutGrid, Lock, FileText, Palette, 
  Undo2, Redo2, CheckCircle2, Grid3X3, AlignLeft, AlignCenter, AlignRight,
  Ruler, Table, MousePointer2, 
  Shapes, BoxSelect, ScrollText, MoreVertical,
  Pencil, PenLine, Pipette, X, Frame,
  Compass, Triangle, RotateCw, StickyNote,
  Maximize2, Share2, Download, Printer, Settings,
  Split, Bold, Italic, Underline, Strikethrough, List, ListOrdered, Lightbulb, Loader2
} from 'lucide-react';

// --- CONSTANTS & CONFIG ---

const INITIAL_FOLDERS: NoteFolder[] = [
  { id: 'all', name: 'All Notes', icon: 'LayoutGrid', type: 'system', count: 2 },
  { id: 'lecture', name: 'Lecture Notes', icon: 'FileText', type: 'user', count: 1 },
  { id: 'personal', name: 'Personal Diary', icon: 'Lock', type: 'user', count: 1 },
  { id: 'creative', name: 'Creative Space', icon: 'Palette', type: 'user', count: 0 },
];

const INITIAL_NOTES: Note[] = [
  { 
    id: '1', 
    title: 'Organic Chemistry', 
    content: '<b>Benzene rings</b> structure analysis...<br><i>Key points:</i><br>1. Resonance<br>2. Stability', 
    folderId: 'lecture', 
    color: '#eff6ff', 
    createdAt: Date.now(), 
    updatedAt: Date.now(), 
    tags: ['chemistry', 'important'],
  },
  { 
    id: '2', 
    title: 'Dream Journal', 
    content: 'Had a dream about flying over a neon city...', 
    folderId: 'personal', 
    color: '#fff1f2', 
    createdAt: Date.now()-100000, 
    updatedAt: Date.now(), 
    tags: ['dream'] 
  },
];

const PAPER_TYPES = [
    { id: 'blank', label: 'Blank', bg: 'bg-white dark:bg-slate-800' },
    { id: 'ruled', label: 'Ruled', bg: 'bg-[linear-gradient(to_bottom,rgba(203,213,225,0.5)_1px,transparent_1px)] dark:bg-[linear-gradient(to_bottom,rgba(71,85,105,0.5)_1px,transparent_1px)] [background-size:100%_32px] bg-white dark:bg-slate-800' },
    { id: 'grid', label: 'Grid', bg: 'bg-[linear-gradient(to_right,rgba(226,232,240,0.8)_1px,transparent_1px),linear-gradient(to_bottom,rgba(226,232,240,0.8)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(51,65,85,0.8)_1px,transparent_1px),linear-gradient(to_bottom,rgba(51,65,85,0.8)_1px,transparent_1px)] [background-size:24px_24px] bg-white dark:bg-slate-800' },
    { id: 'dots', label: 'Dotted', bg: 'bg-[radial-gradient(rgba(203,213,225,0.8)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(71,85,105,0.8)_1px,transparent_1px)] [background-size:24px_24px] bg-white dark:bg-slate-800' },
];

const TOOLS = [
  { id: 'pointer', label: 'Pointer', icon: MousePointer2, color: 'text-red-500' },
  { id: 'pen', label: 'Pen', icon: PenTool, color: 'text-blue-500' },
  { id: 'highlighter', label: 'Highlighter', icon: Highlighter, color: 'text-yellow-500' },
  { id: 'pencil', label: 'Pencil', icon: Pencil, color: 'text-gray-500' },
  { id: 'eraser', label: 'Eraser', icon: Eraser, color: 'text-slate-400' },
  { id: 'text', label: 'Text', icon: Type, color: 'text-cyan-500' },
];

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

// --- COMPONENTS ---

export const NotesApp: React.FC = () => {
  // Navigation & Data
  const [folders, setFolders] = useState<NoteFolder[]>(INITIAL_FOLDERS);
  const [notes, setNotes] = useState<Note[]>(INITIAL_NOTES);
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Editor State
  const [editorView, setEditorView] = useState<'split' | 'canvas' | 'text'>('split');
  const [activeTool, setActiveTool] = useState('pen');
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [paperType, setPaperType] = useState(PAPER_TYPES[0]);
  const [isAiMenuOpen, setIsAiMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // AI Explanation Modal State
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);

  // Text State
  const [htmlContent, setHtmlContent] = useState('');
  const textEditorRef = useRef<HTMLDivElement>(null);

  // --- LOGIC ---

  // Robust Canvas Initialization with ResizeObserver
  useEffect(() => {
    if (selectedNote && canvasContainerRef.current) {
        const resizeObserver = new ResizeObserver(entries => {
            const entry = entries[0];
            const { width, height } = entry.contentRect;
            const canvas = canvasRef.current;
            
            if (canvas && contextRef.current) {
                const tempDrawing = canvas.toDataURL();
                canvas.width = width * 2;
                canvas.height = height * 2;
                canvas.style.width = `${width}px`;
                canvas.style.height = `${height}px`;

                const ctx = canvas.getContext('2d')!;
                ctx.scale(2, 2);
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                contextRef.current = ctx;

                const img = new Image();
                img.src = tempDrawing;
                img.onload = () => ctx.drawImage(img, 0, 0, width, height);
            }
        });
        
        resizeObserver.observe(canvasContainerRef.current);
        
        const canvas = canvasRef.current!;
        const { offsetWidth, offsetHeight } = canvasContainerRef.current;
        canvas.width = offsetWidth * 2;
        canvas.height = offsetHeight * 2;
        canvas.style.width = `${offsetWidth}px`;
        canvas.style.height = `${offsetHeight}px`;
        const ctx = canvas.getContext('2d')!;
        ctx.scale(2, 2);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        contextRef.current = ctx;
        if (selectedNote.drawingData) {
            const img = new Image();
            img.src = selectedNote.drawingData;
            img.onload = () => ctx.drawImage(img, 0, 0, offsetWidth, offsetHeight);
        }
        
        return () => resizeObserver.disconnect();
    }
  }, [selectedNote]);

  // Tool Logic
  useEffect(() => {
      if (!contextRef.current) return;
      contextRef.current.strokeStyle = strokeColor;
      contextRef.current.lineWidth = strokeWidth;
      
      if (activeTool === 'highlighter') {
          contextRef.current.globalAlpha = 0.3;
          contextRef.current.lineWidth = 15;
          contextRef.current.globalCompositeOperation = 'source-over';
      } else if (activeTool === 'eraser') {
          contextRef.current.globalCompositeOperation = 'destination-out';
          contextRef.current.lineWidth = 20;
          contextRef.current.globalAlpha = 1;
      } else {
          contextRef.current.globalAlpha = 1;
          contextRef.current.globalCompositeOperation = 'source-over';
      }
  }, [activeTool, strokeColor, strokeWidth]);

  const startDrawing = ({ nativeEvent }: React.MouseEvent) => {
      if (!contextRef.current || !['pen', 'highlighter', 'eraser', 'pencil'].includes(activeTool)) return;
      const { offsetX, offsetY } = nativeEvent;
      contextRef.current.beginPath();
      contextRef.current.moveTo(offsetX, offsetY);
      setIsDrawing(true);
  };

  const draw = ({ nativeEvent }: React.MouseEvent) => {
      if (!isDrawing || !contextRef.current) return;
      const { offsetX, offsetY } = nativeEvent;
      contextRef.current.lineTo(offsetX, offsetY);
      contextRef.current.stroke();
  };

  const stopDrawing = () => {
      if(!contextRef.current) return;
      contextRef.current.closePath();
      setIsDrawing(false);
      saveCanvas();
  };

  const saveCanvas = () => {
      if (!selectedNote || !canvasRef.current) return;
      const dataUrl = canvasRef.current.toDataURL();
      setNotes(prev => prev.map(n => n.id === selectedNote.id ? { ...n, drawingData: dataUrl } : n));
  };
  
  const handleImageInsert = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && contextRef.current) {
        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                const ctx = contextRef.current!;
                const canvas = ctx.canvas;
                // Draw image centered
                const x = (canvas.width / 2 / 2) - (img.width / 2); // account for retina scaling
                const y = (canvas.height / 2 / 2) - (img.height / 2);
                ctx.drawImage(img, x, y);
                saveCanvas();
            };
            img.src = event.target?.result as string;
        };
        reader.readAsDataURL(file);
    }
  };

  // Note Management
  const createNote = () => {
      const newNote: Note = {
          id: Date.now().toString(),
          title: 'Untitled Note',
          content: '',
          folderId: selectedFolderId === 'all' ? 'lecture' : selectedFolderId,
          color: '#ffffff',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          tags: [],
      };
      setNotes([newNote, ...notes]);
      setSelectedNote(newNote);
      setHtmlContent('');
  };

  const handleTextChange = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!selectedNote) return;
    const newContent = e.currentTarget.innerHTML;
    setHtmlContent(newContent);
    setNotes(prevNotes => 
        prevNotes.map(note => 
            note.id === selectedNote.id ? { ...note, content: newContent, updatedAt: Date.now() } : note
        )
    );
  };
  
  const handleAiAction = async (action: 'summarize' | 'quiz' | 'grammar' | 'explain') => {
      setIsProcessing(true);
      try {
          if (action === 'explain') {
              const selection = window.getSelection()?.toString().trim();
              if (!selection) {
                  alert("Please select some text to explain.");
                  return;
              }
              setIsExplaining(true);
              const res = await GeminiService.explainText(selection);
              setExplanation(res);

          } else {
              if (!textEditorRef.current) return;
              const text = textEditorRef.current.innerText;
              if (!text.trim()) return;

              if (action === 'summarize') {
                  const res = await GeminiService.generateNoteSummary(text);
                  setHtmlContent(prev => prev + `<br><hr><h3>✨ AI Summary</h3><ul>${res.split('\n').map(r => `<li>${r}</li>`).join('')}</ul>`);
              } else if (action === 'quiz') {
                  const quiz = await GeminiService.generateNoteQuiz(text);
                  const quizHtml = quiz.map(q => `<p><b>Q: ${q.question}</b><br>A: ${q.options[q.correctIndex]}</p>`).join('');
                  setHtmlContent(prev => prev + `<br><hr><br><h3>AI Quiz</h3>${quizHtml}`);
              } else if (action === 'grammar') {
                  const fixed = await GeminiService.aiFixGrammar(text);
                  setHtmlContent(fixed);
              }
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsProcessing(false);
          setIsAiMenuOpen(false);
      }
  };
  
  const applyFormat = (command: string) => {
    document.execCommand(command, false);
    textEditorRef.current?.focus();
  };

  // --- RENDERERS ---

  const renderSidebar = () => (
      <div className="w-64 bg-gray-50 dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 flex flex-col h-full shrink-0">
          <div className="p-6">
              <h2 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <span className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white text-lg">N</span>
                  Notes
              </h2>
              <button 
                  onClick={createNote}
                  className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-6 shadow-md"
              >
                  <Plus size={18} /> New Note
              </button>
              
              <div className="space-y-1">
                  {folders.map(folder => (
                      <button
                          key={folder.id}
                          onClick={() => setSelectedFolderId(folder.id)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${selectedFolderId === folder.id ? 'bg-white dark:bg-slate-800 shadow-sm text-blue-600' : 'text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-900'}`}
                      >
                          <div className="flex items-center gap-3 font-medium text-sm">
                              {folder.id === 'all' && <LayoutGrid size={16} />}
                              {folder.id === 'lecture' && <FileText size={16} />}
                              {folder.id === 'personal' && <Lock size={16} />}
                              {folder.id === 'creative' && <Palette size={16} />}
                              {folder.name}
                          </div>
                          <span className="text-[10px] font-bold bg-gray-200 dark:bg-slate-700 px-2 py-0.5 rounded-full text-gray-500">{notes.filter(n => folder.id === 'all' || n.folderId === folder.id).length}</span>
                      </button>
                  ))}
              </div>
          </div>
          
          <div className="mt-auto p-4 border-t border-gray-200 dark:border-slate-800">
              <div className="relative">
                  <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                  <input 
                      value={searchTerm} 
                      onChange={e => setSearchTerm(e.target.value)}
                      placeholder="Search notes..." 
                      className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:border-blue-500"
                  />
              </div>
          </div>
      </div>
  );

  const renderNoteList = () => {
      const filtered = notes.filter(n => (selectedFolderId === 'all' || n.folderId === selectedFolderId) && n.title.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return (
          <div className="flex-1 bg-white dark:bg-slate-900 p-6 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filtered.map(note => (
                      <div 
                          key={note.id} 
                          onClick={() => { setSelectedNote(note); setHtmlContent(note.content); }}
                          className="group relative aspect-[3/4] bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer overflow-hidden flex flex-col"
                      >
                          <div className="flex-1 bg-gray-50 dark:bg-slate-900/50 p-4 relative overflow-hidden">
                              {note.drawingData && <img src={note.drawingData} className="absolute inset-0 w-full h-full object-cover opacity-80" alt="Note Preview" />}
                              <div className="relative z-10 text-[10px] text-slate-500 line-clamp-6" dangerouslySetInnerHTML={{__html: note.content || 'Empty note...'}}></div>
                          </div>
                          <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700">
                              <h3 className="font-bold text-slate-800 dark:text-white truncate mb-1">{note.title}</h3>
                              <p className="text-[10px] text-slate-400">{new Date(note.updatedAt).toLocaleDateString()}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      );
  };

  const renderEditor = () => (
      <div className="fixed inset-0 z-50 bg-gray-100 dark:bg-slate-950 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          {/* AI Explanation Modal */}
          {explanation && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => { setExplanation(null); setIsExplaining(false); }}>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-2xl max-w-lg w-full animate-in zoom-in" onClick={e => e.stopPropagation()}>
                      <h3 className="font-bold text-lg mb-4 text-slate-800 dark:text-white flex items-center gap-2"><Lightbulb className="text-yellow-400"/> AI Explanation</h3>
                      {isExplaining ? <Loader2 className="animate-spin" /> : <p className="text-slate-600 dark:text-slate-300">{explanation}</p>}
                  </div>
              </div>
          )}
          
          {/* HEADER */}
          <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center justify-between px-6 shadow-sm z-30">
              <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedNote(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
                      <ChevronLeft size={24} />
                  </button>
                  <input 
                      value={selectedNote?.title} 
                      onChange={e => setNotes(prev => prev.map(n => n.id === selectedNote!.id ? { ...n, title: e.target.value } : n))}
                      className="bg-transparent text-xl font-bold text-slate-800 dark:text-white outline-none placeholder:text-gray-300"
                      placeholder="Untitled Note"
                  />
              </div>
              <div className="flex items-center gap-2">
                  <div className="relative">
                      <button onClick={() => setIsAiMenuOpen(!isAiMenuOpen)} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full font-bold text-sm shadow-lg hover:shadow-indigo-500/30 transition-all">
                          {isProcessing ? <Sparkles size={16} className="animate-spin" /> : <Sparkles size={16} />} AI Actions
                      </button>
                      {isAiMenuOpen && (
                          <div className="absolute top-12 right-0 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 animate-in slide-in-from-top-2 z-50">
                              <button onClick={() => handleAiAction('explain')} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-2"><Lightbulb size={14}/> Explain Selection</button>
                              <button onClick={() => handleAiAction('summarize')} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">Summarize Page</button>
                              <button onClick={() => handleAiAction('grammar')} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">Fix Grammar</button>
                              <button onClick={() => handleAiAction('quiz')} className="w-full text-left px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200">Generate Quiz</button>
                          </div>
                      )}
                  </div>
                  <div className="h-8 w-px bg-gray-200 dark:bg-slate-700 mx-2"></div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"><Share2 size={20}/></button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"><Download size={20}/></button>
                  <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white"><MoreVertical size={20}/></button>
              </div>
          </header>

          {/* DUAL PAD CONTAINER */}
          <div className="flex-1 flex overflow-hidden">
              {/* Drawing Pad */}
              <div className={`relative h-full transition-all duration-300 ease-in-out ${editorView === 'text' ? 'w-0 opacity-0' : editorView === 'split' ? 'w-1/2' : 'w-full'}`}>
                  <div ref={canvasContainerRef} className={`w-full h-full overflow-hidden ${paperType.bg}`}>
                      <canvas ref={canvasRef} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} className="w-full h-full cursor-crosshair" />
                  </div>
              </div>
              {/* Writing Pad */}
              <div className={`relative h-full transition-all duration-300 ease-in-out ${editorView === 'canvas' ? 'w-0 opacity-0' : editorView === 'split' ? 'w-1/2' : 'w-full'}`}>
                  <div className="w-full h-full overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 flex flex-col">
                      {/* --- NEW TEXT FORMATTING TOOLBAR --- */}
                      <div className="sticky top-0 z-10 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 px-4 py-1 flex items-center gap-1">
                          {[
                              { cmd: 'bold', icon: Bold }, { cmd: 'italic', icon: Italic }, { cmd: 'underline', icon: Underline }, { cmd: 'strikeThrough', icon: Strikethrough },
                              { cmd: 'insertUnorderedList', icon: List }, { cmd: 'insertOrderedList', icon: ListOrdered },
                              { cmd: 'justifyLeft', icon: AlignLeft }, { cmd: 'justifyCenter', icon: AlignCenter }, { cmd: 'justifyRight', icon: AlignRight },
                          ].map(item => (
                              <button key={item.cmd} onClick={() => applyFormat(item.cmd)} className="p-2 text-slate-500 hover:bg-gray-200 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-200 rounded-md">
                                  <item.icon size={16} />
                              </button>
                          ))}
                      </div>
                      <div
                          ref={textEditorRef}
                          contentEditable
                          suppressContentEditableWarning={true}
                          dangerouslySetInnerHTML={{ __html: htmlContent }}
                          onBlur={handleTextChange}
                          className="prose dark:prose-invert max-w-none w-full h-full outline-none text-slate-800 dark:text-slate-200 text-lg leading-relaxed p-12 flex-1"
                          style={{pointerEvents: 'auto'}}
                      />
                  </div>
              </div>
          </div>

          {/* FLOATING TOOLBAR */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-gray-200 dark:border-slate-700 p-2 flex items-center gap-2 z-40 transition-all hover:scale-105">
              {TOOLS.map(tool => (
                  <button key={tool.id} onClick={() => setActiveTool(tool.id)} className={`p-3 rounded-full transition-all relative group ${activeTool === tool.id ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`} title={tool.label}>
                      <tool.icon size={22} className={`${activeTool === tool.id ? tool.color : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                      {activeTool === tool.id && <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${tool.color.replace('text-', 'bg-')}`}></div>}
                  </button>
              ))}
              <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 mx-1"></div>
              {/* --- NEW IMAGE INSERT BUTTON --- */}
              <input type="file" ref={fileInputRef} onChange={handleImageInsert} className="hidden" accept="image/*" />
              <button onClick={() => fileInputRef.current?.click()} className="p-3 rounded-full hover:bg-gray-50 dark:hover:bg-slate-700 text-slate-400" title="Insert Image"><ImageIcon size={22}/></button>
              <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 mx-1"></div>
              {/* View Switcher */}
              <button onClick={() => setEditorView('canvas')} title="Canvas Only" className={`p-3 rounded-full ${editorView === 'canvas' ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}><Pencil size={22} className={editorView === 'canvas' ? 'text-indigo-500' : 'text-slate-400'} /></button>
              <button onClick={() => setEditorView('split')} title="Split View" className={`p-3 rounded-full ${editorView === 'split' ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}><Split size={22} className={editorView === 'split' ? 'text-indigo-500' : 'text-slate-400'} /></button>
              <button onClick={() => setEditorView('text')} title="Text Only" className={`p-3 rounded-full ${editorView === 'text' ? 'bg-slate-100 dark:bg-slate-700' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}><Type size={22} className={editorView === 'text' ? 'text-indigo-500' : 'text-slate-400'} /></button>
              <div className="w-px h-8 bg-gray-200 dark:bg-slate-700 mx-1"></div>
              <div className="flex items-center gap-1 px-2">
                  {COLORS.map(c => (
                      <button key={c} onClick={() => setStrokeColor(c)} className={`w-6 h-6 rounded-full border-2 transition-all ${strokeColor === c ? 'border-gray-400 scale-110' : 'border-transparent hover:scale-110'}`} style={{ backgroundColor: c }} />
                  ))}
              </div>
          </div>

          {/* Settings Panel */}
          {(activeTool === 'pen' || activeTool === 'highlighter' || activeTool === 'pencil') && (
              <div className="absolute bottom-28 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 p-4 flex flex-col gap-3 animate-in slide-in-from-bottom-2 z-40 w-64">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>Stroke Size</span>
                      <span>{strokeWidth}px</span>
                  </div>
                  <input type="range" min="1" max="30" value={strokeWidth} onChange={e => setStrokeWidth(parseInt(e.target.value))} className="w-full accent-blue-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                  <div className="flex justify-between gap-2 mt-1">
                      {PAPER_TYPES.map(pt => (
                          <button key={pt.id} onClick={() => setPaperType(pt)} className={`flex-1 h-8 rounded border transition-all ${paperType.id === pt.id ? 'border-blue-500 bg-blue-50 dark:bg-slate-700' : 'border-gray-200 dark:border-slate-700 hover:border-gray-400'}`} title={pt.label}>
                              <div className={`w-full h-full rounded opacity-50 ${pt.bg.replace('bg-white', '').replace('dark:bg-slate-800', '')}`}></div>
                          </button>
                      ))}
                  </div>
              </div>
          )}
      </div>
  );

  return (
    <div className="h-full flex bg-white dark:bg-slate-900 animate-fadeIn">
        {selectedNote ? renderEditor() : (
            <>
                {renderSidebar()}
                {renderNoteList()}
            </>
        )}
    </div>
  );
};
