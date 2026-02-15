
import React, { useState, useEffect, useRef } from 'react';
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
  Unlock,
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
  Trash
} from 'lucide-react';

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

const AdminTabButton = ({ id, currentTab, label, icon: Icon, onClick, badgeCount }: { id: string, currentTab: string, label: string, icon: any, onClick: () => void, badgeCount?: number }) => (
  <button 
    type="button"
    onClick={(e) => {
      e.preventDefault();
      onClick();
    }}
    className={`flex items-center gap-2 px-5 py-3 rounded-full font-black text-xs transition-all shrink-0 cursor-pointer ${currentTab === id ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-900'}`}
  >
    <Icon className="w-4 h-4" />
    <span className="hidden sm:inline">{label}</span>
    {badgeCount !== undefined && badgeCount > 0 && (
      <span className="bg-red-600 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center border border-white">
        {badgeCount}
      </span>
    )}
  </button>
);

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slogan, setSlogan] = useState("Helena’s premier mountain-trained pack string.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState<'branding' | 'gallery' | 'bookings' | 'fleet'>('branding');
  const [passwordInput, setPasswordInput] = useState("");
  const [bookings, setBookings] = useState<BookingData[]>([]);

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

  const [editingLlama, setEditingLlama] = useState<Llama | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const llamaPhotoInputRef = useRef<HTMLInputElement>(null);

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

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "llama123") {
      setIsAdmin(true); setShowAdminLogin(false); setPasswordInput("");
    } else { alert("Access Denied."); }
  };

  const handleBookingAction = (id: string, action: 'delete' | 'confirm') => {
    if (!isAdmin) return;
    let updated = [...bookings];
    if (action === 'delete') {
      if (!confirm("Delete this lead?")) return;
      updated = updated.filter(b => b.id !== id);
    } else if (action === 'confirm') {
      updated = updated.map(b => b.id === id ? { ...b, status: 'confirmed', isRead: true } : b);
    }
    setBookings(updated);
    localStorage.setItem('hbl_bookings', JSON.stringify(updated));
  };

  const handleLlamaAction = (action: 'add' | 'edit' | 'delete' | 'save', llama?: Llama) => {
    if (!isAdmin) return;
    if (action === 'add') {
      setEditingLlama({
        id: Math.random().toString(36).substr(2, 9),
        name: 'New Recruit',
        age: 3,
        personality: 'Quiet, observant, and strong on the trail.',
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

  const moveGalleryItem = (index: number, direction: 'up' | 'down') => {
    const newGallery = [...gallery];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= gallery.length) return;
    [newGallery[index], newGallery[targetIndex]] = [newGallery[targetIndex], newGallery[index]];
    setGallery(newGallery);
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !isAdmin) return;
    setIsProcessing(true);
    const newImages: GalleryImage[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const reader = new FileReader();
        const p = new Promise<string>((resolve) => {
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(files[i]);
        });
        const raw = await p;
        const optimized = await compressImage(raw);
        newImages.push({ url: optimized, caption: "Expedition Moment" });
      } catch (err) {
        console.error("Upload failed for file", i, err);
      }
    }
    setGallery(prev => [...newImages, ...prev]);
    setIsProcessing(false);
  };

  const unreadBookingsCount = bookings.filter(b => !b.isRead).length;

  return (
    <div className="min-h-screen text-left">
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in zoom-in">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black">Admin Access</h3>
              <button onClick={() => setShowAdminLogin(false)} className="p-2 hover:bg-stone-100 rounded-full transition-colors"><X /></button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
                <label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Entry Password</label>
                <input 
                  type="password" 
                  placeholder="Password (llama123)" 
                  className="w-full bg-stone-100 border p-4 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10 transition-all" 
                  value={passwordInput} 
                  onChange={(e) => setPasswordInput(e.target.value)} 
                  autoFocus 
                />
              </div>
              <button type="submit" className="w-full bg-green-800 text-white py-4 rounded-2xl font-black shadow-lg shadow-green-900/20 active:scale-95 transition-all">Verify & Open CMS</button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD OVERLAY */}
      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-stone-100 flex flex-col animate-in fade-in overflow-hidden">
          <header className="bg-white border-b px-4 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-6 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-800 text-white rounded-xl flex items-center justify-center shadow-lg"><Settings className="w-5 h-5" /></div>
              <h2 className="text-xl font-black">Administrative Control</h2>
            </div>
            
            <nav className="flex items-center gap-2 bg-stone-50 p-1 rounded-full border border-stone-100 overflow-x-auto max-w-full">
              <AdminTabButton id="branding" currentTab={adminTab} label="Branding" icon={Palette} onClick={() => setAdminTab('branding')} />
              <AdminTabButton id="fleet" currentTab={adminTab} label="Herd Fleet" icon={Users} onClick={() => setAdminTab('fleet')} />
              <AdminTabButton id="gallery" currentTab={adminTab} label="Wilderness Journal" icon={ImageIcon} onClick={() => setAdminTab('gallery')} />
              <AdminTabButton id="bookings" currentTab={adminTab} label="Expedition Logs" icon={ClipboardList} onClick={() => setAdminTab('bookings')} badgeCount={unreadBookingsCount} />
            </nav>

            <button onClick={() => setShowDashboard(false)} className="bg-stone-900 text-white px-8 py-3 rounded-full font-black text-xs uppercase flex items-center gap-2 shadow-xl hover:bg-stone-800 transition-all">
              <Home size={14} /> Back to Site
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20 bg-stone-50/50">
            {/* BRANDING TAB */}
            {adminTab === 'branding' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-6">
                <header className="flex items-center gap-4 mb-2">
                  <Palette className="w-8 h-8 text-stone-300" />
                  <h3 className="text-3xl font-black">Site Identity</h3>
                </header>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-stone-100 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="label-style">Company Name</label>
                      <input className="input-style" value={branding.siteName} onChange={(e) => setBranding({...branding, siteName: e.target.value})} />
                    </div>
                    <div>
                      <label className="label-style">Notification Email</label>
                      <input className="input-style" value={branding.adminEmail} onChange={(e) => setBranding({...branding, adminEmail: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="label-style">Style Highlight (Italicized Word)</label>
                    <p className="text-[10px] text-stone-400 mb-2 uppercase tracking-widest font-bold">The word in your title that gets the green italic treatment</p>
                    <input className="input-style font-black italic text-green-800" value={branding.accentName} onChange={(e) => setBranding({...branding, accentName: e.target.value})} />
                  </div>
                  <div>
                    <label className="label-style">Hero Image URL</label>
                    <input className="input-style" value={branding.heroImageUrl} onChange={(e) => setBranding({...branding, heroImageUrl: e.target.value})} />
                  </div>
                  <div className="p-6 bg-stone-50 rounded-2xl flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center"><CheckCircle className="text-green-600" /></div>
                    <div>
                      <h4 className="font-black text-sm">Settings Synced</h4>
                      <p className="text-xs text-stone-500">All changes are saved to local persistence instantly.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FLEET TAB */}
            {adminTab === 'fleet' && (
              <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-6">
                <header className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <Users className="w-8 h-8 text-stone-300" />
                    <h3 className="text-3xl font-black">Herd Management</h3>
                  </div>
                  {!editingLlama && (
                    <button onClick={() => handleLlamaAction('add')} className="bg-green-800 text-white px-8 py-3.5 rounded-2xl font-black text-sm flex items-center gap-2 shadow-xl shadow-green-900/20 hover:bg-green-700 transition-all">
                      <Plus size={18} /> New Llama
                    </button>
                  )}
                </header>

                {editingLlama ? (
                  <div className="bg-white p-10 rounded-[4rem] shadow-2xl space-y-8 animate-in zoom-in duration-300 border border-stone-100">
                    <div className="flex items-center gap-4 mb-4">
                      <button onClick={() => setEditingLlama(null)} className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><ChevronLeft /></button>
                      <h4 className="text-3xl font-black tracking-tight">Editing {editingLlama.name}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                      <div className="space-y-6">
                        <div className="aspect-[4/5] bg-stone-50 rounded-[3rem] overflow-hidden relative group border-4 border-stone-100 shadow-inner">
                          <img src={editingLlama.imageUrl} className="w-full h-full object-cover" />
                          <button onClick={() => llamaPhotoInputRef.current?.click()} className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white font-black text-xs uppercase tracking-[0.2em] transition-all">
                             <Upload className="mb-2" /> Replace Asset
                          </button>
                        </div>
                        <input type="file" ref={llamaPhotoInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setIsProcessing(true);
                            const reader = new FileReader();
                            reader.onload = async (ev) => {
                              const optimized = await compressImage(ev.target?.result as string);
                              setEditingLlama({...editingLlama, imageUrl: optimized});
                              setIsProcessing(false);
                            };
                            reader.readAsDataURL(file);
                          }
                        }} />
                      </div>
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                          <div><label className="label-style">Llama Name</label><input className="input-style" value={editingLlama.name} onChange={(e) => setEditingLlama({...editingLlama, name: e.target.value})} /></div>
                          <div><label className="label-style">Specialty</label><select className="input-style" value={editingLlama.specialty} onChange={(e) => setEditingLlama({...editingLlama, specialty: e.target.value as any})}><option>Backpacking</option><option>Hunting</option><option>Lead Llama</option><option>Gentle Soul</option></select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                          <div><label className="label-style">Age (Years)</label><input type="number" className="input-style" value={editingLlama.age} onChange={(e) => setEditingLlama({...editingLlama, age: parseInt(e.target.value)})}/></div>
                          <div><label className="label-style">Max Load (lbs)</label><input type="number" className="input-style" value={editingLlama.maxLoad} onChange={(e) => setEditingLlama({...editingLlama, maxLoad: parseInt(e.target.value)})}/></div>
                        </div>
                        <div><label className="label-style">Personality Profile</label><textarea className="input-style h-40 resize-none leading-relaxed" value={editingLlama.personality} onChange={(e) => setEditingLlama({...editingLlama, personality: e.target.value})} /></div>
                        <button onClick={() => handleLlamaAction('save')} className="w-full bg-green-800 text-white py-6 rounded-3xl font-black text-xl shadow-2xl shadow-green-900/30 hover:bg-green-700 active:scale-[0.98] transition-all flex items-center justify-center gap-3">
                          <Save /> Save Heritage Asset
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {llamas.map(l => (
                      <div key={l.id} className="bg-white p-6 rounded-[3rem] shadow-lg border border-stone-100 group hover:shadow-2xl hover:-translate-y-2 transition-all duration-500">
                        <div className="aspect-square rounded-[2rem] overflow-hidden mb-6 border-2 border-stone-50 shadow-inner">
                          <img src={l.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        </div>
                        <h4 className="text-2xl font-black text-stone-900">{l.name}</h4>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 px-3 py-1 rounded-full tracking-widest">{l.specialty}</span>
                           <span className="text-[10px] font-black uppercase text-stone-400 tracking-widest">{l.maxLoad}lbs cap</span>
                        </div>
                        <div className="flex gap-2 mt-8">
                          <button onClick={() => handleLlamaAction('edit', l)} className="flex-1 bg-stone-100 p-3 rounded-2xl text-stone-600 font-black text-[10px] uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all">Edit Profile</button>
                          <button onClick={() => handleLlamaAction('delete', l)} className="p-3 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* GALLERY TAB */}
            {adminTab === 'gallery' && (
              <div className="max-w-7xl mx-auto space-y-10 animate-in slide-in-from-bottom-6">
                <header className="flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="flex items-center gap-4">
                    <ImageIcon className="w-8 h-8 text-stone-300" />
                    <h3 className="text-3xl font-black">Wilderness Journal</h3>
                  </div>
                  <div className="flex gap-4">
                    <button onClick={() => fileInputRef.current?.click()} className="bg-stone-900 text-white px-8 py-3.5 rounded-2xl font-black text-xs uppercase flex items-center gap-2 shadow-xl">
                      <Upload size={14} /> Batch Import Assets
                    </button>
                    <input type="file" ref={fileInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                  </div>
                </header>

                <div className="bg-white p-10 rounded-[4rem] shadow-xl border border-stone-100">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {gallery.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-stone-50 rounded-[2.5rem] overflow-hidden relative group border-2 border-stone-50 shadow-sm hover:border-green-200 transition-all">
                        <img src={img.url} className="w-full h-full object-cover" />
                        
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-3 transition-all p-4">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => moveGalleryItem(idx, 'up')}
                              disabled={idx === 0}
                              className="w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-xl flex items-center justify-center disabled:opacity-20"
                            >
                              <ArrowUp size={16} />
                            </button>
                            <button 
                              onClick={() => moveGalleryItem(idx, 'down')}
                              disabled={idx === gallery.length - 1}
                              className="w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-xl flex items-center justify-center disabled:opacity-20"
                            >
                              <ArrowDown size={16} />
                            </button>
                          </div>
                          <button 
                            onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))} 
                            className="w-full py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <Trash size={12}/> Delete
                          </button>
                        </div>
                        
                        <div className="absolute top-2 left-2 bg-black/40 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-md">
                          Pos {idx + 1}
                        </div>
                      </div>
                    ))}
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square border-4 border-dashed border-stone-100 rounded-[2.5rem] flex flex-col items-center justify-center text-stone-200 hover:text-green-800 hover:border-green-200 hover:bg-green-50/30 transition-all group"
                    >
                      <Plus size={48} className="mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em]">Add Memory</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* BOOKINGS TAB */}
            {adminTab === 'bookings' && (
              <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-6">
                <header className="flex items-center gap-4">
                  <ClipboardList className="w-8 h-8 text-stone-300" />
                  <h3 className="text-3xl font-black">Expedition Logs</h3>
                  {unreadBookingsCount > 0 && (
                    <span className="bg-green-800 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg animate-pulse">
                      {unreadBookingsCount} New Requests
                    </span>
                  )}
                </header>
                
                {bookings.length === 0 ? (
                  <div className="bg-white p-24 rounded-[4rem] text-center border-4 border-dashed border-stone-100">
                    <Clock className="w-20 h-20 text-stone-100 mx-auto mb-6" />
                    <p className="text-stone-400 font-black uppercase tracking-[0.2em] text-sm">No active trail logs found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-6">
                    {bookings.map(b => (
                      <div key={b.id} className={`bg-white p-8 md:p-10 rounded-[3.5rem] border shadow-sm transition-all flex flex-col xl:flex-row items-center justify-between gap-10 hover:shadow-xl ${!b.isRead ? 'border-green-800/20 ring-4 ring-green-800/5' : 'border-stone-100'}`}>
                        <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left w-full">
                          <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shrink-0 shadow-lg ${b.status === 'confirmed' ? 'bg-green-800 text-white' : 'bg-orange-500 text-white'}`}>
                            {b.status === 'confirmed' ? <CheckCircle size={36}/> : <Clock size={36}/>}
                          </div>
                          <div className="flex-1">
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-2">
                              <h4 className="text-3xl font-black text-stone-900">{b.name}</h4>
                              <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] ${b.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-700'}`}>
                                {b.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-x-8 gap-y-2 text-stone-400 font-bold uppercase tracking-widest text-xs">
                              <div className="flex items-center gap-2"><Clock size={14}/> {b.startDate} to {b.endDate}</div>
                              <div className="flex items-center gap-2"><Users size={14}/> {b.numLlamas} Pack Animals</div>
                              <div className="flex items-center gap-2"><Mail size={14}/> {b.email}</div>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-4 w-full xl:w-auto">
                          {b.status !== 'confirmed' && (
                            <button onClick={() => handleBookingAction(b.id, 'confirm')} className="flex-1 xl:flex-none px-10 py-5 bg-green-800 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-green-900/40 hover:bg-green-700 transition-all flex items-center justify-center gap-2">
                              <CheckCircle size={16}/> Confirm Lead
                            </button>
                          )}
                          <button onClick={() => handleBookingAction(b.id, 'delete')} className="p-6 bg-red-50 text-red-500 rounded-[1.5rem] hover:bg-red-500 hover:text-white transition-all shadow-lg active:scale-90"><Trash2 size={24}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      )}

      {/* PUBLIC LANDING PAGE */}
      {!showDashboard && (
        <>
          <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-xl border-b h-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
              <Logo branding={branding} defaultBranding={defaultBranding} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              
              <div className="hidden md:flex items-center gap-10 font-black uppercase text-[10px] tracking-[0.2em]">
                {['Herd', 'Benefits', 'Gear', 'Gallery', 'FAQ'].map((link) => (
                  <a key={link} href={`#${link.toLowerCase()}`} className="text-stone-500 hover:text-green-800 transition-all hover:tracking-[0.3em]">{link}</a>
                ))}
                <a href="#booking" className="bg-green-800 text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-xl shadow-green-900/20 hover:bg-green-900 transition-all active:scale-95 group">
                  Book Expedition <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </a>
              </div>
              <button className="md:hidden p-2 text-stone-900" onClick={() => setIsMenuOpen(true)}><Menu size={28} /></button>
            </div>
          </nav>

          {/* Mobile Overlay (Public Site) */}
          <div className={`fixed inset-0 z-[60] bg-stone-950 transition-all duration-700 md:hidden ${isMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
            <div className="p-8 flex flex-col h-full">
              <div className="flex justify-between items-center mb-16">
                <Logo branding={branding} defaultBranding={defaultBranding} light />
                <button onClick={() => setIsMenuOpen(false)} className="text-white p-3 bg-white/10 rounded-full"><X size={24} /></button>
              </div>
              <nav className="flex flex-col gap-10 text-center">
                {['Herd', 'Gear', 'Gallery', 'FAQ'].map((link) => (
                  <a key={link} href={`#${link.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-5xl font-black text-white hover:text-green-400 transition-all tracking-tighter uppercase">{link}</a>
                ))}
                <a href="#booking" onClick={() => setIsMenuOpen(false)} className="mt-10 bg-green-600 text-white py-8 rounded-[2rem] text-2xl font-black uppercase tracking-widest shadow-2xl shadow-green-900/50">Plan My Trek</a>
              </nav>
            </div>
          </div>

          <section className="relative h-[100vh] flex items-center justify-center text-center overflow-hidden">
            <div className="absolute inset-0 -z-10"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.35] scale-105" /></div>
            <div className="max-w-5xl px-4 text-white">
              <h1 className="text-6xl md:text-9xl font-black mb-10 leading-[0.95] tracking-tighter animate-in slide-in-from-top-16 duration-1000">Pack the Peak. <br /><span className="italic text-green-400 font-light tracking-normal">Elevate the Trek.</span></h1>
              <p className="text-xl md:text-3xl text-stone-200 mb-16 max-w-4xl mx-auto font-medium leading-relaxed animate-in fade-in duration-1000 delay-300">{slogan}</p>
              <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                <a href="#booking" className="bg-green-600 px-16 py-6 rounded-3xl text-xl font-black shadow-2xl shadow-green-900/40 hover:bg-green-500 transition-all active:scale-95 hover:tracking-[0.05em]">Secure Your String</a>
                <a href="#herd" className="text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 border-b-2 border-white/20 pb-2 hover:border-white transition-all">Meet the Fleet <ArrowDown size={14}/></a>
              </div>
            </div>
          </section>

          <section id="benefits" className="py-40 bg-white"><div className="max-w-7xl mx-auto px-4"><h2 className="text-6xl font-black mb-24 text-center tracking-tighter">Wilderness Intelligence</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-10">{BENEFITS.map((b,i)=><div key={i} className="p-12 bg-stone-50 rounded-[3rem] border border-stone-100 text-left hover:border-green-200 hover:bg-white transition-all group hover:shadow-2xl duration-500"><div className="mb-8 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500">{b.icon}</div><h3 className="text-2xl font-black mb-4 tracking-tight">{b.title}</h3><p className="text-stone-500 font-medium leading-relaxed">{b.description}</p></div>)}</div></div></section>

          <section id="herd" className="py-40 bg-stone-100"><div className="max-w-7xl mx-auto px-4"><h2 className="text-6xl font-black mb-24 text-center tracking-tighter">The Heritage String</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">{llamas.map(l=><LlamaCard key={l.id} llama={l} />)}</div></div></section>

          <section id="gear" className="py-40 bg-white"><div className="max-w-7xl mx-auto px-4"><h2 className="text-6xl font-black mb-24 text-center tracking-tighter">Expedition Kit</h2><GearSection /></div></section>

          <section id="gallery" className="py-40 bg-stone-950 text-white">
            <div className="max-w-7xl mx-auto px-4">
              <header className="flex flex-col md:flex-row justify-between items-end mb-24 gap-8">
                <h2 className="text-6xl md:text-8xl font-black tracking-tighter">Trail Log</h2>
                <div className="bg-white/5 backdrop-blur-md border border-white/10 px-8 py-4 rounded-3xl text-green-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Field Updates Active</div>
              </header>
              <PhotoCarousel images={gallery} />
            </div>
          </section>

          <section id="faq" className="py-40 bg-stone-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 relative z-10"><FAQSection /></div>
          </section>

          <section id="booking" className="py-40 bg-white">
            <div className="max-w-5xl mx-auto px-4 text-center">
              <h2 className="text-6xl font-black mb-24 tracking-tighter">Mission Control</h2>
              <BookingForm />
            </div>
          </section>

          <footer className="bg-stone-950 text-stone-500 py-32 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-16">
              <Logo branding={branding} defaultBranding={defaultBranding} light />
              <div className="flex items-center gap-6">
                <button onClick={() => isAdmin ? setShowDashboard(true) : setShowAdminLogin(true)} className="w-16 h-16 rounded-[1.5rem] bg-white/5 flex items-center justify-center transition-all hover:bg-white/10 text-white group shadow-2xl">
                  {isAdmin ? <Settings className="group-hover:rotate-90 transition-transform duration-500" /> : <Lock size={20} />}
                </button>
                {isAdmin && <span className="text-[10px] font-black uppercase text-green-500 tracking-[0.3em] animate-pulse">Session Active</span>}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">© {new Date().getFullYear()} {branding.siteName}</p>
            </div>
          </footer>
        </>
      )}

      {/* Global CSS Utilities */}
      <style>{`
        .label-style { @apply block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-[0.2em]; }
        .input-style { @apply w-full bg-stone-50 border border-stone-100 p-5 rounded-2xl font-bold focus:bg-white focus:border-green-800 focus:ring-4 focus:ring-green-800/5 outline-none transition-all duration-300; }
        @keyframes float { 0% { transform: translateY(0px); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0px); } }
      `}</style>

      {/* Global Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] bg-stone-950/80 backdrop-blur-2xl flex items-center justify-center">
          <div className="bg-white px-12 py-16 rounded-[4rem] shadow-2xl flex flex-col items-center gap-8 animate-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-800 text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl animate-bounce"><Zap size={32} /></div>
             <div className="text-center">
               <h3 className="text-3xl font-black text-stone-900 mb-2">Syncing Trail Assets</h3>
               <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Finalizing High Country Content...</p>
             </div>
             <Loader2 className="w-10 h-10 text-green-800 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
