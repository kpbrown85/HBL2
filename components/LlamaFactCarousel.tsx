import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { LLAMA_FACTS } from '../constants';
import { cn } from '../lib/utils';

export const LlamaFactCarousel: React.FC<{ className?: string }> = ({ className }) => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % LLAMA_FACTS.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const next = () => setIndex((prev) => (prev + 1) % LLAMA_FACTS.length);
  const prev = () => setIndex((prev) => (prev - 1 + LLAMA_FACTS.length) % LLAMA_FACTS.length);

  return (
    <div className={cn("relative overflow-hidden bg-midnight/40 backdrop-blur-md border-y border-white/5 py-4", className)}>
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between gap-8 group">
        <button 
          onClick={prev}
          className="p-2 text-paper/30 hover:text-gold transition-colors opacity-0 group-hover:opacity-100"
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex-1 flex items-center justify-center gap-4 min-h-[40px]">
          <div className="w-8 h-8 bg-gold/10 text-gold rounded-full flex items-center justify-center shrink-0">
            <Sparkles size={14} className="animate-pulse" />
          </div>
          
          <div className="relative flex-1 max-w-2xl overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="text-center"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-gold/60 block mb-1">
                  Did You Know?
                </span>
                <p className="text-paper/90 text-sm md:text-base font-medium italic leading-tight">
                  "{LLAMA_FACTS[index]}"
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="w-8 h-8 opacity-0" /> {/* Spacer for balance */}
        </div>

        <button 
          onClick={next}
          className="p-2 text-paper/30 hover:text-gold transition-colors opacity-0 group-hover:opacity-100"
        >
          <ChevronRight size={16} />
        </button>
      </div>
      
      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 h-[1px] bg-gold/20 w-full overflow-hidden">
        <motion.div 
          key={index}
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 8, ease: "linear" }}
          className="h-full bg-gold/60 w-full"
        />
      </div>
    </div>
  );
};
