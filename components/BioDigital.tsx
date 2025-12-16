
import React, { useState, useEffect, useRef } from 'react';
import { BioModel, BioHotspot } from '../types';
import { GeminiService } from '../services/geminiService';
import { 
  Box, Search, Info, Maximize2, RotateCcw, 
  ZoomIn, ZoomOut, Layers, Eye, Activity, 
  BrainCircuit, Heart, Sprout, Dna, ChevronRight, Loader2, Sparkles, Volume2, Plus, PlayCircle, Film
} from 'lucide-react';

// --- MOCK DATA ---
const INITIAL_MODELS: BioModel[] = [
  {
    id: 'heart',
    name: 'Human Heart',
    category: 'Human Anatomy',
    description: 'The engine of the circulatory system, pumping blood throughout the body.',
    image: 'https://cdn.pixabay.com/photo/2012/04/14/14/23/heart-34131_1280.png',
    hotspots: [
      { id: 'aorta', x: 50, y: 15, label: 'Aorta' },
      { id: 'left_ventricle', x: 65, y: 60, label: 'Left Ventricle' },
      { id: 'right_atrium', x: 30, y: 35, label: 'Right Atrium' },
      { id: 'pulmonary', x: 40, y: 25, label: 'Pulmonary Artery' },
    ]
  },
  {
    id: 'brain',
    name: 'Human Brain',
    category: 'Human Anatomy',
    description: 'The command center of the nervous system.',
    image: 'https://cdn.pixabay.com/photo/2013/07/13/11/55/brain-158941_1280.png',
    hotspots: [
      { id: 'frontal', x: 25, y: 40, label: 'Frontal Lobe' },
      { id: 'cerebellum', x: 75, y: 70, label: 'Cerebellum' },
      { id: 'temporal', x: 50, y: 60, label: 'Temporal Lobe' },
    ]
  },
  {
    id: 'cell',
    name: 'Plant Cell',
    category: 'Botany',
    description: 'The structural and functional unit of plants.',
    image: 'https://cdn.pixabay.com/photo/2021/11/20/03/17/cell-6810751_1280.png',
    hotspots: [
      { id: 'nucleus', x: 50, y: 50, label: 'Nucleus' },
      { id: 'wall', x: 85, y: 50, label: 'Cell Wall' },
      { id: 'chloroplast', x: 30, y: 60, label: 'Chloroplast' },
    ]
  },
  {
    id: 'dna',
    name: 'DNA Helix',
    category: 'Genetics',
    description: 'The molecule that carries genetic instructions.',
    image: 'https://cdn.pixabay.com/photo/2013/07/18/10/56/dna-163526_1280.jpg',
    hotspots: [
      { id: 'backbone', x: 20, y: 20, label: 'Sugar-Phosphate' },
      { id: 'base', x: 50, y: 50, label: 'Base Pair' },
    ]
  }
];

export const BioDigital: React.FC = () => {
  const [models, setModels] = useState<BioModel[]>(INITIAL_MODELS);
  const [activeModel, setActiveModel] = useState<BioModel>(INITIAL_MODELS[0]);
  const [selectedPart, setSelectedPart] = useState<BioHotspot | null>(null);
  const [tutorMessage, setTutorMessage] = useState("Welcome to the BioDigital Lab! Select a part to learn more.");
  const [loadingTutor, setLoadingTutor] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState('');
  
  // Veo State
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);
  const [viewMode, setViewMode] = useState<'model' | 'video'>('model');

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-rotate effect for "3D" feel
  useEffect(() => {
    let interval: any;
    if (isAutoRotating) {
        interval = setInterval(() => {
            setRotation(prev => ({ ...prev, y: (prev.y + 1) % 360 }));
        }, 50);
    }
    return () => clearInterval(interval);
  }, [isAutoRotating]);

  // AI Tutor Fetch
  const handlePartClick = async (part: BioHotspot) => {
    setSelectedPart(part);
    setLoadingTutor(true);
    // Slight zoom to focus
    setZoom(1.5);
    
    try {
        const explanation = await GeminiService.getBioTutorExplanation(part.label, activeModel.name);
        setTutorMessage(explanation);
        
        // Auto-speak
        const u = new SpeechSynthesisUtterance(explanation);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
    } catch (e) {
        setTutorMessage(`Here is the ${part.label}. It's a key part of the ${activeModel.name}.`);
    } finally {
        setLoadingTutor(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Check if exists locally
    const existing = models.find(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (existing) {
        setActiveModel(existing);
        resetView();
        return;
    }

    setIsGenerating(true);
    try {
        setGenerationStep('Thinking & Designing model...');
        // 1. Get Model Config from Gemini
        const modelData = await GeminiService.generateBioModel(searchQuery);
        
        setGenerationStep('Generating 3D visuals (Nano Banana)...');
        // 2. Generate Image using Gemini 2.5 Flash Image
        const imageBase64 = await GeminiService.generateBioImage(modelData.imagePrompt);

        if (!imageBase64) {
            throw new Error("Failed to generate visual.");
        }

        // 3. Create new Model Object
        const newModel: BioModel = {
            id: Date.now().toString(),
            name: modelData.name,
            category: modelData.category,
            description: modelData.description,
            image: imageBase64,
            hotspots: modelData.hotspots
        };

        setModels(prev => [newModel, ...prev]);
        setActiveModel(newModel);
        resetView();
        setSearchQuery('');
    } catch (error) {
        alert("Could not generate model. Please try a different topic.");
    } finally {
        setIsGenerating(false);
        setGenerationStep('');
    }
  };
  
  const handleGenerateVideo = async () => {
      if (activeModel.video) {
          setViewMode('video');
          return;
      }
      
      // Check for Key (client side check for Veo)
      if (window.aistudio && !await window.aistudio.hasSelectedApiKey()) {
          await window.aistudio.openSelectKey();
          if (!await window.aistudio.hasSelectedApiKey()) return;
      }

      setIsVideoGenerating(true);
      try {
          // Pass the current model image to Veo for consistent generation
          const videoUrl = await GeminiService.generateBioVideo(activeModel.name, activeModel.image);
          if (videoUrl) {
              const updatedModel = { ...activeModel, video: videoUrl };
              // Update local state and models array
              setActiveModel(updatedModel);
              setModels(prev => prev.map(m => m.id === updatedModel.id ? updatedModel : m));
              setViewMode('video');
          } else {
              alert("Video generation failed or timed out.");
          }
      } catch (e) {
          alert("Error generating video.");
      } finally {
          setIsVideoGenerating(false);
      }
  };

  const resetView = () => {
      setZoom(1);
      setRotation({ x: 0, y: 0 });
      setSelectedPart(null);
      setViewMode('model');
      setTutorMessage(`Exploring the ${activeModel.name}. Click a glowing marker!`);
  };

  // 3D Parallax Mouse Effect
  const handleMouseMove = (e: React.MouseEvent) => {
      if (isAutoRotating || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      // Subtle tilt
      setRotation({
          x: (y - 0.5) * -10,
          y: (x - 0.5) * 10
      });
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-slate-50 dark:bg-slate-900 animate-fadeIn overflow-hidden">
        
        {/* LEFT SIDEBAR - MODELS */}
        <div className="w-full md:w-80 bg-white dark:bg-slate-950 border-r border-gray-200 dark:border-slate-800 flex flex-col z-20 shadow-xl">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
                <h2 className="text-2xl font-black flex items-center gap-2">
                    <Box size={24} /> BioDigital
                </h2>
                <p className="text-indigo-100 text-sm opacity-90">Interactive 3D Biology Explorer</p>
            </div>
            
            <div className="p-4 border-b border-gray-100 dark:border-slate-800">
                <form onSubmit={handleSearch} className="relative">
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Generate new model (e.g. Eye)"
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-100 dark:bg-slate-900 border-none rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none focus:ring-2 ring-indigo-500"
                        disabled={isGenerating}
                    />
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    {isGenerating && <Loader2 className="absolute right-3 top-2.5 text-indigo-500 animate-spin" size={16} />}
                </form>
                {isGenerating && (
                    <p className="text-xs text-indigo-500 font-medium mt-2 animate-pulse flex items-center gap-1">
                        <Sparkles size={12} /> {generationStep}
                    </p>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">My Models</div>
                {models.map(model => (
                    <button
                        key={model.id}
                        onClick={() => { setActiveModel(model); resetView(); }}
                        className={`w-full p-3 rounded-xl flex items-center gap-4 transition-all ${activeModel.id === model.id ? 'bg-indigo-50 dark:bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/20' : 'hover:bg-gray-50 dark:hover:bg-slate-900 border-transparent'} border group`}
                    >
                        <div className={`w-12 h-12 rounded-lg bg-gray-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden border border-gray-200 dark:border-slate-700 relative`}>
                            <img src={model.image} alt={model.name} className="w-full h-full object-cover opacity-90 group-hover:scale-110 transition-transform" />
                            {!INITIAL_MODELS.find(m => m.id === model.id) && (
                                <div className="absolute top-0 right-0 bg-indigo-500 text-white p-0.5 rounded-bl-md">
                                    <Sparkles size={8} />
                                </div>
                            )}
                        </div>
                        <div className="text-left flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 dark:text-white truncate">{model.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{model.category}</p>
                        </div>
                        {activeModel.id === model.id && <ChevronRight size={16} className="ml-auto text-indigo-500"/>}
                    </button>
                ))}
            </div>

            <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50 dark:bg-slate-900">
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700">
                     <div className="flex items-center gap-2 mb-2 text-indigo-500 font-bold">
                         <Sparkles size={16} /> Dr. Nova
                     </div>
                     <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed min-h-[3rem]">
                         {loadingTutor ? <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin"/> Searching data...</span> : tutorMessage}
                     </p>
                     {selectedPart && !loadingTutor && (
                         <button onClick={() => handlePartClick(selectedPart)} className="mt-2 text-xs font-bold text-gray-400 hover:text-indigo-500 flex items-center gap-1">
                             <Volume2 size={12}/> Replay Explanation
                         </button>
                     )}
                 </div>
            </div>
        </div>

        {/* MAIN VIEWPORT */}
        <div className="flex-1 relative bg-slate-100 dark:bg-slate-900 overflow-hidden flex flex-col">
            
            {/* Toolbar */}
            <div className="absolute top-4 left-4 right-4 z-30 flex justify-between items-start pointer-events-none">
                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md p-2 rounded-xl shadow-lg pointer-events-auto flex flex-col gap-2">
                    <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300" title="Zoom In"><ZoomIn size={20}/></button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300" title="Zoom Out"><ZoomOut size={20}/></button>
                    <button onClick={resetView} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300" title="Reset"><RotateCcw size={20}/></button>
                    <button onClick={() => setIsAutoRotating(!isAutoRotating)} className={`p-2 rounded-lg transition-colors ${isAutoRotating ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`} title="Auto Rotate"><Activity size={20}/></button>
                </div>

                <div className="flex flex-col items-end gap-2">
                    <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md px-4 py-2 rounded-xl shadow-lg pointer-events-auto text-right">
                         <h1 className="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2 justify-end">
                             {activeModel.name}
                             {!INITIAL_MODELS.find(m => m.id === activeModel.id) && (
                                <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">AI Generated</span>
                             )}
                         </h1>
                         <p className="text-xs text-slate-500">{activeModel.category}</p>
                    </div>

                    {/* Veo Integration */}
                    <button 
                        onClick={handleGenerateVideo}
                        disabled={isVideoGenerating}
                        className="pointer-events-auto bg-black text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold hover:bg-gray-900 transition-colors"
                    >
                        {isVideoGenerating ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />}
                        {activeModel.video ? 'Play Veo Video' : 'Generate Veo Animation'}
                    </button>
                    {activeModel.video && viewMode === 'video' && (
                         <button 
                            onClick={() => setViewMode('model')}
                            className="pointer-events-auto bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold"
                        >
                            <Box size={16} /> Back to Model
                        </button>
                    )}
                </div>
            </div>

            {/* 3D Stage */}
            <div 
                ref={containerRef}
                className="flex-1 flex items-center justify-center relative perspective-1000 cursor-move bg-[url('https://www.transparenttextures.com/patterns/graphy.png')]"
                onMouseMove={handleMouseMove}
                onMouseLeave={() => { if(!isAutoRotating) setRotation({x:0, y:0}) }}
            >
                {/* Simulated 3D Object or Video */}
                {viewMode === 'video' && activeModel.video ? (
                    <div className="w-[80%] max-w-4xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden relative z-10">
                        <video 
                            src={activeModel.video} 
                            controls 
                            autoPlay 
                            loop 
                            className="w-full h-full object-contain"
                        />
                    </div>
                ) : (
                    <div 
                        className="relative transition-transform duration-200 ease-out"
                        style={{
                            transform: `scale(${zoom}) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
                            transformStyle: 'preserve-3d',
                            width: '500px',
                            height: '500px'
                        }}
                    >
                         {/* The Image (Acting as the model) */}
                         <img 
                            src={activeModel.image} 
                            alt={activeModel.name} 
                            className="w-full h-full object-contain drop-shadow-2xl filter brightness-110 contrast-110"
                            draggable={false}
                         />
                         
                         {/* Hotspots Layer */}
                         <div className="absolute inset-0 z-10 pointer-events-none">
                             {activeModel.hotspots.map(spot => (
                                 <button
                                    key={spot.id}
                                    onClick={() => handlePartClick(spot)}
                                    className={`
                                        absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center cursor-pointer pointer-events-auto transition-all duration-300 group
                                        ${selectedPart?.id === spot.id ? 'bg-indigo-600 scale-125 z-50' : 'bg-white/50 hover:bg-indigo-500 hover:scale-110'}
                                        shadow-[0_0_15px_rgba(99,102,241,0.5)] border-2 border-white
                                    `}
                                    style={{ 
                                        left: `${spot.x}%`, 
                                        top: `${spot.y}%`,
                                        transform: `translateZ(20px)` // Pop out effect
                                    }}
                                 >
                                     <div className={`w-2 h-2 rounded-full ${selectedPart?.id === spot.id ? 'bg-white animate-pulse' : 'bg-indigo-600'}`}></div>
                                     
                                     {/* Tooltip Label */}
                                     <div className={`
                                         absolute left-full ml-3 bg-slate-900/90 text-white text-xs font-bold px-3 py-1.5 rounded-lg whitespace-nowrap backdrop-blur-sm
                                         opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                                         ${selectedPart?.id === spot.id ? 'opacity-100' : ''}
                                     `}>
                                         {spot.label}
                                     </div>

                                     {/* Connecting Line */}
                                     {selectedPart?.id === spot.id && (
                                         <div className="absolute right-full top-1/2 w-8 h-0.5 bg-indigo-500 origin-right animate-in fade-in zoom-in"></div>
                                     )}
                                 </button>
                             ))}
                         </div>
                    </div>
                )}
            </div>

            {/* Bottom Info Bar */}
            <div className="bg-white dark:bg-slate-950 p-4 border-t border-gray-200 dark:border-slate-800 flex items-center justify-between z-20">
                <div className="flex items-center gap-4">
                    <div className="hidden md:block">
                        <p className="text-xs font-bold text-gray-400 uppercase">Interaction Mode</p>
                        <p className="text-sm font-bold text-slate-700 dark:text-white">{viewMode === 'video' ? 'Animation Playback' : 'Interactive Exploration'}</p>
                    </div>
                </div>
                {viewMode === 'model' && (
                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                         {activeModel.hotspots.map(h => (
                             <button 
                                key={h.id}
                                onClick={() => handlePartClick(h)}
                                className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${selectedPart?.id === h.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700 hover:border-indigo-500'}`}
                             >
                                 {h.label}
                             </button>
                         ))}
                    </div>
                )}
            </div>

        </div>
    </div>
  );
};
