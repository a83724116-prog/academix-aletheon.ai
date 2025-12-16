
import React, { useState, useEffect, useRef } from 'react';
import { StudyGroup, GroupMessage, GroupEvent, GroupResource } from '../types';
import { Users, MessageCircle, Calendar, Plus, Send, MoreVertical, Video, BookOpen, X, FileText, Link as LinkIcon, Image as ImageIcon, Smile, Paperclip } from 'lucide-react';

const MOCK_GROUPS: StudyGroup[] = [
  {
    id: '1',
    name: 'Class 10 Math Pros',
    subject: 'Mathematics',
    members: 12,
    description: 'Solving complex algebra and geometry problems together.',
    messages: [
      { id: '1', userId: 'u2', userName: 'Alice', text: 'Does anyone have the notes for Chapter 5?', timestamp: Date.now() - 3600000 },
      { id: '2', userId: 'u3', userName: 'Bob', text: 'Yes, I uploaded them to the resources tab.', timestamp: Date.now() - 1800000 },
    ],
    events: [
      { id: 'e1', title: 'Group Study: Trigonometry', date: 'Today, 5:00 PM', type: 'session' },
      { id: 'e2', title: 'Calculus Quiz', date: 'Tomorrow, 10:00 AM', type: 'deadline' }
    ],
    resources: [
        { id: 'r1', name: 'Trig Formulas.pdf', type: 'pdf', url: '#', uploadedBy: 'Bob' }
    ]
  },
  {
    id: '2',
    name: 'History Buffs',
    subject: 'History',
    members: 8,
    description: 'Discussing the rise of nationalism and world wars.',
    messages: [],
    events: [],
    resources: []
  },
  {
    id: '3',
    name: 'Science Geeks',
    subject: 'Physics',
    members: 15,
    description: 'Physics lab discussions and theory prep.',
    messages: [],
    events: [],
    resources: []
  }
];

export const StudyGroups: React.FC = () => {
  const [groups, setGroups] = useState<StudyGroup[]>(MOCK_GROUPS);
  const [selectedGroup, setSelectedGroup] = useState<StudyGroup | null>(null);
  const [messageText, setMessageText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Modals state
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showScheduleEvent, setShowScheduleEvent] = useState(false);
  const [showShareResource, setShowShareResource] = useState(false);

  // Form states
  const [newGroup, setNewGroup] = useState({ name: '', subject: '', description: '' });
  const [newEvent, setNewEvent] = useState({ title: '', date: '', time: '' });
  const [newResource, setNewResource] = useState({ name: '', type: 'pdf' as 'pdf'|'link'|'image' });

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedGroup?.messages]);

  // Sync selectedGroup with groups state when groups update (e.g. incoming messages)
  useEffect(() => {
    if (selectedGroup) {
      const updatedGroup = groups.find(g => g.id === selectedGroup.id);
      if (updatedGroup && updatedGroup !== selectedGroup) {
        setSelectedGroup(updatedGroup);
      }
    }
  }, [groups]);

  // Simulate Real-time Chat (Incoming messages from others)
  useEffect(() => {
    if (!selectedGroup) return;

    const intervalId = setInterval(() => {
      // 30% chance to receive a message every 5 seconds
      if (Math.random() > 0.7) {
        const mockUsers = ['Alice', 'Bob', 'Charlie', 'David', 'Eve', 'Frank'];
        const mockPhrases = [
          "That makes sense!",
          "Can you explain step 2 again?",
          "I shared a new resource.",
          "When is the next meeting?",
          "Thanks for the help!",
          "I'm working on the problem set now.",
          "Did anyone check the latest announcement?",
          "Lol",
          "👍",
          "Wait, isn't the deadline tomorrow?",
          "My code isn't working :("
        ];

        const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)];
        const randomPhrase = mockPhrases[Math.floor(Math.random() * mockPhrases.length)];

        const newMessage: GroupMessage = {
          id: Date.now().toString() + Math.random(),
          userId: randomUser.toLowerCase(),
          userName: randomUser,
          text: randomPhrase,
          timestamp: Date.now(),
          isMe: false
        };

        setGroups(prevGroups => prevGroups.map(g => {
            if (g.id === selectedGroup.id) {
                return { ...g, messages: [...g.messages, newMessage] };
            }
            return g;
        }));
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [selectedGroup?.id]);

  const handleJoin = (group: StudyGroup) => {
    setSelectedGroup(group);
  };

  const handleSendMessage = () => {
    if (!selectedGroup || !messageText.trim()) return;
    
    const newMessage: GroupMessage = {
      id: Date.now().toString(),
      userId: 'me',
      userName: 'You',
      text: messageText,
      timestamp: Date.now(),
      isMe: true
    };

    setGroups(prev => prev.map(g => {
        if (g.id === selectedGroup.id) {
            return { ...g, messages: [...g.messages, newMessage] };
        }
        return g;
    }));
    
    setMessageText('');
  };

  const handleCreateGroup = () => {
    if (!newGroup.name || !newGroup.subject) return;
    const group: StudyGroup = {
        id: Date.now().toString(),
        name: newGroup.name,
        subject: newGroup.subject,
        description: newGroup.description,
        members: 1,
        messages: [],
        events: [],
        resources: []
    };
    setGroups([...groups, group]);
    setShowCreateGroup(false);
    setNewGroup({ name: '', subject: '', description: '' });
  };

  const handleAddEvent = () => {
      if (!selectedGroup || !newEvent.title || !newEvent.date) return;
      const event: GroupEvent = {
          id: Date.now().toString(),
          title: newEvent.title,
          date: `${newEvent.date}, ${newEvent.time}`,
          type: 'session'
      };
      
      setGroups(prev => prev.map(g => {
        if (g.id === selectedGroup.id) {
            return { ...g, events: [...g.events, event] };
        }
        return g;
      }));
      
      setShowScheduleEvent(false);
      setNewEvent({ title: '', date: '', time: '' });
  };

  const handleAddResource = () => {
      if (!selectedGroup || !newResource.name) return;
      const resource: GroupResource = {
          id: Date.now().toString(),
          name: newResource.name,
          type: newResource.type,
          url: '#',
          uploadedBy: 'You'
      };
      
      setGroups(prev => prev.map(g => {
        if (g.id === selectedGroup.id) {
            return { ...g, resources: [...g.resources, resource] };
        }
        return g;
      }));
      
      setShowShareResource(false);
      setNewResource({ name: '', type: 'pdf' });
  };

  if (!selectedGroup) {
    return (
      <div className="h-full flex flex-col relative animate-fadeIn">
        <div className="flex justify-between items-center mb-6">
           <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Study Groups</h2>
           <button 
             onClick={() => setShowCreateGroup(true)}
             className="bg-primary text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-indigo-600 transition-colors shadow-lg shadow-indigo-500/30"
           >
             <Plus size={18} /> Create Group
           </button>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-4">
          {groups.map(group => (
            <div key={group.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col group">
               <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-primary dark:text-indigo-400 group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                  <span className="bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 text-xs font-bold px-2 py-1 rounded-lg">
                    {group.subject}
                  </span>
               </div>
               <h3 className="font-bold text-lg mb-2 text-gray-800 dark:text-white">{group.name}</h3>
               <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 flex-1 line-clamp-2">{group.description}</p>
               
               <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50 dark:border-slate-700">
                  <div className="flex -space-x-2">
                     {[...Array(Math.min(3, group.members))].map((_, i) => (
                        <div key={i} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-slate-600 border-2 border-white dark:border-slate-800"></div>
                     ))}
                     {group.members > 3 && (
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-700 border-2 border-white dark:border-slate-800 flex items-center justify-center text-xs font-bold text-gray-500">
                            +{group.members - 3}
                        </div>
                     )}
                  </div>
                  <button 
                    onClick={() => handleJoin(group)}
                    className="text-primary font-bold text-sm hover:underline flex items-center gap-1"
                  >
                    Join <span className="hidden sm:inline">Group</span>
                  </button>
               </div>
            </div>
          ))}
        </div>

        {/* Create Group Modal */}
        {showCreateGroup && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm rounded-3xl p-4">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
                    <h3 className="text-xl font-bold mb-4 dark:text-white">Create New Study Group</h3>
                    <div className="space-y-3">
                        <input value={newGroup.name} onChange={e => setNewGroup({...newGroup, name: e.target.value})} placeholder="Group Name" className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-gray-700 focus:ring-2 ring-primary outline-none" />
                        <input value={newGroup.subject} onChange={e => setNewGroup({...newGroup, subject: e.target.value})} placeholder="Subject" className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-gray-700 focus:ring-2 ring-primary outline-none" />
                        <textarea value={newGroup.description} onChange={e => setNewGroup({...newGroup, description: e.target.value})} placeholder="Description" className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-gray-700 h-24 resize-none focus:ring-2 ring-primary outline-none" />
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => setShowCreateGroup(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">Cancel</button>
                            <button onClick={handleCreateGroup} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-indigo-600">Create</button>
                        </div>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
  }

  // Active Group View
  return (
    <div className="h-full flex flex-col md:flex-row gap-6 bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 relative animate-fadeIn">
      
      {/* Schedule Modal */}
      {showScheduleEvent && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Schedule Session</h3>
                <div className="space-y-3">
                    <input value={newEvent.title} onChange={e => setNewEvent({...newEvent, title: e.target.value})} placeholder="Session Title" className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-gray-700" />
                    <input type="date" value={newEvent.date} onChange={e => setNewEvent({...newEvent, date: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-gray-700" />
                    <input type="time" value={newEvent.time} onChange={e => setNewEvent({...newEvent, time: e.target.value})} className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-gray-700" />
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => setShowScheduleEvent(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">Cancel</button>
                        <button onClick={handleAddEvent} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-indigo-600">Schedule</button>
                    </div>
                </div>
             </div>
          </div>
      )}

      {/* Share Resource Modal */}
      {showShareResource && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in">
                <h3 className="text-xl font-bold mb-4 dark:text-white">Share Resource</h3>
                <div className="space-y-3">
                    <input value={newResource.name} onChange={e => setNewResource({...newResource, name: e.target.value})} placeholder="File Name (e.g. Notes.pdf)" className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border dark:border-gray-700" />
                    <div className="flex gap-2">
                        {['pdf', 'link', 'image'].map(t => (
                            <button 
                                key={t} 
                                onClick={() => setNewResource({...newResource, type: t as any})}
                                className={`flex-1 p-2 rounded-lg text-sm font-bold capitalize ${newResource.type === t ? 'bg-indigo-100 text-primary' : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-300'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button onClick={() => setShowShareResource(false)} className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl">Cancel</button>
                        <button onClick={handleAddResource} className="flex-1 py-3 bg-primary text-white font-bold rounded-xl hover:bg-indigo-600">Share</button>
                    </div>
                </div>
             </div>
          </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
             <button onClick={() => setSelectedGroup(null)} className="md:hidden text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white"><Users size={20}/></button>
             <div>
                <h3 className="font-bold text-gray-800 dark:text-white truncate max-w-[200px]">{selectedGroup.name}</h3>
                <p className="text-xs text-green-500 flex items-center gap-1 font-medium"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> 5 Online</p>
             </div>
          </div>
          <div className="flex gap-2 text-gray-500">
             <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors" title="Video Call"><Video size={20}/></button>
             <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors"><MoreVertical size={20}/></button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30 dark:bg-slate-900/30 scroll-smooth">
           {selectedGroup.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <MessageCircle size={48} className="mx-auto mb-2 opacity-20" />
                 <p>Start the conversation!</p>
              </div>
           ) : (
             selectedGroup.messages.map(msg => (
               <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[75%] ${msg.isMe ? 'bg-primary text-white rounded-br-none' : 'bg-white dark:bg-slate-700 dark:text-slate-100 rounded-bl-none'} p-4 rounded-2xl shadow-sm border border-transparent ${!msg.isMe && 'border-gray-100 dark:border-slate-600'}`}>
                     {!msg.isMe && <p className="text-xs font-bold opacity-70 mb-1 text-primary dark:text-indigo-300">{msg.userName}</p>}
                     <p className="text-sm leading-relaxed">{msg.text}</p>
                     <p className={`text-[10px] text-right mt-1 ${msg.isMe ? 'text-indigo-200' : 'text-gray-400'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                  </div>
               </div>
             ))
           )}
           <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-gray-700">
           <div className="flex gap-2 items-end">
              <button className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><Paperclip size={20}/></button>
              <div className="flex-1 bg-gray-50 dark:bg-slate-900 rounded-xl flex items-center border border-gray-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/50 transition-all">
                  <input 
                    value={messageText}
                    onChange={e => setMessageText(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 p-3 bg-transparent border-none outline-none min-w-0"
                  />
                  <button className="p-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"><Smile size={20}/></button>
              </div>
              <button 
                onClick={handleSendMessage} 
                disabled={!messageText.trim()}
                className="bg-primary text-white p-3 rounded-xl hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
              >
                  <Send size={20} />
              </button>
           </div>
        </div>
      </div>

      {/* Sidebar Info (Hidden on mobile) */}
      <div className="w-72 border-l border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-900 p-4 hidden md:flex flex-col gap-6 overflow-y-auto">
         <div>
            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
               <Calendar size={16} className="text-primary"/> Upcoming Events
            </h4>
            <div className="space-y-3">
               {selectedGroup.events.length > 0 ? selectedGroup.events.map(ev => (
                  <div key={ev.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:border-primary transition-colors cursor-pointer group">
                     <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center bg-gray-100 dark:bg-slate-700 rounded-lg p-1 min-w-[3rem]">
                           <span className="text-[10px] font-bold text-red-500 uppercase">{ev.type}</span>
                           <span className="text-lg font-black leading-none">{ev.date.split(',')[0].split(' ')[1]}</span>
                        </div>
                        <div>
                           <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight group-hover:text-primary transition-colors">{ev.title}</p>
                           <p className="text-xs text-gray-500 mt-1">{ev.date.split(',')[1]}</p>
                        </div>
                     </div>
                  </div>
               )) : <p className="text-sm text-gray-400 italic">No upcoming events.</p>}
               <button 
                onClick={() => setShowScheduleEvent(true)}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-500 hover:border-primary hover:text-primary transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
               >
                  + Schedule Session
               </button>
            </div>
         </div>

         <div>
             <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
               <BookOpen size={16} className="text-primary"/> Shared Resources
            </h4>
            <div className="space-y-2 mb-2">
                {selectedGroup.resources?.map(res => (
                    <div key={res.id} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer">
                        <div className="p-2 bg-gray-50 dark:bg-slate-700 rounded-lg">
                            {res.type === 'pdf' ? <FileText size={16} className="text-red-500"/> : res.type === 'image' ? <ImageIcon size={16} className="text-blue-500"/> : <LinkIcon size={16} className="text-green-500"/>}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">{res.name}</p>
                            <p className="text-[10px] text-gray-400">Shared by {res.uploadedBy}</p>
                        </div>
                    </div>
                ))}
            </div>
            <button 
                onClick={() => setShowShareResource(true)}
                className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-500 hover:border-primary hover:text-primary transition-colors hover:bg-gray-50 dark:hover:bg-slate-800"
            >
                + Share Resource
            </button>
         </div>
      </div>
    </div>
  );
};
