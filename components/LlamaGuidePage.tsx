import React from 'react';
import { ArrowLeft, BookOpen, Info, Package, Heart, Compass, ShieldCheck, Phone } from 'lucide-react';

interface LlamaGuidePageProps {
  onBack: () => void;
}

export const LlamaGuidePage: React.FC<LlamaGuidePageProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-stone-50 py-24 px-8">
      <div className="max-w-4xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-stone-900 leading-none mb-4">Field Guide.</h1>
            <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px]">Informational Guide to Renting Llamas for Backpacking</p>
          </div>
          <button onClick={onBack} className="flex items-center gap-3 text-stone-400 font-black text-[10px] uppercase tracking-widest hover:text-stone-900 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </button>
        </header>

        <div className="bg-white rounded-[4rem] shadow-xl border border-stone-100 overflow-hidden">
          <div className="p-12 md:p-20 space-y-20">
            {/* Introduction */}
            <section className="space-y-8">
              <div className="flex items-center gap-4 text-green-800">
                <BookOpen size={32} />
                <h2 className="text-3xl font-black tracking-tight uppercase">Introduction</h2>
              </div>
              <p className="text-stone-600 text-lg leading-relaxed font-medium">
                Llama trekking is an increasingly popular way to explore the backcountry, offering a low-impact, efficient, and enjoyable means of carrying gear through rugged terrain. This guide provides essential information for a successful trip, covering llama care, equipment, and trail etiquette.
              </p>
            </section>

            {/* General Info */}
            <section className="space-y-12">
              <div className="flex items-center gap-4 text-green-800">
                <Info size={32} />
                <h2 className="text-3xl font-black tracking-tight uppercase">General Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-stone-50 p-10 rounded-[3rem] space-y-4">
                  <h4 className="font-black text-stone-900 uppercase tracking-widest text-xs">Physical Traits</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">Strong, agile, and sure-footed with padded feet that cause minimal environmental damage. They have a thick undercoat and a three-compartment stomach for nutrient efficiency.</p>
                </div>
                <div className="bg-stone-50 p-10 rounded-[3rem] space-y-4">
                  <h4 className="font-black text-stone-900 uppercase tracking-widest text-xs">Carrying Capacity</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">A well-conditioned llama can carry 60–85 pounds (25–33% of its body weight). Younger or less-conditioned llamas should carry less.</p>
                </div>
                <div className="bg-stone-50 p-10 rounded-[3rem] space-y-4">
                  <h4 className="font-black text-stone-900 uppercase tracking-widest text-xs">Temperament</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">Gentle, curious, and intelligent. They rarely spit at humans and are excellent alert animals, spotting wildlife or predators early.</p>
                </div>
                <div className="bg-stone-50 p-10 rounded-[3rem] space-y-4">
                  <h4 className="font-black text-stone-900 uppercase tracking-widest text-xs">Environmental Impact</h4>
                  <p className="text-stone-500 text-sm leading-relaxed">Low-impact browsers. Their soft feet reduce erosion, and their manure has minimal impact. They nibble plants without uprooting them.</p>
                </div>
              </div>
            </section>

            {/* Equipment */}
            <section className="space-y-12">
              <div className="flex items-center gap-4 text-green-800">
                <Package size={32} />
                <h2 className="text-3xl font-black tracking-tight uppercase">Essential Equipment</h2>
              </div>
              <ul className="space-y-6">
                <li className="flex gap-6">
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center shrink-0 font-black text-stone-400">01</div>
                  <div>
                    <h4 className="font-black text-stone-900 uppercase tracking-tight mb-2">Pack Saddle</h4>
                    <p className="text-stone-500 text-sm leading-relaxed">The foundation of the packing system. Distributes weight evenly. We use modern, lightweight saddles designed to fit different llama body shapes.</p>
                  </div>
                </li>
                <li className="flex gap-6">
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center shrink-0 font-black text-stone-400">02</div>
                  <div>
                    <h4 className="font-black text-stone-900 uppercase tracking-tight mb-2">Panniers</h4>
                    <p className="text-stone-500 text-sm leading-relaxed">Bags that hang on either side. Must be packed evenly to maintain balance. Weights should be measured using a handheld scale.</p>
                  </div>
                </li>
                <li className="flex gap-6">
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center shrink-0 font-black text-stone-400">03</div>
                  <div>
                    <h4 className="font-black text-stone-900 uppercase tracking-tight mb-2">Halter & Lead Rope</h4>
                    <p className="text-stone-500 text-sm leading-relaxed">Used to lead the llama. Never remove the halter on the trail, as it can be extremely difficult to catch a loose llama.</p>
                  </div>
                </li>
                <li className="flex gap-6">
                  <div className="w-12 h-12 bg-stone-100 rounded-2xl flex items-center justify-center shrink-0 font-black text-stone-400">04</div>
                  <div>
                    <h4 className="font-black text-stone-900 uppercase tracking-tight mb-2">Stakeout Lead & Picket Line</h4>
                    <p className="text-stone-500 text-sm leading-relaxed">For securing llamas in camp. Allows them to graze safely. Set up in areas with good grass, away from water sources.</p>
                  </div>
                </li>
              </ul>
            </section>

            {/* Backcountry Care */}
            <section className="space-y-12">
              <div className="flex items-center gap-4 text-green-800">
                <Heart size={32} />
                <h2 className="text-3xl font-black tracking-tight uppercase">Backcountry Care</h2>
              </div>
              <div className="bg-green-50 p-12 rounded-[3rem] border border-green-100 space-y-8">
                <div className="space-y-4">
                  <h4 className="font-black text-green-900 uppercase tracking-widest text-xs">Feeding & Water</h4>
                  <p className="text-green-800/70 text-sm leading-relaxed">Llamas are browsers and eat green vegetation. They need daily water but can go 3-4 days in emergencies. Lead them to water sources away from camp to minimize impact.</p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-black text-green-900 uppercase tracking-widest text-xs">Handling on the Trail</h4>
                  <p className="text-green-800/70 text-sm leading-relaxed">Llamas follow on a lead rope. Allow 20-30 seconds of rest for every 30-40 feet of elevation gain. Give them time to assess obstacles like streams or logs.</p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-black text-green-900 uppercase tracking-widest text-xs">Health & Safety</h4>
                  <p className="text-green-800/70 text-sm leading-relaxed">Brush llamas before saddling to prevent irritation. Check for sores daily. Be alert for signs of fatigue like lagging or lying down.</p>
                </div>
              </div>
            </section>

            {/* Etiquette */}
            <section className="space-y-12">
              <div className="flex items-center gap-4 text-green-800">
                <ShieldCheck size={32} />
                <h2 className="text-3xl font-black tracking-tight uppercase">Safety & Etiquette</h2>
              </div>
              <div className="space-y-6 text-stone-600 font-medium">
                <p className="flex gap-4 items-start"><span className="text-green-800 font-black">Trail Etiquette:</span> When meeting horses, call out to the party, inform them you have llamas, and move off the trail to let them pass.</p>
                <p className="flex gap-4 items-start"><span className="text-green-800 font-black">Camping:</span> Choose a campsite at least 200 feet from water. Monitor picket lines periodically, even at night.</p>
                <p className="flex gap-4 items-start"><span className="text-green-800 font-black">Leave No Trace:</span> Pack out all trash. Llamas can easily carry it out for you.</p>
              </div>
            </section>

            {/* Emergency */}
            <section className="pt-20 border-t border-stone-100">
              <div className="bg-stone-900 text-white p-12 rounded-[3rem] flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="space-y-2 text-center md:text-left">
                  <h3 className="text-2xl font-black tracking-tight">Emergency Contact</h3>
                  <p className="text-stone-400 text-sm font-medium">For injured llamas or lost equipment during your trek.</p>
                </div>
                <div className="flex items-center gap-4 bg-white/10 px-8 py-4 rounded-2xl">
                  <Phone size={20} className="text-green-400" />
                  <span className="text-xl font-black tracking-widest">801-372-0353</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};
