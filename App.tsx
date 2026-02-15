
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
  Bell,
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
  galleryMode: 'manual' | 'cloud';
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
    onClick={onClick}
    className={`flex items-center gap-2 px-5 py-3 rounded-full font-black text-xs transition-all shrink-0 ${currentTab === id ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-900'}`}
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
    adminEmail: 'kevin.paul.brown@gmail.com',
    galleryMode: 'manual'
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
        name: 'Unnamed Llama',
        age: 1,
        personality: 'Tell us about this llama...',
        maxLoad: 60,
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
    if (!files || !isAdmin) return;
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

  const unreadBookingsCount = bookings.filter(b => !b.isRead).length;

  return (
    <div className="min-h-screen text-left">
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-black">Admin Access</h3><button onClick={() => setShowAdminLogin(false)}><X /></button></div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <input type="password" placeholder="Password (llama123)" className="w-full bg-stone-100 border p-4 rounded-2xl outline-none font-bold" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus />
              <button type="submit" className="w-full bg-green-800 text-white py-4 rounded-2xl font-black">Open Dashboard</button>
            </form>
          </div>
        </div>
      )}

      {/* Admin Dashboard Overay */}
      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-stone-100 flex flex-col animate-in fade-in overflow-hidden">
          <header className="bg-white border-b px-4 md:px-12 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-800 text-white rounded-xl flex items-center justify-center"><Settings className="w-5 h-5" /></div>
              <h2 className="text-xl font-black">CMS</h2>
            </div>
            
            <nav className="flex items-center gap-2 bg-stone-50 p-1 rounded-full border border-stone-100 overflow-x-auto max-w-full">
              <AdminTabButton id="branding" currentTab={adminTab} label="Branding" icon={Palette} onClick={() => setAdminTab('branding')} />
              <AdminTabButton id="fleet" currentTab={adminTab} label="Fleet" icon={Users} onClick={() => setAdminTab('fleet')} />
              <AdminTabButton id="gallery" currentTab={adminTab} label="Gallery" icon={ImageIcon} onClick={() => setAdminTab('gallery')} />
              <AdminTabButton id="bookings" currentTab={adminTab} label="Logs" icon={ClipboardList} onClick={() => setAdminTab('bookings')} badgeCount={unreadBookingsCount} />
            </nav>

            <button onClick={() => setShowDashboard(false)} className="bg-stone-900 text-white px-6 py-2.5 rounded-full font-black text-xs uppercase flex items-center gap-2 shadow-lg">
              <Home size={14} /> Exit CMS
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20">
            {adminTab === 'branding' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-in slide-in-from-bottom-4">
                <h3 className="text-3xl font-black">Site Branding</h3>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Company Name</label>
                      <input className="w-full bg-stone-50 border p-4 rounded-xl font-bold" value={branding.siteName} onChange={(e) => setBranding({...branding, siteName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Lead Delivery Email</label>
                      <input className="w-full bg-stone-50 border p-4 rounded-xl font-bold" value={branding.adminEmail} onChange={(e) => setBranding({...branding, adminEmail: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Style Highlight (e.g. 'Llamas')</label>
                    <input className="w-full bg-stone-50 border p-4 rounded-xl font-bold italic text-green-800" value={branding.accentName} onChange={(e) => setBranding({...branding, accentName: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'fleet' && (
              <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black">Llama Fleet</h3>
                  {!editingLlama && (
                    <button onClick={() => handleLlamaAction('add')} className="bg-green-800 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2 shadow-xl shadow-green-900/20">
                      <Plus size={18} /> Recruit New Llama
                    </button>
                  )}
                </div>

                {editingLlama ? (
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl space-y-8 animate-in zoom-in duration-300">
                    <div className="flex items-center gap-4 mb-4">
                      <button onClick={() => setEditingLlama(null)} className="p-3 bg-stone-100 rounded-full hover:bg-stone-200 transition-colors"><ChevronLeft /></button>
                      <h4 className="text-2xl font-black">Editing {editingLlama.name}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <div className="aspect-square bg-stone-100 rounded-3xl overflow-hidden relative group">
                          <img src={editingLlama.imageUrl} className="w-full h-full object-cover" />
                          <button onClick={() => llamaPhotoInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-black text-xs uppercase transition-all">Change Photo</button>
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
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="label-style">Name</label><input className="input-style" value={editingLlama.name} onChange={(e) => setEditingLlama({...editingLlama, name: e.target.value})} /></div>
                          <div><label className="label-style">Specialty</label><select className="input-style" value={editingLlama.specialty} onChange={(e) => setEditingLlama({...editingLlama, specialty: e.target.value as any})}><option>Backpacking</option><option>Hunting</option><option>Lead Llama</option><option>Gentle Soul</option></select></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div><label className="label-style">Age</label><input type="number" className="input-style" value={editingLlama.age} onChange={(e) => setEditingLlama({...editingLlama, age: parseInt(e.target.value)})}/></div>
                          <div><label className="label-style">Max Load (lbs)</label><input type="number" className="input-style" value={editingLlama.maxLoad} onChange={(e) => setEditingLlama({...editingLlama, maxLoad: parseInt(e.target.value)})}/></div>
                        </div>
                        <div><label className="label-style">Personality</label><textarea className="input-style h-24 resize-none" value={editingLlama.personality} onChange={(e) => setEditingLlama({...editingLlama, personality: e.target.value})} /></div>
                        <button onClick={() => handleLlamaAction('save')} className="w-full bg-green-800 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-green-900/20 active:scale-95 transition-all">Save Profile Changes</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {llamas.map(l => (
                      <div key={l.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-200 group hover:shadow-xl transition-all">
                        <img src={l.imageUrl} className="w-full h-40 object-cover rounded-2xl mb-4" />
                        <h4 className="text-xl font-black">{l.name}</h4>
                        <p className="text-xs text-stone-400 font-bold uppercase tracking-widest mt-1">{l.specialty}</p>
                        <div className="flex gap-2 mt-6">
                          <button onClick={() => handleLlamaAction('edit', l)} className="flex-1 bg-stone-100 p-2.5 rounded-xl text-stone-600 font-black text-[10px] uppercase tracking-widest">Edit</button>
                          <button onClick={() => handleLlamaAction('delete', l)} className="p-2.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {adminTab === 'gallery' && (
              <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black">Gallery Engine</h3>
                  <button onClick={() => fileInputRef.current?.click()} className="bg-stone-900 text-white px-8 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2">
                    <Upload size={14} /> Batch Upload
                  </button>
                  <input type="file" ref={fileInputRef} multiple className="hidden" accept="image/*" onChange={handleGalleryUpload} />
                </div>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {gallery.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-stone-100 rounded-2xl overflow-hidden relative group border border-stone-100">
                        <img src={img.url} className="w-full h-full object-cover" />
                        <button onClick={() => setGallery(prev => prev.filter((_, i) => i !== idx))} className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash size={12}/>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {adminTab === 'bookings' && (
              <div className="max-w-6xl mx-auto space-y-10 animate-in slide-in-from-bottom-4">
                <h3 className="text-3xl font-black">Expedition Logs</h3>
                {bookings.length === 0 ? (
                  <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-stone-200">
                    <Clock className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                    <p className="text-stone-400 font-bold uppercase tracking-widest text-xs">No active leads found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(b => (
                      <div key={b.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-6 text-left w-full">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                            {b.status === 'confirmed' ? <CheckCircle size={28}/> : <Clock size={28}/>}
                          </div>
                          <div>
                            <h4 className="text-xl font-black">{b.name}</h4>
                            <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">{b.startDate} to {b.endDate} • {b.numLlamas} Llamas</p>
                            <p className="text-stone-500 text-sm mt-1">{b.email} • {b.phone}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                          {b.status !== 'confirmed' && (
                            <button onClick={() => handleBookingAction(b.id, 'confirm')} className="flex-1 md:flex-none px-6 py-3 bg-green-800 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-green-900/10">Confirm</button>
                          )}
                          <button onClick={() => handleBookingAction(b.id, 'delete')} className="p-3.5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={20}/></button>
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

      {/* Main Landing Page */}
      {!showDashboard && (
        <>
          {/* Navigation Bar */}
          <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-lg border-b h-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
              <Logo branding={branding} defaultBranding={defaultBranding} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              
              <div className="hidden md:flex items-center gap-8 font-black uppercase text-xs tracking-widest">
                <a href="#about" className="text-stone-600 hover:text-green-800 transition-colors">The Herd</a>
                <a href="#gear" className="text-stone-600 hover:text-green-800 transition-colors">Gear</a>
                <a href="#faq" className="text-stone-600 hover:text-green-800 transition-colors">FAQ</a>
                <a href="#booking" className="bg-green-800 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-green-900/20 hover:bg-green-900 transition-all active:scale-95">Plan Expedition <ChevronRight size={14} /></a>
              </div>
              <button className="md:hidden p-2 text-stone-900" onClick={() => setIsMenuOpen(true)}><Menu size={28} /></button>
            </div>
          </nav>

          {/* Hero Section */}
          <section className="relative h-[95vh] flex items-center justify-center text-center overflow-hidden">
            <div className="absolute inset-0 -z-10"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.4] scale-105" /></div>
            <div className="max-w-5xl px-4 text-white">
              <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] animate-in slide-in-from-top-12 duration-1000">Pack the Peak. <br /><span className="italic text-green-400 font-light tracking-tight">Free the Trek.</span></h1>
              <p className="text-xl md:text-2xl text-stone-200 mb-12 max-w-3xl mx-auto animate-in fade-in duration-1000 delay-300">{slogan}</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <a href="#booking" className="bg-green-600 px-12 py-5 rounded-full text-lg font-black shadow-xl hover:bg-green-500 transition-all active:scale-95">Secure Your Herd</a>
              </div>
            </div>
          </section>

          {/* Core Sections */}
          <section id="benefits" className="py-32 bg-white"><div className="max-w-7xl mx-auto px-4 text-center"><h2 className="text-5xl font-black mb-20 text-center">Built for the Backcountry</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-8">{BENEFITS.map((b,i)=><div key={i} className="p-10 bg-stone-50 rounded-[2.5rem] border border-stone-100 text-left hover:border-green-200 hover:bg-white transition-all group"><div className="mb-6 group-hover:scale-110 transition-transform">{b.icon}</div><h3 className="text-2xl font-black mb-4">{b.title}</h3><p className="text-stone-500 font-medium leading-relaxed">{b.description}</p></div>)}</div></div></section>

          <section id="about" className="py-32 bg-stone-100"><div className="max-w-7xl mx-auto px-4"><h2 className="text-5xl font-black mb-16 text-center">The Active Herd</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">{llamas.map(l=><LlamaCard key={l.id} llama={l} />)}</div></div></section>

          <section id="gear" className="py-32 bg-white"><div className="max-w-7xl mx-auto px-4"><h2 className="text-5xl font-black mb-20 text-center">Equipment Field Manual</h2><GearSection /></div></section>

          <section id="gallery" className="py-32 bg-stone-950 text-white">
            <div className="max-w-7xl mx-auto px-4">
              <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <h2 className="text-5xl md:text-7xl font-black tracking-tight">Wilderness Journal</h2>
              </header>
              <PhotoCarousel images={gallery} />
            </div>
          </section>

          <section id="faq" className="py-32 bg-stone-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 relative z-10"><FAQSection /></div>
          </section>

          <section id="booking" className="py-32 bg-white">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-5xl font-black mb-20 text-center">Expedition Logistics</h2>
              <BookingForm />
            </div>
          </section>

          {/* Footer & Admin Toggle */}
          <footer className="bg-stone-950 text-stone-500 py-24 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-12">
              <Logo branding={branding} defaultBranding={defaultBranding} light />
              <div className="flex items-center gap-4">
                <button onClick={() => isAdmin ? setShowDashboard(true) : setShowAdminLogin(true)} className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center transition-all hover:bg-white/10 text-white">
                  {isAdmin ? <Settings size={20} /> : <Lock size={20} />}
                </button>
                {isAdmin && <span className="text-[10px] font-black uppercase text-green-500 animate-pulse">Admin Active</span>}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} {branding.siteName}</p>
            </div>
          </footer>
        </>
      )}

      {/* Inline styles for dashboard utility */}
      <style>{`
        .label-style { @apply block text-[10px] font-black uppercase text-stone-400 mb-1.5 tracking-widest; }
        .input-style { @apply w-full bg-stone-50 border border-stone-100 p-4 rounded-xl font-bold focus:bg-white focus:border-green-800 outline-none transition-all; }
      `}</style>

      {/* Global Overlay for Processing */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] bg-stone-900/60 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white px-10 py-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in duration-300">
             <div className="w-16 h-16 bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-lg animate-bounce"><Zap /></div>
             <h3 className="text-2xl font-black text-stone-900">Syncing Wilderness Assets...</h3>
             <Loader2 className="w-8 h-8 text-green-800 animate-spin" />
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
