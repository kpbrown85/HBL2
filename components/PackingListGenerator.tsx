
import React, { useState } from 'react';
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
    const list = await generatePackingList(tripType, duration, weather);
    setResult(list);
    setIsLoading(false);
  };

  const handlePrint = () => {
    if (!result) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const formattedContent = result
      .replace(/\n/g, '<br/>')
      .replace(/### (.*)/g, '<h2 style="font-family: sans-serif; font-size: 14px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; color: #78716c; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e7e5e4; padding-bottom: 4px;">$1</h2>')
      .replace(/- (.*)/g, '<div style="display: flex; align-items: flex-start; gap: 12px; padding: 12px; background: #fff; border: 1px solid #e7e5e4; border-radius: 8px; margin-bottom: 8px; font-family: sans-serif; font-size: 13px; color: #444;"><div style="width: 14px; height: 14px; border: 2px solid #d6d3d1; border-radius: 3px; margin-top: 2px; flex-shrink: 0;"></div><span>$1</span></div>');

    printWindow.document.write(`
      <html>
        <head>
          <title>Expedition Loadout - ${tripType} (${duration} Days)</title>
          <style>
            body { 
              padding: 40px; 
              background: #fafaf9; 
              color: #1c1917;
              -webkit-print-color-adjust: exact;
            }
            .header {
              margin-bottom: 40px;
              border-bottom: 4px solid #166534;
              padding-bottom: 20px;
            }
            .site-name {
              font-family: serif;
              font-size: 24px;
              font-weight: 900;
              color: #166534;
              margin: 0;
            }
            .trip-meta {
              font-family: sans-serif;
              font-size: 10px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 0.2em;
              color: #a8a29e;
              margin-top: 8px;
            }
            .footer {
              margin-top: 60px;
              font-family: sans-serif;
              font-size: 10px;
              color: #a8a29e;
              text-align: center;
              border-top: 1px solid #e7e5e4;
              padding-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="site-name">Helena Backcountry Llamas</h1>
            <div class="trip-meta">Expedition Loadout: ${tripType} &bull; ${duration} Days &bull; ${weather}</div>
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
    <div className="bg-white rounded-[3rem] shadow-2xl border border-stone-100 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2">
        {/* Form Side */}
        <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-stone-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-lg">
              <ClipboardList size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-stone-900 tracking-tight leading-none">Expedition Intel</h3>
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest mt-2">Generate your custom loadout</p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Trip Type */}
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Objective</label>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setTripType('Backpacking')}
                  className={`flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-2 ${tripType === 'Backpacking' ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-stone-50 text-stone-400 border-transparent hover:border-stone-200'}`}
                >
                  <Mountain size={18} /> Backpacking
                </button>
                <button 
                  onClick={() => setTripType('Hunting')}
                  className={`flex items-center justify-center gap-3 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition-all border-2 ${tripType === 'Hunting' ? 'bg-stone-900 text-white border-stone-900 shadow-xl' : 'bg-stone-50 text-stone-400 border-transparent hover:border-stone-200'}`}
                >
                  <Target size={18} /> Hunting
                </button>
              </div>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Duration: {duration} Days</label>
              <input 
                type="range" 
                min="1" 
                max="14" 
                className="w-full accent-green-800"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
              />
              <div className="flex justify-between mt-2 text-[10px] font-black text-stone-300">
                <span>1 DAY</span>
                <span>14 DAYS</span>
              </div>
            </div>

            {/* Weather */}
            <div>
              <label className="block text-[10px] font-black text-stone-400 uppercase tracking-[0.2em] mb-4">Expected Conditions</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {weatherOptions.map((opt) => (
                  <button 
                    key={opt.label}
                    onClick={() => setWeather(opt.label)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all border-2 ${weather === opt.label ? 'bg-green-50 border-green-200 text-green-900 shadow-sm' : 'bg-stone-50 border-transparent text-stone-400'}`}
                  >
                    <opt.icon size={20} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-center">{opt.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-green-800 text-white py-6 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-green-900 transition-all shadow-xl shadow-green-900/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <><Loader2 className="animate-spin" /> Analyzing Terrain Requirements...</>
              ) : (
                <><Sparkles size={20} /> Build Custom Loadout</>
              )}
            </button>
          </div>
        </div>

        {/* Results Side */}
        <div className="bg-stone-50 p-8 md:p-12 relative min-h-[400px]">
          {result ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center mb-8">
                <h4 className="text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
                  <ClipboardList size={20} className="text-green-800" />
                  Your Field List
                </h4>
                <button 
                  onClick={handlePrint}
                  className="p-3 bg-white border border-stone-200 rounded-xl text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all shadow-sm"
                  title="Print List"
                >
                  <Printer size={16} />
                </button>
              </div>
              <div className="prose prose-stone prose-sm max-w-none text-stone-700 font-medium leading-relaxed prose-headings:font-black prose-headings:text-stone-900 prose-ul:list-none prose-ul:p-0 prose-li:mb-4 prose-li:p-4 prose-li:bg-white prose-li:rounded-xl prose-li:shadow-sm prose-li:border prose-li:border-stone-100">
                <div dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br/>').replace(/### (.*)/g, '<h5 class="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mt-8 mb-4">$1</h5>').replace(/- (.*)/g, '<div class="flex items-start gap-3 p-4 bg-white rounded-xl mb-2 shadow-sm border border-stone-100"><div class="w-4 h-4 rounded border-2 border-stone-200 mt-0.5 shrink-0"></div><span>$1</span></div>').replace(/Llama Breed & Herd Recommendation/g, '<span class="text-green-800 font-black flex items-center gap-2 mb-2"><Mountain size={14}/> Llama Breed & Herd Recommendation</span>') }} />
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center opacity-30">
              <div className="w-20 h-20 bg-stone-200 rounded-full flex items-center justify-center mb-6">
                <ClipboardList size={40} className="text-stone-400" />
              </div>
              <p className="text-sm font-black uppercase tracking-widest text-stone-500">Input trip details to receive<br/>expedition-specific gear intel.</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer Info */}
      <div className="bg-stone-900 text-stone-500 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5">
        <div className="flex items-center gap-3">
          <Info size={16} className="text-green-500" />
          <p className="text-[10px] font-black uppercase tracking-widest">AI suggestions are based on high-country logistics. Always carry bear-safety items.</p>
        </div>
        <div className="flex items-center gap-2 text-white/50">
          <span className="text-[9px] font-black uppercase tracking-widest">Grounding: Helena National Forest</span>
        </div>
      </div>
    </div>
  );
};
