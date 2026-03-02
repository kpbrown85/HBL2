
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Calendar, User, ChevronRight, ArrowRight } from 'lucide-react';
import { BLOG_ENTRIES } from '../constants';
import { BlogEntry } from '../types';

export const BlogSection: React.FC = () => {
  const [selectedEntry, setSelectedEntry] = useState<BlogEntry | null>(null);

  return (
    <section className="py-32 bg-stone-50 overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-xl">
                <BookOpen size={24} />
              </div>
              <span className="text-stone-400 font-black text-xs uppercase tracking-[0.4em]">Expedition Logs</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-stone-900 leading-[0.9]">
              Field <br/> <span className="text-stone-300 italic">Reports</span>
            </h2>
          </div>
          
          <p className="text-stone-400 font-medium max-w-sm text-lg leading-relaxed">
            Real stories from the Montana high country. Discover what it's like to trek with our elite pack strings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {BLOG_ENTRIES.map((entry) => (
            <motion.div
              whileHover={{ y: -10 }}
              key={entry.id}
              onClick={() => setSelectedEntry(entry)}
              className="group cursor-pointer"
            >
              <div className="relative aspect-[16/10] rounded-[3rem] overflow-hidden mb-8 shadow-2xl border border-stone-100">
                <img 
                  src={entry.imageUrl} 
                  alt={entry.title}
                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors" />
                <div className="absolute top-8 left-8">
                  <div className="px-6 py-2 bg-white/20 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                    {entry.date}
                  </div>
                </div>
              </div>
              
              <div className="px-4">
                <div className="flex items-center gap-4 mb-4 text-stone-400 font-black text-[10px] uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <User size={14} /> {entry.author}
                  </div>
                  <div className="w-1 h-1 bg-stone-300 rounded-full" />
                  <div className="flex items-center gap-2">
                    <Calendar size={14} /> {entry.date}
                  </div>
                </div>
                <h3 className="text-3xl font-black tracking-tight text-stone-900 mb-4 group-hover:text-green-800 transition-colors">
                  {entry.title}
                </h3>
                <p className="text-stone-500 font-medium text-lg leading-relaxed mb-6">
                  {entry.excerpt}
                </p>
                <div className="flex items-center gap-2 text-green-800 font-black text-xs uppercase tracking-widest">
                  Read Full Report <ArrowRight size={16} className="transition-transform group-hover:translate-x-2" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Blog Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-stone-900/90 backdrop-blur-xl flex items-center justify-center p-6 lg:p-12"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white w-full max-w-5xl max-h-full rounded-[4rem] overflow-hidden flex flex-col shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="relative h-96 shrink-0">
                <img 
                  src={selectedEntry.imageUrl} 
                  alt={selectedEntry.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <button 
                  onClick={() => setSelectedEntry(null)}
                  className="absolute top-8 right-8 w-12 h-12 bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-white/40 transition-all"
                >
                  <ChevronRight className="rotate-90" />
                </button>
                <div className="absolute bottom-12 left-12 right-12">
                  <h2 className="text-5xl font-black text-white tracking-tighter leading-none">
                    {selectedEntry.title}
                  </h2>
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-12 lg:p-20 custom-scrollbar">
                <div className="flex items-center gap-6 mb-12 text-stone-400 font-black text-xs uppercase tracking-widest">
                  <div className="flex items-center gap-2">
                    <User size={16} className="text-green-600" /> {selectedEntry.author}
                  </div>
                  <div className="w-1.5 h-1.5 bg-stone-200 rounded-full" />
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-green-600" /> {selectedEntry.date}
                  </div>
                </div>
                <div className="prose prose-stone prose-2xl max-w-none text-stone-600 font-medium leading-relaxed">
                  {selectedEntry.content}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
