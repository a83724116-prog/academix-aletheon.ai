
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { ActivityLog } from '../types';
import { 
  Trophy, Clock, CheckCircle2, Calendar as CalendarIcon, 
  MoreHorizontal, ChevronLeft, ChevronRight, TrendingUp, 
  BookOpen, Target, Filter, ArrowUpRight, Zap
} from 'lucide-react';

interface AnalyticsProps {
  activityLogs: ActivityLog[];
}

const COLORS = ['#f97316', '#8b5cf6', '#06b6d4', '#10b981', '#f43f5e'];

export const Analytics: React.FC<AnalyticsProps> = ({ activityLogs }) => {
  const [date, setDate] = useState(new Date());

  // --- Data Processing ---

  // 1. Top Stats
  const totalMinutes = useMemo(() => activityLogs.reduce((acc, log) => acc + log.durationMinutes, 0), [activityLogs]);
  const totalHours = (totalMinutes / 60).toFixed(1);
  const totalXP = useMemo(() => activityLogs.reduce((acc, log) => acc + (log.score || 0), 0), [activityLogs]); // Assuming score ~= XP for simplicity here
  const totalTasks = activityLogs.length;

  // 2. Area Chart Data (Trends over last 7 days)
  const trendData = useMemo(() => {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7Days = Array.from({length: 7}, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return d.toISOString().split('T')[0];
      });

      return last7Days.map(dateStr => {
          const dayLogs = activityLogs.filter(l => l.date === dateStr);
          const xp = dayLogs.reduce((acc, l) => acc + (l.score || 0), 0);
          const mins = dayLogs.reduce((acc, l) => acc + l.durationMinutes, 0);
          const d = new Date(dateStr);
          return {
              name: days[d.getDay()],
              xp: xp,
              minutes: mins,
              amt: 100 // dummy max
          };
      });
  }, [activityLogs]);

  // 3. Subject Distribution (Donut)
  const subjectDist = useMemo(() => {
      const counts: Record<string, number> = {};
      activityLogs.forEach(log => {
          const subj = log.subject || 'General';
          counts[subj] = (counts[subj] || 0) + log.durationMinutes;
      });
      return Object.keys(counts).map((key, i) => ({
          name: key,
          value: counts[key],
          color: COLORS[i % COLORS.length]
      })).sort((a, b) => b.value - a.value);
  }, [activityLogs]);

  // 4. Subject Proficiency (Bar Chart)
  const subjectProficiency = useMemo(() => {
      const scores: Record<string, {total: number, count: number}> = {};
      activityLogs.forEach(log => {
          if (log.score) {
              const subj = log.subject || 'General';
              if (!scores[subj]) scores[subj] = { total: 0, count: 0 };
              scores[subj].total += log.score;
              scores[subj].count += 1;
          }
      });
      return Object.keys(scores).map(key => ({
          subject: key,
          score: Math.round(scores[key].total / scores[key].count),
          fill: COLORS[Math.floor(Math.random() * COLORS.length)]
      })).sort((a,b) => b.score - a.score).slice(0, 5);
  }, [activityLogs]);

  // Calendar Logic
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const monthName = date.toLocaleString('default', { month: 'long' });

  const getDayActivityLevel = (day: number) => {
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const count = activityLogs.filter(l => l.date === dateStr).length;
      if (count > 2) return 'bg-orange-500 text-white';
      if (count > 0) return 'bg-orange-200 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      return 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700';
  };

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-950 p-6 md:p-8 overflow-y-auto animate-fadeIn font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Analytics Dashboard</h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium">Track your growth and performance metrics.</p>
            </div>
            <div className="flex gap-2">
                <button className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-indigo-500 transition-colors">
                    <Filter size={20} />
                </button>
                <button className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-indigo-500 transition-colors">
                    <MoreHorizontal size={20} />
                </button>
            </div>
        </div>

        {/* Top Cards Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-gradient-to-br from-orange-400 to-pink-500 rounded-[2rem] p-6 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><Clock size={80} /></div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                        <Clock size={24} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-black mb-1">{totalHours}</h3>
                    <p className="font-bold text-orange-100 uppercase tracking-wider text-xs">Total Study Hours</p>
                </div>
            </div>

            {/* Card 2 */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] p-6 text-white shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><Trophy size={80} /></div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                        <Trophy size={24} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-black mb-1">{totalXP}</h3>
                    <p className="font-bold text-indigo-100 uppercase tracking-wider text-xs">Total XP Gained</p>
                </div>
            </div>

            {/* Card 3 */}
            <div className="bg-gradient-to-br from-cyan-400 to-teal-500 rounded-[2rem] p-6 text-white shadow-xl shadow-teal-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:scale-110 transition-transform"><CheckCircle2 size={80} /></div>
                <div className="relative z-10">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4">
                        <CheckCircle2 size={24} className="text-white" />
                    </div>
                    <h3 className="text-4xl font-black mb-1">{totalTasks}</h3>
                    <p className="font-bold text-teal-100 uppercase tracking-wider text-xs">Tasks Completed</p>
                </div>
            </div>
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Area Chart - Management Value Style */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Performance Trend</h3>
                    <div className="flex gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">XP</span>
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400">Hours</span>
                    </div>
                </div>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10}/>
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                            <Tooltip 
                                contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff'}}
                                itemStyle={{color: '#fff'}}
                            />
                            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
                            <Area type="monotone" dataKey="xp" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorXp)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Pie Chart - Distribution */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-4">Subject Focus</h3>
                <div className="flex-1 relative">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={subjectDist}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {subjectDist.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{borderRadius: '12px'}} />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                        <span className="text-3xl font-black text-slate-800 dark:text-white">{subjectDist.length}</span>
                        <span className="text-xs text-slate-400 uppercase font-bold">Subjects</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Bar Chart - Proficiency */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Subject Proficiency</h3>
                    <button className="text-xs font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 px-3 py-1 rounded-lg">View Details</button>
                </div>
                <div className="space-y-6">
                    {subjectProficiency.map((subj, i) => (
                        <div key={i}>
                            <div className="flex justify-between text-sm font-bold mb-2">
                                <span className="text-slate-700 dark:text-slate-300">{subj.subject}</span>
                                <span className="text-slate-500">{subj.score}%</span>
                            </div>
                            <div className="h-3 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-1000" 
                                    style={{ width: `${subj.score}%`, backgroundColor: subj.fill }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Calendar & List - Replaces "Top Students" */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-lg text-slate-800 dark:text-white">Activity Log</h3>
                    <div className="flex gap-1">
                        <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth()-1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronLeft size={16}/></button>
                        <button onClick={() => setDate(new Date(date.getFullYear(), date.getMonth()+1))} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"><ChevronRight size={16}/></button>
                    </div>
                </div>

                {/* Mini Calendar */}
                <div className="mb-6">
                    <div className="text-sm font-bold text-center mb-4 text-slate-800 dark:text-white">{monthName} {date.getFullYear()}</div>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-[10px] font-bold text-slate-400">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {Array.from({length: firstDay}).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({length: daysInMonth}).map((_, i) => (
                            <div 
                                key={i} 
                                className={`
                                    aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all cursor-default
                                    ${getDayActivityLevel(i + 1)}
                                `}
                            >
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent List */}
                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Recent Sessions</h4>
                    {activityLogs.slice(-4).reverse().map((log, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 rounded-xl transition-colors">
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                                {log.type === 'Quiz' ? <Target size={16}/> : log.type === 'Focus Session' ? <Zap size={16}/> : <BookOpen size={16}/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-700 dark:text-white truncate">{log.subject || log.type}</p>
                                <p className="text-xs text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</p>
                            </div>
                            {log.score && <span className="text-xs font-bold text-green-500">+{log.score} XP</span>}
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
