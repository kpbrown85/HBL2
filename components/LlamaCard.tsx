
import React from 'react';
import { Llama } from '../types';
import { Shield, Target, Compass, Heart, Weight } from 'lucide-react';

const SpecialtyIcon = ({ type }: { type: Llama['specialty'] }) => {
  switch (type) {
    case 'Lead Llama': return <Shield className="w-4 h-4" />;
    case 'Hunting': return <Target className="w-4 h-4" />;
    case 'Backpacking': return <Compass className="w-4 h-4" />;
    case 'Gentle Soul': return <Heart className="w-4 h-4" />;
    default: return null;
  }
};

export const LlamaCard: React.FC<{ llama: Llama }> = ({ llama }) => {
  return (
    <div className="bg-white rounded-[2rem] overflow-hidden shadow-lg border border-stone-100 transition-all duration-500 hover:-translate-y-3 hover:scale-[1.03] hover:shadow-2xl group">
      <div className="h-64 overflow-hidden relative bg-stone-100">
        <img 
          src={llama.imageUrl} 
          alt={llama.name} 
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-stone-900/10 group-hover:bg-transparent transition-colors duration-500" />
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-2xl font-black text-stone-900 group-hover:text-gold transition-colors">{llama.name}</h3>
            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{llama.age} years old</p>
          </div>
        </div>
        <p className="text-stone-600 mb-5 italic leading-relaxed line-clamp-2">"{llama.personality}"</p>
        
        <div className="grid grid-cols-2 gap-4 border-t border-stone-50 pt-5">
          <div className="flex flex-col">
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Capacity</span>
            <div className="flex items-center gap-2">
              <Weight className="w-4 h-4 text-gold" />
              <span className="font-black text-stone-900 text-lg">{llama.maxLoad} lbs</span>
            </div>
          </div>
          <div className="flex flex-col border-l border-stone-100 pl-4">
            <span className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mb-1">Specialty</span>
            <div className="flex items-center gap-2 text-stone-900 font-bold">
              <span className="text-gold"><SpecialtyIcon type={llama.specialty} /></span>
              <span className="text-sm truncate">{llama.specialty}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
