
import React, { useState, useEffect } from 'react';
import { getWeatherForecast } from '../services/geminiService';
import { WeatherForecast as WeatherType } from '../types';
import { 
  Cloud, 
  Sun, 
  CloudRain, 
  Snowflake, 
  CloudLightning, 
  Wind, 
  Thermometer, 
  Droplets,
  Loader2,
  ExternalLink,
  MapPin,
  RefreshCcw,
  Clock
} from 'lucide-react';

const ConditionIcon = ({ condition, size = 24 }: { condition: string, size?: number }) => {
  const c = condition.toLowerCase();
  if (c.includes('sun') || c.includes('clear')) return <Sun size={size} className="text-amber-400" />;
  if (c.includes('rain') || c.includes('shower')) return <CloudRain size={size} className="text-blue-400" />;
  if (c.includes('snow')) return <Snowflake size={size} className="text-sky-200" />;
  if (c.includes('thunder') || c.includes('storm')) return <CloudLightning size={size} className="text-purple-400" />;
  if (c.includes('wind')) return <Wind size={size} className="text-stone-300" />;
  return <Cloud size={size} className="text-stone-400" />;
};

export const WeatherForecast: React.FC = () => {
  const [weather, setWeather] = useState<WeatherType | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchWeather = async () => {
    setLoading(true);
    const data = await getWeatherForecast();
    if (data) setWeather(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="bg-white p-24 rounded-[3rem] shadow-xl border border-stone-100 flex flex-col items-center justify-center gap-6">
        <Loader2 className="w-12 h-12 text-green-800 animate-spin" />
        <p className="text-stone-400 font-black uppercase tracking-widest text-xs">Syncing with Montana Weather Satellites...</p>
      </div>
    );
  }

  if (!weather) return null;

  return (
    <div className="space-y-12 animate-in fade-in duration-1000">
      <div className="bg-stone-900 rounded-[3rem] p-12 text-white shadow-2xl relative overflow-hidden ring-1 ring-white/10">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Wind size={200} />
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Current Conditions */}
          <div className="lg:col-span-1 space-y-8 flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                <MapPin className="text-stone-900" size={20} />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight leading-none">Helena, MT</h3>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">Regional Conditions</span>
              </div>
            </div>

            <div className="flex items-center gap-8">
              <div className="text-7xl font-black tracking-tighter text-green-400">
                {weather.currentTemp}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <ConditionIcon condition={weather.currentCondition} size={32} />
                  <span className="text-xl font-bold">{weather.currentCondition}</span>
                </div>
                <div className="flex items-center gap-2 text-stone-500 text-xs font-bold uppercase tracking-widest">
                  <Clock size={12} /> {weather.lastUpdated}
                </div>
              </div>
            </div>

            <button 
              onClick={fetchWeather}
              className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <RefreshCcw size={14} /> Refresh Intel
            </button>
          </div>

          {/* 5-Day Forecast Grid */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 h-full">
              {weather.forecast.map((day, idx) => (
                <div 
                  key={idx}
                  className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] flex flex-col items-center justify-between gap-4 group hover:bg-white/10 transition-all"
                >
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-500">{day.day}</span>
                  <div className="p-3 bg-stone-800 rounded-2xl group-hover:scale-110 transition-transform">
                    <ConditionIcon condition={day.condition} size={28} />
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 font-black text-lg">
                      <span className="text-white">{day.high}</span>
                      <span className="text-stone-600 text-xs">/</span>
                      <span className="text-stone-500">{day.low}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1 text-[8px] font-black text-stone-500 uppercase tracking-widest mt-1">
                      <Droplets size={8} /> {day.precipitation}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sources/Grounding */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-wrap items-center gap-6">
          <span className="text-[10px] font-black uppercase tracking-widest text-stone-600">Verified Sources:</span>
          {weather.sources.map((source, i) => (
            <a 
              key={i} 
              href={source.uri} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-2 text-stone-400 hover:text-green-400 transition-colors text-[9px] font-bold uppercase tracking-widest"
            >
              {source.title.length > 20 ? source.title.substring(0, 20) + '...' : source.title} <ExternalLink size={10} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};
