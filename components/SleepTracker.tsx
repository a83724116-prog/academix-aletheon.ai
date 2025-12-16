
import React, { useState, useEffect } from 'react';
import { 
  Moon, Sun, Clock, Zap, Heart, 
  ChevronLeft, ChevronRight, Activity, 
  Info, BedDouble, Wind, Brain, Sparkles, Loader2, AlarmClock
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { SleepData } from '../types';
import { GeminiService } from '../services/geminiService';

// --- MOCK DATA ---
const MOCK_SLEEP_DATA: SleepData = {
  date: new Date().toISOString().split('T')[0],
  score: 85,
  durationHours: 7,
  durationMinutes: 42,
  bedTime: '10:30 PM',
  wakeTime: '06:12 AM',
  heartRate: [62, 58, 55, 54, 53, 55, 58, 60, 65], // Simplified hourly trend
  stats: {
    deep: '1h 30m',
    light: '4h 15m',
    rem: '1h 57m',
    awake: '20m'
  },
  stages: [
    { time: '10:30', level: 'Awake', value: 4 },
    { time: '11:00', level: 'Light', value: 2 },
    { time: '11:30', level: 'Deep', value: 1 },
    { time: '12:00', level: 'Deep', value: 1 },
    { time: '12:30', level: 'Light', value: 2 },
    { time: '01:00', level: 'REM', value: 3 },
    { time: '01:30', level: 'Light', value: 2 },
    { time: '02:00', level: 'Deep', value: 1 },
    { time: '02:30', level: 'Deep', value: 1 },
    { time: '03:00', level: 'Light', value: 2 },
    { time: '03:30', level: 'REM', value: 3 },
    { time: '04:00', level: 'Light', value: 2 },
    { time: '04:30', level: 'Deep', value: 1 },
    { time: '05:00', level: 'REM', value: 3 },
    { time: '05:30', level: 'Light', value: 2 },
    { time: '06:00', level: 'Awake', value: 4 },
  ]
};

// --- COMPONENTS ---

const CircularProgress = ({ value, size = 180, strokeWidth = 15 }: { value: number, size?: number, strokeWidth?: number }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                {/* Background Track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Gradient Definition */}
                <defs>
                    <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#f97316" /> {/* Orange-500 */}
                        <stop offset="100%" stopColor="#f43f5e" /> {/* Rose-500 */}
                    </linearGradient>
                </defs>
                {/* Progress Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#scoreGradient)"
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-white">
                <span className="text-5xl font-black tracking-tighter">{value}</span>
                <span className="text-xs font-bold uppercase tracking-widest opacity-60">Sleep Score</span>
            </div>
        </div>
    );
};

export const SleepTracker: React.FC = () => {
  const [data, setData] = useState<SleepData>(MOCK_SLEEP_DATA);
  const [aiInsight, setAiInsight] = useState<{advice: string, scoreAnalysis: string} | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
      // Simulate AI loading on mount
      handleGetInsight();
  }, []);

  const handleGetInsight = async () => {
      setLoadingAi(true);
      try {
          const result = await GeminiService.analyzeSleepPatterns(data);
          setAiInsight(result);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingAi(false);
      }
  };

  return (
    <div className="h-full bg-[#0f172a] text-white overflow-y-auto animate-fadeIn relative font-sans">
       {/* Background Ambient Gradients */}
       <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-[#1e1b4b] to-[#0f172a] pointer-events-none"></div>
       <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none"></div>
       <div className="absolute top-[200px] left-[-50px] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

       <div className="max-w-6xl mx-auto p-6 md:p-10 relative z-10">
           
           {/* Header */}
           <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
               <div>
                   <h1 className="text-3xl font-black tracking-tight mb-1">Good Morning, Alex</h1>
                   <p className="text-slate-400 text-sm">Here is your sleep report for last night.</p>
               </div>
               
               <div className="flex items-center gap-4 bg-slate-900/50 p-1.5 rounded-2xl border border-slate-700/50 backdrop-blur-md">
                   <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"><ChevronLeft size={20}/></button>
                   <span className="flex items-center gap-2 text-sm font-bold px-2">
                       <CalendarIcon size={16} className="text-orange-500" /> Today, {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                   </span>
                   <button className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors"><ChevronRight size={20}/></button>
               </div>
           </header>

           {/* Main Dashboard Grid */}
           <div className="grid lg:grid-cols-12 gap-8">
               
               {/* Left Column: Score & Graph */}
               <div className="lg:col-span-7 space-y-8">
                   
                   {/* Score Card */}
                   <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-rose-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                       
                       <CircularProgress value={data.score} />
                       
                       <div className="flex-1 space-y-6 w-full">
                           <div className="grid grid-cols-2 gap-4">
                               <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/30">
                                   <div className="flex items-center gap-2 text-indigo-400 mb-1 font-bold text-xs uppercase tracking-wider"><Moon size={14}/> Time Asleep</div>
                                   <div className="text-2xl font-black">{data.durationHours}h {data.durationMinutes}m</div>
                               </div>
                               <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700/30">
                                   <div className="flex items-center gap-2 text-rose-400 mb-1 font-bold text-xs uppercase tracking-wider"><Heart size={14}/> Avg HR</div>
                                   <div className="text-2xl font-black">58 <span className="text-sm text-slate-500 font-medium">bpm</span></div>
                               </div>
                           </div>
                           
                           {/* Simple Stage Bar */}
                           <div className="space-y-2">
                               <div className="flex justify-between text-xs font-bold text-slate-400 uppercase">
                                   <span>Stages</span>
                                   <span>100%</span>
                               </div>
                               <div className="h-4 w-full bg-slate-900 rounded-full overflow-hidden flex">
                                   <div className="h-full bg-indigo-900 w-[15%]" title="Awake"></div>
                                   <div className="h-full bg-indigo-400 w-[20%]" title="REM"></div>
                                   <div className="h-full bg-indigo-600 w-[45%]" title="Light"></div>
                                   <div className="h-full bg-indigo-800 w-[20%]" title="Deep"></div>
                               </div>
                               <div className="flex gap-4 justify-center text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                                   <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-900"></div> Awake</span>
                                   <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-400"></div> REM</span>
                                   <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-600"></div> Light</span>
                                   <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-800"></div> Deep</span>
                               </div>
                           </div>
                       </div>
                   </div>

                   {/* Hypnogram Graph */}
                   <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 min-h-[350px]">
                       <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                           <Activity className="text-indigo-500" /> Sleep Cycles
                       </h3>
                       <div className="h-64 w-full">
                           <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={data.stages}>
                                   <defs>
                                       <linearGradient id="sleepGradient" x1="0" y1="0" x2="0" y2="1">
                                           <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                           <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                       </linearGradient>
                                   </defs>
                                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                   <XAxis 
                                       dataKey="time" 
                                       axisLine={false} 
                                       tickLine={false} 
                                       tick={{fill: '#64748b', fontSize: 10}} 
                                       interval={2}
                                   />
                                   <YAxis 
                                       hide 
                                       domain={[0, 5]} 
                                   />
                                   <Tooltip 
                                       contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'}}
                                       labelStyle={{color: '#94a3b8', fontSize: '10px', marginBottom: '4px'}}
                                       itemStyle={{color: '#fff', fontWeight: 'bold'}}
                                       formatter={(value: any, name: any, props: any) => [props.payload.level, 'Stage']}
                                   />
                                   <Area 
                                       type="stepAfter" 
                                       dataKey="value" 
                                       stroke="#818cf8" 
                                       strokeWidth={3}
                                       fill="url(#sleepGradient)" 
                                       animationDuration={1500}
                                   />
                               </AreaChart>
                           </ResponsiveContainer>
                       </div>
                   </div>
               </div>

               {/* Right Column: Stats, Schedule, AI */}
               <div className="lg:col-span-5 space-y-6">
                   
                   {/* Stats Grid */}
                   <div className="grid grid-cols-2 gap-4">
                       {[
                           { label: 'Deep Sleep', value: data.stats.deep, icon: BedDouble, color: 'text-indigo-400' },
                           { label: 'REM Sleep', value: data.stats.rem, icon: Brain, color: 'text-purple-400' },
                           { label: 'Efficiency', value: '92%', icon: Zap, color: 'text-yellow-400' },
                           { label: 'Respiration', value: '14 br/m', icon: Wind, color: 'text-teal-400' }
                       ].map((stat, i) => (
                           <div key={i} className="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl flex flex-col justify-between h-32 hover:bg-slate-800/60 transition-colors group">
                               <div className={`${stat.color} bg-slate-900/50 w-10 h-10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                   <stat.icon size={20} />
                               </div>
                               <div>
                                   <div className="text-2xl font-black">{stat.value}</div>
                                   <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">{stat.label}</div>
                               </div>
                           </div>
                       ))}
                   </div>

                   {/* Schedule / Alarm */}
                   <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-3xl border border-indigo-500/30 relative overflow-hidden">
                       <div className="flex justify-between items-center mb-6 relative z-10">
                           <h3 className="font-bold text-lg flex items-center gap-2">
                               <AlarmClock className="text-orange-400" /> Schedule
                           </h3>
                           <button className="text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-full font-bold hover:bg-indigo-500/30">Edit</button>
                       </div>
                       
                       <div className="flex items-center justify-between relative z-10">
                           <div>
                               <div className="text-xs text-slate-400 font-bold uppercase mb-1">Bedtime</div>
                               <div className="text-2xl font-black text-white">{data.bedTime}</div>
                           </div>
                           <div className="h-10 w-[1px] bg-slate-700"></div>
                           <div>
                               <div className="text-xs text-slate-400 font-bold uppercase mb-1">Wake Up</div>
                               <div className="text-2xl font-black text-orange-400">{data.wakeTime}</div>
                           </div>
                           <div className="bg-orange-500 w-10 h-10 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.5)] animate-pulse">
                               <Sun size={20} className="text-white fill-white" />
                           </div>
                       </div>
                   </div>

                   {/* AI Insight */}
                   <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-5"><Sparkles size={120} /></div>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 relative z-10">
                            <Sparkles className="text-yellow-400" size={18} /> Sleep Coach
                        </h3>
                        
                        {loadingAi ? (
                            <div className="h-20 flex items-center justify-center text-slate-400 gap-2">
                                <Loader2 className="animate-spin" size={20} /> Analyzing cycles...
                            </div>
                        ) : (
                            <div className="relative z-10 space-y-4">
                                <p className="text-sm leading-relaxed text-slate-300">
                                    "{aiInsight?.advice || "Great job getting enough deep sleep! Try to maintain this wake-up time for consistency."}"
                                </p>
                                <div className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-2 rounded-xl inline-block">
                                    Analysis: {aiInsight?.scoreAnalysis || "Consistent Schedule"}
                                </div>
                            </div>
                        )}
                   </div>

               </div>
           </div>
       </div>
    </div>
  );
};

function CalendarIcon({ className, size }: { className?: string, size?: number }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
    )
}
