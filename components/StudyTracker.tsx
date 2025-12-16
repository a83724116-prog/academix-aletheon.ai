
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, 
  AreaChart, Area, PieChart, Pie, Cell, RadialBarChart, RadialBar
} from 'recharts';
import { GeminiService } from '../services/geminiService';
import { ActivityLog } from '../types';
import { 
  Activity, Sparkles, TrendingUp, Calendar as CalendarIcon, Loader2, 
  Clock, Zap, CheckCircle2, MoreHorizontal, ChevronLeft, ChevronRight,
  Target, BookOpen, Filter, X, Trophy, AlertCircle
} from 'lucide-react';

interface StudyTrackerProps {
    activityLogs: ActivityLog[];
}

const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#3b82f6'];

// --- Helper Components ---

const StatBox = ({ label, value, subtext, color, icon: Icon }: any) => (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between h-full relative overflow-hidden group">
        <div className={`absolute top-0 right-0 p-4 opacity-10 transition-transform group-hover:scale-110 ${color}`}>
            <Icon size={48} />
        </div>
        <div>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{label}</p>
            <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">{value}</h3>
        </div>
        <div className={`mt-4 text-xs font-bold px-2 py-1 rounded-lg w-fit ${color.replace('text-', 'bg-').replace('500', '100')} ${color}`}>
            {subtext}
        </div>
    </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700 text-xs">
        <p className="font-bold mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
            <span className="font-medium">{entry.name}: {entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- Calendar Widget Component ---
const CalendarWidget = ({ 
    logs, 
    onDayClick 
}: { 
    logs: ActivityLog[], 
    onDayClick: (date: string, logs: ActivityLog[]) => void 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getLogsForDay = (day: number) => {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      return logs.filter(l => l.date === dateStr);
  };

  // Get Today's activities for the list below
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const todaysLogs = logs.filter(l => l.date === todayStr);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 h-full flex flex-col">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                {monthName} <span className="text-indigo-500">{year}</span>
            </h3>
            <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 p-1 rounded-xl">
                <button onClick={prevMonth} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-500 transition-all shadow-sm"><ChevronLeft size={16}/></button>
                <button onClick={nextMonth} className="p-1 hover:bg-white dark:hover:bg-slate-600 rounded-lg text-slate-500 transition-all shadow-sm"><ChevronRight size={16}/></button>
            </div>
        </div>
        
        {/* Days Header */}
        <div className="grid grid-cols-7 mb-2">
            {dayNames.map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">{d}</div>
            ))}
        </div>
        
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-y-2 gap-x-1 mb-6">
            {Array.from({length: firstDayOfMonth}).map((_, i) => <div key={`empty-${i}`} />)}
            
            {Array.from({length: daysInMonth}).map((_, i) => {
                const day = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const dayLogs = logs.filter(l => l.date === dateStr);
                const hasActivity = dayLogs.length > 0;
                
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                return (
                    <div key={day} className="flex justify-center">
                        <button 
                            onClick={() => onDayClick(dateStr, dayLogs)}
                            className={`
                                w-8 h-8 flex flex-col items-center justify-center rounded-full text-xs font-bold transition-all relative
                                ${isToday 
                                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg scale-110 z-10' 
                                    : hasActivity
                                        ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black'
                                        : 'text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-700'}
                            `}
                        >
                            {day}
                            {hasActivity && !isToday && (
                                <span className="absolute -bottom-1 w-1 h-1 bg-indigo-500 rounded-full"></span>
                            )}
                        </button>
                    </div>
                )
            })}
        </div>

        {/* Schedule / Upcoming List (Simulated from "March 2028" card in reference) */}
        <div className="flex-1 overflow-y-auto space-y-3 pt-4 border-t border-gray-100 dark:border-slate-700 custom-scrollbar">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Today's Activity</h4>
            {todaysLogs.length > 0 ? (
                todaysLogs.map((log, i) => (
                    <div key={i} className={`p-3 rounded-xl border-l-4 text-xs ${
                        log.type === 'Focus Session' ? 'bg-pink-50 border-pink-400 text-pink-900 dark:bg-pink-900/20 dark:text-pink-100' :
                        log.type === 'Quiz' ? 'bg-amber-50 border-amber-400 text-amber-900 dark:bg-amber-900/20 dark:text-amber-100' :
                        'bg-blue-50 border-blue-400 text-blue-900 dark:bg-blue-900/20 dark:text-blue-100'
                    }`}>
                        <div className="font-bold flex justify-between">
                            <span>{new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            <span>{log.durationMinutes}m</span>
                        </div>
                        <div className="font-medium opacity-80 mt-1 truncate">{log.subject || log.type}</div>
                    </div>
                ))
            ) : (
                <div className="text-center py-4 text-gray-400 text-xs italic">
                    No activity recorded today.
                </div>
            )}
        </div>
    </div>
  )
}

// --- Main Component ---

export const StudyTracker: React.FC<StudyTrackerProps> = ({ activityLogs }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [selectedDate, setSelectedDate] = useState<{date: string, logs: ActivityLog[]} | null>(null);

    // --- Computed Metrics ---
    
    const totalMinutes = useMemo(() => activityLogs.reduce((acc, log) => acc + log.durationMinutes, 0), [activityLogs]);
    const totalHours = (totalMinutes / 60).toFixed(1);

    const weeklyData = useMemo(() => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const data = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const logsForDay = activityLogs.filter(l => l.date === dateStr);
            const minutes = logsForDay.reduce((acc, l) => acc + l.durationMinutes, 0);
            
            data.push({
                day: days[d.getDay()],
                fullDay: days[d.getDay()],
                hours: parseFloat((minutes / 60).toFixed(1)),
                fill: i === 0 ? '#6366f1' : '#cbd5e1' // Highlight today
            });
        }
        return data;
    }, [activityLogs]);

    const categoryData = useMemo(() => {
        const counts: Record<string, number> = {};
        activityLogs.forEach(log => {
            const cat = log.subject || log.type || 'General';
            counts[cat] = (counts[cat] || 0) + 1;
        });
        
        return Object.keys(counts).map((key, i) => ({
            name: key,
            value: counts[key],
            color: COLORS[i % COLORS.length]
        })).sort((a, b) => b.value - a.value).slice(0, 4); // Top 4
    }, [activityLogs]);

    const averageScore = useMemo(() => {
        const quizzes = activityLogs.filter(l => l.type === 'Quiz' && l.score !== undefined);
        if (quizzes.length === 0) return 0;
        const total = quizzes.reduce((acc, q) => acc + (q.score || 0), 0);
        return Math.round(total / quizzes.length);
    }, [activityLogs]);

    const handleAnalyze = async () => {
        setLoading(true);
        try {
            const promptData = weeklyData.map(d => ({ day: d.day, hours: d.hours }));
            const res = await GeminiService.analyzeStudyProgress(promptData);
            setAnalysis(res);
        } catch (e) {
            setAnalysis("Great consistency! Try to increase focus duration on weekends.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full bg-slate-50 dark:bg-slate-950 p-6 overflow-y-auto animate-fadeIn custom-scrollbar relative font-sans">
            
            {/* Daily Details Modal */}
            {selectedDate && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
                        <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-xl">{new Date(selectedDate.date).toLocaleDateString(undefined, {weekday: 'long', day: 'numeric', month: 'long'})}</h3>
                                <p className="text-slate-400 text-sm">{selectedDate.logs.length} Activities Recorded</p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50 dark:bg-slate-950">
                            {selectedDate.logs.length === 0 ? (
                                <div className="text-center py-12 text-gray-400">
                                    <Clock size={48} className="mx-auto mb-3 opacity-30" />
                                    <p className="font-medium">No activity recorded.</p>
                                </div>
                            ) : (
                                selectedDate.logs.map((log) => (
                                    <div key={log.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0 ${
                                            log.type === 'Quiz' ? 'bg-amber-400' : 
                                            log.type === 'Focus Session' ? 'bg-indigo-500' : 
                                            'bg-emerald-500'
                                        }`}>
                                            {log.type === 'Quiz' ? <Trophy size={20}/> : log.type === 'Focus Session' ? <Zap size={20}/> : <BookOpen size={20}/>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 dark:text-white truncate">{log.type}</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{log.subject || 'General Practice'}</p>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-black text-slate-800 dark:text-white">{log.durationMinutes}m</div>
                                            {log.score !== undefined && <div className="text-xs font-bold text-green-500">+{log.score} XP</div>}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto">
                <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Analytics</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Track your learning momentum in real-time.</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                        <span className="text-xs font-bold px-3 py-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">Weekly</span>
                        <span className="text-xs font-bold px-3 py-1.5 text-gray-400 hover:text-gray-600 cursor-pointer">Monthly</span>
                    </div>
                </header>

                {/* BENTO GRID LAYOUT */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 grid-rows-[auto_auto_auto]">
                    
                    {/* 1. Learning Activity (Large Chart) */}
                    <div className="col-span-1 md:col-span-2 lg:row-span-2 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white">Learning Activity</h3>
                                <p className="text-sm text-gray-400 font-medium mt-1">Hours spent over last 7 days</p>
                            </div>
                            <div className="text-right">
                                <span className="block text-3xl font-black text-slate-800 dark:text-white">{totalHours} <span className="text-lg text-gray-400">hrs</span></span>
                                <span className="text-xs font-bold text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg inline-block mt-1">+12% vs last week</span>
                            </div>
                        </div>
                        <div className="flex-1 min-h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} barSize={32}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                    <XAxis 
                                        dataKey="day" 
                                        axisLine={false} 
                                        tickLine={false} 
                                        tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} 
                                        dy={10} 
                                    />
                                    <YAxis hide />
                                    <Tooltip cursor={{fill: 'rgba(99, 102, 241, 0.05)', radius: 12}} content={<CustomTooltip />} />
                                    <Bar 
                                        dataKey="hours" 
                                        radius={[8, 8, 8, 8]} 
                                    >
                                        {weeklyData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === 6 ? '#6366f1' : '#cbd5e1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* 2. Calendar Widget */}
                    <div className="col-span-1 md:col-span-1 lg:col-span-1 lg:row-span-2">
                        <CalendarWidget logs={activityLogs} onDayClick={(d, logs) => setSelectedDate({date: d, logs})} />
                    </div>

                    {/* 3. Stats Column (Stacked) */}
                    <div className="col-span-1 lg:col-span-1 flex flex-col gap-6">
                        {/* Course Card Style */}
                        <div className="bg-gradient-to-br from-pink-500 to-rose-500 p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden flex-1 min-h-[160px] flex flex-col justify-center">
                            <div className="absolute top-0 right-0 p-4 opacity-20"><Trophy size={80} /></div>
                            <h3 className="text-lg font-bold mb-1 relative z-10">Quiz Master</h3>
                            <p className="text-pink-100 text-sm mb-4 relative z-10">Average Score</p>
                            <div className="text-5xl font-black relative z-10">{averageScore}%</div>
                        </div>

                        {/* Focus Card Style */}
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex-1 min-h-[160px] flex flex-col justify-center relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 text-indigo-50 dark:text-slate-700 transition-transform group-hover:scale-110"><Target size={80} /></div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">Focus Time</h3>
                            <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mb-2">{totalHours}h</div>
                            <div className="w-full bg-gray-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 w-[70%] rounded-full"></div>
                            </div>
                        </div>
                    </div>

                    {/* 4. Subject Breakdown (Donut + List) */}
                    <div className="col-span-1 md:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-slate-800 dark:text-white">Top Subjects</h3>
                            <button className="text-xs font-bold text-gray-400 hover:text-indigo-500">View All</button>
                        </div>
                        
                        <div className="flex items-center gap-8">
                            {/* Donut */}
                            <div className="relative w-32 h-32 shrink-0">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            innerRadius={40}
                                            outerRadius={55}
                                            paddingAngle={5}
                                            dataKey="value"
                                            stroke="none"
                                            cornerRadius={4}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center text-xl font-black text-slate-800 dark:text-white">
                                    {activityLogs.length}
                                </div>
                            </div>

                            {/* Legend List */}
                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {categoryData.map((cat, i) => (
                                    <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{backgroundColor: cat.color}}></div>
                                            <span className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate max-w-[100px]">{cat.name}</span>
                                        </div>
                                        <span className="text-xs font-bold text-gray-400">{cat.value} Sessions</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 5. AI Insight (Full Width or remaining space) */}
                    <div className="col-span-1 md:col-span-2 bg-gradient-to-r from-violet-600 to-indigo-600 p-6 md:p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden flex flex-col justify-center min-h-[200px]">
                        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none"><Sparkles size={120} /></div>
                        
                        <div className="relative z-10">
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold mb-4 border border-white/20">
                                <Sparkles size={12} className="text-yellow-300" /> AI Coach
                            </div>
                            <h3 className="text-2xl font-bold mb-3">Weekly Review</h3>
                            
                            {!analysis ? (
                                <p className="text-indigo-100 mb-6 text-sm leading-relaxed max-w-xl">
                                    I can analyze your last 7 days of activity to provide personalized tips.
                                </p>
                            ) : (
                                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-sm leading-relaxed font-medium mb-4 max-w-xl animate-fadeIn">
                                    "{analysis}"
                                </div>
                            )}

                            <button 
                                onClick={handleAnalyze}
                                disabled={loading}
                                className="bg-white text-indigo-600 px-6 py-3 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center gap-2 w-fit disabled:opacity-80"
                            >
                                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Generate Analysis'}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
