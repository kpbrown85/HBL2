
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
  Trash,
  LayoutDashboard,
  LogOut
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
  const galleryFileInputRef = useRef<HTMLInputElement>(null);
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
      setShowDashboard(true);
    } else { alert("Access Denied."); }
  };

  const handleBookingAction = (id: string, action: 'delete' | 'confirm') => {
    let updated = [...bookings];
    if (action === 'delete') {
      if (!confirm("Delete this expedition lead?")) return;
      updated = updated.filter(b => b.id !== id);
    } else if (action === 'confirm') {
      updated = updated.map(b => b.id === id ? { ...b, status: 'confirmed', isRead: true } : b);
    }
    setBookings(updated);
    localStorage.setItem('hbl_bookings', JSON.stringify(updated));
  };

  const handleLlamaAction = (action: 'add' | 'edit' | 'delete' | 'save', llama?: Llama) => {
    if (action === 'add') {
      setEditingLlama({
        id: Math.random().toString(36).substr(2, 9),
        name: 'New Recruit',
        age: 3,
        personality: 'Strong and dependable.',
        maxLoad: 70,
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
    const newImages: GalleryImage[] = [];
    for (let i = 0; i < files.length; i++) {
      const reader = new FileReader();
      const p = new Promise<string>((resolve) => {
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(files[i]);
      });
      const raw = await p;
      const optimized = await compressImage(raw);
      newImages.push({ url: optimized, caption: "Expedition Highlight" });
    }
    setGallery(prev => [...newImages, ...prev]);
    setIsProcessing(false);
  };

  const moveGalleryItem = (index: number, direction: 'up' | 'down') => {
    const newGallery = [...gallery];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= gallery.length) return;
    [newGallery[index], newGallery[target]] = [newGallery[target], newGallery[index]];
    setGallery(newGallery);
  };

  const unreadCount = bookings.filter(b => !b.isRead).length;

  const SidebarItem = ({ id, label, icon: Icon }: { id: typeof adminTab, label: string, icon: any }) => (
    <button 
      onClick={() => { setAdminTab(id); setEditingLlama(null); }}
      className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${adminTab === id ? 'bg-green-800 text-white shadow-xl shadow-green-900/20' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-900'}`}
    >
      <Icon size={18} />
      {label}
      {id === 'bookings' && unreadCount > 0 && (
        <span className="ml-auto bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[10px]">{unreadCount}</span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen text-left">
      {/* Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-stone-900/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl animate-in zoom-in">
            <h3 className="text-3xl font-black mb-2">Admin Portal</h3>
            <p className="text-stone-400 text-sm mb-8 font-bold uppercase tracking-widest">Verify credentials to enter Mission Control.</p>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <input type="password" placeholder="Access Code (llama123)" className="w-full bg-stone-100 border p-5 rounded-2xl outline-none font-bold focus:ring-4 focus:ring-green-500/10" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowAdminLogin(false)} className="flex-1 bg-stone-100 text-stone-500 py-4 rounded-2xl font-black">Cancel</button>
                <button type="submit" className="flex-[2] bg-green-800 text-white py-4 rounded-2xl font-black shadow-lg">Authenticate</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD */}
      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col md:flex-row animate-in fade-in overflow-hidden">
          {/* Sidebar */}
          <aside className="w-full md:w-80 bg-white border-r flex flex-col shrink-0">
            <div className="p-8 border-b">
              <Logo branding={branding} defaultBranding={defaultBranding} onClick={() => setShowDashboard(false)} />
            </div>
            <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
              <SidebarItem id="branding" label="Identity" icon={Palette} />
              <SidebarItem id="fleet" label="The Herd" icon={Users} />
              <SidebarItem id="gallery" label="Journal" icon={ImageIcon} />
              <SidebarItem id="bookings" label="Logistics" icon={ClipboardList} />
            </nav>
            <div className="p-6 border-t space-y-4">
              <button onClick={() => setShowDashboard(false)} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-stone-400 hover:bg-stone-100 hover:text-stone-900 transition-all">
                <Home size={18} /> View Site
              </button>
              <button onClick={() => { setIsAdmin(false); setShowDashboard(false); }} className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all">
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </aside>

          {/* Main Workspace */}
          <main className="flex-1 bg-stone-50 overflow-y-auto">
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b px-8 py-6 flex justify-between items-center">
              <h2 className="text-2xl font-black tracking-tight flex items-center gap-4">
                <LayoutDashboard className="text-stone-300" />
                {adminTab === 'branding' && "Site Branding"}
                {adminTab === 'fleet' && "Llama Fleet Management"}
                {adminTab === 'gallery' && "Wilderness Journal"}
                {adminTab === 'bookings' && "Expedition Leads"}
              </h2>
              {adminTab === 'fleet' && !editingLlama && (
                <button onClick={() => handleLlamaAction('add')} className="bg-green-800 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-900/20">
                  <Plus size={16} /> Recruit Llama
                </button>
              )}
              {adminTab === 'gallery' && (
                <button onClick={() => galleryFileInputRef.current?.click()} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2">
                  <Upload size={16} /> Batch Import
                </button>
              )}
            </header>

            <div className="p-8 md:p-12 lg:p-20">
              {/* Branding Content */}
              {adminTab === 'branding' && (
                <div className="max-w-4xl space-y-10 animate-in slide-in-from-bottom-4">
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-stone-100 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Business Name</label>
                        <input className="w-full bg-stone-50 border p-4 rounded-xl font-bold" value={branding.siteName} onChange={(e) => setBranding({...branding, siteName: e.target.value})} />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Notification Email</label>
                        <input className="w-full bg-stone-50 border p-4 rounded-xl font-bold" value={branding.adminEmail} onChange={(e) => setBranding({...branding, adminEmail: e.target.value})} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Style Accent (Italic Word)</label>
                      <input className="w-full bg-stone-50 border p-4 rounded-xl font-bold italic text-green-800" value={branding.accentName} onChange={(e) => setBranding({...branding, accentName: e.target.value})} />
                    </div>
                  </div>
                </div>
              )}

              {/* Fleet Content */}
              {adminTab === 'fleet' && (
                <div className="animate-in slide-in-from-bottom-4">
                  {editingLlama ? (
                    <div className="max-w-5xl bg-white p-10 rounded-[3rem] shadow-2xl space-y-10 border border-stone-100">
                      <div className="flex items-center gap-4">
                        <button onClick={() => setEditingLlama(null)} className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><ChevronLeft /></button>
                        <h4 className="text-3xl font-black">Editing {editingLlama.name}</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                          <div className="aspect-square bg-stone-50 rounded-[3rem] overflow-hidden relative group shadow-inner border-4 border-stone-50">
                            <img src={editingLlama.imageUrl} className="w-full h-full object-cover" />
                            <button onClick={() => llamaPhotoInputRef.current?.click()} className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white font-black text-[10px] uppercase tracking-widest transition-all">
                              <ImageIcon className="mb-2" /> Change Asset
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
                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Name</label>
                              <input className="w-full bg-stone-50 border p-4 rounded-xl font-bold" value={editingLlama.name} onChange={(e) => setEditingLlama({...editingLlama, name: e.target.value})} />
                            </div>
                            <div>
                              <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Specialty</label>
                              <select className="w-full bg-stone-50 border p-4 rounded-xl font-bold outline-none" value={editingLlama.specialty} onChange={(e) => setEditingLlama({...editingLlama, specialty: e.target.value as any})}>
                                <option>Backpacking</option><option>Hunting</option><option>Lead Llama</option><option>Gentle Soul</option>
                              </select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Age</label><input type="number" className="w-full bg-stone-50 border p-4 rounded-xl font-bold" value={editingLlama.age} onChange={(e) => setEditingLlama({...editingLlama, age: parseInt(e.target.value)})}/></div>
                            <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Max Load</label><input type="number" className="w-full bg-stone-50 border p-4 rounded-xl font-bold" value={editingLlama.maxLoad} onChange={(e) => setEditingLlama({...editingLlama, maxLoad: parseInt(e.target.value)})}/></div>
                          </div>
                          <div><label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Personality Profile</label><textarea className="w-full bg-stone-50 border p-4 rounded-xl font-bold h-32 resize-none" value={editingLlama.personality} onChange={(e) => setEditingLlama({...editingLlama, personality: e.target.value})} /></div>
                          <button onClick={() => handleLlamaAction('save')} className="w-full bg-green-800 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-900/20 active:scale-95 transition-all flex items-center justify-center gap-3">
                            <Save /> Commit Changes
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {llamas.map(l => (
                        <div key={l.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-200 group hover:shadow-xl transition-all">
                          <div className="aspect-square rounded-2xl overflow-hidden mb-6"><img src={l.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" /></div>
                          <h4 className="text-xl font-black">{l.name}</h4>
                          <div className="flex items-center gap-2 mt-2">
                             <span className="text-[10px] font-black uppercase text-green-700 bg-green-50 px-2 py-1 rounded-full">{l.specialty}</span>
                          </div>
                          <div className="flex gap-2 mt-8">
                            <button onClick={() => handleLlamaAction('edit', l)} className="flex-1 bg-stone-100 p-3 rounded-xl text-stone-600 font-black text-[10px] uppercase tracking-widest hover:bg-stone-900 hover:text-white transition-all">Edit Profile</button>
                            <button onClick={() => handleLlamaAction('delete', l)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Gallery Content */}
              {adminTab === 'gallery' && (
                <div className="space-y-10 animate-in slide-in-from-bottom-4">
                  <input type="file" ref={galleryFileInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                  <div className="bg-white p-10 rounded-[3.5rem] shadow-xl border border-stone-100">
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                      {gallery.map((img, idx) => (
                        <div key={idx} className="aspect-square bg-stone-50 rounded-[2rem] overflow-hidden relative group border-2 border-stone-50 hover:border-green-200 transition-all">
                          <img src={img.url} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-2 transition-all p-4">
                            <div className="flex gap-2">
                              <button onClick={() => moveGalleryItem(idx, 'up')} disabled={idx === 0} className="w-8 h-8 bg-white/20 hover:bg-white text-white hover:text-stone-900 rounded-lg flex items-center justify-center disabled:opacity-20"><ArrowUp size={14} /></button>
                              <button onClick={() => moveGalleryItem(idx, 'down')} disabled={idx === gallery.length - 1} className="w-8 h-8 bg-white/20 hover:bg-white text-white hover:text-stone-900 rounded-lg flex items-center justify-center disabled:opacity-20"><ArrowDown size={14} /></button>
                            </div>
                            <button onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))} className="w-full py-2 bg-red-500/80 hover:bg-red-500 text-white rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"><Trash size={12}/> Delete</button>
                          </div>
                          <div className="absolute top-2 left-2 bg-black/40 text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest backdrop-blur-sm">#{idx + 1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Bookings Content */}
              {adminTab === 'bookings' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                  {bookings.length === 0 ? (
                    <div className="bg-white p-24 rounded-[3.5rem] text-center border-4 border-dashed border-stone-100 flex flex-col items-center">
                      <Clock className="w-16 h-16 text-stone-100 mb-6" />
                      <p className="text-stone-400 font-black uppercase tracking-widest text-sm">No expedition leads currently in log.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-6">
                      {bookings.map(b => (
                        <div key={b.id} className={`bg-white p-8 md:p-10 rounded-[3rem] border shadow-sm transition-all flex flex-col lg:flex-row items-center justify-between gap-10 hover:shadow-xl ${!b.isRead ? 'border-green-800/20 ring-4 ring-green-800/5' : 'border-stone-100'}`}>
                          <div className="flex flex-col md:flex-row items-center gap-8 text-center md:text-left w-full">
                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-lg ${b.status === 'confirmed' ? 'bg-green-800 text-white' : 'bg-orange-500 text-white'}`}>
                              {b.status === 'confirmed' ? <CheckCircle size={32}/> : <Clock size={32}/>}
                            </div>
                            <div className="flex-1">
                              <h4 className="text-2xl font-black text-stone-900 mb-1">{b.name}</h4>
                              <div className="flex flex-wrap justify-center md:justify-start gap-x-6 gap-y-1 text-stone-400 font-bold uppercase tracking-widest text-[10px]">
                                <span className="flex items-center gap-2"><Clock size={12}/> {b.startDate} to {b.endDate}</span>
                                <span className="flex items-center gap-2"><Users size={12}/> {b.numLlamas} Llamas</span>
                                <span className="flex items-center gap-2 text-stone-900"><Mail size={12}/> {b.email}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-4 w-full lg:w-auto">
                            {b.status !== 'confirmed' && (
                              <button onClick={() => handleBookingAction(b.id, 'confirm')} className="flex-1 lg:flex-none px-8 py-4 bg-green-800 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-green-900/20 transition-all hover:bg-green-700">Confirm</button>
                            )}
                            <button onClick={() => handleBookingAction(b.id, 'delete')} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-95"><Trash2 size={24}/></button>
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

      {/* PUBLIC SITE */}
      {!showDashboard && (
        <>
          <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-xl border-b h-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
              <Logo branding={branding} defaultBranding={defaultBranding} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <div className="hidden md:flex items-center gap-10 font-black uppercase text-[10px] tracking-widest">
                <a href="#about" className="text-stone-500 hover:text-green-800 transition-all">The Herd</a>
                <a href="#gear" className="text-stone-500 hover:text-green-800 transition-all">Gear</a>
                <a href="#faq" className="text-stone-500 hover:text-green-800 transition-all">FAQ</a>
                <a href="#booking" className="bg-green-800 text-white px-8 py-3.5 rounded-2xl flex items-center gap-2 shadow-xl shadow-green-900/20 hover:bg-green-900 transition-all">Book Expedition <ChevronRight size={14} /></a>
              </div>
              <button className="md:hidden p-2 text-stone-900" onClick={() => setIsMenuOpen(true)}><Menu size={28} /></button>
            </div>
          </nav>

          {/* Hero */}
          <section className="relative h-[95vh] flex items-center justify-center text-center overflow-hidden">
            <div className="absolute inset-0 -z-10"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.35] scale-105" /></div>
            <div className="max-w-5xl px-4 text-white">
              <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] animate-in slide-in-from-top-12 duration-1000 tracking-tight">Unload the Journey. <br /><span className="italic text-green-400 font-light">Pack the Peak.</span></h1>
              <p className="text-xl md:text-2xl text-stone-200 mb-12 max-w-3xl mx-auto animate-in fade-in duration-1000 delay-300 font-medium leading-relaxed">{slogan}</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <a href="#booking" className="bg-green-600 px-12 py-5 rounded-full text-lg font-black shadow-xl hover:bg-green-500 transition-all active:scale-95">Secure Your Herd</a>
              </div>
            </div>
          </section>

          {/* Core Layout Sections */}
          <section id="benefits" className="py-32 bg-white"><div className="max-w-7xl mx-auto px-4"><h2 className="text-5xl font-black mb-20 text-center tracking-tight">High Altitude Performance</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-8">{BENEFITS.map((b,i)=><div key={i} className="p-10 bg-stone-50 rounded-[3rem] border border-stone-100 hover:border-green-200 hover:bg-white transition-all group"><div className="mb-8 group-hover:scale-110 transition-transform">{b.icon}</div><h3 className="text-2xl font-black mb-4">{b.title}</h3><p className="text-stone-500 font-medium leading-relaxed">{b.description}</p></div>)}</div></div></section>
          <section id="about" className="py-32 bg-stone-100"><div className="max-w-7xl mx-auto px-4"><h2 className="text-5xl font-black mb-16 text-center tracking-tight">The Heritage Herd</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">{llamas.map(l=><LlamaCard key={l.id} llama={l} />)}</div></div></section>
          <section id="gear" className="py-32 bg-white"><div className="max-w-7xl mx-auto px-4"><h2 className="text-5xl font-black mb-20 text-center tracking-tight">Expedition Kit</h2><GearSection /></div></section>
          <section id="gallery" className="py-32 bg-stone-950 text-white">
            <div className="max-w-7xl mx-auto px-4">
              <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-none">Trail Journal</h2>
              </header>
              <PhotoCarousel images={gallery} />
            </div>
          </section>
          <section id="faq" className="py-32 bg-stone-50 relative overflow-hidden"><div className="max-w-7xl mx-auto px-4 relative z-10"><FAQSection /></div></section>
          <section id="booking" className="py-32 bg-white"><div className="max-w-5xl mx-auto px-4 text-center"><h2 className="text-5xl font-black mb-20 tracking-tight">Expedition Logistics</h2><BookingForm /></div></section>

          {/* Footer */}
          <footer className="bg-stone-950 text-stone-500 py-24 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12">
              <Logo branding={branding} defaultBranding={defaultBranding} light />
              <div className="flex items-center gap-6">
                <button onClick={() => isAdmin ? setShowDashboard(true) : setShowAdminLogin(true)} className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center transition-all hover:bg-white/10 text-white shadow-2xl">
                  {isAdmin ? <Settings size={24} /> : <Lock size={24} />}
                </button>
                {isAdmin && <span className="text-[10px] font-black uppercase text-green-500 animate-pulse tracking-widest">Admin Session Verified</span>}
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em]">© {new Date().getFullYear()} {branding.siteName}</p>
            </div>
          </footer>
        </>
      )}

      {/* Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 z-[300] bg-stone-950/80 backdrop-blur-2xl flex items-center justify-center">
          <div className="bg-white px-12 py-16 rounded-[4rem] shadow-2xl flex flex-col items-center gap-8 animate-in zoom-in">
             <div className="w-20 h-20 bg-green-800 text-white rounded-[2rem] flex items-center justify-center shadow-2xl animate-bounce"><Zap size={32} /></div>
             <div className="text-center">
               <h3 className="text-3xl font-black text-stone-900 mb-2">Syncing Trail Assets</h3>
               <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">Optimizing High Country Content...</p>
             </div>
             <Loader2 className="w-10 h-10 text-green-800 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
