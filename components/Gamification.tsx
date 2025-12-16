
import React, { useRef, useState, MouseEvent } from 'react';
import { UserProgress, Badge, Rank } from '../types';
import { Trophy, Star, Medal, Zap, Lock, Shield } from 'lucide-react';

interface GamificationProps {
  progress: UserProgress;
  allBadges: Badge[];
  ranks: Rank[];
}

// 3D Tilt Card Component
const RankCard: React.FC<{ rank: Rank; isUnlocked: boolean; isCurrent: boolean }> = ({ rank, isUnlocked, isCurrent }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((y - centerY) / centerY) * -15; // Max 15deg rotation
    const rotateY = ((x - centerX) / centerX) * 15;

    setRotation({ x: rotateX, y: rotateY });
    setGlow({ x: (x / rect.width) * 100, y: (y / rect.height) * 100 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setGlow({ x: 50, y: 50 });
  };

  return (
    <div 
      className="perspective-1000 relative"
      style={{ perspective: '1000px' }}
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`
          relative w-full aspect-[3/4] rounded-xl transition-transform duration-100 ease-out
          flex flex-col items-center justify-between p-6 select-none
          ${isUnlocked ? 'cursor-pointer' : 'opacity-60 grayscale'}
        `}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale3d(1.02, 1.02, 1.02)`,
          backgroundColor: isUnlocked ? '#1e1b4b' : '#0f172a', // Dark background for contrast
          boxShadow: isCurrent 
            ? `0 20px 50px -10px ${rank.color}66` 
            : '0 10px 30px -10px rgba(0,0,0,0.5)',
          border: isCurrent ? `2px solid ${rank.color}` : '1px solid #334155'
        }}
      >
        {/* Dynamic Sheen/Glow */}
        {isUnlocked && (
          <div 
            className="absolute inset-0 rounded-xl pointer-events-none z-10 mix-blend-overlay"
            style={{
              background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 80%)`
            }}
          />
        )}

        {/* Rank Image - No masking, full PNG */}
        <div className="flex-1 flex items-center justify-center w-full z-0 relative">
          <img 
            src={rank.image} 
            alt={rank.name} 
            className={`w-full h-auto drop-shadow-2xl object-contain transition-all duration-500 ${isCurrent ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]' : ''}`}
            style={{ filter: isUnlocked ? 'none' : 'brightness(0.5) blur(1px)' }}
          />
          {!isUnlocked && (
            <div className="absolute inset-0 flex items-center justify-center z-20">
              <Lock className="text-gray-400 w-12 h-12" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="relative z-10 text-center w-full mt-4">
          <h3 
            className="text-xl font-black uppercase tracking-wider mb-1"
            style={{ 
              color: isUnlocked ? rank.color : '#94a3b8',
              textShadow: isUnlocked ? `0 0 10px ${rank.color}44` : 'none'
            }}
          >
            {rank.name}
          </h3>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
            Level {rank.minLevel}+
          </p>
        </div>

        {/* Current Badge Indicator */}
        {isCurrent && (
          <div className="absolute -top-3 -right-3 bg-white text-black p-2 rounded-full shadow-lg z-30 animate-bounce">
            <Star size={20} fill="#fbbf24" className="text-yellow-400" />
          </div>
        )}
      </div>
    </div>
  );
};

export const Gamification: React.FC<GamificationProps> = ({ progress, allBadges, ranks }) => {
  const currentRankIndex = [...ranks].reverse().findIndex(r => progress.level >= r.minLevel);
  // reverse find index gives index from end, convert to actual index
  const actualRankIndex = currentRankIndex >= 0 ? ranks.length - 1 - currentRankIndex : 0;
  const currentRank = ranks[actualRankIndex];
  const nextRank = ranks[actualRankIndex + 1];

  const nextLevelXp = progress.level * 100; // Simplified scaling
  const progressPercent = Math.min(100, (progress.xp / nextLevelXp) * 100);

  return (
    <div className="space-y-12 pb-10 animate-fadeIn text-gray-800 dark:text-gray-100">
      
      {/* Hero Section */}
      <div className="relative bg-slate-900 rounded-3xl p-8 md:p-12 overflow-hidden shadow-2xl border border-slate-700">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        {/* Ambient Glow based on rank */}
        <div 
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-30 blur-3xl rounded-full pointer-events-none"
            style={{ background: `radial-gradient(circle, ${currentRank.color} 0%, transparent 70%)` }}
        ></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
          
          <div className="text-center md:text-left">
            <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase drop-shadow-md mb-2">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                {currentRank.name}
              </span>
            </h1>
            <p className="text-slate-400 font-bold tracking-widest uppercase mb-8">Current Rank • Season 1</p>
            
            <div className="bg-slate-800/80 backdrop-blur-md p-6 rounded-2xl border border-slate-700 inline-block min-w-[300px]">
              <div className="flex justify-between text-sm font-bold text-slate-300 mb-2">
                <span>XP Progress</span>
                <span style={{ color: currentRank.color }}>{progress.xp} / {nextLevelXp}</span>
              </div>
              <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                <div 
                  className="h-full shadow-[0_0_15px_currentColor] transition-all duration-1000"
                  style={{ 
                    width: `${progressPercent}%`,
                    backgroundColor: currentRank.color,
                    color: currentRank.color
                  }}
                />
              </div>
              <p className="text-xs text-center mt-3 text-slate-500">
                {nextRank 
                  ? `${nextLevelXp - progress.xp} XP to reach ${nextRank.name}` 
                  : "Max Rank Achieved!"}
              </p>
            </div>
          </div>

          <div className="relative w-64 h-64 md:w-80 md:h-80 perspective-1000">
            <img 
              src={currentRank.image} 
              alt="Current Rank" 
              className="w-full h-full object-contain animate-[float_4s_ease-in-out_infinite] drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]"
            />
          </div>
        </div>
      </div>

      {/* Rank Path */}
      <div>
        <h2 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-3">
          <Trophy className="text-yellow-500" /> Rank Progression
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {ranks.map((rank) => (
            <RankCard 
              key={rank.id} 
              rank={rank} 
              isUnlocked={progress.level >= rank.minLevel}
              isCurrent={currentRank.id === rank.id}
            />
          ))}
        </div>
      </div>

      {/* Achievement Medals (Classic Badges) */}
      <div>
        <h2 className="text-2xl font-black uppercase italic mb-8 flex items-center gap-3">
          <Medal className="text-orange-500" /> Honor Medals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {allBadges.map(badge => {
             const unlocked = progress.badges.includes(badge.id);
             return (
               <div key={badge.id} className={`flex items-center gap-4 p-4 rounded-xl border ${unlocked ? 'bg-gradient-to-r from-slate-800 to-slate-900 border-slate-700 text-white' : 'bg-gray-100 dark:bg-slate-900/50 border-gray-200 dark:border-slate-800 text-gray-500 grayscale'}`}>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl shadow-inner ${unlocked ? 'bg-slate-700 text-yellow-400' : 'bg-gray-200 dark:bg-slate-800'}`}>
                     <Star fill={unlocked ? "currentColor" : "none"} size={20} />
                  </div>
                  <div>
                     <h4 className="font-bold">{badge.name}</h4>
                     <p className="text-xs opacity-70">{badge.description}</p>
                  </div>
               </div>
             )
           })}
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
      `}</style>
    </div>
  );
};
