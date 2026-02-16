
import React, { useState, useEffect, useRef } from 'react';
import { LLAMAS, GALLERY_IMAGES, BENEFITS } from './constants';
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
  Trash,
  LogOut,
  Edit3,
  // Added missing Calendar icon
  Calendar
} from 'lucide-react';

// --- Types ---
interface Branding {
  siteName: string;
  accentName: string;
  heroImageUrl: string;
  adminEmail: string;
}

// --- Utilities ---
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

const Logo = ({ branding, light = false, onClick }: { branding: Branding, light?: boolean, onClick?: () => void }) => {
  const accent = branding.accentName || "Llamas";
  const regex = new RegExp(`(${accent})`, 'gi');
  const parts = branding.siteName.split(regex);
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

const App: React.FC = () => {
  // --- States ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slogan, setSlogan] = useState("Helena’s premier mountain-trained pack string.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('hbl_isAdmin') === 'true');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState<'branding' | 'gallery' | 'bookings' | 'fleet'>('branding');
  const [passwordInput, setPasswordInput] = useState("");
  
  // --- Data States ---
  const [branding, setBranding] = useState<Branding>(() => {
    const saved = localStorage.getItem('hbl_branding');
    return saved ? JSON.parse(saved) : {
      siteName: "Helena Backcountry Llamas",
      accentName: "Llamas",
      heroImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=2400",
      adminEmail: 'kevin.paul.brown@gmail.com'
    };
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
  const [editingLlama, setEditingLlama] = useState<Llama | null>(null);

  // --- Refs ---
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const llamaPhotoRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
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
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "llama123") {
      setIsAdmin(true); setShowAdminLogin(false); setPasswordInput(""); setShowDashboard(true);
    } else { alert("Access Denied"); }
  };

  const handleLlamaSave = () => {
    if (!editingLlama) return;
    setLlamas(prev => {
      const idx = prev.findIndex(l => l.id === editingLlama.id);
      if (idx > -1) {
        const next = [...prev]; next[idx] = editingLlama; return next;
      }
      return [...prev, editingLlama];
    });
    setEditingLlama(null);
  };

  const moveGallery = (idx: number, dir: 'up' | 'down') => {
    const target = dir === 'up' ? idx - 1 : idx + 1;
    if (target < 0 || target >= gallery.length) return;
    const next = [...gallery];
    [next[idx], next[target]] = [next[target], next[idx]];
    setGallery(next);
  };

  const updateBooking = (id: string, action: 'confirm' | 'delete') => {
    const logs = JSON.parse(localStorage.getItem('hbl_bookings') || '[]');
    let next;
    if (action === 'delete') {
      if (!confirm("Permanently remove log?")) return;
      next = logs.filter((l: any) => l.id !== id);
    } else {
      next = logs.map((l: any) => l.id === id ? { ...l, status: 'confirmed', isRead: true } : l);
    }
    localStorage.setItem('hbl_bookings', JSON.stringify(next));
    setBookings(next);
  };

  const unreadCount = bookings.filter(b => !b.isRead).length;

  return (
    <div className="min-h-screen text-left">
      {/* CMS Login */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] bg-stone-950/95 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl animate-in zoom-in duration-300">
            <div className="w-16 h-16 bg-green-800 text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl"><Lock size={32} /></div>
            <h3 className="text-2xl font-black text-center mb-2">Mission Control</h3>
            <p className="text-stone-400 text-center text-xs font-bold uppercase tracking-widest mb-8">Secure Access Only</p>
            <form onSubmit={handleLogin} className="space-y-4">
              <input type="password" placeholder="Key (llama123)" className="w-full bg-stone-50 border p-4 rounded-xl outline-none focus:ring-4 focus:ring-green-500/10 font-bold" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} autoFocus />
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 bg-stone-100 py-4 rounded-xl font-black text-xs uppercase text-stone-500">Cancel</button>
                <button type="submit" className="flex-[2] bg-green-800 text-white py-4 rounded-xl font-black text-xs uppercase shadow-lg">Enter</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD */}
      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[150] bg-white flex flex-col overflow-hidden animate-in fade-in">
          <header className="bg-white border-b px-8 py-4 flex items-center justify-between shrink-0">
            <Logo branding={branding} onClick={() => setShowDashboard(false)} />
            <nav className="flex items-center gap-1 bg-stone-50 p-1 rounded-2xl border border-stone-100">
              {[
                { id: 'branding' as const, icon: Palette, label: 'Identity' },
                { id: 'fleet' as const, icon: Users, label: 'Herd' },
                { id: 'gallery' as const, icon: ImageIcon, label: 'Journal' },
                { id: 'bookings' as const, icon: ClipboardList, label: 'Logs' }
              ].map(t => (
                <button key={t.id} onClick={() => { setAdminTab(t.id); setEditingLlama(null); }} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${adminTab === t.id ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-100'}`}>
                  <t.icon size={16} /> <span className="hidden sm:inline">{t.label}</span>
                  {t.id === 'bookings' && unreadCount > 0 && <span className="bg-red-600 text-white w-4 h-4 rounded-full flex items-center justify-center text-[8px]">{unreadCount}</span>}
                </button>
              ))}
            </nav>
            <div className="flex gap-3">
              <button onClick={() => setShowDashboard(false)} className="px-6 py-3 rounded-xl border font-black text-[10px] uppercase text-stone-500 flex items-center gap-2 hover:bg-stone-50 transition-all"><Home size={14} /> Exit</button>
              <button onClick={() => { setIsAdmin(false); setShowDashboard(false); }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><LogOut size={18} /></button>
            </div>
          </header>

          <main className="flex-1 bg-stone-50/50 overflow-y-auto p-8 sm:p-16">
            <div className="max-w-6xl mx-auto">
              {adminTab === 'branding' && (
                <div className="max-w-3xl space-y-12 animate-in slide-in-from-bottom-4">
                  <header><h2 className="text-4xl font-black tracking-tight">Site Identity</h2><p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mt-2">Manage public-facing branding</p></header>
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-stone-100 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div><label className="label-cms">Business Name</label><input className="input-cms" value={branding.siteName} onChange={e => setBranding({...branding, siteName: e.target.value})} /></div>
                      <div><label className="label-cms">Notification Email</label><input className="input-cms" value={branding.adminEmail} onChange={e => setBranding({...branding, adminEmail: e.target.value})} /></div>
                    </div>
                    <div><label className="label-cms">Logo Accent (Italic Word)</label><input className="input-cms font-black italic text-green-800" value={branding.accentName} onChange={e => setBranding({...branding, accentName: e.target.value})} /></div>
                    <div><label className="label-cms">Hero Image URL</label><input className="input-cms" value={branding.heroImageUrl} onChange={e => setBranding({...branding, heroImageUrl: e.target.value})} /></div>
                  </div>
                </div>
              )}

              {adminTab === 'fleet' && (
                <div className="space-y-12 animate-in slide-in-from-bottom-4">
                  <header className="flex justify-between items-end">
                    <div><h2 className="text-4xl font-black tracking-tight">The Fleet</h2><p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mt-2">Pack animal profiles</p></div>
                    {!editingLlama && <button onClick={() => setEditingLlama({ id: Math.random().toString(36).substr(2,9), name: 'New Llama', age: 5, personality: 'Steady and brave.', maxLoad: 80, imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800', specialty: 'Backpacking' })} className="bg-green-800 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl"><Plus size={18}/> New Recruit</button>}
                  </header>
                  
                  {editingLlama ? (
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl border border-stone-100 animate-in zoom-in">
                      <div className="flex items-center gap-4 mb-10"><button onClick={() => setEditingLlama(null)} className="p-3 bg-stone-100 rounded-full"><ChevronLeft /></button><h4 className="text-2xl font-black">Editor: {editingLlama.name}</h4></div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                           <div className="aspect-[4/5] bg-stone-50 rounded-[2.5rem] overflow-hidden border-4 border-stone-50 shadow-inner group relative">
                              <img src={editingLlama.imageUrl} className="w-full h-full object-cover" />
                              <button onClick={() => llamaPhotoRef.current?.click()} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white font-black text-[10px] uppercase tracking-widest transition-all"><ImageIcon className="mb-2" size={32}/> Update Asset</button>
                           </div>
                           <input type="file" ref={llamaPhotoRef} className="hidden" accept="image/*" onChange={async e => {
                             const f = e.target.files?.[0]; if (f) { setIsProcessing(true); const r = new FileReader(); r.onload = async ev => { const opt = await compressImage(ev.target?.result as string); setEditingLlama({...editingLlama, imageUrl: opt}); setIsProcessing(false); }; r.readAsDataURL(f); }
                           }} />
                        </div>
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className="label-cms">Name</label><input className="input-cms" value={editingLlama.name} onChange={e => setEditingLlama({...editingLlama, name: e.target.value})} /></div>
                            <div><label className="label-cms">Specialty</label><select className="input-cms" value={editingLlama.specialty} onChange={e => setEditingLlama({...editingLlama, specialty: e.target.value as any})}><option>Backpacking</option><option>Hunting</option><option>Lead Llama</option><option>Gentle Soul</option></select></div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div><label className="label-cms">Age</label><input type="number" className="input-cms" value={editingLlama.age} onChange={e => setEditingLlama({...editingLlama, age: parseInt(e.target.value)})} /></div>
                            <div><label className="label-cms">Max Load (lbs)</label><input type="number" className="input-cms" value={editingLlama.maxLoad} onChange={e => setEditingLlama({...editingLlama, maxLoad: parseInt(e.target.value)})} /></div>
                          </div>
                          <div><label className="label-cms">Personality</label><textarea className="input-cms h-32 resize-none leading-relaxed" value={editingLlama.personality} onChange={e => setEditingLlama({...editingLlama, personality: e.target.value})} /></div>
                          <button onClick={handleLlamaSave} className="w-full bg-green-800 text-white py-5 rounded-2xl font-black text-lg shadow-xl flex items-center justify-center gap-2"><Save /> Save Profile</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                      {llamas.map(l => (
                        <div key={l.id} className="bg-white p-6 rounded-[2.5rem] border border-stone-100 shadow-lg group">
                          <div className="aspect-square rounded-[1.5rem] overflow-hidden mb-6 border-2 border-stone-50 shadow-inner"><img src={l.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-all duration-700" /></div>
                          <h4 className="text-xl font-black text-stone-900">{l.name}</h4>
                          <span className="text-[9px] font-black uppercase text-green-700 bg-green-50 px-3 py-1 rounded-full mt-2 inline-block tracking-widest">{l.specialty}</span>
                          <div className="flex gap-2 mt-8">
                             <button onClick={() => setEditingLlama({...l})} className="flex-1 bg-stone-900 text-white p-3 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Edit3 size={14}/> Edit</button>
                             <button onClick={() => { if(confirm("Remove?")) setLlamas(prev => prev.filter(p => p.id !== l.id)); }} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'gallery' && (
                <div className="space-y-12 animate-in slide-in-from-bottom-4">
                  <header className="flex justify-between items-end">
                    <div><h2 className="text-4xl font-black tracking-tight">Wilderness Journal</h2><p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mt-2">Curate the expedition visual feed</p></div>
                    <button onClick={() => galleryInputRef.current?.click()} className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl"><Upload size={18}/> Batch Import</button>
                    <input type="file" ref={galleryInputRef} multiple className="hidden" accept="image/*" onChange={async e => {
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
                  <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-stone-100">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                      {gallery.map((img, idx) => (
                        <div key={idx} className="aspect-square bg-stone-50 rounded-[2rem] overflow-hidden relative group border border-stone-50 hover:border-green-200 transition-all shadow-sm">
                          <img src={img.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-stone-950/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-all p-4">
                            <div className="flex gap-2">
                              <button onClick={() => moveGallery(idx, 'up')} disabled={idx === 0} className="w-8 h-8 bg-white/10 hover:bg-white text-white hover:text-stone-950 rounded-lg flex items-center justify-center disabled:opacity-5"><ArrowUp size={16}/></button>
                              <button onClick={() => moveGallery(idx, 'down')} disabled={idx === gallery.length-1} className="w-8 h-8 bg-white/10 hover:bg-white text-white hover:text-stone-950 rounded-lg flex items-center justify-center disabled:opacity-5"><ArrowDown size={16}/></button>
                            </div>
                            <button onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))} className="w-full py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg font-black text-[9px] uppercase tracking-widest">Delete</button>
                          </div>
                        </div>
                      ))}
                      <button onClick={() => galleryInputRef.current?.click()} className="aspect-square border-4 border-dashed border-stone-100 rounded-[2rem] flex flex-col items-center justify-center text-stone-200 hover:text-green-800 hover:border-green-200 transition-all"><Plus size={40}/><span className="text-[8px] font-black uppercase tracking-widest">Add Asset</span></button>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'bookings' && (
                <div className="space-y-12 animate-in slide-in-from-bottom-4">
                  <header><h2 className="text-4xl font-black tracking-tight">Expedition Logs</h2><p className="text-stone-400 font-bold uppercase tracking-widest text-[10px] mt-2">Manage customer leads & bookings</p></header>
                  <div className="space-y-4">
                    {bookings.length === 0 ? (
                       <div className="bg-white p-32 rounded-[3.5rem] border-4 border-dashed border-stone-100 flex flex-col items-center text-stone-200"><Clock size={48} className="mb-4"/><p className="font-black uppercase tracking-widest text-xs">No active logs</p></div>
                    ) : (
                      bookings.map(b => (
                        <div key={b.id} className={`bg-white p-8 rounded-[3rem] border transition-all flex flex-col sm:flex-row items-center justify-between gap-8 ${!b.isRead ? 'border-green-800 ring-4 ring-green-800/5' : 'border-stone-100 shadow-sm'}`}>
                          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left flex-1">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${b.status === 'confirmed' ? 'bg-green-800 text-white' : 'bg-orange-500 text-white'}`}>{b.status === 'confirmed' ? <CheckCircle size={32}/> : <Clock size={32}/>}</div>
                            <div>
                              <h4 className="text-2xl font-black text-stone-900 leading-none mb-2">{b.name}</h4>
                              <div className="flex flex-wrap gap-x-6 gap-y-1 text-stone-400 font-bold uppercase tracking-widest text-[9px]"><span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {b.startDate} → {b.endDate}</span><span className="flex items-center gap-1"><Users className="w-3 h-3"/> {b.numLlamas} Head</span><span className="flex items-center gap-1 text-stone-900"><Mail className="w-3 h-3"/> {b.email}</span></div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {b.status !== 'confirmed' && <button onClick={() => updateBooking(b.id, 'confirm')} className="px-8 py-4 bg-green-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Confirm</button>}
                            <button onClick={() => updateBooking(b.id, 'delete')} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
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

      {/* PUBLIC SITE */}
      {!showDashboard && (
        <>
          <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-2xl border-b h-20 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
              <Logo branding={branding} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <div className="hidden md:flex items-center gap-12 font-black uppercase text-[10px] tracking-[0.2em] relative">
                <a href="#benefits" className="text-stone-500 hover:text-green-800 transition-all">Benefits</a>
                <a href="#about" className="text-stone-500 hover:text-green-800 transition-all">The Herd</a>
                <a href="#gear" className="text-stone-500 hover:text-green-800 transition-all">Gear Guide</a>
                <a href="#gallery" className="text-stone-500 hover:text-green-800 transition-all">Gallery</a>
                <a href="#faq" className="text-stone-500 hover:text-green-800 transition-all">FAQ</a>
                <a href="#booking" className="bg-green-800 text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-2xl shadow-green-900/20 hover:bg-green-900 transition-all">Book Expedition <ChevronRight size={14} /></a>
              </div>
              <button className="md:hidden p-2 text-stone-900 z-[70]" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={28} /> : <Menu size={28} />}</button>
            </div>
          </nav>

          {/* MOBILE OVERLAY */}
          <div className={`fixed inset-0 z-[60] bg-stone-950 transition-all duration-700 md:hidden ${isMenuOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'}`}>
            <div className="p-10 pt-32 flex flex-col h-full">
              <nav className="flex flex-col gap-10 text-left">
                {['Benefits', 'About', 'Gear', 'Gallery', 'FAQ'].map(l => (
                  <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-6xl font-black text-white hover:text-green-400 transition-all tracking-tighter uppercase">{l}</a>
                ))}
                <a href="#booking" onClick={() => setIsMenuOpen(false)} className="mt-12 bg-green-600 text-white py-10 rounded-[3rem] text-2xl font-black uppercase tracking-widest text-center shadow-2xl">Plan My Trek</a>
              </nav>
            </div>
          </div>

          <section className="relative h-[95vh] flex items-center justify-center text-center overflow-hidden">
            <div className="absolute inset-0 -z-10"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.4] scale-110" /></div>
            <div className="max-w-5xl px-4 text-white">
              <h1 className="text-6xl md:text-9xl font-black mb-10 leading-[0.95] tracking-tighter animate-in slide-in-from-top-16 duration-1000">Pack the Peak. <br /><span className="italic text-green-400 font-light tracking-tight">Free the Trek.</span></h1>
              <p className="text-xl md:text-3xl text-stone-200 mb-16 max-w-3xl mx-auto animate-in fade-in duration-1000 delay-300 font-medium leading-relaxed">{slogan}</p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                <a href="#booking" className="bg-green-600 px-16 py-6 rounded-3xl text-xl font-black shadow-2xl shadow-green-900/40 hover:bg-green-500 transition-all active:scale-95">Secure Your Herd</a>
              </div>
            </div>
          </section>

          <section id="benefits" className="py-40 bg-white"><div className="max-w-7xl mx-auto px-4"><h2 className="text-6xl font-black mb-24 text-center tracking-tighter">Wilderness Intelligence</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-10">{BENEFITS.map((b,i)=><div key={i} className="p-12 bg-stone-50 rounded-[3rem] border border-stone-100 hover:border-green-200 hover:bg-white transition-all group hover:shadow-2xl duration-500"><div className="mb-10 group-hover:scale-110 transition-transform duration-500">{b.icon}</div><h3 className="text-2xl font-black mb-4 tracking-tight">{b.title}</h3><p className="text-stone-500 font-medium leading-relaxed">{b.description}</p></div>)}</div></div></section>
          <section id="about" className="py-40 bg-stone-100"><div className="max-w-7xl mx-auto px-4"><h2 className="text-6xl font-black mb-24 text-center tracking-tighter">The Heritage String</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">{llamas.map(l=><LlamaCard key={l.id} llama={l} />)}</div></div></section>
          <section id="gear" className="py-40 bg-white"><div className="max-w-7xl mx-auto px-4"><h2 className="text-6xl font-black mb-24 text-center tracking-tighter">Expedition Kit</h2><GearSection /></div></section>
          
          <section id="gallery" className="py-40 bg-stone-950 text-white">
            <div className="max-w-7xl mx-auto px-4">
              <header className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">Trail Journal</h2>
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-3xl text-green-400 font-black uppercase tracking-widest text-[10px]">High Country Updates Active</div>
              </header>
              <PhotoCarousel images={gallery} />
            </div>
          </section>

          <section id="faq" className="py-40 bg-stone-50 relative overflow-hidden"><div className="max-w-7xl mx-auto px-4 relative z-10"><FAQSection /></div></section>
          
          <section id="booking" className="py-40 bg-white">
            <div className="max-w-5xl mx-auto px-4 text-center">
              <h2 className="text-6xl font-black mb-24 tracking-tighter">Expedition Logistics</h2>
              <BookingForm />
            </div>
          </section>

          <footer className="bg-stone-950 text-stone-500 py-32 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-16">
              <Logo branding={branding} light onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <div className="flex items-center gap-8">
                <button onClick={() => isAdmin ? setShowDashboard(true) : setShowAdminLogin(true)} className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center transition-all hover:bg-white/10 text-white shadow-2xl group z-40 relative">
                  {isAdmin ? <Settings size={28} className="group-hover:rotate-90 transition-transform duration-500" /> : <Lock size={28} />}
                </button>
                {isAdmin && <span className="text-[10px] font-black uppercase text-green-500 tracking-[0.3em] animate-pulse">Session Active</span>}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">© {new Date().getFullYear()} {branding.siteName}</p>
            </div>
          </footer>
        </>
      )}

      {/* Global CSS Inject */}
      <style>{`
        .label-cms { @apply block text-[9px] font-black uppercase text-stone-400 mb-2 tracking-[0.2em]; }
        .input-cms { @apply w-full bg-stone-50 border p-4 rounded-xl font-bold outline-none focus:bg-white focus:border-green-800 transition-all; }
      `}</style>

      {/* GLOBAL LOADER */}
      {isProcessing && (
        <div className="fixed inset-0 z-[300] bg-stone-950/80 backdrop-blur-3xl flex items-center justify-center">
          <div className="bg-white px-12 py-16 rounded-[4rem] shadow-2xl flex flex-col items-center gap-8 animate-in zoom-in">
             <div className="w-20 h-20 bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-2xl animate-bounce"><Zap size={40} /></div>
             <div className="text-center">
               <h3 className="text-3xl font-black text-stone-900 mb-2 tracking-tight">Syncing Trail Intel</h3>
               <p className="text-stone-400 font-bold uppercase tracking-widest text-[9px]">Optimizing High Country Assets...</p>
             </div>
             <Loader2 className="w-10 h-10 text-green-800 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
