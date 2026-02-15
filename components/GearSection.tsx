
import React, { useState } from 'react';
import { GEAR_ITEMS } from '../constants';
import { GearItem } from '../types';
import { Backpack, Target, Mountain, CheckCircle2, Info, Scale, PackageCheck } from 'lucide-react';

export const GearSection: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'backpacking' | 'hunting'>('all');
  const [checklist, setChecklist] = useState<Set<string>>(new Set());

  const toggleCheck = (id: string) => {
    const newChecklist = new Set(checklist);
    if (newChecklist.has(id)) newChecklist.delete(id);
    else newChecklist.add(id);
    setChecklist(newChecklist);
  };

  const filteredGear = GEAR_ITEMS.filter(item => 
    filter === 'all' || item.category === filter || item.category === 'both'
  );

  const FilterButton = ({ type, label, icon: Icon }: { type: typeof filter, label: string, icon: any }) => (
    <button
      onClick={() => setFilter(type)}
      className={`flex items-center gap-2 px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all border-2 ${
        filter === type 
          ? 'bg-green-800 text-white border-green-800 shadow-xl shadow-green-900/20' 
          : 'bg-white text-stone-400 border-stone-100 hover:border-green-200 hover:text-green-700'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="space-y-16">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-stone-900 text-white p-10 rounded-[3rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
            <PackageCheck className="w-32 h-32" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-green-500 mb-4">Standard Issue</h4>
          <h3 className="text-3xl font-black mb-6">What We Provide</h3>
          <ul className="space-y-4 text-stone-400 font-medium">
            <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500" /> Professional Decker Pack Saddle</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500" /> Dual Canvas Panniers (80L capacity)</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500" /> High-Vis Halter & 10ft Lead</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="w-5 h-5 text-green-500" /> Digital Hanging Scale for Balancing</li>
          </ul>
        </div>

        <div className="bg-white p-10 rounded-[3rem] border border-stone-200 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
            <Backpack className="w-32 h-32 text-stone-900" />
          </div>
          <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 mb-4">Explorer Checklist</h4>
          <h3 className="text-3xl font-black mb-6">What You Bring</h3>
          <ul className="space-y-4 text-stone-500 font-medium">
            <li className="flex items-center gap-3"><Info className="w-5 h-5 text-green-800" /> Personal Tent & Sleeping Systems</li>
            <li className="flex items-center gap-3"><Info className="w-5 h-5 text-green-800" /> Freeze-Dried Rations & Cooking Gear</li>
            <li className="flex items-center gap-3"><Info className="w-5 h-5 text-green-800" /> Bear-Safe Storage (Mandatory)</li>
            <li className="flex items-center gap-3"><Info className="w-5 h-5 text-green-800" /> Water Filtration & Emergency GPS</li>
          </ul>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap justify-center gap-4">
        <FilterButton type="all" label="Full Catalog" icon={Mountain} />
        <FilterButton type="backpacking" label="Backpacker" icon={Backpack} />
        <FilterButton type="hunting" label="Hunter" icon={Target} />
      </div>

      {/* Gear Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredGear.map((item) => (
          <div 
            key={item.id} 
            onClick={() => toggleCheck(item.id)}
            className={`cursor-pointer p-8 rounded-[2.5rem] border-2 transition-all group relative flex flex-col h-full ${
              checklist.has(item.id) 
                ? 'bg-green-50 border-green-200 shadow-inner' 
                : 'bg-white border-stone-100 hover:border-green-200 shadow-sm'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                checklist.has(item.id) ? 'bg-green-800 text-white' : 'bg-green-50 text-green-800 group-hover:bg-green-800 group-hover:text-white'
              }`}>
                {item.icon}
              </div>
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                checklist.has(item.id) ? 'bg-green-800 border-green-800 text-white' : 'border-stone-200'
              }`}>
                {checklist.has(item.id) && <CheckCircle2 className="w-4 h-4" />}
              </div>
            </div>

            <h3 className="text-xl font-black text-stone-900 mb-3 tracking-tight">{item.name}</h3>
            <p className="text-stone-500 leading-relaxed text-sm flex-grow">
              {item.description}
            </p>

            <div className="mt-6 pt-4 border-t border-stone-100 flex items-center justify-between">
              <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-1">
                <Scale className="w-3 h-3" /> Balanced Load
              </span>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-1 rounded-full ${
                item.category === 'both' ? 'bg-stone-100 text-stone-500' : 
                item.category === 'backpacking' ? 'bg-blue-50 text-blue-600' : 'bg-red-50 text-red-600'
              }`}>
                {item.category}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-12 bg-stone-50 p-12 rounded-[3rem] border border-stone-200">
        <h4 className="text-2xl font-black mb-4 text-stone-900">Load Management Rule</h4>
        <p className="text-stone-500 max-w-2xl mx-auto leading-relaxed font-medium">
          "Panniers must be balanced within <span className="text-green-800 font-black">2 lbs</span> of each other. 
          Uneven loads cause saddle sores and trail fatigue for your llama. Never exceed the individual load limit of your assigned pack string."
        </p>
      </div>
    </div>
  );
};
