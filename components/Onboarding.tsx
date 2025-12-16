
import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, X, Check } from 'lucide-react';

interface Step {
  target: string; // ID of the target element
  title: string;
  message: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const STEPS: Step[] = [
  { target: 'nav-dashboard', title: 'Welcome to EduCompanion!', message: "I'm your AI assistant. Let's take a quick tour of your new intelligent workspace.", position: 'right' },
  { target: 'nav-periodic', title: 'Periodic Table', message: "Explore the elements in our interactive 3D Periodic Table. Tap any element for deep insights.", position: 'right' },
  { target: 'nav-news', title: 'Global News', message: "Stay updated with real-time, AI-curated news from around the world.", position: 'right' },
  { target: 'nav-mentor', title: 'AI Mentor', message: "Stuck on a problem? Chat with me here anytime for instant academic support.", position: 'right' },
  { target: 'nav-tracker', title: 'Study Analytics', message: "Track your progress and get AI-generated study habits analysis.", position: 'right' },
];

export const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('onboarding_complete');
    if (!hasSeenOnboarding) {
      // Small delay to ensure rendering
      setTimeout(() => setIsVisible(true), 1000);
    }
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    const updatePosition = () => {
      const step = STEPS[currentStep];
      const element = document.getElementById(step.target);
      if (element) {
        setTargetRect(element.getBoundingClientRect());
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [currentStep, isVisible]);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      finishTour();
    }
  };

  const finishTour = () => {
    setIsVisible(false);
    localStorage.setItem('onboarding_complete', 'true');
  };

  if (!isVisible || !targetRect) return null;

  const step = STEPS[currentStep];

  // Calculate Popover Position
  let popoverStyle: React.CSSProperties = {};
  const spacing = 16;
  
  if (step.position === 'right') {
    popoverStyle = {
      left: targetRect.right + spacing,
      top: targetRect.top + (targetRect.height / 2) - 80, // rough center vertical alignment
    };
  } else if (step.position === 'bottom') {
    popoverStyle = {
      left: targetRect.left + (targetRect.width / 2) - 150,
      top: targetRect.bottom + spacing,
    };
  }

  // Ensure it stays on screen (basic clamping)
  if (window.innerWidth < 768) {
      // Mobile override: Center on screen bottom
      popoverStyle = {
          position: 'fixed',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          top: 'auto'
      };
  }

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Dark Overlay with cutout effect simulated via separate divs or just highlight ring */}
      <div 
         className="absolute transition-all duration-300 ease-in-out border-4 border-indigo-500 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] box-content"
         style={{
            left: targetRect.left,
            top: targetRect.top,
            width: targetRect.width,
            height: targetRect.height,
         }}
      />

      {/* Message Card */}
      <div 
        className="absolute pointer-events-auto bg-white dark:bg-slate-800 p-0 rounded-2xl shadow-2xl w-80 animate-in zoom-in slide-in-from-bottom-5 duration-300 flex flex-col overflow-hidden"
        style={window.innerWidth >= 768 ? popoverStyle : { bottom: 20, left: '5%', right: '5%', width: 'auto' }}
      >
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-full">
                <Sparkles className="text-white" size={20} />
             </div>
             <span className="font-bold text-white">AI Assistant</span>
             <button onClick={finishTour} className="ml-auto text-white/70 hover:text-white"><X size={18}/></button>
        </div>
        
        <div className="p-5">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-2">{step.title}</h3>
            <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed mb-6">
                {step.message}
            </p>
            
            <div className="flex justify-between items-center">
                <div className="flex gap-1">
                    {STEPS.map((_, i) => (
                        <div key={i} className={`h-1.5 rounded-full transition-all ${i === currentStep ? 'w-6 bg-indigo-500' : 'w-1.5 bg-gray-200 dark:bg-slate-700'}`} />
                    ))}
                </div>
                <button 
                  onClick={handleNext}
                  className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                >
                  {currentStep === STEPS.length - 1 ? 'Get Started' : 'Next'} 
                  {currentStep === STEPS.length - 1 ? <Check size={14}/> : <ArrowRight size={14} />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
