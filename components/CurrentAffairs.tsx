
import React, { useState, useEffect, useRef } from 'react';
import { GeminiService } from '../services/geminiService';
import { Newspaper, Globe, Cpu, Beaker, Trophy, Briefcase, ExternalLink, Loader2, Search, RefreshCw, Zap, Clock, ArrowRight, Bookmark, Star, X, PlayCircle, Volume2, Radio } from 'lucide-react';

const CATEGORIES = [
  { id: 'world', label: 'World', icon: Globe, query: 'latest important world news', color: 'from-blue-500 to-cyan-500' },
  { id: 'technology', label: 'Tech', icon: Cpu, query: 'latest technology and ai news', color: 'from-violet-500 to-purple-500' },
  { id: 'science', label: 'Science', icon: Beaker, query: 'latest scientific discoveries and space news', color: 'from-emerald-500 to-teal-500' },
  { id: 'business', label: 'Business', icon: Briefcase, query: 'latest global business and stock market news', color: 'from-amber-500 to-orange-500' },
  { id: 'sports', label: 'Sports', icon: Trophy, query: 'latest major sports events and results', color: 'from-red-500 to-pink-500' },
];

interface NewsItem {
  headline: string;
  summary: string;
  category: string;
  time: string;
  impact: 'High' | 'Medium' | 'Low';
  sourceName?: string;
  url?: string;
  imageKeyword?: string;
}

// --- NEWS MODAL COMPONENT ---
const NewsReaderModal: React.FC<{ item: NewsItem; onClose: () => void; imageSrc: string }> = ({ item, onClose, imageSrc }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div 
                className="bg-white dark:bg-slate-900 w-full max-w-4xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col relative border border-gray-200 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full transition-colors backdrop-blur-sm"
                >
                    <X size={24} />
                </button>

                {/* Hero Image */}
                <div className="h-64 md:h-80 w-full relative shrink-0">
                     <img src={imageSrc} alt={item.headline} className="w-full h-full object-cover" />
                     <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                     <div className="absolute bottom-6 left-6 right-6">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wider bg-white/20 backdrop-blur-md border border-white/20 mb-3`}>
                            {item.category}
                        </span>
                        <h2 className="text-2xl md:text-4xl font-black text-white leading-tight shadow-sm">
                            {item.headline}
                        </h2>
                     </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-white dark:bg-slate-900">
                     <div className="flex items-center gap-4 mb-8 text-sm text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-slate-800 pb-4">
                        <span className="flex items-center gap-1"><Clock size={14}/> {item.time}</span>
                        <span className="flex items-center gap-1 font-bold text-indigo-500"><Globe size={14}/> {item.sourceName || 'Global Source'}</span>
                        <button onClick={() => {
                             const u = new SpeechSynthesisUtterance(item.summary);
                             window.speechSynthesis.speak(u);
                        }} className="ml-auto flex items-center gap-1 hover:text-indigo-500 transition-colors"><Volume2 size={16}/> Listen</button>
                     </div>

                     <div className="prose dark:prose-invert max-w-none">
                         <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300 font-medium first-letter:text-5xl first-letter:font-black first-letter:text-indigo-600 first-letter:mr-3 first-letter:float-left">
                            {item.summary}
                         </p>
                         
                         <div className="mt-8 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                             <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                                <Zap size={18} className="text-yellow-500" /> AI Context
                             </h4>
                             <p className="text-sm text-slate-600 dark:text-slate-400">
                                This event is rated as <strong>{item.impact} Impact</strong>. It significantly affects current trends in {item.category}.
                             </p>
                         </div>
                     </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">Close</button>
                    {item.url && (
                        <a 
                            href={item.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                        >
                            Read Full Article <ExternalLink size={18}/>
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN CARD COMPONENT ---
const NewsCard: React.FC<{ item: NewsItem; index: number; onClick: () => void }> = ({ item, index, onClick }) => {
  // Enhanced Prompt for Pollinations.ai with FLUX model
  const keyword = item.imageKeyword || item.category + " news photography";
  const imageSrc = `https://image.pollinations.ai/prompt/${encodeURIComponent(keyword + ", award winning news photography, cinematic lighting, highly detailed, 4k, realistic texture")}?width=800&height=600&nologo=true&seed=${index}&model=flux`;

  return (
    <div 
        onClick={onClick}
        className="group relative h-96 rounded-3xl overflow-hidden cursor-pointer shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-slate-900"
    >
      {/* Background Image */}
      <img 
        src={imageSrc} 
        alt={item.headline} 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90"
        loading="lazy"
      />
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity"></div>
      
      {/* Content */}
      <div className="absolute inset-0 p-6 flex flex-col justify-end">
         <div className="mb-auto transform translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
             <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-white border border-white/10`}>
                 {item.category}
             </span>
         </div>

         <div className="space-y-2">
            <h3 className="text-xl font-black text-white leading-tight line-clamp-3 drop-shadow-md group-hover:text-indigo-200 transition-colors">
                {item.headline}
            </h3>
            <div className="flex items-center gap-3 text-xs text-gray-300 font-medium border-t border-white/20 pt-3 mt-2">
                <span className="flex items-center gap-1"><Clock size={12}/> {item.time}</span>
                <span className="flex items-center gap-1"><Globe size={12}/> {item.sourceName}</span>
            </div>
         </div>
         
         <div className="absolute top-4 right-4 bg-white/10 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity border border-white/10 text-white">
            <ArrowRight size={20} />
         </div>
      </div>
    </div>
  );
};

// --- HERO COMPONENT ---
const HeroNews: React.FC<{ item: NewsItem; onClick: () => void }> = ({ item, onClick }) => {
    const keyword = item.imageKeyword || "breaking news photography";
    const imageSrc = `https://image.pollinations.ai/prompt/${encodeURIComponent(keyword + ", hyper-realistic, dramatic news lighting, 8k resolution, cinematic")}?width=1200&height=800&nologo=true&model=flux`;

    return (
        <div onClick={onClick} className="relative w-full h-[500px] rounded-[2.5rem] overflow-hidden cursor-pointer group mb-10 shadow-2xl ring-4 ring-white/10 bg-slate-900">
            <img src={imageSrc} alt={item.headline} className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 opacity-90" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90"></div>
            
            <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-xs font-black uppercase tracking-widest rounded-full mb-4 animate-pulse shadow-lg shadow-red-600/50">
                    <Radio size={14} fill="currentColor" className="animate-ping absolute opacity-50"/> 
                    <Radio size={14} fill="currentColor" /> LIVE BREAKING
                </span>
                <h1 className="text-3xl md:text-5xl font-black text-white mb-4 leading-tight max-w-4xl drop-shadow-2xl">
                    {item.headline}
                </h1>
                <p className="text-gray-200 text-lg max-w-2xl line-clamp-2 mb-6 font-medium">
                    {item.summary}
                </p>
                <div className="flex items-center gap-4">
                    <button className="bg-white text-black px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition-colors">
                        Read Full Story <ArrowRight size={18}/>
                    </button>
                    <span className="text-white/80 text-sm font-bold flex items-center gap-2">
                        <Clock size={16}/> {item.time}
                    </span>
                </div>
            </div>
        </div>
    );
};

export const CurrentAffairs: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState(CATEGORIES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedNews, setSelectedNews] = useState<NewsItem | null>(null);

  // Initial Fetch
  useEffect(() => {
    const category = CATEGORIES.find(c => c.id === activeCategory);
    if (category) {
      setSearchQuery('');
      fetchNews(category.query);
    }
  }, [activeCategory]);

  const fetchNews = async (query: string) => {
    setLoading(true);
    setNewsItems([]);
    
    try {
      const { text } = await GeminiService.getCurrentAffairs(query);
      try {
          // Attempt to clean markdown if present
          const cleanText = text?.replace(/```json/g, '').replace(/```/g, '').trim() || '[]';
          const parsed = JSON.parse(cleanText);
          if (Array.isArray(parsed)) {
              setNewsItems(parsed);
          }
      } catch (e) {
          console.warn("JSON Parse failed", e);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveCategory('search');
      fetchNews(searchQuery);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 dark:bg-slate-900 overflow-hidden animate-fadeIn relative">
      
      {/* Modal */}
      {selectedNews && (
          <NewsReaderModal 
            item={selectedNews} 
            onClose={() => setSelectedNews(null)}
            imageSrc={`https://image.pollinations.ai/prompt/${encodeURIComponent((selectedNews.imageKeyword || selectedNews.category) + ", award winning photography, 8k")}?width=1200&height=800&nologo=true&model=flux`}
          />
      )}

      {/* Header */}
      <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-200 dark:border-slate-800 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 z-20 sticky top-0">
         <div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-white flex items-center gap-3">
               <Globe className="text-indigo-500" /> Global Insight
            </h1>
         </div>

         <div className="flex w-full md:w-auto gap-3 items-center">
            <div className="hidden md:flex gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl">
                {CATEGORIES.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeCategory === cat.id ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
               <Search className="absolute left-3 top-3 text-gray-400" size={16} />
               <input 
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Search topic..." 
                 className="w-full pl-10 pr-4 py-2.5 bg-gray-100 dark:bg-slate-800 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold text-slate-800 dark:text-white"
               />
            </form>
            <button 
              onClick={() => {
                  const cat = CATEGORIES.find(c => c.id === activeCategory);
                  fetchNews(searchQuery || cat?.query || 'latest news');
              }}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-500/30"
            >
               <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
         <div className="max-w-7xl mx-auto pb-20">
            {loading ? (
                <div className="h-[60vh] flex flex-col items-center justify-center">
                    <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-6" />
                    <p className="text-2xl font-black text-slate-800 dark:text-white animate-pulse">Scanning Global Feeds...</p>
                    <p className="text-slate-500 mt-2">Connecting to live sources & generating realistic visuals</p>
                </div>
            ) : newsItems.length > 0 ? (
                <div className="animate-in slide-in-from-bottom-8 duration-700">
                    {/* Hero Item (First item) */}
                    <HeroNews item={newsItems[0]} onClick={() => setSelectedNews(newsItems[0])} />
                    
                    {/* Masonry Grid for the rest */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                        {newsItems.slice(1).map((item, idx) => (
                            <NewsCard 
                                key={idx} 
                                item={item} 
                                index={idx} 
                                onClick={() => setSelectedNews(item)}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="text-center py-20 opacity-50">
                    <Newspaper size={64} className="mx-auto mb-4" />
                    <p className="text-xl font-bold">No news found for this topic.</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};
