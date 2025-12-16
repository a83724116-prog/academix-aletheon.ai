
import React, { useState, useEffect, useRef } from 'react';
import { Chemical, LabTool, Experiment } from '../types';
import { GeminiService } from '../services/geminiService';
import { 
  FlaskConical, Flame, RefreshCw, ChevronUp, ChevronDown, CheckCircle2, 
  ShieldAlert, Volume2, VolumeX, Beaker, Thermometer, Droplets, 
  TestTube, Pipette, ArrowLeft, Microscope, Info, Check, X, Award, Play, Sparkles, Loader2
} from 'lucide-react';

// --- ASSETS & DATA ---

const CHEMICALS: Chemical[] = [
  // Elements
  { id: 'c', symbol: 'C', name: 'Carbon (Charcoal)', formula: 'C', type: 'solid', color: '#1a1a1a', category: 'element', image: 'https://cdn-icons-png.flaticon.com/512/2933/2933892.png', desc: 'Black solid, porous.' },
  { id: 's', symbol: 'S', name: 'Sulfur Powder', formula: 'S', type: 'solid', color: '#fef08a', category: 'element', image: 'https://cdn-icons-png.flaticon.com/512/2933/2933758.png', desc: 'Yellow crystalline powder.' },
  { id: 'fe', symbol: 'Fe', name: 'Iron Filings', formula: 'Fe', type: 'solid', color: '#525252', category: 'element', image: 'https://cdn-icons-png.flaticon.com/512/5696/5696853.png', desc: 'Grey magnetic powder.' },
  { id: 'cu', symbol: 'Cu', name: 'Copper Strip', formula: 'Cu', type: 'solid', color: '#b45309', category: 'element', image: 'https://cdn-icons-png.flaticon.com/512/8207/8207759.png', desc: 'Reddish-brown metal.' },
  { id: 'al', symbol: 'Al', name: 'Aluminium Foil', formula: 'Al', type: 'solid', color: '#d1d5db', category: 'element', image: 'https://cdn-icons-png.flaticon.com/512/3756/3756832.png', desc: 'Silvery-white metal.' },
  { id: 'zn', symbol: 'Zn', name: 'Zinc Granules', formula: 'Zn', type: 'solid', color: '#9ca3af', category: 'element', image: 'https://cdn-icons-png.flaticon.com/512/6122/6122606.png', desc: 'Grey metallic granules.' },
  
  // Acids & Bases
  { id: 'hcl', symbol: 'HCl', name: 'Dilute HCl', formula: 'HCl', type: 'acid', color: 'rgba(255, 255, 255, 0.2)', category: 'acid', image: 'https://cdn-icons-png.flaticon.com/512/4256/4256900.png', desc: 'Colorless, pungent acid.' },
  { id: 'h2so4', symbol: 'H₂SO₄', name: 'Dilute H₂SO₄', formula: 'H₂SO₄', type: 'acid', color: 'rgba(255, 255, 255, 0.2)', category: 'acid', image: 'https://cdn-icons-png.flaticon.com/512/9118/9118671.png', desc: 'Strong mineral acid.' },
  { id: 'naoh', symbol: 'NaOH', name: 'Sodium Hydroxide', formula: 'NaOH', type: 'base', color: 'rgba(255, 255, 255, 0.3)', category: 'base', image: 'https://cdn-icons-png.flaticon.com/512/4600/4600293.png', desc: 'Strong alkali solution.' },
  { id: 'vinegar', symbol: 'CH₃COOH', name: 'Vinegar', formula: 'CH₃COOH', type: 'acid', color: 'rgba(254, 215, 170, 0.4)', category: 'acid', image: 'https://cdn-icons-png.flaticon.com/512/2442/2442071.png', desc: 'Acetic acid solution.' },
  { id: 'nahco3', symbol: 'NaHCO₃', name: 'Baking Soda', formula: 'NaHCO₃', type: 'solid', color: '#ffffff', category: 'base', image: 'https://cdn-icons-png.flaticon.com/512/2454/2454226.png', desc: 'White powder.' },
  
  // Others
  { id: 'h2o', symbol: 'H₂O', name: 'Distilled Water', formula: 'H₂O', type: 'liquid', color: 'rgba(219, 234, 254, 0.4)', category: 'compound', image: 'https://cdn-icons-png.flaticon.com/512/3262/3262846.png', desc: 'Pure solvent.' },
  { id: 'nacl_sol', symbol: 'NaCl', name: 'Salt Solution', formula: 'NaCl(aq)', type: 'solution', color: 'rgba(255, 255, 255, 0.5)', category: 'salt', image: 'https://cdn-icons-png.flaticon.com/512/3389/3389066.png', desc: 'Saline water.' },
  { id: 'phenol', symbol: 'Ph', name: 'Phenolphthalein', formula: 'C₂₀H₁₄O₄', type: 'indicator', color: 'rgba(255, 255, 255, 0.1)', category: 'indicator', image: 'https://cdn-icons-png.flaticon.com/512/9566/9566869.png', desc: 'pH indicator.' },
];

const TOOLS: LabTool[] = [
  { id: 'beaker', name: 'Beaker', type: 'container' },
  { id: 'test_tube', name: 'Test Tube', type: 'container' },
  { id: 'flask', name: 'Conical Flask', type: 'container' },
  { id: 'burner', name: 'Bunsen Burner', type: 'heat' },
];

const EXPERIMENTS: Experiment[] = [
  {
    id: 'exp1',
    title: 'Reaction of Iron with HCl',
    category: 'Chemical Reactions',
    objective: 'Observe gas formation when metal reacts with acid.',
    difficulty: 'Easy',
    requiredMaterials: ['test_tube', 'fe', 'hcl'],
    steps: [
      { stepNo: 1, text: 'Select a Test Tube', mentorLine: "Let's start by grabbing a Test Tube from the tools panel.", criteria: { type: 'tool', id: 'test_tube' } },
      { stepNo: 2, text: 'Add Iron Filings', mentorLine: "Good. Now, add some Iron Filings (Fe) from the shelf.", criteria: { type: 'add', id: 'fe' } },
      { stepNo: 3, text: 'Add Dilute HCl', mentorLine: "Carefully add Dilute Hydrochloric Acid (HCl). Watch closely!", criteria: { type: 'add', id: 'hcl' }, visualFx: 'bubbles', nextColor: 'rgba(200, 200, 200, 0.3)' },
      { stepNo: 4, text: 'Observe Reaction', mentorLine: "See those bubbles? That's Hydrogen gas being released!", criteria: { type: 'wait' } }
    ],
    quiz: [
      { question: "What gas was produced?", options: ["Oxygen", "Hydrogen", "Carbon Dioxide", "Nitrogen"], correctIndex: 1, explanation: "Metals react with acid to release Hydrogen gas." },
      { question: "What is the chemical symbol for Iron?", options: ["Ir", "Fe", "In", "I"], correctIndex: 1, explanation: "Ferrum is Latin for Iron." }
    ]
  },
  {
    id: 'exp2',
    title: 'Volcanic Neutralization',
    category: 'Acids, Bases & Salts',
    objective: 'Observe a vigorous neutralization reaction.',
    difficulty: 'Easy',
    requiredMaterials: ['beaker', 'nahco3', 'vinegar'],
    steps: [
      { stepNo: 1, text: 'Select a Beaker', mentorLine: "Grab a 250ml Beaker for this one.", criteria: { type: 'tool', id: 'beaker' } },
      { stepNo: 2, text: 'Add Baking Soda', mentorLine: "Add a scoop of Baking Soda (Sodium Bicarbonate).", criteria: { type: 'add', id: 'nahco3' } },
      { stepNo: 3, text: 'Pour Vinegar', mentorLine: "Now pour in the Vinegar (Acetic Acid). Stand back!", criteria: { type: 'add', id: 'vinegar' }, visualFx: 'eruption' },
      { stepNo: 4, text: 'Analyze Result', mentorLine: "Whoa! That fizz is Carbon Dioxide (CO₂) gas escaping.", criteria: { type: 'wait' } }
    ],
    quiz: [
      { question: "What type of reaction is this?", options: ["Combination", "Neutralization", "Decomposition", "Redox"], correctIndex: 1, explanation: "Acid (Vinegar) + Base (Soda) = Salt + Water + CO2" },
      { question: "What gas caused the fizz?", options: ["O₂", "H₂", "CO₂", "N₂"], correctIndex: 2, explanation: "Carbonates release Carbon Dioxide with acids." }
    ]
  },
  {
    id: 'exp3',
    title: 'Indicators: Acid or Base?',
    category: 'Acids, Bases & Salts',
    objective: 'Use Phenolphthalein to identify a base.',
    difficulty: 'Medium',
    requiredMaterials: ['test_tube', 'naoh', 'phenol'],
    steps: [
      { stepNo: 1, text: 'Select Test Tube', mentorLine: "Pick a clean Test Tube.", criteria: { type: 'tool', id: 'test_tube' } },
      { stepNo: 2, text: 'Add Sodium Hydroxide', mentorLine: "Add some Sodium Hydroxide (NaOH). It's a strong base.", criteria: { type: 'add', id: 'naoh' } },
      { stepNo: 3, text: 'Add Phenolphthalein', mentorLine: "Add a few drops of the indicator.", criteria: { type: 'add', id: 'phenol' }, visualFx: 'color_change', nextColor: '#ec4899' }, // Pink
      { stepNo: 4, text: 'Check Color', mentorLine: "It turned Pink! Phenolphthalein turns pink in basic solutions.", criteria: { type: 'wait' } }
    ],
    quiz: [
      { question: "What color does Phenolphthalein turn in a base?", options: ["Colorless", "Pink", "Blue", "Red"], correctIndex: 1, explanation: "It is pink in alkaline (basic) solutions." },
      { question: "Is NaOH acidic or basic?", options: ["Acidic", "Basic", "Neutral", "Amphoteric"], correctIndex: 1, explanation: "Sodium Hydroxide is a strong base." }
    ]
  },
  {
    id: 'exp4',
    title: 'Copper & Acid (No Reaction)',
    category: 'Reactivity Series',
    objective: 'Test reactivity of Copper with dilute acid.',
    difficulty: 'Medium',
    requiredMaterials: ['test_tube', 'cu', 'hcl'],
    steps: [
      { stepNo: 1, text: 'Select Test Tube', mentorLine: "Get a Test Tube.", criteria: { type: 'tool', id: 'test_tube' } },
      { stepNo: 2, text: 'Add Copper Strip', mentorLine: "Place the Copper Strip (Cu) inside.", criteria: { type: 'add', id: 'cu' } },
      { stepNo: 3, text: 'Add Dilute HCl', mentorLine: "Add Dilute HCl.", criteria: { type: 'add', id: 'hcl' } },
      { stepNo: 4, text: 'Observe', mentorLine: "Nothing happened! Copper is less reactive than Hydrogen, so it doesn't displace it.", criteria: { type: 'wait' } }
    ],
    quiz: [
      { question: "Why was there no reaction?", options: ["Wrong acid", "Copper is unreactive", "Copper is below Hydrogen in reactivity series", "Needs more heat"], correctIndex: 2, explanation: "Copper cannot displace Hydrogen from acid." }
    ]
  }
];

// --- COMPONENTS ---

// 1. Inventory Shelf (Updated with Images)
const InventoryShelf: React.FC<{ isOpen: boolean, toggle: () => void, onSelect: (c: Chemical) => void, activeExperiment: Experiment | null }> = ({ isOpen, toggle, onSelect, activeExperiment }) => {
    // Filter chemicals if experiment is active to reduce clutter, or show all for free play
    const visibleChemicals = activeExperiment 
        ? CHEMICALS.filter(c => activeExperiment.requiredMaterials.includes(c.id))
        : CHEMICALS;

    return (
        <div className={`
            absolute bottom-0 left-0 right-0 bg-slate-100 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 z-50 
            transition-all duration-500 ease-out flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.1)]
            ${isOpen ? 'translate-y-0 h-64' : 'translate-y-[calc(100%-40px)] h-64'}
        `}>
            <div onClick={toggle} className="w-full h-10 flex items-center justify-center cursor-pointer hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700">
                <div className="w-12 h-1 bg-gray-300 rounded-full mb-1"></div>
                {isOpen ? <ChevronDown size={16} className="text-gray-400 absolute right-4" /> : <ChevronUp size={16} className="text-gray-400 absolute right-4" />}
            </div>
            <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Beaker size={14} /> Element & Chemical Shelf
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {visibleChemicals.map(c => (
                    <button key={c.id} onClick={() => onSelect(c)} className="group flex flex-col items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-md transition-all active:scale-95">
                        <div className="w-14 h-14 p-2 rounded-lg flex items-center justify-center bg-white shadow-inner border border-gray-100">
                            <img src={c.image} alt={c.name} className="w-full h-full object-contain" />
                        </div>
                        <div className="text-center w-full">
                            <span className="block text-[10px] font-black text-gray-400 uppercase">{c.symbol}</span>
                            <span className="block text-[10px] font-bold text-gray-600 dark:text-gray-300 leading-tight line-clamp-1">{c.name}</span>
                        </div>
                    </button>
                ))}
                </div>
            </div>
        </div>
    );
};

// 2. Quiz Modal
const QuizModal: React.FC<{ experiment: Experiment, onClose: () => void }> = ({ experiment, onClose }) => {
    const [qIndex, setQIndex] = useState(0);
    const [score, setScore] = useState(0);
    const [selected, setSelected] = useState<number | null>(null);
    const [isFinished, setIsFinished] = useState(false);

    const handleAnswer = (idx: number) => {
        setSelected(idx);
        if (idx === experiment.quiz[qIndex].correctIndex) setScore(s => s + 1);
        
        setTimeout(() => {
            if (qIndex < experiment.quiz.length - 1) {
                setQIndex(q => q + 1);
                setSelected(null);
            } else {
                setIsFinished(true);
            }
        }, 1500);
    };

    if (isFinished) {
        return (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center animate-in zoom-in">
                    <Award size={48} className="text-yellow-500 mx-auto mb-4" />
                    <h2 className="text-2xl font-black mb-2 dark:text-white">Experiment Complete!</h2>
                    <p className="text-gray-500 mb-6">You scored {score}/{experiment.quiz.length}</p>
                    <button onClick={onClose} className="bg-primary text-white px-6 py-3 rounded-xl font-bold w-full">Continue</button>
                </div>
            </div>
        );
    }

    const currentQ = experiment.quiz[qIndex];

    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-2xl max-w-md w-full animate-in slide-in-from-bottom-10">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="font-bold text-gray-500 text-sm uppercase">Quiz {qIndex + 1}/{experiment.quiz.length}</h3>
                   <button onClick={onClose} className="text-gray-400 hover:text-red-500"><X size={20}/></button>
                </div>
                <h2 className="text-xl font-bold mb-6 text-gray-800 dark:text-white">{currentQ.question}</h2>
                <div className="space-y-3">
                    {currentQ.options.map((opt, i) => (
                        <button 
                            key={i}
                            onClick={() => selected === null && handleAnswer(i)}
                            className={`w-full p-4 rounded-xl text-left font-bold border-2 transition-all ${
                                selected === null ? 'border-gray-100 dark:border-slate-700 hover:border-indigo-500' :
                                i === currentQ.correctIndex ? 'bg-green-100 border-green-500 text-green-700' :
                                i === selected ? 'bg-red-100 border-red-500 text-red-700' : 'border-gray-100 opacity-50'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
                {selected !== null && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-xl">
                        <strong>Info:</strong> {currentQ.explanation}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MAIN CHEMISTRY LAB ---

export const ChemistryLab: React.FC = () => {
  const [view, setView] = useState<'lobby' | 'safety' | 'bench'>('lobby');
  const [activeExp, setActiveExp] = useState<Experiment | null>(null);
  
  // Experiment State
  const [stepIndex, setStepIndex] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);

  // Bench State
  const [selectedTool, setSelectedTool] = useState<LabTool | null>(null);
  const [beakerContents, setBeakerContents] = useState<Chemical[]>([]);
  const [liquidHeight, setLiquidHeight] = useState(0);
  const [liquidColor, setLiquidColor] = useState('transparent');
  const [fx, setFx] = useState<'none' | 'bubbles' | 'smoke' | 'eruption' | 'crystals' | 'color_change'>('none');
  const [isHeating, setIsHeating] = useState(false);
  
  // Mentor
  const [mentorMsg, setMentorMsg] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const synth = useRef(window.speechSynthesis);

  // Speak Function
  const speak = (text: string) => {
      setMentorMsg(text);
      synth.current.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.onstart = () => setIsSpeaking(true);
      u.onend = () => setIsSpeaking(false);
      synth.current.speak(u);
  };

  const askAiTutor = async () => {
      setAiThinking(true);
      try {
          const chemicals = beakerContents.map(c => c.name);
          const lastAction = selectedTool ? `Used ${selectedTool.name}` : 'Started session';
          const context = activeExp?.title;
          const advice = await GeminiService.getLabTutorResponse(chemicals, lastAction, context);
          speak(advice);
      } catch (e) {
          speak("I'm having trouble analyzing the reaction right now.");
      } finally {
          setAiThinking(false);
      }
  };

  // Actions
  const handleStart = (exp: Experiment | null) => {
      setActiveExp(exp);
      setStepIndex(0);
      setView('safety');
      setMentorMsg("Safety check! Please equip your gear.");
  };

  const handleSafetyComplete = () => {
      setView('bench');
      resetBench();
      if (activeExp) {
          const firstStep = activeExp.steps[0];
          speak(`Welcome to the bench! ${firstStep.mentorLine}`);
      } else {
          speak("Welcome to Free Play! Use the tools and explore.");
      }
  };

  const resetBench = () => {
      setSelectedTool(null);
      setBeakerContents([]);
      setLiquidHeight(0);
      setLiquidColor('transparent');
      setFx('none');
      setIsHeating(false);
  };

  const checkStep = (type: 'add' | 'tool' | 'heat' | 'wait', id?: string) => {
      if (!activeExp) return true; // Free play allows everything

      const currentStep = activeExp.steps[stepIndex];
      
      // Check if action matches criteria
      if (currentStep.criteria.type === type && (!currentStep.criteria.id || currentStep.criteria.id === id)) {
          // Success
          if (currentStep.visualFx) setFx(currentStep.visualFx);
          if (currentStep.nextColor) setLiquidColor(currentStep.nextColor);
          
          if (stepIndex < activeExp.steps.length - 1) {
              const nextStep = activeExp.steps[stepIndex + 1];
              setStepIndex(s => s + 1);
              setTimeout(() => speak(`Correct! ${nextStep.mentorLine}`), 1000);
          } else {
              // Experiment Finish
              setTimeout(() => {
                  speak("Excellent work! You've completed the experiment. Ready for a quiz?");
                  setShowQuiz(true);
              }, 2000);
          }
          return true;
      } else {
          // Wrong Move
          speak(`Wait! That's not right. ${currentStep.text}`);
          return false;
      }
  };

  const handleToolSelect = (tool: LabTool) => {
      if (checkStep('tool', tool.id)) {
          setSelectedTool(tool);
      }
  };

  const handleChemicalAdd = (c: Chemical) => {
      if (!selectedTool) {
          speak("Select a container first!");
          return;
      }
      if (checkStep('add', c.id)) {
          const newContents = [...beakerContents, c];
          setBeakerContents(newContents);
          
          // Visuals
          const liquidCount = newContents.filter(x => x.type === 'liquid' || x.type === 'acid' || x.type === 'base' || x.type === 'solution').length;
          const solidCount = newContents.filter(x => x.type === 'solid').length;
          setLiquidHeight(Math.min(90, (liquidCount * 20) + (solidCount * 5)));
          
          // Color mixing (simple override)
          if (c.color !== '#ffffff' && activeExp?.steps[stepIndex]?.nextColor === undefined) {
             setLiquidColor(c.color); 
          }
      }
  };

  const handleWait = () => {
      if (checkStep('wait')) {
          speak("Good observation.");
      }
  };

  // --- Views ---

  if (view === 'lobby') {
      return (
          <div className="h-full bg-slate-50 dark:bg-slate-900 p-8 overflow-y-auto animate-fadeIn">
              <div className="max-w-5xl mx-auto">
                  <header className="mb-12 text-center">
                      <div className="inline-block p-4 bg-indigo-100 rounded-full text-indigo-600 mb-4">
                          <Microscope size={40} />
                      </div>
                      <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2">Dr. Nova's Laboratory</h1>
                      <p className="text-slate-500">Select an experiment to begin your practical training.</p>
                  </header>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {EXPERIMENTS.map(exp => (
                          <button key={exp.id} onClick={() => handleStart(exp)} className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 hover:border-indigo-500 hover:shadow-xl transition-all text-left group">
                              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full mb-4 inline-block">{exp.difficulty}</span>
                              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2 group-hover:text-indigo-600 transition-colors">{exp.title}</h3>
                              <p className="text-sm text-slate-500 line-clamp-2">{exp.objective}</p>
                          </button>
                      ))}
                      <button onClick={() => handleStart(null)} className="bg-gradient-to-br from-indigo-600 to-purple-600 p-6 rounded-3xl shadow-lg text-white hover:scale-[1.02] transition-transform text-left">
                          <Play size={32} className="mb-4" />
                          <h3 className="text-xl font-bold mb-2">Free Exploration</h3>
                          <p className="text-indigo-100 text-sm">Use any tool, mix any chemical. Be safe!</p>
                      </button>
                  </div>
              </div>
          </div>
      );
  }

  if (view === 'safety') {
      return (
          <div className="h-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 p-6">
             <div className="bg-white dark:bg-slate-800 p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full text-center animate-in zoom-in">
                 <ShieldAlert size={64} className="text-yellow-500 mx-auto mb-6" />
                 <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-2">Safety Check</h2>
                 <p className="text-slate-500 mb-8">Dr. Nova says: "Protective gear is mandatory!"</p>
                 <button onClick={handleSafetyComplete} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30">
                     I'm Wearing PPE (Enter)
                 </button>
             </div>
          </div>
      );
  }

  // BENCH VIEW
  return (
      <div className="h-full flex flex-col relative bg-slate-200 dark:bg-slate-950 overflow-hidden">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 p-4 z-40 flex justify-between pointer-events-none">
              <button onClick={() => setView('lobby')} className="pointer-events-auto bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100">
                  <ArrowLeft size={20} />
              </button>
              
              <div className="flex gap-2 pointer-events-auto">
                 <button 
                    onClick={askAiTutor} 
                    disabled={aiThinking}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 font-bold"
                 >
                    {aiThinking ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />} Ask Dr. Nova
                 </button>

                 {activeExp && (
                    <div className="bg-white/90 dark:bg-slate-800/90 p-4 rounded-2xl shadow-lg max-w-md hidden md:block">
                        <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Current Step</h3>
                        <p className="font-bold text-slate-800 dark:text-white leading-tight">{activeExp.steps[stepIndex].text}</p>
                        {activeExp.steps[stepIndex].criteria.type === 'wait' && (
                            <button onClick={handleWait} className="mt-2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-lg animate-pulse">Done Observing</button>
                        )}
                    </div>
                 )}
              </div>
          </div>

          {/* Workbench */}
          <div className="flex-1 relative flex items-center justify-center">
              {/* Background */}
              <div className="absolute bottom-0 w-full h-1/3 bg-[#cbd5e1] dark:bg-slate-800 border-t-8 border-[#94a3b8] dark:border-slate-700"></div>

              {/* Tools Sidebar */}
              <div className="absolute left-6 top-24 z-30 flex flex-col gap-4">
                  {TOOLS.map(t => (
                      <button 
                        key={t.id} 
                        onClick={() => handleToolSelect(t)} 
                        className={`p-4 rounded-2xl shadow-lg border-2 transition-all bg-white dark:bg-slate-800 ${selectedTool?.id === t.id ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-white dark:border-slate-700 hover:scale-105'}`}
                      >
                         {t.id === 'beaker' && <Beaker size={28} className="text-blue-500" />}
                         {t.id === 'test_tube' && <TestTube size={28} className="text-green-500" />}
                         {t.id === 'flask' && <FlaskConical size={28} className="text-purple-500" />}
                         {t.id === 'burner' && <Flame size={28} className="text-orange-500" />}
                      </button>
                  ))}
              </div>

              {/* Central Setup */}
              {selectedTool && (
                  <div className="relative z-20 flex flex-col items-center mb-16 animate-in slide-in-from-bottom-10 fade-in duration-500">
                      {/* Visual FX */}
                      {fx === 'eruption' && (
                          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-40 h-64 bg-white/80 blur-xl rounded-full animate-pulse z-0"></div>
                      )}
                      {fx === 'bubbles' && (
                           <div className="absolute -top-10 w-full h-20 flex justify-center gap-2">
                               <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce"></div>
                               <div className="w-3 h-3 bg-white/50 rounded-full animate-bounce delay-75"></div>
                               <div className="w-1 h-1 bg-white/50 rounded-full animate-bounce delay-150"></div>
                           </div>
                      )}

                      {/* Tool Render */}
                      <div className={`
                         relative bg-white/10 backdrop-blur-md border-2 border-white/50 shadow-2xl overflow-hidden transition-all duration-500
                         ${selectedTool.id === 'test_tube' ? 'w-20 h-64 rounded-b-full' : 'w-56 h-64 rounded-b-3xl'}
                      `}>
                         {/* Liquid */}
                         <div 
                           className="absolute bottom-0 w-full transition-all duration-1000 ease-in-out"
                           style={{ height: `${liquidHeight}%`, backgroundColor: liquidColor }}
                         >
                            {fx === 'bubbles' && <div className="w-full h-full bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-50 animate-pulse"></div>}
                         </div>

                         {/* Solid Particles */}
                         {beakerContents.filter(c => c.type === 'solid').map((c, i) => (
                             <div key={i} className="absolute bottom-4 w-4 h-4 rounded-full shadow-sm animate-bounce" style={{ left: `${20 + (i*10)}%`, backgroundColor: c.color, animationDuration: '2s' }}></div>
                         ))}
                      </div>

                      <div className="mt-6 bg-white/90 dark:bg-slate-800/90 px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                          {selectedTool.name}
                      </div>
                  </div>
              )}
          </div>

          <InventoryShelf isOpen={true} toggle={() => {}} onSelect={handleChemicalAdd} activeExperiment={activeExp} />
          
          {showQuiz && activeExp && (
              <QuizModal experiment={activeExp} onClose={() => { setShowQuiz(false); setView('lobby'); }} />
          )}
      </div>
  );
};
