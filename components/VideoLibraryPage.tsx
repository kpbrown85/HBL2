import React from 'react';
import { ArrowLeft, Play, Youtube, BookOpen, Info } from 'lucide-react';

interface VideoLibraryPageProps {
  onBack: () => void;
  onBookClinic: () => void;
}

const VIDEOS = [
  { id: 'Ft2NlrqAhnA', title: 'Llama Packing Basics', description: 'Essential techniques for leading and handling pack llamas in the backcountry.' },
  { id: '-QC6T9QnInI', title: 'Saddling Your Llama', description: 'Step-by-step guide to properly fitting and securing a pack saddle.' },
  { id: 'GwW60NRepvM', title: 'Balancing Panniers', description: 'How to weigh and balance your gear for a stable and comfortable llama.' },
  { id: 'CFxjqGImOys', title: 'Trail Etiquette', description: 'Navigating encounters with hikers, dogs, and horses on the trail.' },
  { id: 'sdz_H1vkml0', title: 'Setting Up Camp', description: 'Picket lines, grazing management, and securing your herd overnight.' },
  { id: 'yE0XERXRpJ8', title: 'Llama Health Checks', description: 'Identifying signs of fatigue, heat stress, or injury during a trek.' },
  { id: 'zIynNN7wok8', title: 'Watering & Feeding', description: 'Managing nutrition and hydration in different backcountry environments.' },
  { id: 'X3CD4Z97oM4', title: 'Advanced Terrain', description: 'Techniques for crossing streams, logs, and steep rocky sections.' },
  { id: 'zMl5x62AXQo', title: 'Llama Gear Overview', description: 'A deep dive into the specialized equipment used for llama packing.' }
];

export const VideoLibraryPage: React.FC<VideoLibraryPageProps> = ({ onBack, onBookClinic }) => {
  return (
    <div className="min-h-screen bg-stone-50 py-24 px-8">
      <div className="max-w-7xl mx-auto space-y-16">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-stone-900 leading-none mb-4">Video Library.</h1>
            <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px]">Educational Resources for Backcountry Llama Packing</p>
          </div>
          <button onClick={onBack} className="flex items-center gap-3 text-stone-400 font-black text-[10px] uppercase tracking-widest hover:text-stone-900 transition-colors">
            <ArrowLeft size={16} /> Back to Home
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {VIDEOS.map((video) => (
            <div key={video.id} className="group bg-white rounded-[3rem] shadow-xl border border-stone-100 overflow-hidden hover:shadow-2xl transition-all duration-500">
              <div className="aspect-video relative bg-stone-900">
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${video.id}`}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="p-10 space-y-4">
                <div className="flex items-center gap-3 text-green-800">
                  <Play size={20} fill="currentColor" />
                  <h3 className="text-xl font-black tracking-tight uppercase">{video.title}</h3>
                </div>
                <p className="text-stone-500 text-sm leading-relaxed font-medium">
                  {video.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <section className="bg-stone-900 text-white p-12 md:p-20 rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="space-y-6 text-center md:text-left max-w-2xl">
            <div className="flex items-center justify-center md:justify-start gap-4 text-green-400">
              <Youtube size={32} />
              <h2 className="text-3xl font-black tracking-tight uppercase">More Resources</h2>
            </div>
            <p className="text-stone-400 text-lg leading-relaxed font-medium">
              These videos are provided as a starting point for your education. We highly recommend attending one of our pre-trip clinics for hands-on experience before your first solo expedition.
            </p>
          </div>
          <button 
            onClick={onBookClinic}
            className="px-10 py-6 bg-green-800 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-green-700 transition-all shadow-xl"
          >
            Book a Clinic
          </button>
        </section>
      </div>
    </div>
  );
};
