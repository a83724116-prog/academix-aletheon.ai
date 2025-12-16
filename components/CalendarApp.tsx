
import React, { useState, useEffect } from 'react';
import { CalendarEvent } from '../types';
import { GeminiService } from '../services/geminiService';
import { 
  ChevronLeft, ChevronRight, Plus, Sparkles, Bell, 
  Calendar as CalendarIcon, Clock, Tag, X, Check, Loader2, Star,
  ExternalLink
} from 'lucide-react';

const EVENT_TYPES = [
  { id: 'exam', label: 'Exam', color: 'bg-red-400', text: 'text-red-900', border: 'border-red-300' },
  { id: 'study', label: 'Study', color: 'bg-indigo-400', text: 'text-indigo-900', border: 'border-indigo-300' },
  { id: 'assignment', label: 'Due', color: 'bg-amber-400', text: 'text-amber-900', border: 'border-amber-300' },
  { id: 'chill', label: 'Chill', color: 'bg-emerald-400', text: 'text-emerald-900', border: 'border-emerald-300' },
  { id: 'other', label: 'Other', color: 'bg-pink-400', text: 'text-pink-900', border: 'border-pink-300' },
];

const MOCK_EVENTS: CalendarEvent[] = [
    { id: '1', title: 'Math Final', date: new Date().toISOString().split('T')[0], time: '09:00', type: 'exam', color: 'bg-red-400' },
    { id: '2', title: 'Physics Study', date: new Date(Date.now() + 86400000).toISOString().split('T')[0], time: '14:00', type: 'study', color: 'bg-indigo-400' }
];

export const CalendarApp: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>(MOCK_EVENTS);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEvent, setNewEvent] = useState({ title: '', time: '12:00', type: 'study' });
  
  // AI State
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Calendar Logic
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDate(dateStr);
    setShowAddModal(true);
  };

  const addEvent = () => {
      if (!selectedDate || !newEvent.title) return;
      
      const typeConfig = EVENT_TYPES.find(t => t.id === newEvent.type) || EVENT_TYPES[0];
      
      const event: CalendarEvent = {
          id: Date.now().toString(),
          title: newEvent.title,
          date: selectedDate,
          time: newEvent.time,
          type: newEvent.type as any,
          color: typeConfig.color
      };
      
      const updatedEvents = [...events, event];
      setEvents(updatedEvents);
      setShowAddModal(false);
      setNewEvent({ title: '', time: '12:00', type: 'study' });
      
      // Trigger AI re-check quietly
      handleAiOptimize(updatedEvents);
  };

  const handleAiOptimize = async (currentEvents: CalendarEvent[]) => {
      setLoadingAi(true);
      try {
          const result = await GeminiService.manageCalendar(currentEvents);
          setAiInsights(result);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingAi(false);
      }
  };

  const addToGoogleCalendar = (e: React.MouseEvent, event: CalendarEvent) => {
      e.stopPropagation();
      // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
      // Assuming event duration of 1 hour for simplicity
      const startDate = new Date(`${event.date}T${event.time}`);
      const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 Hour

      const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
      
      const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(event.title)}&dates=${format(startDate)}/${format(endDate)}&details=Added%20from%20EduCompanion%20AI&location=`;
      
      window.open(url, '_blank');
  };

  // Initial AI check
  useEffect(() => {
      handleAiOptimize(events);
  }, []);

  const renderCalendarGrid = () => {
      const slots = [];
      
      // Empty slots for previous month
      for (let i = 0; i < firstDayOfMonth; i++) {
          slots.push(<div key={`empty-${i}`} className="h-32 md:h-48 lg:h-64 bg-transparent"></div>);
      }

      // Day slots
      for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const dayEvents = events.filter(e => e.date === dateStr);
          const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

          slots.push(
              <div 
                key={day} 
                onClick={() => handleDayClick(day)}
                className={`
                    h-32 md:h-48 lg:h-64 border border-gray-100 dark:border-slate-700/50 rounded-3xl p-4 relative group cursor-pointer transition-all hover:bg-white/50 dark:hover:bg-slate-800/50 hover:shadow-xl hover:-translate-y-1
                    ${isToday ? 'bg-white/80 dark:bg-slate-800/80 shadow-md ring-2 ring-pink-400' : 'bg-white/30 dark:bg-slate-900/30'}
                `}
              >
                  <span className={`
                      text-lg font-bold w-9 h-9 flex items-center justify-center rounded-full mb-2
                      ${isToday ? 'bg-pink-500 text-white' : 'text-slate-600 dark:text-slate-400'}
                  `}>
                      {day}
                  </span>
                  
                  <div className="space-y-1.5 overflow-y-auto max-h-[calc(100%-3rem)] custom-scrollbar">
                      {dayEvents.map(ev => (
                          <div 
                            key={ev.id} 
                            className={`group/ev text-xs px-3 py-1.5 rounded-xl font-bold truncate shadow-sm text-white ${ev.color} hover:brightness-110 flex justify-between items-center`}
                            title={ev.title}
                          >
                              <span className="truncate">{ev.title}</span>
                              <button 
                                onClick={(e) => addToGoogleCalendar(e, ev)}
                                className="ml-1 p-0.5 hover:bg-black/20 rounded opacity-0 group-hover/ev:opacity-100 transition-opacity"
                                title="Add to Google Calendar"
                              >
                                  <ExternalLink size={10} />
                              </button>
                          </div>
                      ))}
                  </div>

                  {/* Add Button on Hover */}
                  <button className="absolute bottom-3 right-3 w-8 h-8 bg-indigo-500 rounded-full text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity flex shadow-lg hover:scale-110">
                      <Plus size={16} />
                  </button>
              </div>
          );
      }
      return slots;
  };

  return (
    <div className="h-full flex flex-col md:flex-row bg-[#fdf2f8] dark:bg-slate-950 overflow-hidden relative animate-fadeIn">
        {/* Background Blobs for Cute Vibe */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-pink-200 dark:bg-pink-900/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-200 dark:bg-indigo-900/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

        {/* Modal */}
        {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in zoom-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl w-full max-w-sm border-2 border-white/50 dark:border-slate-700 relative">
                    <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><X size={20}/></button>
                    <h3 className="text-xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <Star className="text-yellow-400 fill-yellow-400" /> New Event
                    </h3>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Title</label>
                            <input 
                                value={newEvent.title} 
                                onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                                placeholder="e.g. Math Exam"
                                className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 ring-pink-400 font-bold text-slate-700 dark:text-white"
                            />
                        </div>
                        
                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 block">Time</label>
                            <input 
                                type="time"
                                value={newEvent.time} 
                                onChange={e => setNewEvent({...newEvent, time: e.target.value})}
                                className="w-full p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border-none outline-none focus:ring-2 ring-pink-400 font-bold text-slate-700 dark:text-white"
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Category</label>
                            <div className="flex flex-wrap gap-2">
                                {EVENT_TYPES.map(type => (
                                    <button
                                        key={type.id}
                                        onClick={() => setNewEvent({...newEvent, type: type.id})}
                                        className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all ${newEvent.type === type.id ? `${type.color} text-white border-transparent scale-105` : `bg-transparent ${type.text} ${type.border} opacity-60 hover:opacity-100`}`}
                                    >
                                        {type.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            onClick={addEvent}
                            disabled={!newEvent.title}
                            className="w-full py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:scale-[1.02] active:scale-95 transition-all mt-4 disabled:opacity-50"
                        >
                            Add to Calendar
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Sidebar Info */}
        <div className="w-full md:w-80 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border-r border-gray-100 dark:border-slate-800 p-6 flex flex-col z-10">
            <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <CalendarIcon className="text-pink-500" /> My Plan
            </h2>

            {/* AI Insight Box */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><Sparkles size={64}/></div>
                <div className="relative z-10">
                    <h3 className="font-bold text-sm uppercase tracking-wider mb-2 flex items-center gap-2">
                        <Sparkles size={14} className="text-yellow-300" /> AI Assistant
                    </h3>
                    {loadingAi ? (
                        <div className="flex items-center gap-2 text-indigo-200 text-sm">
                            <Loader2 className="animate-spin" size={14} /> Organizing schedule...
                        </div>
                    ) : (
                        <>
                            <p className="text-sm font-medium leading-relaxed mb-4">
                                "{aiInsights?.advice || "Add some events and I'll help you manage them!"}"
                            </p>
                            {aiInsights?.conflictAlert && (
                                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-2 text-xs font-bold text-red-100 mb-2 flex items-center gap-2">
                                    <Bell size={12} /> {aiInsights.conflictAlert}
                                </div>
                            )}
                        </>
                    )}
                    <button 
                        onClick={() => handleAiOptimize(events)}
                        className="w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-bold transition-colors"
                    >
                        Refresh Insights
                    </button>
                </div>
            </div>

            {/* Upcoming Reminders */}
            <div className="flex-1 overflow-y-auto">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Bell size={14} /> Smart Reminders
                </h3>
                {aiInsights?.upcomingReminders?.length > 0 ? (
                    <div className="space-y-3">
                        {aiInsights.upcomingReminders.map((rem: any, i: number) => (
                            <div key={i} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 ${rem.priority === 'High' ? 'bg-red-500' : 'bg-indigo-500'}`}></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-tight">{rem.text}</p>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase">{rem.priority} Priority</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 italic">No urgent alerts.</p>
                )}
            </div>
        </div>

        {/* Main Calendar View */}
        <div className="flex-1 flex flex-col z-10">
            {/* Header */}
            <div className="p-8 md:p-10 flex items-center justify-between">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                        {monthNames[currentDate.getMonth()]} <span className="text-pink-500">{currentDate.getFullYear()}</span>
                    </h2>
                </div>
                <div className="flex bg-white dark:bg-slate-800 rounded-xl p-1 shadow-sm border border-gray-100 dark:border-slate-700">
                    <button onClick={handlePrevMonth} className="p-3 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"><ChevronLeft size={24}/></button>
                    <button onClick={handleNextMonth} className="p-3 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-slate-500"><ChevronRight size={24}/></button>
                </div>
            </div>

            {/* Grid Header */}
            <div className="grid grid-cols-7 px-8 md:px-12 mb-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-sm font-bold text-gray-400 uppercase tracking-widest">{day}</div>
                ))}
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-8 md:px-12 pb-12 custom-scrollbar">
                <div className="grid grid-cols-7 gap-4 md:gap-6 lg:gap-8">
                    {renderCalendarGrid()}
                </div>
            </div>
        </div>
    </div>
  );
};
