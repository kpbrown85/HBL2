
import React, { useState } from 'react';
import { GEAR_ITEMS } from '../constants';
import { GearItem } from '../types';
import { Backpack, Target, Mountain } from 'lucide-react';

export const GearSection: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'backpacking' | 'hunting'>('all');

  const filteredGear = GEAR_ITEMS.filter(item => 
    filter === 'all' || item.category === filter || item.category === 'both'
  );

  const FilterButton = ({ type, label, icon: Icon }: { type: typeof filter, label: string, icon: any }) => (
    <button
      onClick={() => setFilter(type)}
      className={`flex items-center gap-2 px-8 py-4 rounded-full font-bold transition-all border-2 ${
        filter === type 
          ? 'bg-green-800 text-white border-green-800 shadow-xl shadow-green-900/20' 
          : 'bg-white text-stone-500 border-stone-100 hover:border-green-200 hover:text-green-700'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="space-y-16">
      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4">
        <FilterButton type="all" label="All Gear" icon={Mountain} />
        <FilterButton type="backpacking" label="Backpacking" icon={Backpack} />
        <FilterButton type="hunting" label="Hunting" icon={Target} />
      </div>

      {/* Gear Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {filteredGear.map((item) => (
          <div 
            key={item.id} 
            className="bg-white p-8 rounded-[2.5rem] border border-stone-100 hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-full"
          >
            {/* Category Badge */}
            <div className="absolute top-6 right-6">
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full ${
                item.category === 'both' ? 'bg-stone-100 text-stone-500' : 
                item.category === 'backpacking' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
              }`}>
                {item.category}
              </span>
            </div>

            <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-700 mb-6 group-hover:bg-green-800 group-hover:text-white transition-all duration-500">
              {item.icon}
            </div>

            <h3 className="text-xl font-black text-stone-900 mb-4 tracking-tight">{item.name}</h3>
            <p className="text-stone-500 leading-relaxed text-sm flex-grow">
              {item.description}
            </p>

            <div className="mt-8 pt-6 border-t border-stone-50 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-green-800 uppercase tracking-widest">Essential Equipment</span>
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12 bg-stone-950 p-12 rounded-[3rem] text-white">
        <h4 className="text-2xl font-black mb-4">Weight Distribution is Key</h4>
        <p className="text-stone-400 max-w-2xl mx-auto leading-relaxed italic">
          "A balanced llama is a happy llama. We provide the saddles and panniers; you just bring the adventure."
        </p>
      </div>
    </div>
  );
};
