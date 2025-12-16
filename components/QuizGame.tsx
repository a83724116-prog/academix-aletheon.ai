
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { QuizQuestion } from '../types';
import { Play, BrainCircuit, Check, X, Trophy, RefreshCcw, Loader2, Zap, Timer as TimerIcon, Settings, Clock, ListOrdered, BookOpen } from 'lucide-react';

interface QuizGameProps {
  onComplete?: (xp: number) => void;
}

// Interactive 3D Card Component
const TiltCard = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Rotate more for "Elevate" feel
    const rotateX = ((y - centerY) / centerY) * -10; 
    const rotateY = ((x - centerX) / centerX) * 10;

    setRotation({ x: rotateX, y: rotateY });
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setGlare(prev => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="perspective-1000 w-full" style={{ perspective: '1000px' }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative transition-transform duration-100 ease-out transform-gpu ${className}`}
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
        }}
      >
        {children}
        {/* Dynamic Glare Effect */}
        <div 
            className="absolute inset-0 rounded-3xl pointer-events-none mix-blend-overlay transition-opacity duration-300"
            style={{
                background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 80%)`,
                opacity: glare.opacity
            }}
        />
      </div>
    </div>
  );
};

export const QuizGame: React.FC<QuizGameProps> = ({ onComplete }) => {
  const [gameState, setGameState] = useState<'setup' | 'loading' | 'playing' | 'result'>('setup');
  
  // Setup State
  const [config, setConfig] = useState({
      count: 10,
      time: 5, // minutes
      subject: 'Mixed',
      difficulty: 'Medium',
      customSubject: ''
  });

  // Game State
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState(0); // seconds per question (calculated)
  const [streak, setStreak] = useState(0);

  const SUBJECTS = ['Mixed', 'Science', 'History', 'Mathematics', 'Geography', 'Technology', 'Literature', 'Custom'];

  const startGame = async () => {
    const subject = config.subject === 'Custom' ? config.customSubject : config.subject;
    if (!subject) return;

    setGameState('loading');
    try {
      const quiz = await GeminiService.generateQuiz(subject, config.count, config.difficulty);
      if (Array.isArray(quiz) && quiz.length > 0) {
        setQuestions(quiz);
        setGameState('playing');
        setCurrentIndex(0);
        setScore(0);
        setStreak(0);
        // Calculate time per question in seconds
        setTimeLeft(Math.floor((config.time * 60) / quiz.length));
      } else {
        alert("Could not generate a quiz. Please try a different topic.");
        setGameState('setup');
      }
    } catch (e) {
      alert("Error generating quiz.");
      setGameState('setup');
    }
  };

  useEffect(() => {
    let timer: any;
    if (gameState === 'playing' && selectedOption === null) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, selectedOption, currentIndex]);

  const handleTimeOut = () => {
    setSelectedOption(-1);
    setIsCorrect(false);
    setStreak(0);
    setTimeout(nextQuestion, 2000);
  };

  const handleAnswer = (index: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(index);
    const correct = index === questions[currentIndex].correctIndex;
    setIsCorrect(correct);

    if (correct) {
      const points = 100 + (timeLeft * 2) + (streak * 10);
      setScore((s) => s + points);
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }

    setTimeout(nextQuestion, 1500);
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((c) => c + 1);
      setSelectedOption(null);
      setIsCorrect(null);
      // Reset timer for next question based on total time remaining split?
      // Or fixed per question? Let's use fixed per question derived from total config
      setTimeLeft(Math.floor((config.time * 60) / questions.length));
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setGameState('result');
    if (onComplete) {
      const xp = Math.floor(score / 10);
      onComplete(xp);
    }
  };

  // --- Screens ---

  if (gameState === 'setup') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 animate-fadeIn overflow-y-auto">
        <div className="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl p-8 border border-gray-100 dark:border-gray-700 relative overflow-hidden group">
           {/* Decorative Background */}
           <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 to-purple-500"></div>
           <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl"></div>

           <div className="flex items-center justify-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center text-white mr-4">
                 <BrainCircuit size={32} />
              </div>
              <h2 className="text-4xl font-black text-gray-800 dark:text-white tracking-tight">Quiz Master</h2>
           </div>

           <div className="grid md:grid-cols-2 gap-8 relative z-10">
              {/* Subject Selection */}
              <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><BookOpen size={16}/> Subject</h3>
                  <div className="grid grid-cols-2 gap-2">
                      {SUBJECTS.map(sub => (
                          <button
                            key={sub}
                            onClick={() => setConfig({...config, subject: sub})}
                            className={`p-3 rounded-xl text-sm font-bold transition-all border-2 ${config.subject === sub ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300' : 'border-transparent bg-gray-100 dark:bg-slate-900 text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                          >
                              {sub}
                          </button>
                      ))}
                  </div>
                  {config.subject === 'Custom' && (
                      <input 
                        value={config.customSubject}
                        onChange={e => setConfig({...config, customSubject: e.target.value})}
                        placeholder="Enter topic..."
                        className="w-full p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border-2 border-blue-500 outline-none font-bold text-gray-800 dark:text-white"
                      />
                  )}
              </div>

              {/* Settings */}
              <div className="space-y-6">
                  <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4"><ListOrdered size={16}/> Questions: {config.count}</h3>
                      <input 
                        type="range" min="1" max="50" step="1"
                        value={config.count}
                        onChange={e => setConfig({...config, count: parseInt(e.target.value)})}
                        className="w-full accent-blue-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2 font-bold"><span>1</span><span>25</span><span>50</span></div>
                  </div>

                  <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4"><Clock size={16}/> Time: {config.time} min</h3>
                      <input 
                        type="range" min="1" max="60" step="1"
                        value={config.time}
                        onChange={e => setConfig({...config, time: parseInt(e.target.value)})}
                        className="w-full accent-purple-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-2 font-bold"><span>1m</span><span>30m</span><span>60m</span></div>
                  </div>

                  <div>
                      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2"><Settings size={16}/> Difficulty</h3>
                      <div className="flex bg-gray-100 dark:bg-slate-900 p-1 rounded-xl">
                          {['Easy', 'Medium', 'Hard'].map(d => (
                              <button
                                key={d}
                                onClick={() => setConfig({...config, difficulty: d})}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${config.difficulty === d ? 'bg-white dark:bg-slate-700 shadow-sm text-gray-800 dark:text-white' : 'text-gray-400'}`}
                              >
                                  {d}
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
           </div>

           <button 
             onClick={startGame}
             disabled={config.subject === 'Custom' && !config.customSubject}
             className="w-full mt-8 bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-4 rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
           >
             <Play fill="currentColor" size={20} /> Generate Quiz
           </button>
        </div>
      </div>
    );
  }

  if (gameState === 'loading') {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-slate-900">
         <div className="relative">
            <div className="w-20 h-20 border-8 border-blue-100 dark:border-slate-700 rounded-full"></div>
            <div className="w-20 h-20 border-8 border-blue-500 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
         </div>
         <p className="text-2xl font-black text-gray-800 dark:text-white mt-8 animate-pulse">Building Quiz...</p>
         <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Researching {config.subject}</p>
      </div>
    );
  }

  if (gameState === 'result') {
     return (
        <div className="h-full flex flex-col items-center justify-center p-6 animate-fadeIn bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] bg-fixed">
           <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[2rem] shadow-2xl text-center max-w-md w-full relative overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-50/50 dark:to-blue-900/10 pointer-events-none"></div>
               
               <div className="inline-flex p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-2xl text-yellow-500 mb-6 shadow-sm">
                 <Trophy size={48} className="animate-bounce" />
               </div>
               
               <h2 className="text-4xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">Quiz Complete!</h2>
               <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-6 tracking-tighter drop-shadow-sm">
                  {score}
               </div>
               
               <div className="flex justify-center gap-4 mb-8">
                  <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl flex-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">XP Earned</p>
                      <p className="text-xl font-black text-blue-500">+{Math.floor(score / 10)}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-slate-700 p-4 rounded-xl flex-1">
                      <p className="text-xs font-bold text-gray-400 uppercase">Accuracy</p>
                      <p className="text-xl font-black text-purple-500">{Math.round((score / (questions.length * 150)) * 100)}%</p>
                  </div>
               </div>

               <button 
                 onClick={() => setGameState('setup')}
                 className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
               >
                  <RefreshCcw size={20} /> Play Again
               </button>
           </div>
        </div>
     );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="h-full flex flex-col max-w-3xl mx-auto p-4 md:p-6 relative overflow-hidden">
       {/* Background Ambience */}
       <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 -z-10"></div>

       {/* Top Bar */}
       <div className="flex justify-between items-center mb-6 md:mb-10">
          <div className="flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-slate-700">
             <TimerIcon size={18} className={`${timeLeft < 5 ? 'text-red-500 animate-pulse' : 'text-blue-500'}`} />
             <span className={`font-black text-xl tabular-nums ${timeLeft < 5 ? 'text-red-500' : 'text-gray-700 dark:text-gray-200'}`}>{timeLeft}s</span>
          </div>

          <div className="flex items-center gap-2">
             <div className="h-2 w-24 md:w-32 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                ></div>
             </div>
             <span className="text-xs font-bold text-gray-400">{currentIndex + 1}/{questions.length}</span>
          </div>

          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-gray-100 dark:border-slate-700">
             <Zap size={18} className="text-yellow-400 fill-current" />
             <span className="font-black text-xl text-gray-700 dark:text-gray-200">{score}</span>
          </div>
       </div>

       {/* Game Area */}
       <div className="flex-1 flex flex-col items-center justify-center w-full max-w-xl mx-auto">
          
          {/* Question Card */}
          <TiltCard className="mb-8 w-full">
             <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-[2rem] shadow-2xl border-b-8 border-gray-100 dark:border-slate-700 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-purple-500"></div>
                <h3 className="text-2xl md:text-3xl font-black text-gray-800 dark:text-white leading-tight">
                   {currentQ?.question}
                </h3>
             </div>
          </TiltCard>

          {/* Options Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
             {currentQ?.options.map((opt, idx) => {
                let btnClass = "bg-white dark:bg-slate-800 border-b-4 border-gray-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:translate-y-[-2px]";
                let textClass = "text-gray-700 dark:text-gray-200";
                
                if (selectedOption !== null) {
                   if (idx === currentQ.correctIndex) {
                      btnClass = "bg-green-500 border-green-600 shadow-lg scale-[1.02] ring-4 ring-green-500/20";
                      textClass = "text-white";
                   } else if (idx === selectedOption) {
                      btnClass = "bg-red-500 border-red-600 opacity-90";
                      textClass = "text-white";
                   } else {
                      btnClass = "bg-gray-100 dark:bg-slate-800/50 border-transparent opacity-40 grayscale";
                   }
                }

                return (
                   <button 
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      disabled={selectedOption !== null}
                      className={`
                         relative p-6 rounded-2xl font-bold text-lg text-left transition-all duration-200 
                         flex items-center justify-between shadow-sm active:scale-95 group
                         ${btnClass}
                      `}
                   >
                      <span className={textClass}>{opt}</span>
                      {selectedOption !== null && idx === currentQ.correctIndex && (
                         <div className="bg-white/20 p-1 rounded-full">
                            <Check size={20} className="text-white" />
                         </div>
                      )}
                      {selectedOption !== null && idx === selectedOption && idx !== currentQ.correctIndex && (
                         <div className="bg-white/20 p-1 rounded-full">
                            <X size={20} className="text-white" />
                         </div>
                      )}
                   </button>
                );
             })}
          </div>

          {/* Explanation Toast */}
          {selectedOption !== null && (
             <div className="mt-8 animate-in slide-in-from-bottom-4 fade-in duration-300 w-full">
                <div className={`p-4 rounded-2xl flex items-start gap-3 shadow-lg ${isCorrect ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'}`}>
                   {isCorrect ? <Check size={24} className="mt-1 flex-shrink-0" /> : <X size={24} className="mt-1 flex-shrink-0" />}
                   <div>
                      <p className="font-black text-lg mb-1">{isCorrect ? 'Correct!' : 'Missed it!'}</p>
                      <p className="text-sm font-medium opacity-90">{currentQ?.explanation}</p>
                   </div>
                </div>
             </div>
          )}
       </div>
    </div>
  );
};
