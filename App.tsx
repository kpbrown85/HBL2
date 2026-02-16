
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LLAMAS, GALLERY_IMAGES, BENEFITS, LLAMA_FACTS } from './constants';
import { LlamaCard } from './components/LlamaCard';
import { BookingForm } from './components/BookingForm';
import { PhotoCarousel } from './components/PhotoCarousel';
import { GearSection } from './components/GearSection';
import { FAQSection } from './components/FAQSection';
import { generateWelcomeSlogan } from './services/geminiService';
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
  Settings,
  Palette,
  ClipboardList,
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
  Info
} from 'lucide-react';

// --- Types ---
interface Branding {
  siteName: string;
  accentName: string;
  heroImageUrl: string;
  adminEmail: string;
}

// --- Image Compression Utility ---
const compressImage = (base64Str: string, maxWidth = 1200, quality = 0.7): Promise<string> => {
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
      if (!ctx) return reject(new Error("Canvas failed"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
  });
};

// --- Sub-Components ---
const Logo = ({ branding, light = false, onClick }: { branding: Branding, light?: boolean, onClick?: () => void }) => {
  const accent = branding.accentName || "Llamas";
  const safeAccent = accent.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${safeAccent})`, 'gi');
  const parts = (branding.siteName || "Helena Backcountry Llamas").split(regex);
  return (
    <div className="flex items-center gap-3 cursor-pointer select-none" onClick={onClick}>
      <div className={`w-10 h-10 ${light ? 'bg-white text-green-800' : 'bg-green-800 text-white'} rounded-lg flex items-center justify-center shadow-lg shrink-0`}>
        <Mountain className="w-6 h-6" />
      </div>
      <span className={`text-xl font-black tracking-tight ${light ? 'text-white' : 'text-stone-900'}`}>
        {parts.map((part, i) => (
          part.toLowerCase() === accent.toLowerCase() 
            ? <span key={i} className={`${light ? 'text-green-400' : 'text-green-800'} italic`}>{part}</span>
            : <span key={i}>{part}</span>
        ))}
      </span>
    </div>
  );
};

const LlamaFact = () => {
  const fact = useMemo(() => {
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
    return LLAMA_FACTS[dayOfYear % LLAMA_FACTS.length];
  }, []);

  return (
    <div className="bg-green-50 border border-green-100 p-8 rounded-[2.5rem] flex items-start gap-6 group hover:shadow-xl transition-all duration-500 max-w-xl">
      <div className="w-14 h-14 bg-green-800 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform">
        <Sparkles size={24} />
      </div>
      <div>
        <h5 className="text-[10px] font-black uppercase text-green-700 tracking-[0.3em] mb-2">Llama Fact of the Day</h5>
        <p className="text-stone-700 font-medium leading-relaxed italic">"{fact}"</p>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  // --- Global UI State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slogan, setSlogan] = useState("Helena’s premier mountain-trained pack string.");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // --- Admin Logic State ---
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('hbl_isAdmin') === 'true');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState<'branding' | 'fleet' | 'gallery' | 'bookings'>('branding');
  const [passwordInput, setPasswordInput] = useState("");
  const [editingLlama, setEditingLlama] = useState<Llama | null>(null);

  // --- Content State ---
  const [branding, setBranding] = useState<Branding>(() => {
    const saved = localStorage.getItem('hbl_branding');
    const defaults = {
      siteName: "Helena Backcountry Llamas",
      accentName: "Llamas",
      heroImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2400",
      adminEmail: 'kevin.paul.brown@gmail.com'
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

  // --- Refs ---
  const galleryRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  // --- Persistence & Lifecycle ---
  useEffect(() => {
    generateWelcomeSlogan().then(val => { if (val) setSlogan(val); });
    const loadLogs = () => setBookings(JSON.parse(localStorage.getItem('hbl_bookings') || '[]'));
    loadLogs();
    window.addEventListener('hbl_new_booking', loadLogs);
    return () => window.removeEventListener('hbl_new_booking', loadLogs);
  }, []);

  useEffect(() => { localStorage.setItem('hbl_branding', JSON.stringify(branding)); document.title = branding.siteName; }, [branding]);
  useEffect(() => { localStorage.setItem('hbl_llamas', JSON.stringify(llamas)); }, [llamas]);
  useEffect(() => { localStorage.setItem('hbl_gallery', JSON.stringify(gallery)); }, [gallery]);
  useEffect(() => { sessionStorage.setItem('hbl_isAdmin', isAdmin.toString()); }, [isAdmin]);

  // --- Handlers ---
  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "llama123") {
      setIsAdmin(true); setShowAdminLogin(false); setPasswordInput(""); setShowDashboard(true);
    } else {
      alert("Unauthorized Access Key");
    }
  };

  const handleFleetAction = (action: 'save' | 'delete', llama?: Llama) => {
    if (action === 'save' && editingLlama) {
      setLlamas(prev => {
        const idx = prev.findIndex(l => l.id === editingLlama.id);
        if (idx > -1) { const next = [...prev]; next[idx] = editingLlama; return next; }
        return [editingLlama, ...prev];
      });
      setEditingLlama(null);
    } else if (action === 'delete' && llama) {
      if (confirm(`Retire ${llama.name} from the active herd?`)) {
        setLlamas(prev => prev.filter(l => l.id !== llama.id));
      }
    }
  };

  const moveGallery = (idx: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[idx], next[target]] = [next[target], next[idx]];
    setGallery(next);
  };

  const updateLogs = (id: string, action: 'confirm' | 'delete') => {
    const current = JSON.parse(localStorage.getItem('hbl_bookings') || '[]');
    let next;
    if (action === 'delete') {
      if (!confirm("Permanently purge this expedition log?")) return;
      next = current.filter((l: any) => l.id !== id);
    } else {
      next = current.map((l: any) => l.id === id ? { ...l, status: 'confirmed' as const, isRead: true } : l);
    }
    localStorage.setItem('hbl_bookings', JSON.stringify(next));
    setBookings(next);
  };

  const unreadCount = bookings.filter(b => !b.isRead).length;

  return (
    <div className="min-h-screen">
      {/* 🦙 CMS ACCESS (Floating Top Right) */}
      <button 
        onClick={() => isAdmin ? setShowDashboard(true) : setShowAdminLogin(true)}
        className="fixed top-6 right-6 z-[120] w-14 h-14 bg-white border border-stone-100 rounded-full shadow-2xl flex items-center justify-center text-3xl hover:scale-110 active:scale-95 transition-all group overflow-hidden"
        title="Admin Mission Control"
      >
        <span className="group-hover:rotate-12 transition-transform">🦙</span>
        {isAdmin && <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white animate-pulse" />}
      </button>

      {/* LOGIN MODAL */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[250] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[4rem] p-12 max-w-sm w-full shadow-2xl animate-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-800 text-white rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl ring-8 ring-green-800/10">
               <Lock size={36} />
             </div>
             <h3 className="text-3xl font-black text-center mb-2 tracking-tight">Mission Control</h3>
             <p className="text-stone-400 text-center text-[10px] font-black uppercase tracking-[0.2em] mb-12">Authorized Access Only</p>
             <form onSubmit={handleAuth} className="space-y-6">
               <input 
                type="password" 
                placeholder="Key (llama123)" 
                className="w-full bg-stone-50 border border-stone-100 p-5 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 font-black text-lg" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                autoFocus 
               />
               <div className="flex gap-4">
                 <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 bg-stone-100 py-5 rounded-2xl font-black text-xs uppercase tracking-widest text-stone-500 hover:bg-stone-200 transition-colors">Abort</button>
                 <button type="submit" className="flex-[2] bg-green-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-green-900 transition-colors">Authenticate</button>
               </div>
             </form>
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-8">
          <header className="bg-white border-b px-8 py-6 flex items-center justify-between shrink-0">
            <Logo branding={branding} onClick={() => setShowDashboard(false)} />
            <nav className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-3xl border border-stone-100">
              {[
                { id: 'branding' as const, icon: Palette, label: 'Identity' },
                { id: 'fleet' as const, icon: Users, label: 'Herd' },
                { id: 'gallery' as const, icon: ImageIcon, label: 'Journal' },
                { id: 'bookings' as const, icon: ClipboardList, label: 'Logs' }
              ].map(t => (
                <button key={t.id} onClick={() => { setAdminTab(t.id); setEditingLlama(null); }} className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${adminTab === t.id ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:bg-stone-100'}`}>
                  <t.icon size={18} /> <span className="hidden lg:inline">{t.label}</span>
                  {t.id === 'bookings' && unreadCount > 0 && <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] ml-1">{unreadCount}</span>}
                </button>
              ))}
            </nav>
            <div className="flex gap-4">
              <button onClick={() => setShowDashboard(false)} className="px-8 py-4 rounded-2xl border border-stone-100 font-black text-[10px] uppercase tracking-widest text-stone-500 flex items-center gap-2 hover:bg-stone-50 transition-all shadow-sm"><Home size={16} /> Exit CMS</button>
              <button onClick={() => { setIsAdmin(false); setShowDashboard(false); }} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><LogOut size={20} /></button>
            </div>
          </header>

          <main className="flex-1 bg-stone-50/50 overflow-y-auto p-12 sm:p-20">
            <div className="max-w-7xl mx-auto">
              {adminTab === 'branding' && (
                <div className="max-w-4xl space-y-16 animate-in slide-in-from-bottom-8">
                  <header><h2 className="text-5xl font-black tracking-tighter">Presence & Identity</h2><p className="text-stone-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Manage the foundational DNA of Helena Backcountry Llamas</p></header>
                  <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-3"><label className="label-cms">Business Name</label><input className="input-cms" value={branding.siteName} onChange={e => setBranding({...branding, siteName: e.target.value})} /></div>
                      <div className="space-y-3"><label className="label-cms">Notification Email</label><input className="input-cms" value={branding.adminEmail} onChange={e => setBranding({...branding, adminEmail: e.target.value})} /></div>
                    </div>
                    <div className="space-y-3"><label className="label-cms">Style Accent (Italic Word)</label><input className="input-cms font-black italic text-green-800" value={branding.accentName} onChange={e => setBranding({...branding, accentName: e.target.value})} /></div>
                    <div className="space-y-3"><label className="label-cms">Hero Landscape Image URL</label><input className="input-cms" value={branding.heroImageUrl} onChange={e => setBranding({...branding, heroImageUrl: e.target.value})} /></div>
                  </div>
                </div>
              )}

              {adminTab === 'fleet' && (
                <div className="space-y-16 animate-in slide-in-from-bottom-8">
                   <header className="flex justify-between items-end">
                    <div><h2 className="text-5xl font-black tracking-tighter">The Heritage Herd</h2><p className="text-stone-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Manage active pack animal deployments</p></div>
                    {!editingLlama && <button onClick={() => setEditingLlama({ id: Date.now().toString(), name: 'New Recruit', age: 4, personality: 'Steady and observant mountain partner.', maxLoad: 75, imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800', specialty: 'Backpacking' })} className="bg-green-800 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-green-900 transition-all"><Plus size={20}/> New Asset</button>}
                  </header>
                  {editingLlama ? (
                    <div className="bg-white p-16 rounded-[5rem] shadow-2xl border border-stone-100 animate-in zoom-in duration-500">
                       <div className="flex items-center gap-6 mb-16"><button onClick={() => setEditingLlama(null)} className="p-5 bg-stone-50 rounded-full hover:bg-stone-100 transition-colors"><ChevronLeft size={24}/></button><h4 className="text-4xl font-black">Editor: {editingLlama.name}</h4></div>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-20">
                          <div className="space-y-8">
                            <div className="aspect-[4/5] bg-stone-50 rounded-[3.5rem] overflow-hidden border-8 border-white shadow-2xl group relative cursor-pointer">
                              <img src={editingLlama.imageUrl} className="w-full h-full object-cover" />
                              <button onClick={() => photoRef.current?.click()} className="absolute inset-0 bg-stone-900/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white font-black text-[10px] uppercase tracking-[0.4em] transition-all backdrop-blur-sm"><ImageIcon className="mb-4" size={40} /> Swap Visual Asset</button>
                            </div>
                            <input type="file" ref={photoRef} className="hidden" accept="image/*" onChange={async e => {
                              const f = e.target.files?.[0]; if (f) { setIsProcessing(true); const r = new FileReader(); r.onload = async ev => { const opt = await compressImage(ev.target?.result as string); setEditingLlama({...editingLlama, imageUrl: opt}); setIsProcessing(false); }; r.readAsDataURL(f); }
                            }} />
                          </div>
                          <div className="space-y-10">
                             <div className="grid grid-cols-2 gap-8">
                               <div className="space-y-2"><label className="label-cms">Call Name</label><input className="input-cms" value={editingLlama.name} onChange={e => setEditingLlama({...editingLlama, name: e.target.value})} /></div>
                               <div className="space-y-2"><label className="label-cms">Specialty</label><select className="input-cms" value={editingLlama.specialty} onChange={e => setEditingLlama({...editingLlama, specialty: e.target.value as any})}><option>Backpacking</option><option>Hunting</option><option>Lead Llama</option><option>Gentle Soul</option></select></div>
                             </div>
                             <div className="grid grid-cols-2 gap-8">
                               <div className="space-y-2"><label className="label-cms">Age (Years)</label><input type="number" className="input-cms" value={editingLlama.age} onChange={e => setEditingLlama({...editingLlama, age: parseInt(e.target.value)})} /></div>
                               <div className="space-y-2"><label className="label-cms">Max Payload (lbs)</label><input type="number" className="input-cms" value={editingLlama.maxLoad} onChange={e => setEditingLlama({...editingLlama, maxLoad: parseInt(e.target.value)})} /></div>
                             </div>
                             <div className="space-y-2"><label className="label-cms">Personality & Intel</label><textarea className="input-cms h-48 resize-none leading-relaxed text-lg" value={editingLlama.personality} onChange={e => setEditingLlama({...editingLlama, personality: e.target.value})} /></div>
                             <button onClick={() => handleFleetAction('save')} className="w-full bg-green-800 text-white py-8 rounded-[2rem] font-black text-xl shadow-2xl flex items-center justify-center gap-4 hover:bg-green-900 transition-all"><Save size={28}/> Save Profile</button>
                          </div>
                       </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                      {llamas.map(l => (
                        <div key={l.id} className="bg-white p-8 rounded-[4rem] border border-stone-100 shadow-xl group hover:shadow-2xl transition-all">
                           <div className="aspect-square rounded-[2.5rem] overflow-hidden mb-8 border-4 border-stone-50 shadow-inner"><img src={l.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" /></div>
                           <h4 className="text-2xl font-black text-stone-900 tracking-tight">{l.name}</h4>
                           <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 px-3 py-1.5 rounded-full mt-3 inline-block tracking-widest">{l.specialty}</span>
                           <div className="flex gap-3 mt-12">
                              <button onClick={() => setEditingLlama({...l})} className="flex-1 bg-stone-900 text-white p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-black transition-colors"><Edit3 size={16}/> Edit</button>
                              <button onClick={() => handleFleetAction('delete', l)} className="p-5 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
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
                    <div><h2 className="text-5xl font-black tracking-tighter">Wilderness Journal</h2><p className="text-stone-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Curate the public visual feed of expeditions</p></div>
                    <button onClick={() => galleryRef.current?.click()} className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-black transition-all"><Upload size={20}/> Batch Import</button>
                    <input type="file" ref={galleryRef} multiple className="hidden" accept="image/*" onChange={async e => {
                      const files = e.target.files; if (!files) return; setIsProcessing(true);
                      const news: GalleryImage[] = [];
                      for (let i = 0; i < files.length; i++) {
                        const r = new FileReader();
                        const p = new Promise<string>(res => { r.onload = ev => res(ev.target?.result as string); r.readAsDataURL(files[i]); });
                        const raw = await p; const opt = await compressImage(raw);
                        news.push({ url: opt, caption: "Expedition Moment" });
                      }
                      setGallery(prev => [...news, ...prev]); setIsProcessing(false);
                    }} />
                  </header>
                  <div className="bg-white p-12 rounded-[5rem] shadow-2xl border border-stone-100">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
                       {gallery.map((img, idx) => (
                         <div key={idx} className="aspect-square bg-stone-50 rounded-[2.5rem] overflow-hidden relative group border-2 border-stone-50 hover:border-green-200 transition-all shadow-sm">
                           <img src={img.url} className="w-full h-full object-cover" />
                           <div className="absolute inset-0 bg-stone-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-all p-6 backdrop-blur-md">
                             <div className="flex gap-2">
                                <button onClick={() => moveGallery(idx, 'up')} disabled={idx === 0} className="w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-stone-950 rounded-xl flex items-center justify-center disabled:opacity-5 transition-all"><ArrowUp size={20}/></button>
                                <button onClick={() => moveGallery(idx, 'down')} disabled={idx === gallery.length-1} className="w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-stone-950 rounded-xl flex items-center justify-center disabled:opacity-5 transition-all"><ArrowDown size={20}/></button>
                             </div>
                             <button onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))} className="w-full py-3 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md">Remove</button>
                           </div>
                           <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10">#{idx + 1}</div>
                         </div>
                       ))}
                       <button onClick={() => galleryRef.current?.click()} className="aspect-square border-4 border-dashed border-stone-100 rounded-[2.5rem] flex flex-col items-center justify-center text-stone-200 hover:text-green-800 hover:border-green-200 hover:bg-green-50 transition-all group">
                         <Plus size={54} className="mb-3 group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">Add Asset</span>
                       </button>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'bookings' && (
                <div className="space-y-16 animate-in slide-in-from-bottom-8">
                  <header><h2 className="text-5xl font-black tracking-tighter">Expedition Logs</h2><p className="text-stone-400 font-bold uppercase tracking-[0.3em] text-[10px] mt-4">Manage customer leads and trail deployments</p></header>
                  <div className="space-y-6">
                    {bookings.length === 0 ? (
                      <div className="bg-white p-40 rounded-[5rem] border-4 border-dashed border-stone-100 flex flex-col items-center text-stone-200 shadow-inner"><Clock size={80} className="mb-8 opacity-40"/><p className="font-black uppercase tracking-widest text-sm">No trail logs found.</p></div>
                    ) : (
                      bookings.map(b => (
                        <div key={b.id} className={`bg-white p-12 rounded-[4rem] border transition-all flex flex-col lg:flex-row items-center justify-between gap-12 shadow-xl hover:shadow-2xl ${!b.isRead ? 'border-green-800/20 ring-4 ring-green-800/5' : 'border-stone-100'}`}>
                           <div className="flex flex-col sm:flex-row items-center gap-10 text-center sm:text-left flex-1">
                              <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center shrink-0 shadow-xl ${b.status === 'confirmed' ? 'bg-green-800 text-white' : 'bg-orange-500 text-white'}`}>{b.status === 'confirmed' ? <CheckCircle size={44}/> : <Clock size={44}/>}</div>
                              <div className="flex-1">
                                <h4 className="text-4xl font-black text-stone-900 tracking-tight leading-none mb-4">{b.name}</h4>
                                <div className="flex flex-wrap gap-x-10 gap-y-3 text-stone-400 font-bold uppercase tracking-widest text-xs"><span className="flex items-center gap-2"><Calendar className="w-5 h-5"/> {b.startDate} to {b.endDate}</span><span className="flex items-center gap-2"><Users className="w-5 h-5"/> {b.numLlamas} Pack Animals</span><span className="flex items-center gap-2 text-stone-900"><Mail className="w-5 h-5"/> {b.email}</span></div>
                              </div>
                           </div>
                           <div className="flex gap-4 w-full lg:w-auto">
                              {b.status !== 'confirmed' && <button onClick={() => updateLogs(b.id, 'confirm')} className="flex-1 lg:flex-none px-12 py-6 bg-green-800 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-green-900 transition-all">Approve</button>}
                              <button onClick={() => updateLogs(b.id, 'delete')} className="p-6 bg-red-50 text-red-500 rounded-3xl hover:bg-red-500 hover:text-white transition-all shadow-sm"><Trash2 size={28}/></button>
                           </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* PUBLIC SITE VIEW */}
      {!showDashboard && (
        <>
          <nav className="fixed w-full z-[100] bg-white/95 backdrop-blur-2xl border-b h-20 flex items-center shadow-sm">
            <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
              <Logo branding={branding} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <div className="hidden md:flex items-center gap-10 font-black uppercase text-[10px] tracking-[0.2em]">
                <a href="#benefits" className="text-stone-500 hover:text-green-800 transition-all py-2 border-b-2 border-transparent hover:border-green-800">Benefits</a>
                <a href="#about" className="text-stone-500 hover:text-green-800 transition-all py-2 border-b-2 border-transparent hover:border-green-800">The Herd</a>
                <a href="#gear" className="text-stone-500 hover:text-green-800 transition-all py-2 border-b-2 border-transparent hover:border-green-800">Gear Guide</a>
                <a href="#gallery" className="text-stone-500 hover:text-green-800 transition-all py-2 border-b-2 border-transparent hover:border-green-800">Gallery</a>
                <a href="#faq" className="text-stone-500 hover:text-green-800 transition-all py-2 border-b-2 border-transparent hover:border-green-800">FAQ</a>
                <a href="#booking" className="bg-green-800 text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-2xl shadow-green-900/20 hover:bg-green-900 transition-all active:scale-95">Book Expedition <ChevronRight size={14} /></a>
              </div>
              <button className="md:hidden p-3 text-stone-900 z-[110]" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={28} /> : <Menu size={28} />}</button>
            </div>
          </nav>

          <div className={`fixed inset-0 z-[105] bg-stone-950 transition-all duration-700 md:hidden ${isMenuOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'}`}>
            <div className="p-12 pt-32 flex flex-col h-full overflow-y-auto">
              <nav className="flex flex-col gap-10 text-left">
                {['Benefits', 'About', 'Gear', 'Gallery', 'FAQ'].map(l => (
                  <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-6xl font-black text-white hover:text-green-400 transition-all tracking-tighter uppercase">{l}</a>
                ))}
                <a href="#booking" onClick={() => setIsMenuOpen(false)} className="mt-12 bg-green-600 text-white py-12 rounded-[3.5rem] text-3xl font-black uppercase tracking-widest text-center shadow-2xl">Plan My Trek</a>
              </nav>
            </div>
          </div>

          <main>
            <section className="relative h-[98vh] flex items-center justify-center text-center overflow-hidden">
              <div className="absolute inset-0 -z-10 animate-in zoom-in duration-[5000ms]"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.4] scale-110" alt="Montana Wilderness" /></div>
              <div className="max-w-5xl px-4 text-white">
                <h1 className="text-6xl md:text-9xl font-black mb-10 leading-[0.9] tracking-tighter animate-in slide-in-from-top-16 duration-1000">Pack the Peak. <br /><span className="italic text-green-400 font-light tracking-tight">Free the Trek.</span></h1>
                <p className="text-xl md:text-3xl text-stone-200 mb-16 max-w-3xl mx-auto animate-in fade-in duration-1000 delay-300 font-medium leading-relaxed">{slogan}</p>
                <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                  <a href="#booking" className="bg-green-600 px-16 py-7 rounded-3xl text-2xl font-black shadow-2xl shadow-green-900/40 hover:bg-green-500 transition-all active:scale-95">Secure Your Herd</a>
                </div>
              </div>
            </section>

            <section id="benefits" className="py-48 bg-white"><div className="max-w-7xl mx-auto px-6"><h2 className="text-7xl font-black mb-24 text-center tracking-tighter">Wilderness Intelligence</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-12">{BENEFITS.map((b,i)=>(<div key={i} className="p-12 bg-stone-50 rounded-[3.5rem] border border-stone-100 hover:border-green-200 hover:bg-white transition-all group hover:shadow-2xl duration-500"><div className="mb-10 group-hover:scale-110 transition-transform duration-500">{b.icon}</div><h3 className="text-2xl font-black mb-4 tracking-tight">{b.title}</h3><p className="text-stone-500 font-medium leading-relaxed">{b.description}</p></div>))}</div></div></section>
            <section id="about" className="py-48 bg-stone-100"><div className="max-w-7xl mx-auto px-6"><h2 className="text-7xl font-black mb-24 text-center tracking-tighter">The Heritage String</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">{llamas.map(l=><LlamaCard key={l.id} llama={l} />)}</div></div></section>
            <section id="gear" className="py-48 bg-white"><div className="max-w-7xl mx-auto px-6"><h2 className="text-7xl font-black mb-24 text-center tracking-tighter">Expedition Kit</h2><GearSection /></div></section>
            <section id="gallery" className="py-48 bg-stone-950 text-white"><div className="max-w-7xl mx-auto px-6"><header className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8"><h2 className="text-7xl md:text-9xl font-black tracking-tighter leading-none">Journal</h2><div className="bg-white/5 backdrop-blur-xl border border-white/10 px-10 py-5 rounded-full text-green-400 font-black uppercase tracking-widest text-xs">High Country Field Notes</div></header><PhotoCarousel images={gallery} /></div></section>
            <section id="faq" className="py-48 bg-stone-50 relative overflow-hidden"><div className="max-w-7xl mx-auto px-6 relative z-10"><FAQSection /></div></section>
            <section id="booking" className="py-48 bg-white"><div className="max-w-5xl mx-auto px-6 text-center"><h2 className="text-7xl font-black mb-24 tracking-tighter">Logistics</h2><BookingForm /></div></section>
          </main>

          <footer className="bg-stone-950 text-stone-500 pt-40 pb-20 border-t border-white/5 relative">
            <div className="max-w-7xl mx-auto px-6">
              <div className="flex flex-col md:flex-row justify-between items-start gap-20 mb-24">
                <div className="space-y-8 max-w-lg">
                  <Logo branding={branding} light onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                  <p className="text-stone-500 font-medium leading-relaxed">Providing elite mountain-trained pack strings for adventurers since 2018. We specialize in low-impact, high-efficiency wilderness logistics across the Montana Rockies.</p>
                  <div className="flex gap-4">
                     <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-green-800 hover:text-white transition-all cursor-pointer"><Mail size={20}/></div>
                     <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center hover:bg-green-800 hover:text-white transition-all cursor-pointer"><Info size={20}/></div>
                  </div>
                </div>
                
                {/* Llama Fact Widget */}
                <LlamaFact />

                <div className="grid grid-cols-2 gap-20">
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Expeditions</h4>
                    <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                      <li><a href="#benefits" className="hover:text-green-500 transition-colors">Trail Benefits</a></li>
                      <li><a href="#about" className="hover:text-green-500 transition-colors">Herd Profiles</a></li>
                      <li><a href="#gear" className="hover:text-green-500 transition-colors">Gear Guide</a></li>
                    </ul>
                  </div>
                  <div className="space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">Resources</h4>
                    <ul className="space-y-4 text-xs font-bold uppercase tracking-widest">
                      <li><a href="#faq" className="hover:text-green-500 transition-colors">Field Manual</a></li>
                      <li><a href="#booking" className="hover:text-green-500 transition-colors">Booking</a></li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-black uppercase tracking-[0.4em]">
                <p>© {new Date().getFullYear()} {branding.siteName}</p>
                <div className="flex gap-12 text-stone-700">
                  <span>Helena, Montana</span>
                  <span>46.5891° N, 112.0391° W</span>
                </div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Global Style Helper */}
      <style>{`
        .label-cms { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #a8a29e; margin-bottom: 0.5rem; letter-spacing: 0.25em; }
        .input-cms { width: 100%; background-color: #fafaf9; border: 1px solid #f5f5f4; padding: 1.25rem; border-radius: 1.25rem; font-weight: 700; outline: none; transition: all 0.2s; }
        .input-cms:focus { background-color: white; border-color: #166534; box-shadow: 0 0 0 4px rgba(22, 101, 52, 0.05); }
      `}</style>

      {/* PROCESS LOADER */}
      {isProcessing && (
        <div className="fixed inset-0 z-[500] bg-stone-950/80 backdrop-blur-3xl flex items-center justify-center">
          <div className="bg-white px-16 py-20 rounded-[5rem] shadow-2xl flex flex-col items-center gap-10 animate-in zoom-in">
             <div className="w-24 h-24 bg-green-800 text-white rounded-[2rem] flex items-center justify-center shadow-2xl animate-bounce"><Zap size={48} /></div>
             <div className="text-center">
               <h3 className="text-4xl font-black text-stone-900 mb-3 tracking-tighter">Syncing Terrain Data</h3>
               <p className="text-stone-400 font-bold uppercase tracking-[0.3em] text-[10px]">Optimizing Expedition Assets...</p>
             </div>
             <Loader2 className="w-12 h-12 text-green-800 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
