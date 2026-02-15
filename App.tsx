
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LLAMAS, GALLERY_IMAGES, FAQS, BENEFITS } from './constants';
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
  Edit3
} from 'lucide-react';

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
      if (!ctx) return reject(new Error("Canvas context failed"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
  });
};

const safeSave = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Storage failed for ${key}:`, e);
  }
};

// --- Sub-Components (Moved outside App to prevent re-creation) ---

interface Branding {
  siteName: string;
  accentName: string;
  logoType: 'icon' | 'image';
  logoUrl: string;
  heroImageUrl: string;
  adminEmail: string;
}

const Logo = ({ branding, defaultBranding, light = false, onClick }: { branding: Branding, defaultBranding: Branding, light?: boolean, onClick?: () => void }) => {
  const siteTitle = (branding?.siteName || defaultBranding.siteName).toString();
  const accent = (branding?.accentName || defaultBranding.accentName).toString();
  const regex = new RegExp(`(${accent})`, 'gi');
  const parts = siteTitle.split(regex);
  return (
    <div className="flex items-center gap-3 cursor-pointer" onClick={onClick}>
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
  // --- UI State ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slogan, setSlogan] = useState("Helena’s premier mountain-trained pack string.");
  const [isProcessing, setIsProcessing] = useState(false);
  
  // --- Auth & Admin State ---
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState<'branding' | 'gallery' | 'bookings' | 'fleet'>('branding');
  const [passwordInput, setPasswordInput] = useState("");

  // --- CMS Data State ---
  const defaultBranding: Branding = {
    siteName: "Helena Backcountry Llamas",
    accentName: "Llamas",
    logoType: 'icon',
    logoUrl: "",
    heroImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=2400",
    adminEmail: 'kevin.paul.brown@gmail.com'
  };

  const [branding, setBranding] = useState<Branding>(() => {
    const saved = localStorage.getItem('hbl_branding');
    return saved ? { ...defaultBranding, ...JSON.parse(saved) } : defaultBranding;
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
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
  const llamaPhotoInputRef = useRef<HTMLInputElement>(null);

  // --- Effects ---
  useEffect(() => {
    generateWelcomeSlogan().then(val => { if (val) setSlogan(val); });
    const loadBookings = () => {
      setBookings(JSON.parse(localStorage.getItem('hbl_bookings') || '[]'));
    };
    loadBookings();
    window.addEventListener('hbl_new_booking', loadBookings);
    return () => window.removeEventListener('hbl_new_booking', loadBookings);
  }, []);

  useEffect(() => { safeSave('hbl_gallery', gallery); }, [gallery]);
  useEffect(() => { safeSave('hbl_branding', branding); document.title = branding.siteName; }, [branding]);
  useEffect(() => { safeSave('hbl_llamas', llamas); }, [llamas]);

  // --- Handlers ---
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "llama123") {
      setIsAdmin(true); 
      setShowAdminLogin(false); 
      setPasswordInput("");
      setShowDashboard(true);
    } else { 
      alert("Access Denied."); 
    }
  };

  const handleBookingAction = (id: string, action: 'delete' | 'confirm') => {
    let updated = [...bookings];
    if (action === 'delete') {
      if (!confirm("Delete this expedition lead?")) return;
      updated = updated.filter(b => b.id !== id);
    } else if (action === 'confirm') {
      updated = updated.map(b => b.id === id ? { ...b, status: 'confirmed' as const, isRead: true } : b);
    }
    setBookings(updated);
    localStorage.setItem('hbl_bookings', JSON.stringify(updated));
  };

  const handleLlamaAction = (action: 'add' | 'edit' | 'delete' | 'save', llama?: Llama) => {
    if (action === 'add') {
      setEditingLlama({
        id: Math.random().toString(36).substr(2, 9),
        name: 'New Recruit',
        age: 4,
        personality: 'Quiet, observational, and steady.',
        maxLoad: 75,
        imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
        specialty: 'Backpacking'
      });
    } else if (action === 'edit' && llama) {
      setEditingLlama({ ...llama });
    } else if (action === 'delete' && llama) {
      if (confirm(`Remove ${llama.name} from herd?`)) setLlamas(prev => prev.filter(l => l.id !== llama.id));
    } else if (action === 'save' && editingLlama) {
      setLlamas(prev => {
        const idx = prev.findIndex(l => l.id === editingLlama.id);
        if (idx > -1) {
          const updated = [...prev];
          updated[idx] = editingLlama;
          return updated;
        }
        return [...prev, editingLlama];
      });
      setEditingLlama(null);
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    setIsProcessing(true);
    try {
      const newImages: GalleryImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        const p = new Promise<string>((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(files[i]);
        });
        const raw = await p;
        const optimized = await compressImage(raw);
        newImages.push({ url: optimized, caption: "Expedition Moment" });
      }
      setGallery(prev => [...newImages, ...prev]);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setIsProcessing(false);
    }
  };

  const moveGalleryItem = (index: number, direction: 'up' | 'down') => {
    const newGallery = [...gallery];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= gallery.length) return;
    [newGallery[index], newGallery[target]] = [newGallery[target], newGallery[index]];
    setGallery(newGallery);
  };

  const unreadCount = bookings.filter(b => !b.isRead).length;

  // --- Render Helpers ---

  const renderDashboardTabs = () => (
    <nav className="flex items-center gap-2 bg-stone-50 p-1.5 rounded-3xl border border-stone-100">
      {[
        { id: 'branding' as const, label: 'Identity', icon: Palette },
        { id: 'fleet' as const, label: 'The Herd', icon: Users },
        { id: 'gallery' as const, label: 'Journal', icon: ImageIcon },
        { id: 'bookings' as const, label: 'Logistics', icon: ClipboardList }
      ].map(tab => (
        <button 
          key={tab.id}
          onClick={() => { setAdminTab(tab.id); setEditingLlama(null); }}
          className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${adminTab === tab.id ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-900'}`}
        >
          <tab.icon size={18} />
          <span className="hidden lg:inline">{tab.label}</span>
          {tab.id === 'bookings' && unreadCount > 0 && (
            <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px] shadow-lg">{unreadCount}</span>
          )}
        </button>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen text-left">
      {/* 1. Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-950/95 backdrop-blur-xl p-4">
          <div className="bg-white rounded-[4rem] p-12 max-w-md w-full shadow-2xl animate-in zoom-in duration-500">
            <div className="w-20 h-20 bg-green-800 text-white rounded-[2rem] flex items-center justify-center mb-10 mx-auto shadow-2xl">
              <Lock size={36} />
            </div>
            <h3 className="text-3xl font-black mb-2 text-center">Mission Control</h3>
            <p className="text-stone-400 text-center text-sm mb-12 font-bold uppercase tracking-widest">Verify credentials to enter dashboard</p>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <input 
                type="password" 
                placeholder="Access Key (llama123)" 
                className="w-full bg-stone-50 border p-5 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10 focus:bg-white transition-all" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                autoFocus 
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 bg-stone-100 text-stone-500 py-5 rounded-2xl font-black active:scale-95 transition-all">Cancel</button>
                <button type="submit" className="flex-[2] bg-green-800 text-white py-5 rounded-2xl font-black shadow-xl active:scale-95 transition-all">Authenticate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Admin Dashboard View */}
      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in overflow-hidden">
          <header className="bg-white border-b px-8 md:px-16 py-4 flex items-center justify-between shrink-0">
            <Logo branding={branding} defaultBranding={defaultBranding} onClick={() => setShowDashboard(false)} />
            {renderDashboardTabs()}
            <div className="flex gap-4">
              <button onClick={() => setShowDashboard(false)} className="hidden md:flex items-center gap-3 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] text-stone-500 hover:bg-stone-100 transition-all border border-stone-100">
                <Home size={16} /> View Site
              </button>
              <button onClick={() => { setIsAdmin(false); setShowDashboard(false); }} className="bg-red-50 text-red-600 p-3.5 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm">
                <LogOut size={20} />
              </button>
            </div>
          </header>

          <main className="flex-1 bg-stone-50/30 overflow-y-auto">
            <div className="max-w-7xl mx-auto p-12 md:p-20">
              {adminTab === 'branding' && (
                <div className="max-w-4xl space-y-12 animate-in slide-in-from-bottom-8">
                  <header><h2 className="text-4xl font-black tracking-tight mb-2">Presence & Branding</h2><p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Manage your storefront identity</p></header>
                  <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-stone-100 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Business Name</label><input className="w-full bg-stone-50 border p-5 rounded-2xl font-bold outline-none focus:bg-white focus:border-green-800 transition-all" value={branding.siteName} onChange={(e) => setBranding({...branding, siteName: e.target.value})} /></div>
                      <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Notification Email</label><input className="w-full bg-stone-50 border p-5 rounded-2xl font-bold outline-none focus:bg-white focus:border-green-800 transition-all" value={branding.adminEmail} onChange={(e) => setBranding({...branding, adminEmail: e.target.value})} /></div>
                    </div>
                    <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Style Accent (Italic Word)</label><input className="w-full bg-stone-50 border p-5 rounded-2xl font-black italic text-green-800 outline-none focus:bg-white transition-all" value={branding.accentName} onChange={(e) => setBranding({...branding, accentName: e.target.value})} /></div>
                    <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Hero Landscape URL</label><input className="w-full bg-stone-50 border p-5 rounded-2xl font-bold outline-none focus:bg-white transition-all" value={branding.heroImageUrl} onChange={(e) => setBranding({...branding, heroImageUrl: e.target.value})} /></div>
                  </div>
                </div>
              )}

              {adminTab === 'fleet' && (
                <div className="space-y-12 animate-in slide-in-from-bottom-8">
                  <header className="flex justify-between items-end">
                    <div><h2 className="text-4xl font-black tracking-tight mb-2">The Fleet</h2><p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Manage active pack animals</p></div>
                    {!editingLlama && <button onClick={() => handleLlamaAction('add')} className="bg-green-800 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 transition-all"><Plus size={20} /> New Recruit</button>}
                  </header>

                  {editingLlama ? (
                    <div className="max-w-5xl bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 animate-in zoom-in duration-300">
                      <div className="flex items-center gap-6 mb-12">
                        <button onClick={() => setEditingLlama(null)} className="p-4 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><ChevronLeft /></button>
                        <h4 className="text-3xl font-black">Editor: {editingLlama.name}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                        <div className="space-y-8">
                          <div className="aspect-[4/5] bg-stone-50 rounded-[3rem] overflow-hidden relative group border-4 border-stone-100 shadow-inner">
                            <img src={editingLlama.imageUrl} className="w-full h-full object-cover" />
                            <button onClick={() => llamaPhotoInputRef.current?.click()} className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white font-black text-[10px] uppercase tracking-widest transition-all"><ImageIcon className="mb-2" size={32} /> Update Asset</button>
                          </div>
                          <input type="file" ref={llamaPhotoInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) { setIsProcessing(true); const reader = new FileReader(); reader.onload = async (ev) => { const optimized = await compressImage(ev.target?.result as string); setEditingLlama({...editingLlama, imageUrl: optimized}); setIsProcessing(false); }; reader.readAsDataURL(file); }
                          }} />
                        </div>
                        <div className="space-y-8">
                          <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Name</label><input className="w-full bg-stone-50 border p-5 rounded-2xl font-bold outline-none focus:bg-white focus:border-green-800 transition-all" value={editingLlama.name} onChange={(e) => setEditingLlama({...editingLlama, name: e.target.value})} /></div>
                            <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Specialty</label><select className="w-full bg-stone-50 border p-5 rounded-2xl font-bold outline-none focus:bg-white focus:border-green-800 transition-all" value={editingLlama.specialty} onChange={(e) => setEditingLlama({...editingLlama, specialty: e.target.value as any})}><option>Backpacking</option><option>Hunting</option><option>Lead Llama</option><option>Gentle Soul</option></select></div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Age</label><input type="number" className="w-full bg-stone-50 border p-5 rounded-2xl font-bold outline-none focus:bg-white focus:border-green-800 transition-all" value={editingLlama.age} onChange={(e) => setEditingLlama({...editingLlama, age: parseInt(e.target.value)})}/></div>
                            <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Max Load (lbs)</label><input type="number" className="w-full bg-stone-50 border p-5 rounded-2xl font-bold outline-none focus:bg-white focus:border-green-800 transition-all" value={editingLlama.maxLoad} onChange={(e) => setEditingLlama({...editingLlama, maxLoad: parseInt(e.target.value)})}/></div>
                          </div>
                          <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Personality</label><textarea className="w-full bg-stone-50 border p-5 rounded-2xl font-bold outline-none focus:bg-white focus:border-green-800 transition-all h-40 resize-none leading-relaxed" value={editingLlama.personality} onChange={(e) => setEditingLlama({...editingLlama, personality: e.target.value})} /></div>
                          <button onClick={() => handleLlamaAction('save')} className="w-full bg-green-800 text-white py-6 rounded-3xl font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3"><Save /> Save Llama</button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
                      {llamas.map(l => (
                        <div key={l.id} className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-stone-50 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                          <div className="aspect-square rounded-[2.5rem] overflow-hidden mb-8 border-4 border-stone-50 shadow-inner"><img src={l.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /></div>
                          <h4 className="text-2xl font-black text-stone-900">{l.name}</h4>
                          <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 px-3 py-1 rounded-full mt-2 inline-block tracking-widest">{l.specialty}</span>
                          <div className="flex gap-3 mt-10">
                            <button onClick={() => handleLlamaAction('edit', l)} className="flex-1 bg-stone-900 text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2"><Edit3 size={14} /> Profile</button>
                            <button onClick={() => handleLlamaAction('delete', l)} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {adminTab === 'gallery' && (
                <div className="space-y-12 animate-in slide-in-from-bottom-8">
                  <header className="flex justify-between items-end">
                    <div><h2 className="text-4xl font-black tracking-tight mb-2">Wilderness Journal</h2><p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Curate the expedition gallery</p></div>
                    <div className="flex gap-4">
                      <button onClick={() => galleryFileInputRef.current?.click()} className="bg-stone-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl active:scale-95 transition-all"><Upload size={18} /> Batch Upload</button>
                      <input type="file" ref={galleryFileInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                    </div>
                  </header>
                  <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-stone-100">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                      {gallery.map((img, idx) => (
                        <div key={idx} className="aspect-square bg-stone-50 rounded-[2.5rem] overflow-hidden relative group border-2 border-stone-50 hover:border-green-200 transition-all shadow-sm">
                          <img src={img.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-stone-950/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-4 transition-all p-6 backdrop-blur-md">
                            <div className="flex gap-2">
                              <button onClick={() => moveGalleryItem(idx, 'up')} disabled={idx === 0} className="w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-stone-900 rounded-xl flex items-center justify-center disabled:opacity-10 transition-all"><ArrowUp size={18} /></button>
                              <button onClick={() => moveGalleryItem(idx, 'down')} disabled={idx === gallery.length - 1} className="w-10 h-10 bg-white/20 hover:bg-white text-white hover:text-stone-900 rounded-xl flex items-center justify-center disabled:opacity-10 transition-all"><ArrowDown size={18} /></button>
                            </div>
                            <button onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))} className="w-full py-3 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Trash size={14}/> Delete</button>
                          </div>
                          <div className="absolute top-4 left-4 bg-black/40 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest backdrop-blur-md">#{idx + 1}</div>
                        </div>
                      ))}
                      <button onClick={() => galleryFileInputRef.current?.click()} className="aspect-square border-4 border-dashed border-stone-100 rounded-[2.5rem] flex flex-col items-center justify-center text-stone-200 hover:text-green-800 hover:border-green-200 hover:bg-green-50 transition-all group">
                        <Plus size={48} className="mb-2 group-hover:scale-110 transition-transform" /><span className="text-[10px] font-black uppercase tracking-widest">Add Memory</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {adminTab === 'bookings' && (
                <div className="space-y-12 animate-in slide-in-from-bottom-8">
                  <header><h2 className="text-4xl font-black tracking-tight mb-2">Expedition Logs</h2><p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Customer leads & bookings</p></header>
                  {bookings.length === 0 ? (
                    <div className="bg-white p-32 rounded-[4rem] text-center border-4 border-dashed border-stone-100 flex flex-col items-center shadow-inner"><Clock className="w-20 h-20 text-stone-100 mb-8" /><p className="text-stone-400 font-black uppercase tracking-widest text-sm">No trail logs found.</p></div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {bookings.map(b => (
                        <div key={b.id} className={`bg-white p-10 rounded-[3.5rem] border shadow-sm transition-all flex flex-col lg:flex-row items-center justify-between gap-12 hover:shadow-xl ${!b.isRead ? 'border-green-800/20 ring-4 ring-green-800/5' : 'border-stone-100'}`}>
                          <div className="flex flex-col md:flex-row items-center gap-10 text-center md:text-left w-full">
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg ${b.status === 'confirmed' ? 'bg-green-800 text-white' : 'bg-orange-500 text-white'}`}>{b.status === 'confirmed' ? <CheckCircle size={36}/> : <Clock size={36}/>}</div>
                            <div className="flex-1">
                              <h4 className="text-3xl font-black text-stone-900 mb-2">{b.name}</h4>
                              <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-2 text-stone-400 font-bold uppercase tracking-widest text-xs"><span className="flex items-center gap-2"><Clock size={16}/> {b.startDate} to {b.endDate}</span><span className="flex items-center gap-2"><Users size={16}/> {b.numLlamas} Pack Animals</span><span className="flex items-center gap-2 text-stone-900"><Mail size={16}/> {b.email}</span></div>
                            </div>
                          </div>
                          <div className="flex gap-4 w-full lg:w-auto">
                            {b.status !== 'confirmed' && <button onClick={() => handleBookingAction(b.id, 'confirm')} className="flex-1 lg:flex-none px-10 py-5 bg-green-800 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Confirm</button>}
                            <button onClick={() => handleBookingAction(b.id, 'delete')} className="p-5 bg-red-50 text-red-500 rounded-[1.5rem] hover:bg-red-500 hover:text-white transition-all active:scale-90"><Trash2 size={24}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* 3. Public Site View */}
      {!showDashboard && (
        <>
          <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-2xl border-b h-20 flex items-center">
            <div className="max-w-7xl mx-auto px-6 w-full flex justify-between items-center">
              <Logo branding={branding} defaultBranding={defaultBranding} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <div className="hidden md:flex items-center gap-12 font-black uppercase text-[10px] tracking-[0.2em]">
                <a href="#benefits" className="text-stone-500 hover:text-green-800 transition-all">Benefits</a>
                <a href="#about" className="text-stone-500 hover:text-green-800 transition-all">The Herd</a>
                <a href="#gear" className="text-stone-500 hover:text-green-800 transition-all">Gear Guide</a>
                <a href="#gallery" className="text-stone-500 hover:text-green-800 transition-all">Gallery</a>
                <a href="#faq" className="text-stone-500 hover:text-green-800 transition-all">FAQ</a>
                <a href="#booking" className="bg-green-800 text-white px-8 py-4 rounded-2xl flex items-center gap-2 shadow-2xl shadow-green-900/20 hover:bg-green-900 transition-all active:scale-95">Book Expedition <ChevronRight size={14} /></a>
              </div>
              <button className="md:hidden p-2 text-stone-900" onClick={() => setIsMenuOpen(true)}><Menu size={28} /></button>
            </div>
          </nav>

          {/* Mobile Navigation */}
          <div className={`fixed inset-0 z-[60] bg-stone-950 transition-all duration-700 md:hidden ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <div className="p-10 flex flex-col h-full">
              <div className="flex justify-between items-center mb-16">
                <Logo branding={branding} defaultBranding={defaultBranding} light />
                <button onClick={() => setIsMenuOpen(false)} className="text-white p-4 bg-white/10 rounded-full"><X size={28} /></button>
              </div>
              <nav className="flex flex-col gap-10 text-left">
                {['Benefits', 'About', 'Gear', 'Gallery', 'FAQ'].map((link) => (
                  <a key={link} href={`#${link.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-6xl font-black text-white hover:text-green-400 transition-all tracking-tighter uppercase">{link}</a>
                ))}
                <a href="#booking" onClick={() => setIsMenuOpen(false)} className="mt-12 bg-green-600 text-white py-10 rounded-[3rem] text-2xl font-black uppercase tracking-widest text-center">Plan My Trek</a>
              </nav>
            </div>
          </div>

          <section className="relative h-[95vh] flex items-center justify-center text-center overflow-hidden">
            <div className="absolute inset-0 -z-10"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.4] scale-105" /></div>
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
              <Logo branding={branding} defaultBranding={defaultBranding} light />
              <div className="flex items-center gap-8">
                <button 
                  onClick={() => isAdmin ? setShowDashboard(true) : setShowAdminLogin(true)} 
                  className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center transition-all hover:bg-white/10 text-white shadow-2xl group"
                >
                  {isAdmin ? <Settings size={28} className="group-hover:rotate-90 transition-transform duration-500" /> : <Lock size={28} />}
                </button>
                {isAdmin && <span className="text-[10px] font-black uppercase text-green-500 tracking-[0.3em] animate-pulse">Session Active</span>}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">© {new Date().getFullYear()} {branding.siteName}</p>
            </div>
          </footer>
        </>
      )}

      {/* 4. Global Loaders */}
      {isProcessing && (
        <div className="fixed inset-0 z-[300] bg-stone-950/80 backdrop-blur-3xl flex items-center justify-center">
          <div className="bg-white px-12 py-16 rounded-[4rem] shadow-2xl flex flex-col items-center gap-8 animate-in zoom-in duration-500">
             <div className="w-24 h-24 bg-green-800 text-white rounded-[2rem] flex items-center justify-center shadow-2xl animate-bounce"><Zap size={40} /></div>
             <div className="text-center">
               <h3 className="text-3xl font-black text-stone-900 mb-2">Syncing Trail Intel</h3>
               <p className="text-stone-400 font-bold uppercase tracking-widest text-[10px]">Optimizing High Country Assets...</p>
             </div>
             <Loader2 className="w-12 h-12 text-green-800 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
