
import React, { useState, useMemo, useEffect } from 'react';
import { FAQS } from '../constants';
import { 
  ChevronDown, 
  HelpCircle, 
  MessageCircle, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Loader2,
  X,
  ShieldCheck,
  Truck,
  Users,
  Backpack,
  ThumbsUp,
  ThumbsDown,
  Activity
} from 'lucide-react';
import { getLlamaAdvice } from '../services/geminiService';

const CATEGORY_ICONS: Record<string, any> = {
  'Herd': Users,
  'Logistics': Truck,
  'Equipment': Backpack,
  'Safety': ShieldCheck
};

export const FAQSection: React.FC = () => {
  useEffect(() => {
    console.log("FAQ Section v1.1 Deployment Verified");
  }, []);

  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | 'All'>('All');
  const [feedback, setFeedback] = useState<Record<number, 'up' | 'down'>>({});
  
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(FAQS.map(f => f.category));
    return ['All', ...Array.from(cats)];
  }, []);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter(faq => {
      const matchesSearch = 
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || faq.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    setIsAiLoading(true);
    setAiResponse(null);
    const response = await getLlamaAdvice(aiQuery);
    setAiResponse(response);
    setIsAiLoading(false);
  };

  return (
    <div className="space-y-12">
      {/* Header Info */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-midnight/5 text-gold rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-4 border border-midnight/10">
          <Activity size={10} className="animate-pulse" /> Trail Status: Active
        </div>
        <h2 className="text-5xl font-black text-stone-900 mb-6 tracking-tight">Trail Manual & FAQ</h2>
        <p className="text-stone-500 font-medium">Everything you need to know about packing with the herd in the Montana high country.</p>
      </div>

      {/* Search & Categories Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center bg-white p-6 rounded-[2.5rem] shadow-xl border border-stone-100">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-stone-300 w-5 h-5" />
          <input 
            type="text"
            placeholder="Search the field manual..."
            className="w-full bg-stone-50 border border-stone-100 pl-14 pr-6 py-4 rounded-2xl font-bold text-stone-900 focus:bg-white focus:border-gold outline-none transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap justify-center gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${
                activeCategory === cat 
                  ? 'bg-midnight text-white shadow-lg shadow-midnight/20' 
                  : 'bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Accordion Column */}
        <div className="lg:col-span-2 space-y-4">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => {
              const isOpen = openIndex === index;
              const Icon = CATEGORY_ICONS[faq.category] || HelpCircle;
              
              return (
                <div 
                  key={index} 
                  className={`group bg-white rounded-[2rem] border transition-all duration-300 overflow-hidden ${
                    isOpen 
                      ? 'border-gold/20 shadow-xl ring-4 ring-gold/5' 
                      : 'border-stone-100 hover:border-gold/10 shadow-sm'
                  }`}
                >
                  <button
                    onClick={() => toggleFAQ(index)}
                    className="w-full px-8 py-6 flex items-center justify-between text-left focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                        isOpen ? 'bg-midnight text-white shadow-lg shadow-midnight/20' : 'bg-stone-50 text-stone-400 group-hover:bg-midnight/5 group-hover:text-gold'
                      }`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div>
                        <span className={`text-lg font-black tracking-tight transition-colors block leading-tight ${
                          isOpen ? 'text-midnight' : 'text-stone-900'
                        }`}>
                          {faq.question}
                        </span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-stone-400 mt-1 block">{faq.category}</span>
                      </div>
                    </div>
                    <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : 'rotate-0'}`}>
                      <ChevronDown className={isOpen ? 'text-gold' : 'text-stone-300'} />
                    </div>
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <div className="px-8 pb-8 pl-16 md:pl-24 space-y-6">
                       <div className="bg-stone-50 p-6 rounded-2xl border border-stone-100 relative text-stone-600 font-medium leading-relaxed">
                        <MessageCircle className="absolute -left-2 top-4 w-4 h-4 text-stone-100 fill-stone-100" />
                        {faq.answer}
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-stone-50">
                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Knowledge Verified</span>
                        <div className="flex gap-2">
                          <button className="p-2 rounded-lg bg-stone-50 text-stone-400 hover:text-gold transition-colors">
                            <ThumbsUp size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-stone-100 flex flex-col items-center">
               <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center text-stone-200 mb-6"><Search size={32}/></div>
               <h3 className="text-xl font-black text-stone-400">No results found for "{searchQuery}"</h3>
            </div>
          )}
        </div>

        {/* AI Guide Column */}
        <div className="space-y-6">
          <div className="bg-stone-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl ring-1 ring-white/10">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Sparkles className="w-32 h-32" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shadow-lg"><Sparkles className="w-6 h-6 text-midnight"/></div>
                <h3 className="text-2xl font-black tracking-tight">AI Trail Guide</h3>
              </div>
              
              <p className="text-stone-400 text-sm font-medium leading-relaxed mb-8">
                Ask about Montana backcountry logistics. Our AI outfitter is ready.
              </p>

              <form onSubmit={handleAiSubmit} className="space-y-4">
                <textarea 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 font-medium text-sm text-white placeholder:text-stone-600 outline-none focus:border-gold/50 focus:bg-white/10 transition-all h-32 resize-none shadow-inner"
                  placeholder="e.g. Can llamas cross rivers in early June?"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                />
                <button 
                  disabled={isAiLoading || !aiQuery.trim()}
                  className="w-full bg-gold text-midnight py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-gold/80 disabled:opacity-50 transition-all shadow-lg active:scale-95"
                >
                  {isAiLoading ? <Loader2 className="animate-spin" /> : <><Sparkles size={14}/> Query Intel</>}
                </button>
              </form>

              {aiResponse && (
                <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-top-4 backdrop-blur-sm">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[9px] font-black uppercase text-gold tracking-[0.2em]">Intel Response</span>
                    <button onClick={() => setAiResponse(null)} className="text-white/20 hover:text-white transition-colors"><X size={14}/></button>
                  </div>
                  <p className="text-sm font-medium leading-relaxed italic text-stone-200">"{aiResponse}"</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="bg-stone-100 p-8 rounded-[3rem] border border-stone-200 shadow-sm text-center">
            <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mb-4">Need personalized help?</p>
            <a href="mailto:kevin.paul.brown@gmail.com" className="group flex items-center justify-center gap-2 text-stone-900 font-black text-sm hover:text-gold transition-colors">
              Contact Outfitter <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
