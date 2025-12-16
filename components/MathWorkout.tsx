
import React, { useState, useEffect, useCallback } from 'react';
import { MathQuestion } from '../types';
import { Timer, Trophy, RotateCcw, CheckCircle2, XCircle, Settings, Calculator, Target, Zap, Clock, ListOrdered, Check } from 'lucide-react';

interface WorkoutSettings {
  operations: string[];
  difficulty: 'Easy' | 'Medium' | 'Hard';
  mode: 'Time' | 'Questions';
  value: number; // Seconds or Count
}

const OPERATIONS = [
    { id: 'add', label: 'Addition', symbol: '+' },
    { id: 'sub', label: 'Subtraction', symbol: '-' },
    { id: 'mul', label: 'Multiplication', symbol: '×' },
    { id: 'div', label: 'Division', symbol: '÷' },
    { id: 'sqrt', label: 'Square Root', symbol: '√' },
    { id: 'exp', label: 'Exponent', symbol: 'x²' },
    { id: 'cbrt', label: 'Cube Root', symbol: '∛' },
];

interface MathWorkoutProps {
  onComplete?: (score: number) => void;
}

export const MathWorkout: React.FC<MathWorkoutProps> = ({ onComplete }) => {
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'finished'>('menu');
  
  // Settings State
  const [config, setConfig] = useState<WorkoutSettings>({
      operations: ['add', 'sub', 'mul', 'div'],
      difficulty: 'Easy',
      mode: 'Time',
      value: 60 // 60 seconds default
  });

  const [question, setQuestion] = useState<MathQuestion | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0); // Current timer
  const [questionCount, setQuestionCount] = useState(0); // Current Q count
  const [history, setHistory] = useState<{q: string, correct: boolean}[]>([]);

  // --- LOCAL MATH ENGINE (Fast & Efficient) ---
  const generateQuestion = useCallback(() => {
    const { operations, difficulty } = config;
    const op = operations[Math.floor(Math.random() * operations.length)] || 'add';
    
    let q = '', a = 0;
    const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

    switch(op) {
        case 'add': {
            const range = difficulty === 'Easy' ? [1, 50] : difficulty === 'Medium' ? [10, 100] : [50, 500];
            const n1 = rand(range[0], range[1]);
            const n2 = rand(range[0], range[1]);
            q = `${n1} + ${n2}`;
            a = n1 + n2;
            break;
        }
        case 'sub': {
            const range = difficulty === 'Easy' ? [10, 50] : difficulty === 'Medium' ? [50, 150] : [100, 1000];
            const n1 = rand(range[0], range[1]);
            const n2 = rand(1, n1); // Ensure positive result
            q = `${n1} - ${n2}`;
            a = n1 - n2;
            break;
        }
        case 'mul': {
            const range = difficulty === 'Easy' ? [2, 10] : difficulty === 'Medium' ? [5, 15] : [10, 25];
            const n1 = rand(range[0], range[1]);
            const n2 = rand(2, 10);
            q = `${n1} × ${n2}`;
            a = n1 * n2;
            break;
        }
        case 'div': {
            const divisor = rand(2, difficulty === 'Easy' ? 10 : 20);
            const quotient = rand(2, difficulty === 'Easy' ? 10 : 20);
            const dividend = divisor * quotient;
            q = `${dividend} ÷ ${divisor}`;
            a = quotient;
            break;
        }
        case 'sqrt': {
            const base = rand(2, difficulty === 'Easy' ? 12 : 25);
            const sq = base * base;
            q = `√${sq}`;
            a = base;
            break;
        }
        case 'cbrt': {
            const base = rand(2, difficulty === 'Easy' ? 5 : 10);
            const cb = base * base * base;
            q = `∛${cb}`;
            a = base;
            break;
        }
        case 'exp': {
            const base = rand(2, 10);
            const pow = rand(2, 3); // Keep power small
            q = `${base}${pow === 2 ? '²' : '³'}`;
            a = Math.pow(base, pow);
            break;
        }
    }

    // Generate options
    const options = new Set<number>();
    options.add(a);
    while(options.size < 4) {
        let offset = rand(1, 10);
        if (difficulty === 'Hard') offset = rand(1, 20);
        if (Math.random() > 0.5) offset *= -1;
        
        const wrong = a + offset;
        if (wrong > 0 && wrong !== a) options.add(wrong);
    }

    setQuestion({
      id: Date.now(),
      question: q,
      answer: a,
      options: Array.from(options).sort(() => Math.random() - 0.5)
    });
  }, [config]);

  // Timer & Game Loop
  useEffect(() => {
    let timer: any;
    
    if (gameState === 'playing') {
        if (config.mode === 'Time') {
            timer = setInterval(() => {
                setTimeLeft(prev => {
                    if (prev <= 1) {
                        setGameState('finished');
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    }
    return () => clearInterval(timer);
  }, [gameState, config.mode]);

  // Trigger XP reward when game finishes
  useEffect(() => {
    if (gameState === 'finished' && onComplete) {
      const xpEarned = Math.floor(score / 2); // 1 XP per 2 points
      if (xpEarned > 0) onComplete(xpEarned);
    }
  }, [gameState, score, onComplete]);

  const startGame = () => {
    if (config.operations.length === 0) {
        alert("Please select at least one operation.");
        return;
    }
    setScore(0);
    setHistory([]);
    setQuestionCount(0);
    
    if (config.mode === 'Time') {
        setTimeLeft(config.value);
    }
    
    setGameState('playing');
    generateQuestion();
  };

  const handleAnswer = (ans: number) => {
    if (!question) return;
    const isCorrect = ans === question.answer;
    
    if (isCorrect) setScore(s => s + 10);
    else setScore(s => Math.max(0, s - 5));
    
    setHistory(h => [...h, { q: `${question.question} = ${question.answer}`, correct: isCorrect }]);
    
    // Check end condition for Question Mode
    if (config.mode === 'Questions') {
        const nextCount = questionCount + 1;
        setQuestionCount(nextCount);
        if (nextCount >= config.value) {
            setGameState('finished');
            return;
        }
    }

    generateQuestion();
  };

  const toggleOp = (id: string) => {
      setConfig(prev => {
          const exists = prev.operations.includes(id);
          const newOps = exists ? prev.operations.filter(o => o !== id) : [...prev.operations, id];
          return { ...prev, operations: newOps };
      });
  };

  if (gameState === 'menu') {
    return (
      <div className="h-full bg-slate-50 dark:bg-slate-900 p-6 overflow-y-auto animate-fadeIn flex flex-col items-center">
        <div className="max-w-2xl w-full">
            <header className="text-center mb-8">
                <div className="w-20 h-20 bg-indigo-500 rounded-3xl mx-auto flex items-center justify-center shadow-lg mb-4 transform -rotate-6">
                    <Calculator className="text-white w-10 h-10" />
                </div>
                <h2 className="text-4xl font-black text-slate-800 dark:text-white">Math Workout</h2>
                <p className="text-slate-500 mt-2 font-medium">Customize your mental gym session</p>
            </header>

            <div className="bg-white dark:bg-slate-800 rounded-[2rem] shadow-xl border border-gray-100 dark:border-slate-700 p-8 space-y-8">
                
                {/* Operations */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Operations</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {OPERATIONS.map(op => {
                            const active = config.operations.includes(op.id);
                            return (
                                <button
                                    key={op.id}
                                    onClick={() => toggleOp(op.id)}
                                    className={`
                                        p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2
                                        ${active 
                                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300' 
                                            : 'border-transparent bg-gray-50 dark:bg-slate-900 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700'}
                                    `}
                                >
                                    <span className="text-2xl font-black">{op.symbol}</span>
                                    <span className="text-xs font-bold">{op.label}</span>
                                    {active && <div className="absolute top-2 right-2"><CheckCircle2 size={14} /></div>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Difficulty */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Difficulty</h3>
                    <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl">
                        {['Easy', 'Medium', 'Hard'].map((diff) => (
                            <button
                                key={diff}
                                onClick={() => setConfig({...config, difficulty: diff as any})}
                                className={`flex-1 py-3 rounded-lg text-sm font-bold transition-all ${config.difficulty === diff ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white' : 'text-gray-400'}`}
                            >
                                {diff}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mode & Value */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Game Mode</h3>
                    <div className="flex gap-4 mb-4">
                        <button 
                            onClick={() => setConfig({...config, mode: 'Time', value: 60})}
                            className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold ${config.mode === 'Time' ? 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-slate-700 text-gray-500'}`}
                        >
                            <Clock size={20} /> Time Attack
                        </button>
                        <button 
                            onClick={() => setConfig({...config, mode: 'Questions', value: 20})}
                            className={`flex-1 p-4 rounded-xl border-2 flex items-center justify-center gap-2 font-bold ${config.mode === 'Questions' ? 'border-indigo-500 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-200 dark:border-slate-700 text-gray-500'}`}
                        >
                            <ListOrdered size={20} /> Fixed Count
                        </button>
                    </div>
                    
                    <div className="bg-gray-50 dark:bg-slate-900 p-4 rounded-xl">
                        <div className="flex justify-between text-sm font-bold mb-2 text-slate-600 dark:text-slate-300">
                            <span>{config.mode === 'Time' ? 'Duration' : 'Questions'}</span>
                            <span className="text-indigo-500">{config.value} {config.mode === 'Time' ? 'sec' : 'qs'}</span>
                        </div>
                        <input 
                            type="range" 
                            min={config.mode === 'Time' ? 30 : 10} 
                            max={config.mode === 'Time' ? 300 : 100} 
                            step={10}
                            value={config.value}
                            onChange={(e) => setConfig({...config, value: parseInt(e.target.value)})}
                            className="w-full accent-indigo-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                <button 
                    onClick={startGame}
                    className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black text-xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
                >
                    Start Workout
                </button>
            </div>
        </div>
      </div>
    );
  }

  if (gameState === 'finished') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
        <Trophy size={80} className="text-yellow-400 mb-6 drop-shadow-2xl" />
        <h2 className="text-5xl font-black mb-2 text-slate-800 dark:text-white">Session Complete!</h2>
        <p className="text-xl text-gray-500 mb-8 font-medium">Final Score: <span className="text-indigo-500 font-bold text-3xl">{score}</span></p>
        
        <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] shadow-xl w-full max-w-md mb-8 max-h-80 overflow-y-auto border border-gray-100 dark:border-slate-700 custom-scrollbar">
            <h4 className="font-bold mb-4 sticky top-0 bg-white dark:bg-slate-800 pb-2 border-b text-left text-sm uppercase text-gray-400">Answer Log</h4>
            <div className="space-y-3">
                {history.map((h, i) => (
                    <div key={i} className="flex justify-between text-sm items-center p-2 rounded-lg bg-gray-50 dark:bg-slate-900/50">
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{h.q}</span>
                        {h.correct ? <CheckCircle2 size={18} className="text-green-500"/> : <XCircle size={18} className="text-red-500"/>}
                    </div>
                ))}
            </div>
        </div>

        <button onClick={() => setGameState('menu')} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-lg">
          <RotateCcw size={20} /> Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto p-6 relative">
      {/* Top HUD */}
      <div className="w-full flex justify-between items-center mb-12 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
            {config.mode === 'Time' ? (
                <>
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-500">
                        <Timer size={20} />
                    </div>
                    <span className="text-2xl font-black font-mono text-slate-700 dark:text-white tabular-nums">{timeLeft}s</span>
                </>
            ) : (
                <>
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-blue-500">
                        <Target size={20} />
                    </div>
                    <span className="text-2xl font-black font-mono text-slate-700 dark:text-white tabular-nums">{questionCount}/{config.value}</span>
                </>
            )}
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Score</span>
            <span className="text-2xl font-black text-indigo-500">{score}</span>
        </div>
      </div>

      {/* Question Card */}
      <div className="w-full mb-8 perspective-1000">
          <div className="bg-white dark:bg-slate-800 p-16 rounded-[3rem] shadow-2xl border-b-8 border-indigo-500 text-center transform transition-transform hover:scale-[1.02] duration-300">
            <h2 className="text-6xl md:text-7xl font-black text-slate-800 dark:text-white tracking-wider">{question?.question}</h2>
          </div>
      </div>

      {/* Answer Grid */}
      <div className="grid grid-cols-2 gap-4 w-full">
        {question?.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(opt)}
            className="bg-white dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 p-8 rounded-3xl shadow-sm border-2 border-transparent hover:border-indigo-500 text-3xl font-bold text-gray-700 dark:text-gray-200 transition-all active:scale-95 flex items-center justify-center"
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
};
