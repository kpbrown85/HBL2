
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, Type, ThinkingLevel, Modality } from "@google/genai";
import { 
  Sparkles, 
  MessageSquare, 
  Search, 
  MapPin, 
  Image as ImageIcon, 
  Camera, 
  Zap, 
  Brain, 
  Send, 
  Loader2, 
  X, 
  Plus, 
  Download,
  History,
  Info,
  Globe,
  Navigation,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Initialize AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

interface Message {
  role: 'user' | 'model';
  text: string;
  images?: string[];
}

export const HighCountryAIHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'scout' | 'studio' | 'analyst'>('chat');
  
  return (
    <div className="bg-white rounded-[4rem] shadow-2xl border border-stone-100 overflow-hidden flex flex-col h-[800px]">
      <div className="bg-stone-900 p-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center shadow-lg">
            <Sparkles className="text-white" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight">High Country AI Hub</h2>
            <p className="text-stone-500 text-[10px] font-black uppercase tracking-widest">Powered by Gemini Intelligence</p>
          </div>
        </div>
        
        <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/10">
          <TabButton active={activeTab === 'chat'} onClick={() => setActiveTab('chat')} icon={<MessageSquare size={18} />} label="Planner" />
          <TabButton active={activeTab === 'scout'} onClick={() => setActiveTab('scout')} icon={<Search size={18} />} label="Scout" />
          <TabButton active={activeTab === 'studio'} onClick={() => setActiveTab('studio')} icon={<ImageIcon size={18} />} label="Studio" />
          <TabButton active={activeTab === 'analyst'} onClick={() => setActiveTab('analyst')} icon={<Camera size={18} />} label="Analyst" />
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === 'chat' && <AIChat key="chat" />}
          {activeTab === 'scout' && <AIScout key="scout" />}
          {activeTab === 'studio' && <AIStudio key="studio" />}
          {activeTab === 'analyst' && <AIAnalyst key="analyst" />}
        </AnimatePresence>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
      active ? 'bg-gold text-white shadow-lg' : 'text-stone-400 hover:text-white hover:bg-white/5'
    }`}
  >
    {icon}
    <span className="hidden md:block">{label}</span>
  </button>
);

// --- 1. Expedition Planner (Chatbot) ---
const AIChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: "Welcome to the High Country Expedition Planner. I'm here to help you design the perfect backcountry trek with our llama string. What's on your mind?" }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'lite' | 'general' | 'complex'>('general');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      let model = "gemini-3-flash-preview";
      const config: any = {
        systemInstruction: "You are an expert Montana backcountry guide and llama packer. You help users plan trips, choose llamas, and understand mountain safety. Be professional, rugged, and helpful.",
      };

      if (mode === 'lite') {
        model = "gemini-3.1-flash-lite-preview";
      } else if (mode === 'complex') {
        model = "gemini-3.1-pro-preview";
        config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
        // Note: maxOutputTokens is NOT set for thinking mode as per requirements
      }

      const response = await ai.models.generateContent({
        model,
        contents: [...messages, userMsg].map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        })),
        config
      });

      setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm sorry, I couldn't process that request." }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "The mountain pass is blocked. (Connection error)" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-6">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-6 rounded-[2rem] shadow-sm ${
              m.role === 'user' ? 'bg-stone-900 text-white rounded-tr-none' : 'bg-white text-stone-900 rounded-tl-none border border-stone-100'
            }`}>
              <p className="text-sm font-medium leading-relaxed">{m.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-6 rounded-[2rem] rounded-tl-none border border-stone-100 flex items-center gap-3">
              <Loader2 className="animate-spin text-gold" size={18} />
              <span className="text-xs font-bold text-stone-400 uppercase tracking-widest">
                {mode === 'complex' ? "Deep Thinking..." : mode === 'lite' ? "Quick Response..." : "Consulting the herd..."}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="p-8 bg-white border-t border-stone-100">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex bg-stone-100 p-1 rounded-xl">
            <button 
              onClick={() => setMode('lite')}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${mode === 'lite' ? 'bg-midnight text-white shadow-sm' : 'text-stone-400'}`}
            >
              Lite
            </button>
            <button 
              onClick={() => setMode('general')}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${mode === 'general' ? 'bg-midnight text-white shadow-sm' : 'text-stone-400'}`}
            >
              General
            </button>
            <button 
              onClick={() => setMode('complex')}
              className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${mode === 'complex' ? 'bg-midnight text-white shadow-sm' : 'text-stone-400'}`}
            >
              Complex
            </button>
          </div>
          <span className="text-[10px] font-bold text-stone-300 uppercase tracking-widest">
            {mode === 'complex' ? "Pro Model (High Thinking)" : mode === 'lite' ? "Flash Lite (Low Latency)" : "Flash (General)"}
          </span>
        </div>
        <div className="flex gap-4">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask about trail conditions, llama care, or trip planning..."
            className="flex-1 bg-stone-50 border border-stone-100 p-6 rounded-3xl outline-none focus:ring-4 focus:ring-gold/10 font-bold text-stone-900"
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="w-20 h-20 bg-stone-900 text-white rounded-3xl flex items-center justify-center shadow-xl hover:bg-black transition-all active:scale-95 disabled:opacity-50"
          >
            <Send size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 2. Trail Scout (Search & Maps Grounding) ---
const AIScout = () => {
  const [queryText, setQueryText] = useState('');
  const [result, setResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [tool, setTool] = useState<'search' | 'maps'>('search');

  const handleScout = async () => {
    if (!queryText.trim() || isLoading) return;
    setIsLoading(true);
    setResult(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: queryText,
        config: {
          tools: tool === 'search' ? [{ googleSearch: {} }] : [{ googleMaps: {} }],
          systemInstruction: `You are a high-country scout. Use ${tool === 'search' ? 'Google Search' : 'Google Maps'} to find accurate, real-time information about trails, weather, or locations in the Montana Rockies. Be concise and factual.`
        }
      });
      setResult(response.text || "No intel found.");
    } catch (error) {
      console.error("Scout error:", error);
      setResult("Intel gathering failed. The signal is weak.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 p-8">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="text-center">
          <h3 className="text-3xl font-black text-stone-900 mb-2">Trail Scout</h3>
          <p className="text-stone-400 font-bold text-xs uppercase tracking-widest">Real-time intel via Google Grounding</p>
        </div>

        <div className="flex bg-white p-2 rounded-[2rem] border border-stone-100 shadow-sm">
          <button 
            onClick={() => setTool('search')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              tool === 'search' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'
            }`}
          >
            <Globe size={18} /> Search
          </button>
          <button 
            onClick={() => setTool('maps')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${
              tool === 'maps' ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-50'
            }`}
          >
            <Navigation size={18} /> Maps
          </button>
        </div>

        <div className="relative">
          <textarea 
            value={queryText}
            onChange={e => setQueryText(e.target.value)}
            placeholder={tool === 'search' ? "Search for current weather in Helena Elkhorns..." : "Find trailhead locations near Scapegoat Wilderness..."}
            className="w-full bg-white border border-stone-100 p-8 rounded-[2.5rem] outline-none focus:ring-4 focus:ring-gold/10 font-bold text-stone-900 min-h-[150px] shadow-sm"
          />
          <button 
            onClick={handleScout}
            disabled={isLoading || !queryText.trim()}
            className="absolute bottom-6 right-6 px-8 py-4 bg-gold text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-amber-600 transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Gather Intel"}
          </button>
        </div>

        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-8 rounded-[2.5rem] border border-stone-100 shadow-xl"
          >
            <div className="flex items-center gap-3 mb-4 text-gold">
              <Zap size={18} />
              <span className="text-[10px] font-black uppercase tracking-widest">Scout Report</span>
            </div>
            <div className="prose prose-stone prose-sm max-w-none">
              <p className="text-stone-600 font-medium leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

// --- 3. Llama Portrait Studio (Image Generation) ---
const AIStudio = () => {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [quality, setQuality] = useState<'1K' | '2K' | '4K'>('1K');
  const [isEditing, setIsEditing] = useState(false);
  const [baseImage, setBaseImage] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return;
    setIsLoading(true);
    setGeneratedImage(null);

    try {
      // Use gemini-3.1-flash-image-preview for general generation/editing
      // Use gemini-3-pro-image-preview for high quality (1K, 2K, 4K)
      const model = quality === '1K' && !isEditing ? "gemini-3.1-flash-image-preview" : "gemini-3-pro-image-preview";
      
      const contents: any = {
        parts: [{ text: prompt }]
      };

      if (isEditing && baseImage) {
        contents.parts.unshift({
          inlineData: {
            data: baseImage.split(',')[1],
            mimeType: "image/png"
          }
        });
      }

      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: quality
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData) {
            setGeneratedImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Studio error:", error);
      alert("Studio is closed for maintenance. (Image generation failed)");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBaseImage(reader.result as string);
        setIsEditing(true);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="text-center">
          <h3 className="text-3xl font-black text-stone-900 mb-2">Llama Portrait Studio</h3>
          <p className="text-stone-400 font-bold text-xs uppercase tracking-widest">Generate & Edit High-Quality Imagery</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Prompt</label>
              <textarea 
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                placeholder="A majestic llama with a pack saddle standing on a limestone ridge at sunset, cinematic lighting..."
                className="w-full bg-white border border-stone-100 p-6 rounded-3xl outline-none focus:ring-4 focus:ring-gold/10 font-bold text-stone-900 min-h-[120px] shadow-sm"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Target Resolution</label>
              <div className="flex bg-white p-1.5 rounded-2xl border border-stone-100 shadow-sm">
                {(['1K', '2K', '4K'] as const).map(q => (
                  <button 
                    key={q}
                    onClick={() => setQuality(q)}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      quality === q ? 'bg-stone-900 text-white shadow-md' : 'text-stone-400 hover:text-stone-900'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-stone-400 ml-4">Base Image (Optional for Editing)</label>
              <div className="relative">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange}
                  className="hidden" 
                  id="studio-upload" 
                />
                <label 
                  htmlFor="studio-upload"
                  className={`flex items-center justify-center gap-3 w-full p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer ${
                    baseImage ? 'border-gold bg-gold/5 text-gold' : 'border-stone-200 bg-white text-stone-400 hover:border-stone-300'
                  }`}
                >
                  {baseImage ? <CheckCircle2 size={20} /> : <Plus size={20} />}
                  <span className="text-xs font-black uppercase tracking-widest">{baseImage ? "Image Loaded" : "Upload Image to Edit"}</span>
                </label>
                {baseImage && (
                  <button 
                    onClick={() => { setBaseImage(null); setIsEditing(false); }}
                    className="absolute -top-2 -right-2 w-8 h-8 bg-stone-900 text-white rounded-full flex items-center justify-center shadow-lg"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            <button 
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="w-full py-6 bg-stone-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>{isEditing ? "Edit Image" : "Generate Image"} <Sparkles size={16} /></>}
            </button>
          </div>

          <div className="flex flex-col items-center justify-center">
            <div className="w-full aspect-square bg-white rounded-[3rem] border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden shadow-inner relative group">
              {generatedImage ? (
                <>
                  <img src={generatedImage} alt="Generated" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <a 
                      href={generatedImage} 
                      download="llama-portrait.png"
                      className="p-4 bg-white rounded-2xl text-stone-900 hover:bg-gold hover:text-white transition-all shadow-xl"
                    >
                      <Download size={24} />
                    </a>
                  </div>
                </>
              ) : isLoading ? (
                <div className="text-center space-y-4">
                  <Loader2 className="animate-spin text-gold mx-auto" size={48} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-stone-400">Developing Portrait...</p>
                </div>
              ) : (
                <div className="text-center space-y-4 p-12">
                  <ImageIcon className="text-stone-200 mx-auto" size={64} />
                  <p className="text-xs font-bold text-stone-300 uppercase tracking-widest">Your masterpiece will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- 4. Photo Analyst (Image Understanding) ---
const AIAnalyst = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage || isLoading) return;
    setIsLoading(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-pro-preview",
        contents: {
          parts: [
            { inlineData: { data: selectedImage.split(',')[1], mimeType: "image/png" } },
            { text: "Analyze this image from a backcountry llama packer's perspective. What do you see? Any gear, terrain, or llama behavior worth noting?" }
          ]
        }
      });
      setAnalysis(response.text || "No analysis available.");
    } catch (error) {
      console.error("Analysis error:", error);
      setAnalysis("Analysis failed. The lens is foggy.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50 p-8 overflow-y-auto">
      <div className="max-w-2xl mx-auto w-full space-y-8">
        <div className="text-center">
          <h3 className="text-3xl font-black text-stone-900 mb-2">Photo Analyst</h3>
          <p className="text-stone-400 font-bold text-xs uppercase tracking-widest">Image Understanding for the High Country</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="relative aspect-square bg-white rounded-[3rem] border-2 border-dashed border-stone-200 flex items-center justify-center overflow-hidden shadow-inner group">
              {selectedImage ? (
                <img src={selectedImage} alt="Selected" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center space-y-4 p-12">
                  <Camera className="text-stone-200 mx-auto" size={64} />
                  <p className="text-xs font-bold text-stone-300 uppercase tracking-widest">Upload a photo to analyze</p>
                </div>
              )}
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer" 
              />
            </div>
            
            <button 
              onClick={handleAnalyze}
              disabled={isLoading || !selectedImage}
              className="w-full py-6 bg-stone-900 text-white rounded-3xl font-black text-xs uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>Analyze Photo <Search size={16} /></>}
            </button>
          </div>

          <div className="space-y-6">
            {analysis ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white p-8 rounded-[3rem] border border-stone-100 shadow-xl h-full"
              >
                <div className="flex items-center gap-3 mb-6 text-gold">
                  <Brain size={20} />
                  <span className="text-[10px] font-black uppercase tracking-widest">AI Insights</span>
                </div>
                <div className="prose prose-stone prose-sm max-w-none">
                  <p className="text-stone-600 font-medium leading-relaxed whitespace-pre-wrap">{analysis}</p>
                </div>
              </motion.div>
            ) : (
              <div className="bg-stone-100/50 p-12 rounded-[3rem] border border-dashed border-stone-200 h-full flex items-center justify-center text-center">
                <p className="text-xs font-bold text-stone-300 uppercase tracking-widest leading-loose">
                  Select a photo of your gear, <br/> a llama, or a trail <br/> to get expert AI analysis
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
