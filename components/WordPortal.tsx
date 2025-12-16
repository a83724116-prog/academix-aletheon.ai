
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { Search, Volume2, Book, Sparkles, Loader2, Feather, Layers, RotateCcw, ChevronLeft, ChevronRight, Eye, EyeOff, Heart, Star, Bookmark } from 'lucide-react';

interface WordData {
  word: string;
  meaning: string;
  pronunciation?: string;
  example?: string;
  origin?: string;
  sentence?: string; // from search result structure
  hindiTranslation?: string;
  source: 'daily' | 'search';
}

const TiltCard = ({ children, className = "" }: React.PropsWithChildren<{ className?: string }>) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rotateX = ((y - rect.height/2) / (rect.height/2)) * -8; 
    const rotateY = ((x - rect.width/2) / (rect.width/2)) * 8;
    setRotation({ x: rotateX, y: rotateY });
    setGlare({ x: (x / rect.width) * 100, y: (y / rect.height) * 100, opacity: 1 });
  };

  return (
    <div className="perspective-1000 w-full" style={{ perspective: '1000px' }}>
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setRotation({ x: 0, y: 0 }); setGlare(g => ({ ...g, opacity: 0 })); }}
        className={`relative transition-transform duration-100 ease-out transform-gpu ${className}`}
        style={{ transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)` }}
      >
        {children}
        <div 
            className="absolute inset-0 rounded-3xl pointer-events-none mix-blend-overlay transition-opacity duration-300"
            style={{ background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 80%)`, opacity: glare.opacity }}
        />
      </div>
    </div>
  );
};

export const WordPortal: React.FC = () => {
  const [mode, setMode] = useState<'explore' | 'flashcards' | 'liked'>('explore');
  const [dailyWord, setDailyWord] = useState<WordData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState<WordData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingDaily, setLoadingDaily] = useState(true);
  
  // Flashcard & Liked State
  const [deck, setDeck] = useState<WordData[]>([]);
  const [likedWords, setLikedWords] = useState<WordData[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Load Liked words from storage
  useEffect(() => {
    const saved = localStorage.getItem('liked_words');
    if (saved) {
        setLikedWords(JSON.parse(saved));
    }
  }, []);

  // Sync Liked words to storage
  useEffect(() => {
    localStorage.setItem('liked_words', JSON.stringify(likedWords));
  }, [likedWords]);

  useEffect(() => {
    loadDailyBatch();
  }, []);

  const loadDailyBatch = async () => {
    setLoadingDaily(true);
    try {
        // Fetch 1 hero word
        const data = await GeminiService.getDailyWord();
        const heroWord: WordData = { ...data, source: 'daily' };
        setDailyWord(heroWord);
        
        // Fetch batch of 20
        const batch = await GeminiService.getDailyWordBatch();
        const batchData = batch.map((b: any) => ({ ...b, source: 'daily' }));
        
        // Combine hero word with batch for the deck
        setDeck([heroWord, ...batchData]);
    } catch(e) { console.error(e); }
    finally { setLoadingDaily(false); }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!searchQuery.trim()) return;
    setLoading(true);
    setSearchResult(null);
    try {
        const res = await GeminiService.getWordMeaning(searchQuery);
        const wordData: WordData = { ...res, word: searchQuery, source: 'search' };
        setSearchResult(wordData);
        // Add to deck if not exists
        if (!deck.some(d => d.word.toLowerCase() === wordData.word.toLowerCase())) {
            setDeck(prev => [wordData, ...prev]);
        }
    } catch(e) { alert("Could not find word."); }
    finally { setLoading(false); }
  };

  const toggleLike = (word: WordData) => {
      const isLiked = likedWords.some(w => w.word.toLowerCase() === word.word.toLowerCase());
      if (isLiked) {
          setLikedWords(prev => prev.filter(w => w.word.toLowerCase() !== word.word.toLowerCase()));
      } else {
          setLikedWords(prev => [word, ...prev]);
      }
  };

  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  };

  // Flashcard Logic
  const nextCard = () => {
      setIsFlipped(false);
      setTimeout(() => setCardIndex(prev => (prev + 1) % deck.length), 200);
  };

  const prevCard = () => {
      setIsFlipped(false);
      setTimeout(() => setCardIndex(prev => (prev - 1 + deck.length) % deck.length), 200);
  };

  const renderFlashcards = () => {
      const currentCard = deck[cardIndex];
      if (!currentCard) return null;
      const isLiked = likedWords.some(w => w.word.toLowerCase() === currentCard.word.toLowerCase());

      return (
          <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in zoom-in duration-300">
              <div className="mb-8 flex items-center gap-4 w-full max-w-md justify-between">
                  <span className="bg-white dark:bg-slate-800 px-4 py-1 rounded-full text-sm font-bold shadow-sm text-gray-500">
                      Card {cardIndex + 1} / {deck.length}
                  </span>
                  <div className="h-2 flex-1 mx-4 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-pink-500 transition-all duration-300" 
                        style={{ width: `${((cardIndex + 1) / deck.length) * 100}%` }}
                      ></div>
                  </div>
              </div>

              {/* 3D Flip Container */}
              <div className="relative w-full max-w-md aspect-[3/4] perspective-1000 group cursor-pointer" onClick={() => setIsFlipped(!isFlipped)}>
                  <div className={`w-full h-full relative transition-all duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                      
                      {/* FRONT */}
                      <div className="absolute inset-0 backface-hidden">
                          <div className="w-full h-full bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-700 p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group-hover:border-pink-200 transition-colors">
                               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 to-rose-500"></div>
                               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-pink-50 dark:bg-pink-900/20 rounded-full blur-3xl"></div>
                               
                               <div className="absolute top-6 right-6 z-20">
                                   <button 
                                      onClick={(e) => { e.stopPropagation(); toggleLike(currentCard); }}
                                      className={`p-3 rounded-full transition-all ${isLiked ? 'bg-pink-100 text-pink-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                   >
                                       <Heart size={24} fill={isLiked ? "currentColor" : "none"} />
                                   </button>
                               </div>

                               <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Daily Vocab</span>
                               <h2 className="text-4xl md:text-5xl font-black text-slate-800 dark:text-white mb-6 capitalize leading-tight">{currentCard.word}</h2>
                               
                               <button 
                                 onClick={(e) => { e.stopPropagation(); speak(currentCard.word); }}
                                 className="p-4 bg-gray-50 dark:bg-slate-700 rounded-full text-pink-500 hover:scale-110 transition-transform shadow-sm mb-8"
                               >
                                  <Volume2 size={24} />
                               </button>

                               <div className="absolute bottom-10 flex items-center gap-2 text-gray-400 animate-pulse">
                                   <Eye size={16} />
                                   <span className="text-sm font-bold">Tap to reveal</span>
                               </div>
                          </div>
                      </div>

                      {/* BACK */}
                      <div className="absolute inset-0 backface-hidden rotate-y-180">
                          <div className="w-full h-full bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-[2.5rem] shadow-2xl p-8 flex flex-col relative overflow-hidden border border-slate-700">
                               <div className="absolute top-0 right-0 p-8 opacity-10"><Book size={100} /></div>
                               
                               <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-3xl font-black capitalize mb-1">{currentCard.word}</h3>
                                            <p className="text-pink-300 font-mono text-sm">{currentCard.pronunciation}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleLike(currentCard); }}
                                            className={`p-2 rounded-full ${isLiked ? 'text-pink-500' : 'text-gray-400'}`}
                                        >
                                           <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                                        </button>
                                    </div>

                                    <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar pr-2">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Meaning</span>
                                            <p className="text-xl font-medium leading-relaxed">{currentCard.meaning}</p>
                                        </div>

                                        {(currentCard.example || currentCard.sentence) && (
                                            <div className="bg-white/10 p-4 rounded-xl border border-white/10">
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-pink-200 block mb-1">Context</span>
                                                <p className="italic text-gray-200">"{currentCard.example || currentCard.sentence}"</p>
                                            </div>
                                        )}
                                        
                                        {currentCard.origin && (
                                            <div>
                                                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-1">Origin</span>
                                                <p className="text-sm text-gray-300">{currentCard.origin}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-center gap-2 text-gray-400">
                                         <EyeOff size={16} />
                                         <span className="text-xs font-bold">Tap to hide</span>
                                    </div>
                               </div>
                          </div>
                      </div>

                  </div>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-6 mt-10">
                  <button 
                    onClick={prevCard}
                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all text-slate-600 dark:text-gray-300 group"
                  >
                      <ChevronLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
                  </button>
                  <button 
                    onClick={() => {
                        // Shuffle animation
                        setIsFlipped(false);
                        setTimeout(() => {
                           setDeck(prev => [...prev].sort(() => Math.random() - 0.5));
                           setCardIndex(0);
                        }, 300);
                    }}
                    className="px-6 py-3 bg-white dark:bg-slate-800 rounded-2xl font-bold text-sm shadow-sm hover:shadow-md hover:text-pink-500 transition-all flex items-center gap-2"
                  >
                      <RotateCcw size={16} /> Shuffle
                  </button>
                  <button 
                    onClick={nextCard}
                    className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-sm hover:shadow-md hover:scale-105 transition-all text-slate-600 dark:text-gray-300 group"
                  >
                      <ChevronRight size={24} className="group-hover:translate-x-1 transition-transform" />
                  </button>
              </div>
          </div>
      );
  };

  const renderLiked = () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
          {likedWords.length === 0 ? (
             <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-50">
                 <Heart size={64} className="mb-4 text-gray-300"/>
                 <h3 className="text-xl font-bold">No liked words yet</h3>
                 <p>Star words in the flashcard mode to save them here.</p>
             </div>
          ) : (
             likedWords.map((word, i) => (
                 <div key={i} className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative group hover:shadow-md transition-all">
                     <button 
                        onClick={() => toggleLike(word)} 
                        className="absolute top-4 right-4 text-pink-500 hover:scale-110 transition-transform"
                     >
                         <Heart fill="currentColor" size={20} />
                     </button>
                     <h3 className="text-xl font-black capitalize mb-1 text-slate-800 dark:text-white">{word.word}</h3>
                     <p className="text-xs font-mono text-pink-500 mb-4">{word.pronunciation}</p>
                     <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-3">{word.meaning}</p>
                     <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg text-xs italic text-gray-500 dark:text-gray-400">
                         "{word.example || word.sentence}"
                     </div>
                 </div>
             ))
          )}
      </div>
  );

  return (
    <div className="h-full bg-slate-50 dark:bg-slate-900 p-6 md:p-10 overflow-y-auto animate-fadeIn">
       <div className="max-w-4xl mx-auto space-y-8">
          
          <header className="flex flex-col md:flex-row items-center justify-between gap-6">
             <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white mb-2 flex items-center gap-3">
                    <Feather className="text-pink-500" size={32} /> Word Portal
                </h1>
                <p className="text-slate-500">Expand your vocabulary & quiz yourself.</p>
             </div>

             <div className="flex bg-gray-200 dark:bg-slate-800 p-1 rounded-xl">
                 <button 
                   onClick={() => setMode('explore')}
                   className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${mode === 'explore' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 dark:text-gray-400'}`}
                 >
                    <Search size={16} /> Explore
                 </button>
                 <button 
                   onClick={() => setMode('flashcards')}
                   className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${mode === 'flashcards' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 dark:text-gray-400'}`}
                 >
                    <Layers size={16} /> Flashcards
                 </button>
                 <button 
                   onClick={() => setMode('liked')}
                   className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${mode === 'liked' ? 'bg-white shadow-sm text-pink-600' : 'text-gray-500 dark:text-gray-400'}`}
                 >
                    <Heart size={16} fill={mode === 'liked' ? "currentColor" : "none"} /> Liked ({likedWords.length})
                 </button>
             </div>
          </header>

          {mode === 'flashcards' ? (
              deck.length > 0 ? renderFlashcards() : (
                  <div className="h-96 flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-300 dark:border-slate-700 animate-in fade-in">
                      {loadingDaily ? (
                          <>
                             <Loader2 className="animate-spin text-pink-500 mb-4" size={48} />
                             <h3 className="text-xl font-bold">Curating your daily deck...</h3>
                          </>
                      ) : (
                          <>
                             <Layers size={64} className="text-gray-300 mb-4" />
                             <h3 className="text-xl font-bold text-slate-700 dark:text-white mb-2">Deck is empty</h3>
                             <p className="text-gray-500 max-w-sm mb-6">We couldn't load the words. Please check your connection.</p>
                             <button onClick={loadDailyBatch} className="bg-pink-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-pink-600 transition-colors">Retry</button>
                          </>
                      )}
                  </div>
              )
          ) : mode === 'liked' ? (
              renderLiked()
          ) : (
             <>
                {/* Daily Word Hero */}
                <section>
                    <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Sparkles size={14} className="text-yellow-500"/> Featured Word
                    </h2>
                    {loadingDaily ? (
                        <div className="h-64 flex items-center justify-center bg-white dark:bg-slate-800 rounded-3xl">
                            <Loader2 className="animate-spin text-pink-500" />
                        </div>
                    ) : dailyWord ? (
                        <TiltCard>
                            <div className="bg-gradient-to-br from-pink-500 to-rose-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-20"><Book size={120} /></div>
                                <div className="relative z-10">
                                    <div className="flex items-baseline gap-4 mb-2">
                                        <h3 className="text-5xl font-black tracking-tight capitalize">{dailyWord.word}</h3>
                                        <span className="text-pink-200 font-mono">{dailyWord.pronunciation}</span>
                                        <button onClick={() => speak(dailyWord.word)} className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"><Volume2 size={20}/></button>
                                        <button 
                                            onClick={() => toggleLike(dailyWord)} 
                                            className={`ml-auto p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors`}
                                        >
                                            <Heart size={20} fill={likedWords.some(w => w.word === dailyWord.word) ? "currentColor" : "none"} />
                                        </button>
                                    </div>
                                    <p className="text-xl font-medium text-pink-100 mb-6 max-w-lg">{dailyWord.meaning}</p>
                                    
                                    <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                                        <p className="italic text-lg">"{dailyWord.example}"</p>
                                    </div>
                                    {dailyWord.origin && <p className="mt-4 text-xs text-pink-200 opacity-80 uppercase tracking-wide">Origin: {dailyWord.origin}</p>}
                                </div>
                            </div>
                        </TiltCard>
                    ) : null}
                </section>

                {/* Dictionary Search */}
                <section className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-md rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-slate-700">
                   <form onSubmit={handleSearch} className="relative mb-8">
                       <Search className="absolute left-4 top-4 text-gray-400" />
                       <input 
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          placeholder="Look up a word to add to your deck..."
                          className="w-full pl-12 pr-4 py-4 bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 shadow-inner rounded-xl outline-none focus:ring-2 ring-pink-500/30 text-lg font-bold placeholder:text-gray-400 text-slate-800 dark:text-white"
                       />
                       <button type="submit" disabled={loading} className="absolute right-3 top-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-lg font-bold">
                          {loading ? <Loader2 className="animate-spin" size={18}/> : 'Search'}
                       </button>
                   </form>

                   {searchResult && (
                       <div className="animate-in slide-in-from-bottom-4">
                           <div className="flex items-center gap-4 mb-4">
                              <h3 className="text-3xl font-black text-slate-800 dark:text-white capitalize">{searchResult.word}</h3>
                              <button onClick={() => speak(searchResult.word)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full"><Volume2 size={20}/></button>
                              <button onClick={() => toggleLike(searchResult)} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full text-pink-500">
                                  <Heart size={20} fill={likedWords.some(w => w.word === searchResult.word) ? "currentColor" : "none"} />
                              </button>
                              {searchResult.hindiTranslation && <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-bold">{searchResult.hindiTranslation}</span>}
                              <span className="ml-auto text-xs font-bold text-green-500 flex items-center gap-1"><Layers size={14}/> Added to Deck</span>
                           </div>
                           
                           <div className="space-y-6">
                              <div>
                                  <h4 className="font-bold text-gray-400 text-xs uppercase mb-1">Definition</h4>
                                  <p className="text-lg text-slate-700 dark:text-slate-200 leading-relaxed">{searchResult.meaning}</p>
                              </div>
                              
                              {searchResult.sentence && (
                                  <div className="pl-4 border-l-4 border-pink-500 bg-pink-50 dark:bg-pink-900/10 p-4 rounded-r-xl">
                                      <p className="italic text-slate-600 dark:text-slate-300">"{searchResult.sentence}"</p>
                                  </div>
                              )}
                           </div>
                       </div>
                   )}
                </section>
             </>
          )}
       </div>
    </div>
  );
};
