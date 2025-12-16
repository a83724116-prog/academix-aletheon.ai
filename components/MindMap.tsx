
import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { GeminiService } from '../services/geminiService';
import { MindMapNode } from '../types';
import { Loader2, ZoomIn, ZoomOut, Download, Image as ImageIcon, GitFork, Wand2, Send, Sparkles } from 'lucide-react';

export const MindMap: React.FC = () => {
  const [mode, setMode] = useState<'interactive' | 'image'>('image');
  const [formData, setFormData] = useState({ class: '', subject: '', chapter: '' });
  
  // Interactive Mode State
  const [data, setData] = useState<MindMapNode | null>(null);
  
  // Image Mode State
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [editPrompt, setEditPrompt] = useState('');

  const [loading, setLoading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const SUGGESTIONS = [
    "Add a retro filter",
    "Make it high contrast",
    "Add more diagrams",
    "Use a dark background",
    "Simplify the text",
    "Add a futuristic neon style"
  ];

  const generateMap = async () => {
    if (!formData.chapter || !formData.subject) {
        alert("Please enter Subject and Chapter details.");
        return;
    }
    setLoading(true);
    try {
        const topic = `${formData.subject} - ${formData.chapter} (Class ${formData.class})`;
        
        if (mode === 'interactive') {
            const result = await GeminiService.generateMindMap(topic);
            setData(result);
            setImageUrl(null);
        } else {
            const result = await GeminiService.generateMindMapImage(formData.class, formData.subject, formData.chapter);
            setImageUrl(result);
            setData(null);
        }
    } catch (e) {
      alert("Failed to generate mind map. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditImage = async (promptOverride?: string) => {
    const promptToUse = promptOverride || editPrompt;
    if (!imageUrl || !promptToUse.trim()) return;
    setLoading(true);
    try {
        const result = await GeminiService.editMindMapImage(imageUrl, promptToUse);
        if (result) {
            setImageUrl(result);
            setEditPrompt('');
        }
    } catch (e) {
        alert("Failed to edit image.");
    } finally {
        setLoading(false);
    }
  };

  // D3 Rendering Logic
  useEffect(() => {
    if (mode !== 'interactive' || !data || !svgRef.current || !wrapperRef.current) return;

    const width = wrapperRef.current.clientWidth;
    const height = 600;
    
    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", "translate(100,0)"); // Initial margin

    const treeLayout = d3.tree<MindMapNode>().size([height, width - 200]);
    const root = d3.hierarchy<MindMapNode>(data);
    treeLayout(root);

    // Links
    svg.selectAll(".link")
      .data(root.links())
      .enter()
      .append("path")
      .attr("class", "link")
      .attr("fill", "none")
      .attr("stroke", "#94a3b8")
      .attr("stroke-width", 2)
      .attr("d", d3.linkHorizontal()
        .x((d: any) => d.y)
        .y((d: any) => d.x) as any
      );

    // Nodes
    const node = svg.selectAll(".node")
      .data(root.descendants())
      .enter()
      .append("g")
      .attr("class", "node")
      .attr("transform", (d: any) => `translate(${d.y},${d.x})`);

    node.append("circle")
      .attr("r", 6)
      .attr("fill", (d) => d.depth === 0 ? "#6366f1" : (d.depth === 1 ? "#ec4899" : "#10b981"))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2);

    node.append("text")
      .attr("dy", 3)
      .attr("x", (d) => d.children ? -10 : 10)
      .style("text-anchor", (d) => d.children ? "end" : "start")
      .text((d) => d.data.name)
      .attr("class", "text-xs font-medium fill-slate-700 dark:fill-slate-200 bg-white dark:bg-slate-800 px-1 rounded shadow-sm");

    // Add zoom support
    const zoom = d3.zoom().on("zoom", (event) => {
        svg.attr("transform", event.transform);
    });
    d3.select(svgRef.current).call(zoom as any);

  }, [data, mode]);

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-center">
         <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl">
             <button 
                onClick={() => setMode('image')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'image' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-gray-500'}`}
             >
                <ImageIcon size={16} /> Pictograph
             </button>
             <button 
                onClick={() => setMode('interactive')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'interactive' ? 'bg-white dark:bg-slate-800 text-primary shadow-sm' : 'text-gray-500'}`}
             >
                <GitFork size={16} /> Interactive
             </button>
         </div>

         <div className="flex-1 flex gap-2 w-full">
            <input 
                value={formData.class}
                onChange={e => setFormData({...formData, class: e.target.value})}
                placeholder="Class (e.g. 10)"
                className="w-20 p-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 ring-primary"
            />
            <input 
                value={formData.subject}
                onChange={e => setFormData({...formData, subject: e.target.value})}
                placeholder="Subject"
                className="flex-1 p-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 ring-primary"
            />
            <input 
                value={formData.chapter}
                onChange={e => setFormData({...formData, chapter: e.target.value})}
                placeholder="Chapter/Topic"
                className="flex-1 p-2 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 ring-primary"
            />
            <button
              onClick={generateMap}
              disabled={loading}
              className="bg-primary text-white px-6 py-2 rounded-xl hover:bg-indigo-600 disabled:opacity-50 transition-colors flex items-center font-bold"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Generate"}
            </button>
         </div>
      </div>

      {/* Content Area */}
      <div ref={wrapperRef} className="flex-1 bg-white/50 dark:bg-slate-800/50 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden relative shadow-inner">
         
         {/* Initial State */}
         {!data && !imageUrl && !loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <Wand2 size={48} className="mb-4 opacity-20" />
                <p>Enter details to visualize your chapter</p>
                {mode === 'image' && <p className="text-xs text-primary mt-2 flex items-center gap-1"><Sparkles size={12}/> Powered by Nano Banana (Gemini 2.5 Flash Image)</p>}
            </div>
         )}
         
         {/* Loading State */}
         {loading && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-900/80 z-20 backdrop-blur-sm">
                <Loader2 size={48} className="animate-spin text-primary mb-4" />
                <p className="font-bold text-gray-600 dark:text-gray-300">
                    {mode === 'image' ? 'Creating visual masterpiece...' : 'Structuring concepts...'}
                </p>
             </div>
         )}

         {/* Interactive Mode */}
         {mode === 'interactive' && (
             <svg ref={svgRef} className="w-full h-full cursor-grab active:cursor-grabbing"></svg>
         )}

         {/* Image Mode */}
         {mode === 'image' && imageUrl && (
             <div className="w-full h-full flex flex-col">
                 <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gray-100 dark:bg-slate-900/50">
                    <img src={imageUrl} alt="Mind Map" className="max-w-full max-h-full object-contain shadow-2xl rounded-lg" />
                 </div>
                 
                 {/* Edit Bar */}
                 <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-3">
                    {/* Suggestion Chips */}
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        {SUGGESTIONS.map(s => (
                            <button
                                key={s}
                                onClick={() => handleEditImage(s)}
                                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-gray-100 dark:bg-slate-700 text-xs font-medium text-gray-600 dark:text-gray-300 hover:bg-primary hover:text-white transition-colors flex items-center gap-1"
                            >
                                <Sparkles size={10} /> {s}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Wand2 size={16} className="absolute left-3 top-3.5 text-gray-400" />
                            <input 
                                value={editPrompt}
                                onChange={e => setEditPrompt(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleEditImage()}
                                placeholder="Edit using AI (e.g., 'Remove the person in the background')"
                                className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 ring-primary"
                            />
                        </div>
                        <button 
                            onClick={() => handleEditImage()}
                            disabled={loading || !editPrompt.trim()}
                            className="bg-secondary text-white px-4 rounded-xl hover:bg-pink-600 disabled:opacity-50 transition-colors"
                        >
                            <Send size={20} />
                        </button>
                        <a 
                            href={imageUrl} 
                            download="mindmap.png"
                            className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 px-4 rounded-xl hover:bg-gray-200 dark:hover:bg-slate-600 flex items-center justify-center"
                        >
                            <Download size={20} />
                        </a>
                    </div>
                 </div>
             </div>
         )}
      </div>
    </div>
  );
};
