import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LLAMAS, GALLERY_IMAGES, BENEFITS, LLAMA_FACTS } from './constants';
import { LlamaCard } from './components/LlamaCard';
import { BookingForm } from './components/BookingForm';
import { PhotoCarousel } from './components/PhotoCarousel';
import { GearSection } from './components/GearSection';
import { FAQSection } from './components/FAQSection';
import { generateWelcomeSlogan, generateBackdrop } from './services/geminiService';
import { GalleryImage, Llama, BookingData } from './types';
import { 
  Menu, 
  X, 
  ChevronRight, 
  Mountain,
  Plus,
  Upload,
  Loader2,
  Image as ImageIcon,
  Lock,
  Trash2,
  Users,
  Home,
  Zap,
  CheckCircle,
  Clock,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Mail,
  Save,
  LogOut,
  Edit3,
  Calendar,
  Sparkles,
  Info,
  Camera,
  Palette,
  ClipboardList,
  Phone,
  Truck,
  GraduationCap,
  Ban,
  Activity,
  MapPin,
  ExternalLink,
  CreditCard,
  Settings
} from 'lucide-react';

const APP_VERSION = "3.2.6-Production";

interface Branding {
  siteName: string;
  accentName: string;
  heroImageUrl: string;
  adminEmail: string;
  logoUrl?: string;
}

interface UploadStatus {
  current: number;
  total: number;
}

const compressImage = (base64Str: string, maxWidth = 1000, quality = 0.6): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error("Canvas context error"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
  });
};

const Logo = ({ branding, light = false, onClick }: { branding: Branding, light?: boolean, onClick?: () => void }) => {
  const accent = branding.accentName || "Llamas";
  const safeAccent = accent.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${safeAccent})`, 'gi');
  const parts = (branding.siteName || "Helena Backcountry Llamas").split(regex);
  return (
    <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={onClick}>
      <div className={`w-10 h-10 ${light ? 'bg-white text-green-800' : 'bg-green-800 text-white'} rounded-lg flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95 overflow-hidden ring-1 ring-stone-100/10`}>
        {branding.logoUrl ? (
          <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <Mountain className="w-6 h-6" />
        )}
      </div>
      <span className={`text-xl font-black tracking-tight ${light ? 'text-white' : 'text-stone-900'}`}>
        {parts.map((part, i) => (
          part.toLowerCase() === accent.toLowerCase() 
            ? <span key={i} className={`${light ? 'text-green-400' : 'text-green-800'} italic font-display`}>{part}</span>
            : <span key={i}>{part}</span>
        ))}
      </span>
    </div>
  );
};

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slogan, setSlogan] = useState("Montana’s premier backcountry packing string.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('hbl_isAdmin') === 'true');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState<'branding' | 'fleet' | 'gallery' | 'bookings' | 'billing'>('branding');
  const [passwordInput, setPasswordInput] = useState("");
  const [editingLlama, setEditingLlama] = useState<Llama | null>(null);

  const [branding, setBranding] = useState<Branding>(() => {
    const saved = localStorage.getItem('hbl_branding');
    const defaults = {
      siteName: "Helena Backcountry Llamas",
      accentName: "Llamas",
      heroImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2400",
      adminEmail: 'kevin.paul.brown@gmail.com',
      logoUrl: ''
    };
    return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
  });

  const [llamas, setLlamas] = useState<Llama[]>(() => {
    const saved = localStorage.getItem('hbl_llamas');
    return saved ? JSON.parse(saved) : LLAMAS;
  });

  const [gallery, setGallery] = useState<GalleryImage[]>(() => {
    const saved = localStorage.getItem('hbl_gallery');
    return saved ? JSON.parse(saved) : GALLERY_IMAGES;
  });

  const [bookings, setBookings] = useState<BookingData[]>([]);

  const dailyFact = useMemo(() => {
    const day = new Date().getDate();
    return LLAMA_FACTS[day % LLAMA_FACTS.length];
  }, []);

  useEffect(() => {
    generateWelcomeSlogan().then(val => { if (val) setSlogan(val); });
    const loadLogs = () => setBookings(JSON.parse(localStorage.getItem('hbl_bookings') || '[]'));
    loadLogs();
    window.addEventListener('hbl_new_booking', loadLogs);
    
    const checkApiKey = async () => {
      if (typeof window.aistudio !== 'undefined') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
    
    return () => window.removeEventListener('hbl_new_booking', loadLogs);
  }, []);

  useEffect(() => { localStorage.setItem('hbl_branding', JSON.stringify(branding)); document.title = branding.siteName; }, [branding]);
  useEffect(() => { localStorage.setItem('hbl_llamas', JSON.stringify(llamas)); }, [llamas]);
  useEffect(() => { localStorage.setItem('hbl_gallery', JSON.stringify(gallery)); }, [gallery]);
  useEffect(() => { sessionStorage.setItem('hbl_isAdmin', isAdmin.toString()); }, [isAdmin]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    // Keep internal logic but remove UI hints
    if (passwordInput === "llama123") {
      setIsAdmin(true); setShowAdminLogin(false); setPasswordInput(""); setShowDashboard(true);
    } else {
      alert("Invalid Access Key");
    }
  };

  const handleSelectKey = async () => {
    if (typeof window.aistudio !== 'undefined') {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const handleGenerateHero = async () => {
    setIsProcessing(true);
    try {
      const url = await generateBackdrop("A sweeping panorama of the Elkhorn Mountains near Helena, Montana at sunset.");
      setBranding({ ...branding, heroImageUrl: url });
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        alert("API Key expired or invalid. Please re-select your API key in the Billing tab.");
        setHasApiKey(false);
      } else {
        alert("Generation failed: " + err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBooking = (id: string, action: 'confirm' | 'cancel' | 'delete') => {
    const current = JSON.parse(localStorage.getItem('hbl_bookings') || '[]');
    let next;
    if (action === 'delete') {
      if (!confirm("Permanently delete this record?")) return;
      next = current.filter((l: any) => l.id !== id);
    } else {
      next = current.map((l: any) => l.id === id ? { ...l, status: action === 'confirm' ? 'confirmed' : 'canceled', isRead: true } : l);
    }
    localStorage.setItem('hbl_bookings', JSON.stringify(next));
    setBookings(next);
  };

  const unreadCount = bookings.filter(b => !b.isRead).length;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const optimized = await compressImage(ev.target?.result as string, 400, 0.7);
          setBranding({ ...branding, logoUrl: optimized });
        } catch (err) {
          console.error("Logo processing failed:", err);
          alert("Failed to process logo image.");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen selection:bg-green-100 selection:text-green-900">
      <button 
        onClick={() => isAdmin ? setShowDashboard(true) : setShowAdminLogin(true)}
        className="fixed bottom-8 right-8 z-[150] w-16 h-16 bg-white border border-stone-100 rounded-full shadow-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <span className="group-hover:rotate-12 transition-transform">🦙</span>
        {isAdmin && <div className="absolute top-2 right-2 w-4 h-4 bg-green-500 rounded-full ring-4 ring-white animate-pulse" />}
      </button>

      {showAdminLogin && (
        <div className="fixed inset-0 z-[300] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[4rem] p-12 max-w-sm w-full shadow-2xl animate-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-800 text-white rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl ring-8 ring-green-800/10">
               <Lock size={36} />
             </div>
             <h3 className="text-3xl font-black text-center mb-12 tracking-tight text-stone-900">Mission Control</h3>
             <form onSubmit={handleAuth} className="space-y-6">
               <input 
                type="password" 
                placeholder="Access Key" 
                className="w-full bg-stone-50 border border-stone-100 p-5 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 font-black text-center text-lg text-stone-900" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                autoFocus 
               />
               <button type="submit" className="w-full bg-green-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg hover:bg-green-900 transition-colors">Authenticate</button>
               <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full py-3 text-stone-400 font-bold text-xs uppercase tracking-widest hover:text-stone-600">Close</button>
             </form>
          </div>
        </div>
      )}

      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-700">
          <header className="bg-white border-b px-12 py-8 flex items-center justify-between shrink-0">
            <div>
              <Logo branding={branding} onClick={() => setShowDashboard(false)} />
              <div className="flex items-center gap-2 mt-1.5 opacity-50"><Activity size={10} className="text-green-500"/><span className="text-[8px] font-black uppercase tracking-[0.3em]">{APP_VERSION}</span></div>
            </div>
            <nav className="flex items-center gap-2 bg-stone-50 p-2 rounded-3xl border border-stone-100">
              {[
                { id: 'branding' as const, icon: Palette, label: 'Identity' },
                { id: 'fleet' as const, icon: Users, label: 'Herd' },
                { id: 'gallery' as const, icon: ImageIcon, label: 'Journal' },
                { id: 'bookings' as const, icon: ClipboardList, label: 'Expeditions' },
                { id: 'billing' as const, icon: CreditCard, label: 'Billing' }
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => { setAdminTab(t.id); setEditingLlama(null); }} 
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${adminTab === t.id ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:bg-stone-100'}`}
                >
                  <t.icon size={18} /> <span className="hidden lg:inline">{t.label}</span>
                  {t.id === 'bookings' && unreadCount > 0 && <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] ml-1 animate-pulse">{unreadCount}</span>}
                </button>
              ))}
            </nav>
            <div className="flex gap-4">
              <button onClick={() => setShowDashboard(false)} className="px-8 py-4 rounded-2xl border border-stone-100 font-black text-[10px] uppercase tracking-widest text-stone-500 flex items-center gap-2 hover:bg-stone-50 transition-all shadow-sm"><Home size={16} /> Public View</button>
              <button onClick={() => { setIsAdmin(false); setShowDashboard(false); }} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><LogOut size={20} /></button>
            </div>
          </header>

          <main className="flex-1 bg-stone-50/50 overflow-y-auto p-12 lg:p-24">
            <div className="max-w-7xl mx-auto">
              {adminTab === 'branding' && (
                <div className="max-w-4xl space-y-16 animate-in slide-in-from-bottom-8">
                  <header><h2 className="text-6xl font-black tracking-tighter text-stone-900 leading-none">Presence & Identity</h2><p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">Core DNA of {branding.siteName}</p></header>
                  <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-3"><label className="label-cms">Business Name</label><input className="input-cms" value={branding.siteName} onChange={e => setBranding({...branding, siteName: e.target.value})} /></div>
                      <div className="space-y-3"><label className="label-cms">Admin Email</label><input className="input-cms" value={branding.adminEmail} onChange={e => setBranding({...branding, adminEmail: e.target.value})} /></div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-3"><label className="label-cms">Branding Accent (Italic Word)</label><input className="input-cms font-black italic text-green-800" value={branding.accentName} onChange={e => setBranding({...branding, accentName: e.target.value})} /></div>
                      <div className="space-y-3">
                        <label className="label-cms">Custom Logo Asset</label>
                        <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-stone-50 border border-stone-100 rounded-2xl flex items-center justify-center overflow-hidden shadow-sm shrink-0">
                            {branding.logoUrl ? (
                              <img src={branding.logoUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="text-stone-300" />
                            )}
                          </div>
                          <div className="flex-1">
                            <input 
                              type="file" 
                              className="hidden" 
                              id="logo-upload" 
                              accept="image/*" 
                              onChange={handleLogoUpload}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => document.getElementById('logo-upload')?.click()}
                                className="bg-stone-100 text-stone-900 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center gap-2"
                              >
                                <Upload size={14} /> Upload Logo
                              </button>
                              {branding.logoUrl && (
                                <button 
                                  onClick={() => setBranding({...branding, logoUrl: ''})}
                                  className="text-red-500 px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all"
                                >
                                  Reset
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="label-cms">Hero Cinematic Backdrop</label>
                      <div className="flex gap-4">
                        <input className="input-cms flex-1" value={branding.heroImageUrl} onChange={e => setBranding({...branding, heroImageUrl: e.target.value})} />
                        <button 
                          onClick={handleGenerateHero}
                          disabled={isProcessing}
                          className="bg-stone-900 text-white px-8 rounded-2xl flex items-center gap-2 hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                        >
                          {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                          AI Render
                        </button>
                      </div>
                    </div>
                    <div className="pt-8 border-t flex items-center gap-4 text-green-700 font-black uppercase text-[10px] tracking-widest"><CheckCircle size={16}/> State persisted to secure local storage</div>
                  </div>
                </div>
              )}

              {adminTab === 'fleet' && (
                <div className="space-y-16 animate-in slide-in-from-bottom-8">
                   <header className="flex justify-between items-end">
                    <div><h2 className="text-6xl font-black tracking-tighter text-stone-900 leading-none">The Herd</h2><p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">Manage active pack animal string</p></div>
                    {!editingLlama && <button onClick={() => setEditingLlama({ id: Date.now().toString(), name: 'New Llama', age: 4, personality: 'A fresh recruit to the mountain string.', maxLoad: 75, imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800', specialty: 'Backpacking' })} className="bg-green-800 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-green-900 transition-all active:scale-95"><Plus size={20}/> New Recruit</button>}
                  </header>
                  {editingLlama ? (
                    <div className="bg-white p-16 rounded-[5rem] shadow-2xl border border-stone-100 animate-in zoom-in duration-500">
                       <div className="flex items-center gap-6 mb-16">
                         <button onClick={() => setEditingLlama(null)} className="p-5 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><ChevronLeft size={24}/></button>
                         <h4 className="text-4xl font-black text-stone-900">Editing: {editingLlama.name}</h4>
                       </div>
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
                          <div className="space-y-8">
                             <label className="label-cms">Llama Portrait</label>
                             <div 
                                className="aspect-[4/5] bg-stone-50 rounded-[4rem] overflow-hidden border-8 border-white shadow-2xl group relative cursor-pointer ring-1 ring-stone-100 hover:ring-green-500 transition-all"
                                onClick={() => document.getElementById('llama-upload')?.click()}
                              >
                               <img src={editingLlama.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Llama" />
                               <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity backdrop-blur-sm"><Camera size={44} /></div>
                               <input id="llama-upload" type="file" className="hidden" accept="image/*" onChange={async e => {
                                 const file = e.target.files?.[0];
                                 if (file) {
                                   setIsProcessing(true);
                                   const reader = new FileReader();
                                   reader.onload = async ev => {
                                     const optimized = await compressImage(ev.target?.result as string);
                                     setEditingLlama({...editingLlama, imageUrl: optimized});
                                     setIsProcessing(false);
                                   };
                                   reader.readAsDataURL(file);
                                 }
                               }} />
                             </div>
                             <p className="text-center text-stone-400 font-bold uppercase text-[9px] tracking-widest">Click photo to upload new portrait</p>
                          </div>
                          <div className="space-y-10">
                             <div className="grid grid-cols-2 gap-8">
                               <div className="space-y-2"><label className="label-cms">Call Name</label><input className="input-cms" value={editingLlama.name} onChange={e => setEditingLlama({...editingLlama, name: e.target.value})} /></div>
                               <div className="space-y-2"><label className="label-cms">Specialty</label><select className="input-cms" value={editingLlama.specialty} onChange={e => setEditingLlama({...editingLlama, specialty: e.target.value as any})}><option>Backpacking</option><option>Hunting</option><option>Lead Llama</option><option>Gentle Soul</option></select></div>
                             </div>
                             <div className="grid grid-cols-2 gap-8">
                               <div className="space-y-2"><label className="label-cms">Age</label><input type="number" className="input-cms" value={editingLlama.age} onChange={e => setEditingLlama({...editingLlama, age: parseInt(e.target.value)})} /></div>
                               <div className="space-y-2"><label className="label-cms">Max Load (lbs)</label><input type="number" className="input-cms" value={editingLlama.maxLoad} onChange={e => setEditingLlama({...editingLlama, maxLoad: parseInt(e.target.value)})} /></div>
                             </div>
                             <div className="space-y-2"><label className="label-cms">Intelligence & Personality</label><textarea className="input-cms h-48 resize-none leading-relaxed text-lg" value={editingLlama.personality} onChange={e => setEditingLlama({...editingLlama, personality: e.target.value})} /></div>
                             <button onClick={() => {
                               setLlamas(prev => {
                                 const idx = prev.findIndex(l => l.id === editingLlama.id);
                                 if (idx > -1) { const n = [...prev]; n[idx] = editingLlama; return n; }
                                 return [editingLlama, ...prev];
                               });
                               setEditingLlama(null);
                             }} className="w-full bg-green-800 text-white py-8 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:bg-green-900 transition-all active:scale-[0.98]"><Save size={28}/> Commit Changes</button>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                      {llamas.map(l => (
                        <div key={l.id} className="bg-white p-8 rounded-[4rem] border border-stone-100 shadow-xl group hover:shadow-2xl transition-all">
                           <div className="aspect-square rounded-[2.5rem] overflow-hidden mb-8 border-4 border-stone-50"><img src={l.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" alt={l.name} /></div>
                           <h4 className="text-2xl font-black text-stone-900 tracking-tight leading-none mb-4">{l.name}</h4>
                           <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 px-3 py-1.5 rounded-full inline-block tracking-widest">{l.specialty}</span>
                           <div className="flex gap-3 mt-12">
                              <button onClick={() => setEditingLlama({...l})} className="flex-1 bg-stone-900 text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors"><Edit3 size={16}/> Edit</button>
                              <button onClick={() => { if(confirm(`Retire ${l.name}?`)) setLlamas(prev => prev.filter(x => x.id !== l.id)); }} className="p-5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
                           </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'gallery' && (
                <div className="space-y-16 animate-in slide-in-from-bottom-8">
                   <header className="flex justify-between items-end">
                    <div><h2 className="text-6xl font-black tracking-tighter text-stone-900 leading-none">Journal</h2><p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">Expedition visual curated feed</p></div>
                    <button onClick={() => document.getElementById('gallery-upload')?.click()} className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-black transition-all active:scale-95"><Upload size={20}/> Batch Import</button>
                    <input id="gallery-upload" type="file" multiple className="hidden" accept="image/*" onChange={async e => {
                      const files = e.target.files; if (!files) return;
                      setIsProcessing(true);
                      setUploadStatus({ current: 0, total: files.length });
                      const newImages: GalleryImage[] = [];
                      for (let i = 0; i < files.length; i++) {
                        setUploadStatus({ current: i + 1, total: files.length });
                        const raw = await new Promise<string>(res => {
                          const r = new FileReader(); r.onload = ev => res(ev.target?.result as string); r.readAsDataURL(files[i]);
                        });
                        const opt = await compressImage(raw, 1200, 0.5);
                        newImages.push({ url: opt, caption: "Expedition Moment" });
                      }
                      setGallery(prev => [...newImages, ...prev]);
                      setIsProcessing(false);
                      setUploadStatus(null);
                    }} />
                  </header>
                  <div className="bg-white p-12 rounded-[5rem] shadow-2xl border border-stone-100">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                       {gallery.map((img, idx) => (
                         <div key={idx} className="aspect-square bg-stone-50 rounded-[2.5rem] overflow-hidden relative group border-2 border-stone-50 hover:border-green-200 transition-all shadow-sm">
                           <img src={img.url} className="w-full h-full object-cover" alt="Journal" />
                           <div className="absolute inset-0 bg-stone-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-all p-6 backdrop-blur-md">
                             <div className="flex gap-2">
                                <button onClick={() => {
                                  if (idx === 0) return;
                                  const n = [...gallery]; [n[idx], n[idx-1]] = [n[idx-1], n[idx]]; setGallery(n);
                                }} className="w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-stone-950 rounded-xl flex items-center justify-center transition-all"><ArrowUp size={20}/></button>
                                <button onClick={() => {
                                  if (idx === gallery.length-1) return;
                                  const n = [...gallery]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; setGallery(n);
                                }} className="w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-stone-950 rounded-xl flex items-center justify-center transition-all"><ArrowDown size={20}/></button>
                             </div>
                             <button onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))} className="w-full py-3 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Delete</button>
                           </div>
                           <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">#{idx + 1}</div>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'bookings' && (
                <div className="space-y-16 animate-in slide-in-from-bottom-8">
                  <header><h2 className="text-6xl font-black tracking-tighter text-stone-900 leading-none">Expedition Logs</h2><p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">Review incoming deployment requests</p></header>
                  <div className="space-y-8">
                    {bookings.length === 0 ? (
                      <div className="bg-white p-40 rounded-[5rem] border-4 border-dashed border-stone-100 flex flex-col items-center text-stone-200 shadow-inner"><Clock size={80} className="mb-8 opacity-40"/><p className="font-black uppercase tracking-widest text-sm">No trail logs found.</p></div>
                    ) : (
                      bookings.map(b => (
                        <div key={b.id} className={`bg-white p-12 rounded-[4rem] border transition-all flex flex-col lg:flex-row items-center justify-between gap-12 shadow-xl hover:shadow-2xl relative ${!b.isRead ? 'border-green-800/30 ring-4 ring-green-800/5' : 'border-stone-100'}`}>
                           <div className="flex flex-col sm:flex-row items-center gap-10 text-center sm:text-left flex-1 w-full">
                              <div className={`w-24 h-24 rounded-[2.5rem] flex flex-col items-center justify-center shrink-0 shadow-xl ${b.status === 'confirmed' ? 'bg-green-800 text-white' : b.status === 'canceled' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>
                                {b.status === 'confirmed' ? <CheckCircle size={40}/> : b.status === 'canceled' ? <Ban size={40}/> : <Clock size={40}/>}
                              </div>
                              <div className="flex-1">
                                <h4 className="text-4xl font-black text-stone-900 tracking-tight leading-none mb-4">{b.name}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                  <div className="space-y-1"><p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Dates</p><p className="font-bold text-stone-900 flex items-center gap-2 text-sm"><Calendar size={14}/> {b.startDate} to {b.endDate}</p></div>
                                  <div className="space-y-1"><p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Llamas</p><p className="font-bold text-stone-900 flex items-center gap-2 text-sm"><Users size={14}/> {b.numLlamas} animals</p></div>
                                  <div className="space-y-1"><p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Contact</p><p className="font-bold text-stone-900 flex items-center gap-2 text-sm"><Mail size={14}/> {b.email}</p></div>
                                </div>
                              </div>
                           </div>
                           <div className="flex gap-4 w-full lg:w-auto">
                              {b.status === 'pending' && (
                                <>
                                  <button onClick={() => updateBooking(b.id, 'confirm')} className="flex-1 px-8 py-5 bg-green-800 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-green-900 transition-all">Confirm</button>
                                  <button onClick={() => updateBooking(b.id, 'cancel')} className="flex-1 px-8 py-5 bg-stone-100 text-stone-500 rounded-3xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all">Cancel</button>
                                </>
                              )}
                              <button onClick={() => updateBooking(b.id, 'delete')} className="p-6 bg-red-50 text-red-500 rounded-3xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={24}/></button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {adminTab === 'billing' && (
                <div className="max-w-4xl space-y-16 animate-in slide-in-from-bottom-8">
                  <header><h2 className="text-6xl font-black tracking-tighter text-stone-900 leading-none">Billing & API</h2><p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">Secure connection to Google AI services</p></header>
                  <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-10">
                    <div className="flex items-center justify-between gap-12 bg-stone-50 p-10 rounded-[2.5rem] border border-stone-100">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full animate-pulse ${hasApiKey ? 'bg-green-500' : 'bg-orange-500'}`} />
                          <h4 className="text-2xl font-black tracking-tight">{hasApiKey ? 'API Connection Active' : 'API Setup Required'}</h4>
                        </div>
                        <p className="text-stone-500 text-sm font-medium leading-relaxed max-w-md">To generate high-quality images and use advanced reasoning, you must connect a Google AI Studio API key from a paid GCP project.</p>
                      </div>
                      <button 
                        onClick={handleSelectKey}
                        className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all active:scale-95"
                      >
                        <Settings size={20}/> {hasApiKey ? 'Reconfigure Key' : 'Connect API Key'}
                      </button>
                    </div>

                    <div className="flex items-start gap-6 bg-blue-50/50 p-8 rounded-[2rem] border border-blue-100">
                      <Info className="text-blue-500 shrink-0 mt-1" />
                      <div>
                        <h5 className="font-black text-blue-900 text-sm uppercase tracking-widest mb-2">Important Notice</h5>
                        <p className="text-blue-700/70 text-sm leading-relaxed">Advanced features like AI image rendering require a paid API key. You can manage your keys and billing at the <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-blue-900 transition-colors">Google AI Studio Billing Portal</a>.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {!showDashboard && (
        <>
          <nav className="fixed w-full z-[100] bg-white/95 backdrop-blur-2xl border-b h-24 flex items-center shadow-sm">
            <div className="max-w-7xl mx-auto px-8 w-full flex justify-between items-center">
              <Logo branding={branding} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <div className="hidden md:flex items-center gap-12 font-black uppercase text-[11px] tracking-[0.2em]">
                {['Benefits', 'About', 'Gear', 'Gallery', 'FAQ', 'Contact'].map(item => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="text-stone-500 hover:text-green-800 transition-all py-2 border-b-2 border-transparent hover:border-green-800">{item}</a>
                ))}
                <a href="#booking" className="bg-green-800 text-white px-10 py-5 rounded-2xl flex items-center gap-2 shadow-2xl shadow-green-900/20 hover:bg-green-900 transition-all active:scale-95">Book Trek <ChevronRight size={14} /></a>
              </div>
              <button className="md:hidden p-3 text-stone-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={28} /> : <Menu size={28} />}</button>
            </div>
          </nav>

          <div className={`fixed inset-0 z-[110] bg-stone-950 transition-all duration-700 md:hidden ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <div className="p-16 pt-32 flex flex-col h-full space-y-12">
              {['Benefits', 'About', 'Gear', 'Gallery', 'FAQ', 'Contact'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-6xl font-black text-white hover:text-green-400 transition-all tracking-tighter uppercase">{l}</a>
              ))}
              <a href="#booking" onClick={() => setIsMenuOpen(false)} className="bg-green-600 text-white py-12 rounded-[3rem] text-3xl font-black uppercase tracking-widest text-center shadow-2xl">Plan My Trek</a>
            </div>
          </div>

          <main>
            <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
              <div className="absolute inset-0 -z-10"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.4] scale-105 animate-in zoom-in duration-[10000ms]" alt="Landscape" /></div>
              <div className="max-w-5xl px-8 text-white">
                <h1 className="text-7xl md:text-9xl font-black mb-12 leading-[0.85] tracking-tighter animate-in slide-in-from-top-12 duration-1000">Master the Montana Peaks. <br /><span className="italic text-green-400 font-light font-display">Elite Strings for the High Country.</span></h1>
                <p className="text-2xl md:text-4xl text-stone-200 mb-20 max-w-4xl mx-auto font-medium leading-relaxed tracking-tight">{slogan}</p>
                <a href="#booking" className="bg-green-600 px-20 py-8 rounded-3xl text-3xl font-black shadow-2xl shadow-green-900/40 hover:bg-green-500 transition-all active:scale-95 inline-block">Secure Your String</a>
              </div>
            </section>

            <section id="benefits" className="py-64 bg-white"><div className="max-w-7xl mx-auto px-8"><h2 className="text-8xl font-black mb-32 text-center tracking-tighter leading-none">Intelligence.</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-16">{BENEFITS.map((b,i)=>(<div key={i} className="p-12 bg-stone-50 rounded-[4rem] border border-stone-100 hover:border-green-200 hover:bg-white transition-all group hover:shadow-2xl duration-500 text-center"><div className="mb-12 flex justify-center group-hover:scale-110 transition-transform duration-500 text-green-700">{b.icon}</div><h3 className="text-3xl font-black mb-6 tracking-tight leading-none">{b.title}</h3><p className="text-stone-500 font-medium leading-relaxed text-lg">{b.description}</p></div>))}</div></div></section>
            <section id="about" className="py-64 bg-stone-100"><div className="max-w-7xl mx-auto px-8"><h2 className="text-8xl font-black mb-32 text-center tracking-tighter leading-none">The Herd.</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">{llamas.map(l=><LlamaCard key={l.id} llama={l} />)}</div></div></section>
            <section id="gear" className="py-64 bg-white"><div className="max-w-7xl mx-auto px-8"><h2 className="text-8xl font-black mb-32 text-center tracking-tighter leading-none">Expedition Assets.</h2><GearSection /></div></section>
            <section id="gallery" className="py-64 bg-stone-950 text-white"><div className="max-w-7xl mx-auto px-8"><header className="flex flex-col md:flex-row justify-between items-end mb-32 gap-8"><h2 className="text-9xl font-black tracking-tighter leading-none">Journal.</h2><div className="bg-white/5 border border-white/10 px-12 py-6 rounded-full text-green-400 font-black uppercase tracking-widest text-xs">High Country Field Notes</div></header><PhotoCarousel images={gallery} /></div></section>
            <section id="faq" className="py-64 bg-stone-50"><div className="max-w-7xl mx-auto px-8"><FAQSection /></div></section>
            <section id="booking" className="py-64 bg-white"><div className="max-w-5xl mx-auto px-8 text-center"><h2 className="text-8xl font-black mb-32 tracking-tighter leading-none">Logistics.</h2><BookingForm /></div></section>
            
            <section id="contact" className="py-64 bg-stone-50 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-32 opacity-[0.03] rotate-12 pointer-events-none">
                 <Mountain size={600} />
               </div>
               <div className="max-w-7xl mx-auto px-8 relative z-10">
                 <header className="text-center mb-24">
                   <h2 className="text-8xl font-black tracking-tighter leading-none mb-8">Base Camp.</h2>
                   <p className="text-stone-500 text-xl font-medium max-w-2xl mx-auto">Reach out to finalize your high country deployment intel.</p>
                 </header>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                   <div className="bg-white p-16 rounded-[4rem] border border-stone-100 shadow-xl group hover:shadow-2xl transition-all duration-500">
                     <div className="w-20 h-20 bg-green-50 text-green-800 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-green-800 group-hover:text-white transition-all shadow-lg">
                       <MapPin size={36} />
                     </div>
                     <h3 className="text-2xl font-black mb-4 tracking-tight">Deployment Point</h3>
                     <p className="text-stone-500 font-medium leading-relaxed mb-10">310 Lump Gulch Road<br />Clancy, MT 59634</p>
                     <a href="https://www.google.com/maps/search/310+Lump+Gulch+Road+Clancy,+MT+59634" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-800 font-black text-xs uppercase tracking-widest hover:gap-4 transition-all">
                       Get Bearings <ExternalLink size={14} />
                     </a>
                   </div>

                   <div className="bg-white p-16 rounded-[4rem] border border-stone-100 shadow-xl group hover:shadow-2xl transition-all duration-500">
                     <div className="w-20 h-20 bg-green-50 text-green-800 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-green-800 group-hover:text-white transition-all shadow-lg">
                       <Phone size={36} />
                     </div>
                     <h3 className="text-2xl font-black mb-4 tracking-tight">Direct Line</h3>
                     <p className="text-stone-500 font-medium leading-relaxed mb-10">Available for trail updates and technical kit support.</p>
                     <a href="tel:8013720353" className="text-3xl font-black text-stone-900 hover:text-green-800 transition-colors">801-372-0353</a>
                   </div>

                   <div className="bg-white p-16 rounded-[4rem] border border-stone-100 shadow-xl group hover:shadow-2xl transition-all duration-500">
                     <div className="w-20 h-20 bg-green-50 text-green-800 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-green-800 group-hover:text-white transition-all shadow-lg">
                       <Mail size={36} />
                     </div>
                     <h3 className="text-2xl font-black mb-4 tracking-tight">Dispatch</h3>
                     <p className="text-stone-500 font-medium leading-relaxed mb-10">Send over your itinerary or custom hunt requests.</p>
                     <a href="mailto:kevin.paul.brown@gmail.com" className="font-black text-stone-900 border-b-4 border-green-800/20 hover:border-green-800 transition-all py-1">kevin.paul.brown@gmail.com</a>
                   </div>
                 </div>
               </div>
            </section>
          </main>

          <footer className="bg-stone-950 text-stone-500 pt-48 pb-24 border-t border-white/5 relative">
            <div className="max-w-7xl mx-auto px-8">
              <div className="mb-24 p-12 bg-white/5 rounded-[3rem] border border-white/10 flex flex-col md:flex-row items-center gap-8 group transition-all hover:bg-white/[0.08] hover:border-green-500/30">
                <div className="w-16 h-16 bg-green-800/20 text-green-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-green-900/20">
                  <Sparkles size={24} className="animate-float" />
                </div>
                <div className="flex-1">
                  <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-green-500 mb-2">Llama Fact of the Day</h5>
                  <p className="text-stone-300 text-lg md:text-xl font-medium italic leading-relaxed">"{dailyFact}"</p>
                </div>
                <div className="hidden lg:block">
                   <Mountain size={48} className="text-white/5" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-24 mb-32">
                <div className="space-y-10 max-w-xl">
                  <Logo branding={branding} light onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                  <p className="text-stone-500 font-medium leading-relaxed text-lg">Providing elite mountain-trained pack strings for adventures since 2018. We specialize in low-impact, high-efficiency wilderness logistics across the Montana Rockies.</p>
                  <div className="space-y-2 pt-4">
                    <p className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-green-500"/> 310 Lump Gulch Road, Clancy, MT 59634</p>
                    <p className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><Phone size={14} className="text-green-500"/> 801-372-0353</p>
                    <p className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><Mail size={14} className="text-green-500"/> kevin.paul.brown@gmail.com</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-24">
                  <div className="space-y-8"><h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Exploration</h4><ul className="space-y-4 text-xs font-bold uppercase tracking-widest"><li><a href="#benefits" className="hover:text-green-500 transition-colors">Benefits</a></li><li><a href="#about" className="hover:text-green-500 transition-colors">The Herd</a></li><li><a href="#gear" className="hover:text-green-500 transition-colors">Gear Kit</a></li></ul></div>
                  <div className="space-y-8"><h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Intel</h4><ul className="space-y-4 text-xs font-bold uppercase tracking-widest"><li><a href="#faq" className="hover:text-green-500 transition-colors">Field Manual</a></li><li><a href="#booking" className="hover:text-green-500 transition-colors">Deployment</a></li><li><a href="#contact" className="hover:text-green-500 transition-colors">Base Camp</a></li></ul></div>
                </div>
              </div>
              <div className="pt-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12 text-[10px] font-black uppercase tracking-[0.5em]">
                <p>© {new Date().getFullYear()} {branding.siteName}</p>
                <div className="flex gap-12 text-stone-800"><span>Helena, MT</span><span>46.5891° N, 112.0391° W</span></div>
              </div>
            </div>
          </footer>
        </>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[500] bg-stone-950/80 backdrop-blur-3xl flex items-center justify-center">
          <div className="bg-white px-20 py-24 rounded-[5rem] shadow-2xl flex flex-col items-center gap-12 animate-in zoom-in w-full max-w-lg mx-6 text-center">
             <div className="w-24 h-24 bg-green-800 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-bounce"><Zap size={48} /></div>
             <div>
               <h3 className="text-4xl font-black text-stone-900 mb-4 tracking-tighter">
                 {uploadStatus ? "Syncing Terrain Assets" : "Optimizing Visuals"}
               </h3>
               {uploadStatus ? (
                 <div className="space-y-6">
                    <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px]">Deploying Entry {uploadStatus.current} of {uploadStatus.total}</p>
                    <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden shadow-inner ring-1 ring-stone-200"><div className="h-full bg-green-800 transition-all duration-500" style={{ width: `${(uploadStatus.current / uploadStatus.total) * 100}%` }} /></div>
                 </div>
               ) : <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px]">Polishing High-Res Expedition Intel...</p>}
             </div>
             <Loader2 className="w-12 h-12 text-green-800 animate-spin mt-4" />
          </div>
        </div>
      )}

      <style>{`
        .label-cms { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #a8a29e; margin-bottom: 0.75rem; letter-spacing: 0.3em; }
        .input-cms { width: 100%; background-color: #fafaf9; border: 1px solid #f5f5f4; padding: 1.5rem; border-radius: 1.5rem; font-weight: 700; outline: none; transition: all 0.2s; color: #1c1917; }
        .input-cms:focus { background-color: white; border-color: #166534; box-shadow: 0 0 0 6px rgba(22, 101, 52, 0.05); }
      `}</style>
    </div>
  );
};

export default App;