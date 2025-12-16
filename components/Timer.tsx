
import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Coffee, BrainCircuit, Timer as TimerIcon, Zap } from 'lucide-react';

interface TimerProps {
  onComplete?: (minutes: number) => void;
}

type TimerMode = 'pomodoro' | 'shortBreak' | 'longBreak' | 'stopwatch';

const MODES: { [key in TimerMode]: { label: string, minutes: number, color: string, icon: any } } = {
  pomodoro: { label: 'Focus', minutes: 25, color: '#6366f1', icon: BrainCircuit },
  shortBreak: { label: 'Short Break', minutes: 5, color: '#10b981', icon: Coffee },
  longBreak: { label: 'Long Break', minutes: 15, color: '#3b82f6', icon: Coffee },
  stopwatch: { label: 'Stopwatch', minutes: 0, color: '#f59e0b', icon: TimerIcon },
};

export const Timer: React.FC<TimerProps> = ({ onComplete }) => {
  const [mode, setMode] = useState<TimerMode>('pomodoro');
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(100);

  // Circle config
  const radius = 120;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    let interval: any = null;

    if (isActive) {
      interval = setInterval(() => {
        if (mode === 'stopwatch') {
          setTimeLeft(prev => prev + 1);
        } else {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsActive(false);
              handleComplete();
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    } else {
      clearInterval(interval);
    }

    return () => clearInterval(interval);
  }, [isActive, mode]);

  useEffect(() => {
    if (mode === 'stopwatch') {
      setProgress(100); // Always full for stopwatch or implement looping animation
    } else {
      const totalSeconds = MODES[mode].minutes * 60;
      setProgress((timeLeft / totalSeconds) * 100);
    }
  }, [timeLeft, mode]);

  const handleComplete = () => {
    // Play sound notification (simulated)
    if (Notification.permission === 'granted') {
      new Notification("Time's up!", { body: `${MODES[mode].label} session complete.` });
    }

    if (mode === 'pomodoro' && onComplete) {
      onComplete(MODES.pomodoro.minutes); // Award XP and Log minutes
    }
  };

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    if (mode === 'stopwatch') setTimeLeft(0);
    else setTimeLeft(MODES[mode].minutes * 60);
  };

  const switchMode = (newMode: TimerMode) => {
    setMode(newMode);
    setIsActive(false);
    if (newMode === 'stopwatch') setTimeLeft(0);
    else setTimeLeft(MODES[newMode].minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const CurrentIcon = MODES[mode].icon;

  return (
    <div className="h-full flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="max-w-2xl w-full bg-white dark:bg-slate-800 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 flex flex-col items-center">
        
        {/* Header Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10 w-full">
          {(Object.keys(MODES) as TimerMode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className={`px-4 py-2 rounded-full font-bold text-sm transition-all duration-300 ${
                mode === m 
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-lg scale-105' 
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              {MODES[m].label}
            </button>
          ))}
        </div>

        {/* Timer Circle */}
        <div className="relative mb-10">
          {/* SVG Ring */}
          <svg className="transform -rotate-90 w-72 h-72 md:w-80 md:h-80 drop-shadow-xl">
            <circle
              cx="50%" cy="50%" r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-gray-100 dark:text-slate-700"
            />
            <circle
              cx="50%" cy="50%" r={radius}
              stroke={MODES[mode].color}
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - (progress / 100) * circumference}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          {/* Center Content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-800 dark:text-white">
            <CurrentIcon size={32} className="mb-2 opacity-50" style={{color: MODES[mode].color}} />
            <div className="text-6xl md:text-7xl font-black tracking-tighter tabular-nums">
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm font-bold uppercase tracking-widest opacity-40 mt-2">
              {isActive ? 'Running' : 'Paused'}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button
            onClick={resetTimer}
            className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <RotateCcw size={24} />
          </button>
          
          <button
            onClick={toggleTimer}
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-white shadow-xl hover:scale-105 transition-transform active:scale-95"
            style={{ backgroundColor: MODES[mode].color }}
          >
            {isActive ? <Pause size={40} fill="currentColor" /> : <Play size={40} fill="currentColor" className="ml-2" />}
          </button>

          {/* Volume / Settings placeholder */}
          <button
            onClick={() => {
                if(Notification.permission !== 'granted') Notification.requestPermission();
            }}
            className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
            title="Enable Notifications"
          >
            <Zap size={24} />
          </button>
        </div>

        {mode === 'pomodoro' && (
             <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 px-6 py-3 rounded-xl border border-indigo-100 dark:border-indigo-900/30 text-center">
                <p className="text-indigo-800 dark:text-indigo-200 text-sm font-medium">
                   ✨ Complete a session to earn <span className="font-bold">50 XP</span>
                </p>
             </div>
        )}

      </div>
    </div>
  );
};
