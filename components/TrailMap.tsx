
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Mountain, Info, ChevronRight, Compass } from 'lucide-react';
import { TRAILHEADS } from '../constants';
import { Trail } from '../types';

export const TrailMap: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<Trail['region'] | 'All'>('All');
  const [selectedTrail, setSelectedTrail] = useState<Trail | null>(null);

  const regions: (Trail['region'] | 'All')[] = ['All', 'Helena', 'Butte', 'Bozeman', 'Missoula'];
  
  const filteredTrails = selectedRegion === 'All' 
    ? TRAILHEADS 
    : TRAILHEADS.filter(t => t.region === selectedRegion);

  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 mb-20">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-xl">
                <Compass size={24} />
              </div>
              <span className="text-green-800 font-black text-xs uppercase tracking-[0.4em]">Expedition Planning</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-black tracking-tighter text-stone-900 leading-[0.9]">
              Interactive <br/> <span className="text-stone-300 italic">Trail Map</span>
            </h2>
          </div>
          
          <div className="flex flex-wrap gap-2 p-2 bg-stone-50 rounded-[2rem] border border-stone-100">
            {regions.map(region => (
              <button
                key={region}
                onClick={() => {
                  setSelectedRegion(region);
                  setSelectedTrail(null);
                }}
                className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${
                  selectedRegion === region 
                    ? 'bg-stone-900 text-white shadow-xl scale-105' 
                    : 'text-stone-400 hover:bg-stone-100'
                }`}
              >
                {region}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Trail List */}
          <div className="lg:col-span-4 space-y-4 max-h-[600px] overflow-y-auto pr-4 custom-scrollbar">
            <AnimatePresence mode="popLayout">
              {filteredTrails.map((trail) => (
                <motion.button
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={trail.id}
                  onClick={() => setSelectedTrail(trail)}
                  className={`w-full text-left p-6 rounded-[2rem] border transition-all group ${
                    selectedTrail?.id === trail.id 
                      ? 'bg-green-800 border-green-800 text-white shadow-2xl shadow-green-900/20' 
                      : 'bg-white border-stone-100 text-stone-900 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                        selectedTrail?.id === trail.id ? 'text-green-200' : 'text-stone-400'
                      }`}>
                        {trail.region} • {trail.difficulty}
                      </div>
                      <h3 className="text-xl font-black tracking-tight">{trail.name}</h3>
                    </div>
                    <ChevronRight className={`transition-transform duration-500 ${
                      selectedTrail?.id === trail.id ? 'translate-x-1 opacity-100' : 'opacity-0'
                    }`} />
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Map / Detail View */}
          <div className="lg:col-span-8 h-[600px] relative rounded-[3rem] overflow-hidden bg-stone-50 border border-stone-100 group shadow-inner">
            <AnimatePresence mode="wait">
              {selectedTrail ? (
                <motion.div
                  key={selectedTrail.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0"
                >
                  <img 
                    src={selectedTrail.imageUrl} 
                    alt={selectedTrail.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  <div className="absolute bottom-12 left-12 right-12">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="px-4 py-1.5 bg-green-500 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
                        {selectedTrail.difficulty}
                      </div>
                      <div className="px-4 py-1.5 bg-white/20 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">
                        {selectedTrail.bestFor}
                      </div>
                    </div>
                    <h3 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 leading-none">
                      {selectedTrail.name}
                    </h3>
                    <p className="text-white/70 text-lg font-medium max-w-2xl leading-relaxed mb-8">
                      {selectedTrail.description}
                    </p>
                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-3 text-white">
                        <MapPin size={20} className="text-green-400" />
                        <span className="text-sm font-black tracking-widest uppercase">
                          {selectedTrail.coordinates.lat.toFixed(4)}° N, {Math.abs(selectedTrail.coordinates.lng).toFixed(4)}° W
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-24 h-24 bg-stone-100 rounded-full flex items-center justify-center mb-8 text-stone-300">
                    <MapPin size={48} />
                  </div>
                  <h3 className="text-2xl font-black text-stone-900 mb-4">Select a Trailhead</h3>
                  <p className="text-stone-400 font-medium max-w-sm">
                    Explore our curated list of llama-friendly routes across the Montana high country.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
};
