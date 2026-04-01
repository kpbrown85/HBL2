import React, { useState, useRef, useEffect } from 'react';
import { getHighCountryAdvice, AIScoutResponse } from '../services/geminiService';
import { Mountain, Search, Loader2, ExternalLink, ShieldAlert, MapPin, Wind, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export const HighCountryAIScout: React.FC = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState<AIScoutResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const result = await getHighCountryAdvice(query);
      setResponse(result);
    } catch (err) {
      setError("The high country is currently unreachable. Please try again soon.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (response && scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [response]);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-midnight rounded-[3rem] p-8 md:p-16 shadow-2xl border border-white/10 relative overflow-hidden group">
        {/* Background Accents */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
          <Mountain size={400} className="absolute -bottom-20 -right-20 rotate-12" />
          <Wind size={300} className="absolute -top-20 -left-20 -rotate-12" />
        </div>

        <div className="relative z-10">
          <header className="text-center mb-12">
            <div className="w-16 h-16 bg-gold/20 text-gold rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-gold/10">
              <ShieldAlert size={32} />
            </div>
            <h3 className="text-4xl font-black text-paper tracking-tighter mb-4">High Country AI Scout</h3>
            <p className="text-paper/60 font-medium">Real-time trail conditions, weather intel, and llama packing safety.</p>
          </header>

          <form onSubmit={handleSearch} className="relative mb-12">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about trail conditions, weather, or gear..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-paper placeholder:text-paper/30 focus:outline-none focus:ring-2 focus:ring-gold/50 transition-all text-lg font-medium pr-20"
            />
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-4 bg-gold text-midnight rounded-xl hover:bg-gold/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
              {isLoading ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
            </button>
          </form>

          <AnimatePresence mode="wait">
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col items-center gap-4 py-12"
              >
                <div className="flex gap-2">
                  <div className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-3 h-3 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-gold font-black uppercase tracking-[0.3em] text-[10px]">Scouting the Peaks...</p>
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-center font-medium"
              >
                {error}
              </motion.div>
            )}

            {response && (
              <motion.div
                ref={scrollRef}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8"
              >
                <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
                  <div className="prose prose-invert max-w-none">
                    <p className="text-paper/90 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                      {response.text}
                    </p>
                  </div>

                  {response.sources && response.sources.length > 0 && (
                    <div className="mt-12 pt-8 border-t border-white/10">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gold mb-6 flex items-center gap-2">
                        <Info size={12} /> Intelligence Sources
                      </h4>
                      <div className="flex flex-wrap gap-4">
                        {response.sources.map((source, idx) => (
                          <a
                            key={idx}
                            href={source.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-paper/60 hover:text-gold hover:border-gold/30 transition-all"
                          >
                            {source.title.length > 30 ? source.title.substring(0, 30) + '...' : source.title}
                            <ExternalLink size={10} />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                    <MapPin size={24} className="text-gold" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-paper/40">Terrain Check</span>
                    <p className="text-xs font-bold text-paper/80">Verified Trail Data</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                    <Wind size={24} className="text-gold" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-paper/40">Atmospherics</span>
                    <p className="text-xs font-bold text-paper/80">Live Weather Intel</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center gap-3">
                    <ShieldAlert size={24} className="text-gold" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-paper/40">Safety Protocol</span>
                    <p className="text-xs font-bold text-paper/80">Llama-Safe Routes</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
