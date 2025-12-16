import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  BookOpen, 
  Zap
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

// --- MOCK DATA ---

const graphData = [
  { name: '23 Sep', value: 30 },
  { name: '24 Sep', value: 45 },
  { name: '25 Sep', value: 35 },
  { name: '26 Sep', value: 80 }, 
  { name: '27 Sep', value: 55 },
  { name: '28 Sep', value: 70 },
  { name: '29 Sep', value: 45 },
  { name: '30 Sep', value: 60 },
  { name: '01 Oct', value: 50 },
];

const friends = [
  { id: 1, name: 'Alice', status: 'Studying', color: 'bg-green-400', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
  { id: 2, name: 'Bob', status: 'In Class', color: 'bg-yellow-400', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
  { id: 3, name: 'Charlie', status: 'Online', color: 'bg-blue-400', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' },
  { id: 4, name: 'Diana', status: 'Offline', color: 'bg-gray-300', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diana' },
  { id: 5, name: 'Eve', status: 'Studying', color: 'bg-green-400', image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eve' },
];

// --- COMPONENTS ---

const StatCard = ({ label, val, iconClass, textClass, barColor }: any) => {
  const [curr, total] = val.toString().split('/').map((n: string) => parseFloat(n));
  const percentage = total > 0 ? (curr / total) * 100 : 0;

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-all flex flex-col justify-between h-full group">
        <div>
            <div className={`w-12 h-12 rounded-full ${iconClass} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
                <BookOpen size={20} />
            </div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">{label}</p>
            <div className="flex items-baseline gap-1 mb-4">
                <h3 className={`text-3xl font-black ${textClass}`}>{curr}</h3>
                <span className="text-sm font-bold text-gray-400">/ {total}</span>
            </div>
        </div>
        
        <div className="w-full">
            <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">
                <span>Progress</span>
                <span>{Math.round(percentage)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${barColor}`} 
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    </div>
  );
};

const FriendsBar = () => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-slate-700">
    <div className="flex justify-between items-center mb-4">
      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
        <Zap size={18} className="text-coral-500 fill-coral-500" /> Friends Activity
      </h3>
      <button className="text-xs font-bold text-slate-400 hover:text-coral-500">View All</button>
    </div>
    <div className="flex gap-6 overflow-x-auto pb-2 no-scrollbar">
      {friends.map((friend) => (
        <div key={friend.id} className="flex flex-col items-center gap-2 min-w-[64px] cursor-pointer group">
          <div className="relative">
            <img 
              src={friend.image} 
              alt={friend.name} 
              className="w-14 h-14 rounded-full border-2 border-white dark:border-slate-700 shadow-sm group-hover:scale-105 transition-transform" 
            />
            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white dark:border-slate-800 ${friend.status === 'Offline' ? 'bg-slate-300' : 'bg-green-400 animate-pulse'}`}></div>
          </div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{friend.name}</p>
            <p className="text-[10px] text-slate-400 font-medium">{friend.status}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// --- MAIN LAYOUT ---

export const DashboardHome: React.FC<{ setView: (view: any) => void }> = ({ setView }) => {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  return (
    <div className="flex h-full w-full bg-[#f8f9fa] dark:bg-slate-900 font-sans overflow-hidden">
      
      {/* --- CENTER MAIN CONTENT (Full Width) --- */}
      <div className="flex-1 flex flex-col p-6 lg:p-8 overflow-y-auto custom-scrollbar gap-8">
        
        {/* 1. TOP BAR */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Dashboard</h1>
            <p className="text-slate-400 font-medium mt-1">{dateStr}</p>
          </div>
          
          <div className="relative">
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 bg-white dark:bg-slate-800 p-2 pl-4 rounded-full shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-slate-700"
            >
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Mithun Ray</p>
                    <p className="text-xs text-slate-400 font-bold">Class XI • Science</p>
                </div>
                <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-10 h-10 rounded-full bg-coral-100" />
            </button>
            
            {/* User Profile Dropdown */}
            {userMenuOpen && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                <button onClick={() => setView('profile')} className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-coral-50 dark:hover:bg-slate-700 hover:text-coral-500">View Profile</button>
                <button className="w-full text-left px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-coral-50 dark:hover:bg-slate-700 hover:text-coral-500">Edit Settings</button>
                <div className="h-px bg-gray-100 dark:bg-slate-700 my-1"></div>
                <button className="w-full text-left px-4 py-2 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">Log Out</button>
              </div>
            )}
          </div>
        </div>

        {/* 2. TOGGLE */}
        <div className="flex gap-1 bg-white dark:bg-slate-800 p-1.5 rounded-full w-fit shadow-sm border border-gray-100 dark:border-slate-700">
            <button className="px-6 py-2 bg-coral-500 text-white rounded-full text-sm font-bold shadow-md shadow-coral-500/30">Student</button>
            <button className="px-6 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 rounded-full text-sm font-bold transition-colors">Teacher</button>
        </div>

        {/* 3. STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
           <StatCard 
             label="Presentation" 
             val="8/20" 
             iconClass="bg-orange-100 text-orange-500" 
             textClass="text-orange-500" 
             barColor="bg-orange-500"
           />
           <StatCard 
             label="Examination" 
             val="3/10" 
             iconClass="bg-emerald-100 text-emerald-500" 
             textClass="text-emerald-500" 
             barColor="bg-emerald-500"
           />
           <StatCard 
             label="Reports" 
             val="6/15" 
             iconClass="bg-blue-100 text-blue-500" 
             textClass="text-slate-800 dark:text-white" 
             barColor="bg-blue-500"
           />
           
           <div className="bg-white dark:bg-slate-800 p-6 rounded-[24px] shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col justify-between">
               <div className="flex justify-between items-center mb-2">
                   <h3 className="font-bold text-slate-800 dark:text-white">Course Stats</h3>
                   <MoreHorizontal size={16} className="text-slate-400" />
               </div>
               <div className="space-y-4">
                   <div>
                       <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                           <span>Done</span> <span className="text-coral-500">45%</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                           <div className="h-full bg-coral-400 w-[45%] rounded-full"></div>
                       </div>
                   </div>
                   <div>
                       <div className="flex justify-between text-xs font-bold text-slate-500 mb-1">
                           <span>Progress</span> <span className="text-emerald-500">85%</span>
                       </div>
                       <div className="h-2 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 w-[85%] rounded-full"></div>
                       </div>
                   </div>
               </div>
           </div>
        </div>

        {/* 4. ATTENDANCE REPORT */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-700">
           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Total Attendance Report</h3>
              <div className="flex gap-4">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-coral-400"></span> Present
                 </div>
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Absence
                 </div>
              </div>
           </div>
           
           <div className="h-[250px] w-full relative">
              <div className="absolute top-[20%] left-[45%] bg-coral-500 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-lg shadow-coral-500/30 z-10 animate-bounce">
                  128
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-coral-500"></div>
              </div>

              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={graphData}>
                    <defs>
                       <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FB923C" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#FB923C" stopOpacity={0}/>
                       </linearGradient>
                       <linearGradient id="colorAbsent" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#34D399" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#34D399" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid vertical={true} horizontal={true} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 500}} dy={10} />
                    <YAxis hide />
                    <Tooltip contentStyle={{backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 20px -5px rgba(0, 0, 0, 0.1)'}} itemStyle={{color: '#333', fontSize: '12px', fontWeight: 'bold'}} />
                    <Area type="monotone" dataKey="value" stroke="#FB923C" strokeWidth={4} fillOpacity={1} fill="url(#colorPresent)" />
                    <Area type="monotone" dataKey="value" stroke="#34D399" strokeWidth={4} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorAbsent)" />
                 </AreaChart>
              </ResponsiveContainer>
           </div>
        </div>

        {/* 5. STUDENT TABLE */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden">
           <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Academic Success</h3>
              <button className="text-xs font-bold text-coral-500 bg-coral-50 dark:bg-coral-900/20 px-4 py-2 rounded-full hover:bg-coral-100 transition-colors">Annual Exam</button>
           </div>
           
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="text-xs text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700">
                       <th className="pb-4 pl-4 uppercase tracking-wider">Profile</th>
                       <th className="pb-4 uppercase tracking-wider">Name</th>
                       <th className="pb-4 uppercase tracking-wider">Student ID</th>
                       <th className="pb-4 uppercase tracking-wider">Group</th>
                       <th className="pb-4 uppercase tracking-wider">Marks</th>
                       <th className="pb-4 pr-4 text-right uppercase tracking-wider">Action</th>
                    </tr>
                 </thead>
                 <tbody className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-50 dark:border-slate-700/50 last:border-0">
                       <td className="py-4 pl-4"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka" className="w-10 h-10 rounded-full bg-indigo-100" alt="Student"/></td>
                       <td className="py-4">Antwan Graham <br/><span className="text-xs text-slate-400 font-normal">Class XI</span></td>
                       <td className="py-4 text-slate-500 font-mono">M-62358</td>
                       <td className="py-4"><span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">Science</span></td>
                       <td className="py-4 text-coral-500">98/100</td>
                       <td className="py-4 pr-4 text-right"><button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-full text-xs font-bold hover:bg-coral-50 hover:text-coral-500 hover:border-coral-200 transition-all shadow-sm">Edit Profile</button></td>
                    </tr>
                    <tr className="group hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                       <td className="py-4 pl-4"><img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Bob" className="w-10 h-10 rounded-full bg-emerald-100" alt="Student"/></td>
                       <td className="py-4">Dwight Brown <br/><span className="text-xs text-slate-400 font-normal">Class XI</span></td>
                       <td className="py-4 text-slate-500 font-mono">M-62359</td>
                       <td className="py-4"><span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold">Science</span></td>
                       <td className="py-4 text-coral-500">92/100</td>
                       <td className="py-4 pr-4 text-right"><button className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-full text-xs font-bold hover:bg-coral-50 hover:text-coral-500 hover:border-coral-200 transition-all shadow-sm">Edit Profile</button></td>
                    </tr>
                 </tbody>
              </table>
           </div>
        </div>

        {/* 6. FRIENDS ACTIVITY (New Bottom Section) */}
        <FriendsBar />

      </div>
    </div>
  );
};
