
import React, { useState, useEffect } from 'react';
import { GeminiService } from '../services/geminiService';
import { 
  Calendar, Target, Sparkles, Loader2, CheckCircle2, ArrowRight, 
  ListTodo, GraduationCap, Clock, Battery, Coffee, BookOpen, 
  Utensils, BrainCircuit, Play, RotateCcw, ShieldCheck, Zap
} from 'lucide-react';

interface ScheduleItem {
  time: string;
  activity: string;
  type: 'study' | 'break' | 'meal' | 'review';
  reason: string;
  durationMin: number;
  completed?: boolean;
}

interface PlanData {
  strategyNote: string;
  schedule: ScheduleItem[];
}

export const StudyPlanner: React.FC = () => {
  // Input State
  const [tasks, setTasks] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [energyLevel, setEnergyLevel] = useState<'Low'|'Medium'|'High'>('Medium');
  const [style, setStyle] = useState<'Pomodoro'|'Deep Work'|'Balanced'>('Balanced');

  // Plan State
  const [planData, setPlanData] = useState<PlanData | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Focus Mode State
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null);
  const [focusTimeLeft, setFocusTimeLeft] = useState(0);
  const [isFocusRunning, setIsFocusRunning] = useState(false);

  const handleGeneratePlan = async () => {
    if (!tasks.trim()) return;
    setLoading(true);
    setPlanData(null);
    
    try {
      const result = await GeminiService.generateSmartSchedule(
          { start: startTime, end: endTime },
          tasks,
          energyLevel,
          style
      );
      setPlanData(result);
    } catch (e) {
      alert("AI is busy brainstorming. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = (index: number) => {
      if (!planData) return;
      const newSchedule = [...planData.schedule];
      newSchedule[index].completed = !newSchedule[index].completed;
      setPlanData({ ...planData, schedule: newSchedule });
  };

  const startFocus = (index: number, duration: number) => {
      setFocusedItemIndex(index);
      setFocusTimeLeft(duration * 60);
      setIsFocusRunning(true);
  };

  // Focus Timer Effect
  useEffect(() => {
    let interval: any;
    if (isFocusRunning && focusTimeLeft > 0) {
        interval = setInterval(() => {
            setFocusTimeLeft(prev => prev - 1);
        }, 1000);
    } else if (focusTimeLeft === 0 && isFocusRunning) {
        setIsFocusRunning(false);
        // Auto-complete task when timer ends
        if (focusedItemIndex !== null) toggleComplete(focusedItemIndex);
        setFocusedItemIndex(null);
        // Play notification sound if possible
        if(Notification.permission === 'granted') new Notification("Focus Session Complete!");
    }
    return () => clearInterval(interval);
  }, [isFocusRunning, focusTimeLeft]);

  const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const getProgress = () => {
      if (!planData || planData.schedule.length === 0) return 0;
      const completed = planData.schedule.filter(i => i.completed).length;
      return Math.round((completed / planData.schedule.length) * 100);
  };

  const getTypeColor = (type: string) => {
      switch(type) {
          case 'study': return 'border-l-4 border-indigo-500 bg-white dark:bg-slate-800';
          case 'break': return 'border-l-4 border-emerald-400 bg-emerald-50 dark:bg-emerald-900/10';
          case 'meal': return 'border-l-4 border-orange-400 bg-orange-50 dark:bg-orange-900/10';
          default: return 'border-l-4 border-gray-400 bg-gray-50';
      }
  };

  const getTypeIcon = (type: string) => {
    switch(type) {
        case 'study': return <BookOpen size={18} className="text-indigo-500" />;
        case 'break': return <Coffee size={18} className="text-emerald-500" />;
        case 'meal': return <Utensils size={18} className="text-orange-500" />;
        default: return <Clock size={18} className="text-gray-500" />;
    }
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 p-6 md:p-10 overflow-y-auto animate-fadeIn relative">
       
       {/* Focus Overlay */}
       {focusedItemIndex !== null && (
           <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center text-white">
               <div className="w-64 h-64 rounded-full border-8 border-indigo-500/30 flex items-center justify-center relative mb-8">
                   <div className="absolute inset-0 rounded-full border-8 border-indigo-500 border-t-transparent animate-spin" style={{ animationDuration: '3s' }}></div>
                   <div className="text-center">
                       <div className="text-6xl font-black font-mono tabular-nums">{formatTime(focusTimeLeft)}</div>
                       <div className="text-indigo-300 font-bold mt-2">FOCUS MODE</div>
                   </div>
               </div>
               <h2 className="text-2xl font-bold mb-2">{planData?.schedule[focusedItemIndex].activity}</h2>
               <p className="text-slate-400 mb-8 max-w-md text-center">{planData?.schedule[focusedItemIndex].reason}</p>
               
               <button 
                 onClick={() => { setIsFocusRunning(false); setFocusedItemIndex(null); }}
                 className="bg-red-500/20 text-red-400 border border-red-500/50 px-8 py-3 rounded-full font-bold hover:bg-red-500 hover:text-white transition-all"
               >
                   Stop Session
               </button>
           </div>
       )}

       <div className="max-w-5xl mx-auto space-y-8">
          
          <header className="flex flex-col md:flex-row justify-between items-center gap-6">
             <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                    <Target className="text-indigo-500" size={40} /> Smart Study Planner
                </h1>
                <p className="text-slate-500 dark:text-slate-400">
                    AI-powered scheduling that adapts to your energy and goals.
                </p>
             </div>
             
             {planData && (
                 <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-center gap-4">
                     <div className="relative w-16 h-16">
                         <svg className="w-full h-full transform -rotate-90">
                             <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100 dark:text-slate-700" />
                             <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-emerald-500 transition-all duration-1000" strokeDasharray={175} strokeDashoffset={175 - (getProgress() / 100 * 175)} strokeLinecap="round" />
                         </svg>
                         <span className="absolute inset-0 flex items-center justify-center font-bold text-sm">{getProgress()}%</span>
                     </div>
                     <div>
                         <p className="text-xs font-bold text-gray-400 uppercase">Daily Progress</p>
                         <p className="font-bold text-slate-800 dark:text-white">{planData.schedule.filter(i => i.completed).length} / {planData.schedule.length} Tasks</p>
                     </div>
                 </div>
             )}
          </header>

          <div className="grid lg:grid-cols-12 gap-8">
             
             {/* CONFIGURATION PANEL */}
             <div className="lg:col-span-4 space-y-6">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 h-full flex flex-col">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <ListTodo className="text-indigo-500" size={20}/> Plan Your Day
                    </h3>
                    
                    <div className="space-y-5 flex-1">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Available Hours</label>
                            <div className="flex gap-2">
                                <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 w-full outline-none focus:ring-2 ring-indigo-500" />
                                <span className="self-center text-gray-400">-</span>
                                <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="bg-gray-50 dark:bg-slate-900 p-3 rounded-xl border border-gray-200 dark:border-slate-700 w-full outline-none focus:ring-2 ring-indigo-500" />
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Current Energy Level</label>
                            <div className="flex bg-gray-50 dark:bg-slate-900 p-1 rounded-xl">
                                {['Low', 'Medium', 'High'].map((level) => (
                                    <button 
                                        key={level}
                                        onClick={() => setEnergyLevel(level as any)}
                                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${energyLevel === level ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-400'}`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                             <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Strategy Style</label>
                             <div className="grid grid-cols-3 gap-2">
                                 {[
                                     { id: 'Pomodoro', icon: Clock },
                                     { id: 'Deep Work', icon: BrainCircuit },
                                     { id: 'Balanced', icon: Zap }
                                 ].map(s => (
                                    <button 
                                        key={s.id}
                                        onClick={() => setStyle(s.id as any)}
                                        className={`flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all ${style === s.id ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300' : 'border-transparent bg-gray-50 dark:bg-slate-900 text-gray-500'}`}
                                    >
                                        <s.icon size={18} />
                                        <span className="text-[10px] font-bold uppercase">{s.id}</span>
                                    </button>
                                 ))}
                             </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 block">Tasks to Cover</label>
                            <textarea 
                                value={tasks}
                                onChange={(e) => setTasks(e.target.value)}
                                placeholder="E.g., Math Ch 4, Physics Lab Report, History Essay..."
                                className="w-full p-4 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 focus:border-indigo-500 rounded-2xl outline-none resize-none h-32 text-sm leading-relaxed"
                            />
                        </div>
                    </div>

                    <button 
                        onClick={handleGeneratePlan}
                        disabled={loading || !tasks.trim()}
                        className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-violet-600 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:scale-100"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={20} /> Generate Schedule</>}
                    </button>
                </div>
             </div>

             {/* SCHEDULE OUTPUT */}
             <div className="lg:col-span-8">
                 {!planData ? (
                    <div className="h-full bg-slate-100 dark:bg-slate-800/50 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl flex flex-col items-center justify-center text-slate-400 p-8 text-center min-h-[400px]">
                        <GraduationCap size={64} className="mb-4 opacity-50" strokeWidth={1.5} />
                        <h3 className="text-xl font-bold text-slate-500 dark:text-slate-300">Your day, optimized.</h3>
                        <p className="max-w-md">Enter your constraints on the left, and I'll build a schedule that balances productivity with well-being.</p>
                    </div>
                 ) : (
                    <div className="space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-500">
                        {/* Strategy Note */}
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 p-4 rounded-2xl flex items-start gap-3">
                            <Sparkles className="text-indigo-500 mt-1 flex-shrink-0" size={20} />
                            <div>
                                <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm uppercase tracking-wide mb-1">AI Strategy</h4>
                                <p className="text-indigo-700 dark:text-indigo-300 text-sm leading-relaxed italic">"{planData.strategyNote}"</p>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="relative pl-4 space-y-6">
                            {/* Vertical Line */}
                            <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-gray-200 dark:bg-slate-700"></div>

                            {planData.schedule.map((item, idx) => (
                                <div key={idx} className={`relative pl-8 group ${item.completed ? 'opacity-50 grayscale transition-all duration-500' : ''}`}>
                                    {/* Timeline Dot */}
                                    <div className={`
                                        absolute left-[11px] top-6 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 z-10
                                        ${item.type === 'break' ? 'bg-emerald-500' : item.type === 'meal' ? 'bg-orange-500' : 'bg-indigo-500'}
                                    `}></div>

                                    {/* Card */}
                                    <div className={`
                                        p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all
                                        ${getTypeColor(item.type)}
                                        flex flex-col md:flex-row gap-4 items-start md:items-center justify-between
                                    `}>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-black/5 dark:bg-white/10 px-2 py-1 rounded text-xs font-bold text-slate-600 dark:text-slate-300 font-mono">
                                                    {item.time}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider opacity-60">
                                                    {getTypeIcon(item.type)}
                                                    {item.type}
                                                </div>
                                            </div>
                                            <h4 className={`text-lg font-bold text-slate-800 dark:text-white ${item.completed ? 'line-through' : ''}`}>
                                                {item.activity}
                                            </h4>
                                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 italic">
                                                {item.reason}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 w-full md:w-auto">
                                            {item.type === 'study' && !item.completed && (
                                                <button 
                                                    onClick={() => startFocus(idx, item.durationMin)}
                                                    className="flex-1 md:flex-none px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
                                                >
                                                    <Play size={16} fill="currentColor" /> Focus ({item.durationMin}m)
                                                </button>
                                            )}
                                            
                                            <button 
                                                onClick={() => toggleComplete(idx)}
                                                className={`
                                                    w-10 h-10 rounded-xl flex items-center justify-center transition-all
                                                    ${item.completed 
                                                        ? 'bg-green-500 text-white shadow-green-500/30 shadow-lg scale-110' 
                                                        : 'bg-gray-100 dark:bg-slate-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'}
                                                `}
                                            >
                                                <CheckCircle2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center pt-8">
                             <button 
                                onClick={handleGeneratePlan}
                                className="flex items-center gap-2 text-slate-400 font-bold hover:text-indigo-500 transition-colors text-sm"
                             >
                                <RotateCcw size={16} /> Something came up? Reschedule
                             </button>
                        </div>
                    </div>
                 )}
             </div>
          </div>
       </div>
    </div>
  );
};
