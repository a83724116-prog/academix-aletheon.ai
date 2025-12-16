
import React, { useState, useEffect } from 'react';
import { View, UserProgress, Badge, Todo, Rank, ActivityLog } from './types';
import { 
  LayoutDashboard, BookOpen, BrainCircuit, Activity, 
  WholeWord, GraduationCap, Calculator, CheckSquare, 
  Moon, Sun, Menu, X, Users, Trophy, User as UserIcon,
  Bell, Clock, Gamepad2, TrendingUp, Eye, Sparkles, PartyPopper, Timer as TimerIcon, Atom, Newspaper, Feather, Target, Quote, Maximize2, ArrowLeft, ArrowRight, BedDouble, Plus, Search, ChevronRight, Star, MoreVertical, ArrowUpRight, Video
} from 'lucide-react';
import { Summarizer } from './components/Summarizer';
import { MindMap } from './components/MindMap';
import { MathWorkout } from './components/MathWorkout';
import { MentorChat } from './components/MentorChat';
import { Gamification } from './components/Gamification';
import { QuizGame } from './components/QuizGame';
import { PeriodicTable } from './components/PeriodicTable';
import { CurrentAffairs } from './components/CurrentAffairs';
import { WordPortal } from './components/WordPortal';
import { StudyPlanner } from './components/StudyPlanner';
import { Onboarding } from './components/Onboarding';
import { DeepResearch } from './components/DeepResearch';
import { ChemistryLab } from './components/ChemistryLab';
import { TodoList } from './components/TodoList';
import { DashboardHome } from './components/DashboardHome';

// --- Gamification Data ---
const ALL_BADGES: Badge[] = [
  { id: 'math_whiz', name: 'Math Whiz', description: 'Score 100+ points in a single Math session', icon: 'Calculator', condition: 'manual' },
  { id: 'bookworm', name: 'Bookworm', description: 'Summarize 5 Chapters', icon: 'BookOpen', condition: 'manual' },
  { id: 'streak_master', name: 'Streak Master', description: 'Maintain a 7-day study streak', icon: 'Flame', condition: 'manual' },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a task before 8 AM', icon: 'Sun', condition: 'manual' },
  { id: 'quiz_master', name: 'Quiz Master', description: 'Score 100% in a quiz', icon: 'Trophy', condition: 'manual' },
  { id: 'zen_master', name: 'Zen Master', description: 'Complete 5 Focus Sessions', icon: 'BrainCircuit', condition: 'manual' }
];

const RANKS: Rank[] = [
  { id: 'bronze', name: 'Bronze', minLevel: 1, color: '#cd7f32', image: 'https://cdn-icons-png.flaticon.com/512/2583/2583344.png' },
  { id: 'silver', name: 'Silver', minLevel: 5, color: '#c0c0c0', image: 'https://cdn-icons-png.flaticon.com/512/2583/2583319.png' },
  { id: 'gold', name: 'Gold', minLevel: 10, color: '#ffd700', image: 'https://cdn-icons-png.flaticon.com/512/2583/2583434.png' },
  { id: 'platinum', name: 'Platinum', minLevel: 20, color: '#e5e4e2', image: 'https://cdn-icons-png.flaticon.com/512/2583/2583350.png' },
  { id: 'diamond', name: 'Diamond', minLevel: 30, color: '#b9f2ff', image: 'https://cdn-icons-png.flaticon.com/512/2583/2583448.png' }
];

// --- Main App Component ---

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // User State
  const [userProgress, setUserProgress] = useState<UserProgress>({
    xp: 1250,
    level: 5,
    badges: ['math_whiz'],
    streak: 3
  });

  // Real-time Activity Logs State
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

  // Seed Data on Mount
  useEffect(() => {
      const initialLogs: ActivityLog[] = [];
      const today = new Date();
      for(let i=0; i<10; i++) {
          const d = new Date(today);
          d.setDate(today.getDate() - Math.floor(Math.random() * 7)); // Random day in last week
          initialLogs.push({
              id: `seed-${i}`,
              date: d.toISOString().split('T')[0],
              timestamp: d.getTime(),
              type: Math.random() > 0.5 ? 'Focus Session' : 'Quiz',
              durationMinutes: 15 + Math.floor(Math.random() * 45),
              score: Math.floor(Math.random() * 100),
              subject: 'General'
          });
      }
      setActivityLogs(initialLogs);
  }, []);

  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: 'Complete Math Worksheet', completed: false, category: 'Homework' },
    { id: '2', text: 'Read History Chapter 4', completed: true, category: 'Study' },
    { id: '3', text: 'Science Project Research', completed: false, category: 'Homework' },
  ]);

  // Dark Mode Toggle
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(!darkMode);

  const handleCompleteTask = (id: string) => {
    setTodos(todos.map(t => {
      if (t.id === id) {
        if (!t.completed) awardXP(20);
        return { ...t, completed: !t.completed };
      }
      return t;
    }));
  };

  const handleAddTask = (text: string, category: Todo['category'] = 'Study') => {
    const newTodo: Todo = {
        id: Date.now().toString(),
        text,
        completed: false,
        category
    };
    setTodos([newTodo, ...todos]);
  };

  const handleDeleteTask = (id: string) => {
    setTodos(todos.filter(t => t.id !== id));
  };

  const awardXP = (amount: number) => {
    setUserProgress(prev => {
      const newXP = prev.xp + amount;
      const newLevel = Math.floor(newXP / 1000) + 1;
      return { ...prev, xp: newXP, level: newLevel };
    });
  };

  // Central Logger Function
  const handleLogActivity = (log: Omit<ActivityLog, 'id' | 'date' | 'timestamp'>) => {
      const newLog: ActivityLog = {
          ...log,
          id: Date.now().toString(),
          date: new Date().toISOString().split('T')[0],
          timestamp: Date.now()
      };
      setActivityLogs(prev => [...prev, newLog]);
      // Also award XP based on duration or score if not handled elsewhere
      if (log.durationMinutes) awardXP(Math.floor(log.durationMinutes / 2));
  };

  // Views Configuration with Vibrant Glass Colors
  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'profile', label: 'Student Profile', icon: UserIcon },
    { id: 'mentor', label: 'Mentor Info', icon: Users },
    { id: 'todo', label: 'Tasks', icon: CheckSquare },
    { id: 'research', label: 'Course Resources', icon: BookOpen },
    { id: 'periodic', label: 'Periodic Table', icon: Atom },
    { id: 'news', label: 'Global News', icon: Newspaper },
    { id: 'summarizer', label: 'AI Summarizer', icon: BookOpen },
    { id: 'mindmap', label: 'Mind Maps', icon: BrainCircuit },
    { id: 'word', label: 'Word Portal', icon: WholeWord },
    { id: 'math', label: 'Math Workout', icon: Calculator },
    { id: 'quiz', label: 'Quiz Game', icon: Gamepad2 },
    { id: 'planner', label: 'Study Plan', icon: Target },
  ];

  const renderContent = () => {
    switch (view) {
      case 'dashboard': return <DashboardHome setView={setView} />;
      case 'todo': return <TodoList todos={todos} onToggle={handleCompleteTask} onAdd={handleAddTask} onDelete={handleDeleteTask} />;
      case 'research': return <DeepResearch />;
      case 'summarizer': return <Summarizer onSummarizeComplete={() => { awardXP(50); handleLogActivity({type: 'Summary', durationMinutes: 5, subject: 'Reading'}); }} />;
      case 'mindmap': return <MindMap />;
      case 'math': return <MathWorkout onComplete={(score) => { awardXP(Math.floor(score/2)); handleLogActivity({type: 'Math Workout', durationMinutes: 10, score: score, subject: 'Math'}); }} />;
      case 'mentor': return <MentorChat />;
      case 'profile': return <Gamification progress={userProgress} allBadges={ALL_BADGES} ranks={RANKS} />;
      case 'quiz': return <QuizGame onComplete={(score) => { awardXP(score); handleLogActivity({type: 'Quiz', durationMinutes: 5, score: score*10, subject: 'General'}); }} />;
      case 'periodic': return <PeriodicTable />;
      case 'news': return <CurrentAffairs />;
      case 'word': return <WordPortal />;
      case 'planner': return <StudyPlanner />;
      default: return <div className="p-10 text-center text-gray-500">Feature coming soon!</div>;
    }
  };

  return (
    <div className="flex h-screen bg-warm-grey dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors duration-300 font-sans overflow-hidden">
      
      <Onboarding />

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Matching the Design Spec */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 border-r border-gray-100 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-coral-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-coral-500/30">
              <GraduationCap size={24} />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">Edu<span className="text-coral-500">Comp</span></span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-400">
            <X size={24} />
          </button>
        </div>

        <div className="px-6 mb-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Menu</h3>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 space-y-2 custom-scrollbar pb-4">
           {NAV_ITEMS.map(item => (
             <button
               id={`nav-${item.id}`}
               key={item.id}
               onClick={() => { setView(item.id as View); setSidebarOpen(false); }}
               className={`
                 w-full flex items-center gap-4 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 group relative
                 ${view === item.id 
                   ? 'bg-gradient-to-r from-coral-500 to-coral-400 text-white shadow-md shadow-coral-500/30' 
                   : 'text-slate-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-900'}
               `}
             >
               <item.icon size={20} strokeWidth={2} className={view === item.id ? 'text-white' : 'text-gray-400'} />
               <span>{item.label}</span>
             </button>
           ))}
        </nav>

        <div className="p-6 border-t border-gray-100 dark:border-slate-800">
           <button 
             onClick={toggleDarkMode}
             className="w-full flex items-center justify-center gap-2 py-3 rounded-full border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors font-bold text-sm text-slate-500"
           >
             {darkMode ? <Sun size={18} /> : <Moon size={18} />}
             {darkMode ? 'Light Mode' : 'Dark Mode'}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 relative">
        {/* Mobile Header */}
        <div className="md:hidden h-16 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between px-4 z-20 shrink-0 relative">
           <div className="flex items-center">
             <button onClick={() => setSidebarOpen(true)} className="p-2 text-slate-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
               <Menu size={24} />
             </button>
             {view !== 'dashboard' && (
                <button 
                  onClick={() => setView('dashboard')}
                  className="p-2 ml-1 text-slate-500 hover:text-coral-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  title="Back to Dashboard"
                >
                  <ArrowLeft size={24} />
                </button>
             )}
           </div>
           <span className="font-bold text-lg absolute left-1/2 -translate-x-1/2">Dashboard</span>
           <div className="w-10"></div> {/* Spacer */}
        </div>

        <div className="flex-1 overflow-hidden relative">
           <div className="h-full overflow-y-auto custom-scrollbar">
              <div className="h-full flex flex-col">
                 <div className="flex-1 min-h-0 relative">
                    {renderContent()}
                 </div>
              </div>
           </div>
        </div>
      </main>
    </div>
  );
}
