
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { generatePackingList } from '../services/geminiService';
import { 
  ClipboardList, 
  Mountain, 
  Target, 
  Sun, 
  CloudRain, 
  Snowflake, 
  Wind,
  Loader2,
  Sparkles,
  ArrowRight,
  Printer,
  ChevronRight,
  // Add missing Info icon import
  Info
} from 'lucide-react';

export const PackingListGenerator: React.FC = () => {
  const [tripType, setTripType] = useState<'Backpacking' | 'Hunting'>('Backpacking');
  const [duration, setDuration] = useState(3);
  const [weather, setWeather] = useState('Mild & Dry');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const list = await generatePackingList(tripType, duration, weather);
      setResult(list);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    if (!result) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedContent = result
      .replace(/\n/g, '<br/>')
      .replace(/### (.*)/g, '<h2 style="font-family: serif; font-size: 18px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #0B1D21; margin-top: 32px; margin-bottom: 16px; border-bottom: 2px solid #C5943E; padding-bottom: 8px;">$1</h2>')
      .replace(/- (.*)/g, '<div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: #fff; border: 1px solid #e7e5e4; border-radius: 8px; margin-bottom: 8px; font-family: sans-serif; font-size: 13px; color: #444;"><div style="width: 14px; height: 14px; border: 2px solid #C5943E; border-radius: 3px; margin-top: 2px; flex-shrink: 0;"></div><span>$1</span></div>');

    printWindow.document.write(`
      <html>
        <head>
          <title>Expedition Loadout - ${tripType} (${duration} Days)</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&family=Playfair+Display:wght@700;900&display=swap');
            body { 
              padding: 60px; 
              background: #F5F2ED; 
              color: #0B1D21;
              -webkit-print-color-adjust: exact;
              font-family: 'Inter', sans-serif;
            }
            .header {
              margin-bottom: 40px;
              border-bottom: 4px solid #0B1D21;
              padding-bottom: 20px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .site-name {
              font-family: 'Playfair Display', serif;
              font-size: 32px;
              font-weight: 900;
              color: #0B1D21;
              margin: 0;
            }
            .trip-meta {
              font-family: 'Inter', sans-serif;
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.2em;
              color: #C5943E;
            }
            .footer {
              margin-top: 60px;
              font-family: 'Inter', sans-serif;
              font-size: 10px;
              color: #a8a29e;
              text-align: center;
              border-top: 1px solid #e7e5e4;
              padding-top: 20px;
            }
            .content { line-height: 1.6; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1 class="site-name">Helena Backcountry Llamas</h1>
              <div class="trip-meta">Expedition Loadout: ${tripType} &bull; ${duration} Days</div>
            </div>
            <div class="trip-meta">${weather}</div>
          </div>
          <div class="content">
            ${formattedContent}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} Helena Backcountry Llamas &bull; Grounding: Helena National Forest
          </div>
          <script>
            window.onload = () => {
              window.print();
              window.onafterprint = () => window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const weatherOptions = [
    { label: 'Mild & Dry', icon: Sun },
    { label: 'Wet & Stormy', icon: CloudRain },
    { label: 'Cold & Snow', icon: Snowflake },
    { label: 'High Winds', icon: Wind }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col h-full bg-paper"
    >
      <div className="flex-1 overflow-y-auto p-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Form Side */}
          <div className="lg:col-span-5 space-y-10">
            <div className="space-y-2">
              <h3 className="text-4xl font-black text-midnight tracking-tight font-display">Expedition Loadout</h3>
              <p className="text-gold text-xs font-black uppercase tracking-[0.3em]">Custom Gear Intelligence</p>
            </div>

            <div className="space-y-8">
              {/* Trip Type */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Mission Objective</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTripType('Backpacking')}
                    className={`flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-2 ${tripType === 'Backpacking' ? 'bg-midnight text-white border-midnight shadow-xl' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'}`}
                  >
                    <Mountain size={18} /> Backpacking
                  </button>
                  <button 
                    onClick={() => setTripType('Hunting')}
                    className={`flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-2 ${tripType === 'Hunting' ? 'bg-midnight text-white border-midnight shadow-xl' : 'bg-white text-stone-400 border-stone-100 hover:border-stone-200'}`}
                  >
                    <Target size={18} /> Hunting
                  </button>
                </div>
              </div>

              {/* Duration */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Duration</label>
                  <span className="text-2xl font-black text-midnight font-display">{duration} Days</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="14" 
                  className="w-full h-2 bg-stone-200 rounded-lg appearance-none cursor-pointer accent-gold"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value))}
                />
                <div className="flex justify-between text-[10px] font-black text-stone-300">
                  <span>1 DAY</span>
                  <span>14 DAYS</span>
                </div>
              </div>

              {/* Weather */}
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">Expected Conditions</label>
                <div className="grid grid-cols-2 gap-3">
                  {weatherOptions.map((opt) => (
                    <button 
                      key={opt.label}
                      onClick={() => setWeather(opt.label)}
                      className={`flex items-center gap-4 p-4 rounded-xl transition-all border-2 ${weather === opt.label ? 'bg-gold/10 border-gold/20 text-midnight shadow-sm' : 'bg-white border-stone-100 text-stone-400'}`}
                    >
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${weather === opt.label ? 'bg-gold text-white' : 'bg-stone-50'}`}>
                        <opt.icon size={20} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full bg-midnight text-white py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-midnight/90 transition-all shadow-xl shadow-midnight/20 active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <><Loader2 className="animate-spin" /> Analyzing Logistics...</>
                ) : (
                  <><Sparkles size={20} /> Generate Field List</>
                )}
              </button>
            </div>
          </div>

          {/* Results Side */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-stone-100 min-h-[600px] relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8">
                <div className="w-32 h-32 bg-stone-50 rounded-full -mr-16 -mt-16 flex items-center justify-center opacity-50">
                  <ClipboardList size={40} className="text-stone-200" />
                </div>
              </div>

              {result ? (
                <div className="relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex justify-between items-center mb-10">
                    <div>
                      <h4 className="text-2xl font-black text-midnight tracking-tight font-display">Your Field List</h4>
                      <p className="text-[10px] font-black text-gold uppercase tracking-widest mt-1">Verified for {tripType} &bull; {duration} Days</p>
                    </div>
                    <button 
                      onClick={handlePrint}
                      className="w-12 h-12 bg-stone-900 text-white rounded-2xl flex items-center justify-center hover:bg-gold transition-all shadow-lg"
                      title="Print List"
                    >
                      <Printer size={20} />
                    </button>
                  </div>
                  
                  <div className="prose prose-stone prose-sm max-w-none text-stone-700 font-medium leading-relaxed prose-headings:font-black prose-headings:text-midnight prose-headings:font-display prose-ul:list-none prose-ul:p-0">
                    <div dangerouslySetInnerHTML={{ 
                      __html: result
                        .replace(/\n/g, '<br/>')
                        .replace(/### (.*)/g, '<h5 class="text-[11px] font-black uppercase tracking-[0.2em] text-gold mt-10 mb-4 flex items-center gap-3"><span class="w-8 h-[2px] bg-gold/20"></span>$1</h5>')
                        .replace(/- (.*)/g, '<div class="flex items-start gap-4 p-5 bg-stone-50 rounded-2xl mb-3 border border-stone-100 hover:border-gold/30 transition-colors group"><div class="w-5 h-5 rounded-md border-2 border-stone-200 mt-0.5 shrink-0 group-hover:border-gold transition-colors"></div><span class="text-stone-600">$1</span></div>') 
                    }} />
                  </div>

                  <div className="mt-12 p-6 bg-midnight rounded-3xl text-white/80">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gold rounded-xl flex items-center justify-center shrink-0">
                        <Info size={20} className="text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gold mb-1">Safety Protocol</p>
                        <p className="text-xs leading-relaxed">AI suggestions are based on high-country logistics. Always carry bear-safety items and verify local regulations before departure.</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-20">
                  <div className="w-24 h-24 bg-stone-50 rounded-full flex items-center justify-center mb-8 animate-pulse">
                    <ClipboardList size={48} className="text-stone-200" />
                  </div>
                  <h5 className="text-xl font-black text-stone-900 mb-2 font-display">Awaiting Intel</h5>
                  <p className="text-stone-400 text-sm max-w-xs leading-relaxed">Configure your expedition parameters to receive a detailed, AI-generated loadout for the Montana high country.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
