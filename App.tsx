
import React, { useState, useEffect, useRef } from 'react';
import { LLAMAS, GALLERY_IMAGES, FAQS, BENEFITS } from './constants';
import { LlamaCard } from './components/LlamaCard';
import { BookingForm } from './components/BookingForm';
import { Testimonials } from './components/Testimonials';
import { PhotoCarousel } from './components/PhotoCarousel';
import { GearSection } from './components/GearSection';
import { FAQSection } from './components/FAQSection';
import { generateWelcomeSlogan, getLlamaAdvice } from './services/geminiService';
import { GalleryImage, Llama, BookingData } from './types';
import { 
  Menu, 
  X, 
  ChevronRight, 
  ArrowRight,
  Mountain,
  Plus,
  Sparkles,
  Upload,
  Loader2,
  Image as ImageIcon,
  GripVertical,
  Lock,
  Unlock,
  Trash2,
  LogIn,
  Settings,
  RefreshCcw,
  Palette,
  ClipboardList,
  ArrowUpRight,
  Users,
  Camera,
  Home,
  Zap,
  Type,
  Cloud,
  Link as LinkIcon,
  Phone,
  Mail,
  CheckCircle,
  Clock,
  Truck,
  GraduationCap,
  Edit,
  Save,
  ChevronLeft,
  Bell,
  AlertCircle,
  Ban,
  Send
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
  guideImageUrl: string;
  galleryMode: 'manual' | 'cloud';
  cloudFeedUrl: string;
  adminEmail: string;
}

const Logo = ({ branding, defaultBranding, light = false, onClick }: { branding: Branding, defaultBranding: Branding, light?: boolean, onClick: () => void }) => {
  const siteTitle = (branding?.siteName || defaultBranding.siteName).toString();
  const accent = (branding?.accentName || defaultBranding.accentName).toString();
  const regex = new RegExp(`(${accent})`, 'gi');
  const parts = siteTitle.split(regex);
  return (
    <div className="flex items-center gap-3 cursor-pointer" onClick={onClick}>
      {branding?.logoType === 'icon' ? (
        <div className={`w-10 h-10 ${light ? 'bg-white text-green-800' : 'bg-green-800 text-white'} rounded-lg flex items-center justify-center shadow-lg shrink-0`}>
          <Mountain className="w-6 h-6" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg overflow-hidden shadow-lg border border-stone-100 bg-white flex items-center justify-center shrink-0">
          {branding?.logoUrl ? (
            <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
          ) : (
            <ImageIcon className="text-stone-300 w-5 h-5" />
          )}
        </div>
      )}
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
    className={`relative flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm transition-all ${currentTab === id ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-900'}`}
  >
    <Icon className="w-4 h-4" />
    {label}
    {badgeCount !== undefined && badgeCount > 0 && (
      <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-md animate-pulse">
        {badgeCount}
      </span>
    )}
  </button>
);

const NavLink: React.FC<{ href: string; id: string; children: React.ReactNode; onClick: (e: React.MouseEvent<HTMLAnchorElement>, id: string) => void }> = ({ href, id, children, onClick }) => (
  <a 
    href={href} 
    onClick={(e) => onClick(e, id)} 
    className="text-sm font-black text-stone-600 hover:text-green-800 transition-colors uppercase tracking-widest block md:inline"
  >
    {children}
  </a>
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
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [bookings, setBookings] = useState<BookingData[]>([]);

  const defaultBranding: Branding = {
    siteName: "Helena Backcountry Llamas",
    accentName: "Llamas",
    logoType: 'icon',
    logoUrl: "",
    heroImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=2400",
    guideImageUrl: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800",
    galleryMode: 'manual',
    cloudFeedUrl: '',
    adminEmail: 'kevin.paul.brown@gmail.com'
  };

  const [branding, setBranding] = useState<Branding>(() => {
    try {
      const saved = localStorage.getItem('hbl_branding');
      const parsed = saved ? JSON.parse(saved) : null;
      return { ...defaultBranding, ...parsed };
    } catch {
      return defaultBranding;
    }
  });

  const [llamas, setLlamas] = useState<Llama[]>(() => {
    try {
      const saved = localStorage.getItem('hbl_llamas');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : LLAMAS;
    } catch {
      return LLAMAS;
    }
  });

  const [gallery, setGallery] = useState<GalleryImage[]>(() => {
    try {
      const saved = localStorage.getItem('hbl_gallery');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : GALLERY_IMAGES;
    } catch {
      return GALLERY_IMAGES;
    }
  });

  const [editingLlama, setEditingLlama] = useState<Llama | null>(null);
  const [activeLlamaEdit, setActiveLlamaEdit] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const llamaPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    generateWelcomeSlogan().then(val => { if (val) setSlogan(val); });
    const loadBookings = () => {
      const saved = JSON.parse(localStorage.getItem('hbl_bookings') || '[]');
      setBookings(saved);
    };
    loadBookings();
    window.addEventListener('hbl_new_booking', loadBookings);
    return () => window.removeEventListener('hbl_new_booking', loadBookings);
  }, []);

  useEffect(() => { if (gallery.length > 0) safeSave('hbl_gallery', gallery); }, [gallery]);
  useEffect(() => { safeSave('hbl_branding', branding); document.title = branding?.siteName; }, [branding]);
  useEffect(() => { if (llamas.length > 0) safeSave('hbl_llamas', llamas); }, [llamas]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "llama123") {
      setIsAdmin(true); setShowAdminLogin(false); setPasswordInput("");
    } else { alert("Access Denied."); }
  };

  const handleBookingAction = (id: string, action: 'delete' | 'confirm' | 'cancel' | 'read') => {
    if (!isAdmin) return;
    let updated = [...bookings];
    if (action === 'delete') {
      if (!confirm("Delete this lead?")) return;
      updated = updated.filter(b => b.id !== id);
    } else if (action === 'confirm') {
      updated = updated.map(b => b.id === id ? { ...b, status: 'confirmed', isRead: true } : b);
    } else if (action === 'cancel') {
      updated = updated.map(b => b.id === id ? { ...b, status: 'canceled', isRead: true } : b);
    } else if (action === 'read') {
      updated = updated.map(b => b.id === id ? { ...b, isRead: true } : b);
    }
    setBookings(updated);
    localStorage.setItem('hbl_bookings', JSON.stringify(updated));
  };

  const handleLlamaAction = (action: 'add' | 'edit' | 'delete' | 'save', llama?: Llama) => {
    if (!isAdmin) return;
    if (action === 'add') {
      const newLlama: Llama = {
        id: Math.random().toString(36).substr(2, 9),
        name: 'New Llama',
        age: 1,
        personality: 'Quiet and observant.',
        maxLoad: 50,
        imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
        specialty: 'Backpacking'
      };
      setEditingLlama(newLlama);
      setActiveLlamaEdit(newLlama.id);
    } else if (action === 'edit' && llama) {
      setEditingLlama({ ...llama });
      setActiveLlamaEdit(llama.id);
    } else if (action === 'delete' && llama) {
      if (confirm(`Remove ${llama.name} from herd?`)) {
        setLlamas(prev => prev.filter(l => l.id !== llama.id));
      }
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
      setActiveLlamaEdit(null);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'llama' | 'branding') => {
    const file = e.target.files?.[0];
    if (file && isAdmin) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        if (target === 'llama' && editingLlama) {
          setEditingLlama({ ...editingLlama, imageUrl: compressed });
        } else if (target === 'branding') {
          // You could add logic here for branding assets if needed
        }
        setIsProcessing(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elRect = el.getBoundingClientRect().top;
      const pos = elRect - bodyRect - offset;
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const unreadBookingsCount = bookings.filter(b => !b.isRead).length;

  return (
    <div className="min-h-screen text-left">
      {/* Mobile Navigation */}
      <div className={`fixed inset-0 z-[60] bg-stone-900 transition-all duration-500 md:hidden ${isMenuOpen ? 'translate-y-0' : '-translate-y-full'}`}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex justify-between items-center mb-16">
            <Logo branding={branding} defaultBranding={defaultBranding} light onClick={() => setIsMenuOpen(false)} />
            <button onClick={() => setIsMenuOpen(false)} className="text-white p-2 bg-white/10 rounded-full"><X size={24} /></button>
          </div>
          <nav className="flex flex-col gap-8 text-center">
            {['about', 'benefits', 'gear', 'gallery', 'faq'].map((link) => (
              <a 
                key={link}
                href={`#${link}`} 
                onClick={(e) => scrollToSection(e, link)}
                className="text-4xl font-black text-white hover:text-green-400 transition-colors uppercase tracking-tight"
              >
                {link}
              </a>
            ))}
            <a 
              href="#booking" 
              onClick={(e) => scrollToSection(e, 'booking')}
              className="mt-8 bg-green-600 text-white py-6 rounded-2xl text-2xl font-black uppercase tracking-widest shadow-2xl"
            >
              Book Now
            </a>
          </nav>
        </div>
      </div>

      {isProcessing && (
        <div className="fixed inset-0 z-[200] bg-stone-900/40 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white px-10 py-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6">
             <div className="w-16 h-16 bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-lg animate-bounce"><Zap /></div>
             <h3 className="text-2xl font-black text-stone-900">Syncing Assets...</h3>
             <Loader2 className="w-8 h-8 text-green-800 animate-spin" />
          </div>
        </div>
      )}

      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in fade-in zoom-in">
            <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-black">Admin Access</h3><button onClick={() => setShowAdminLogin(false)}><X /></button></div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <input type="password" placeholder="Enter Admin Password" className="w-full bg-stone-100 border p-4 rounded-2xl outline-none font-bold" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus />
              <button type="submit" className="w-full bg-green-800 text-white py-4 rounded-2xl font-black">Verify Identity</button>
            </form>
          </div>
        </div>
      )}

      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-stone-100 flex flex-col animate-in fade-in overflow-hidden">
          <header className="bg-white border-b px-4 md:px-12 py-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-800 text-white rounded-xl flex items-center justify-center shadow-lg"><Settings className="w-5 h-5" /></div>
              <h2 className="text-xl font-black">CMS</h2>
            </div>
            <nav className="hidden lg:flex items-center gap-2 bg-stone-50 p-1 rounded-full border border-stone-100">
              <AdminTabButton id="branding" currentTab={adminTab} label="Branding" icon={Palette} onClick={() => setAdminTab('branding')} />
              <AdminTabButton id="fleet" currentTab={adminTab} label="Llama Fleet" icon={Users} onClick={() => setAdminTab('fleet')} />
              <AdminTabButton id="gallery" currentTab={adminTab} label="Gallery" icon={ImageIcon} onClick={() => setAdminTab('gallery')} />
              <AdminTabButton id="bookings" currentTab={adminTab} label="Expedition Logs" icon={ClipboardList} onClick={() => setAdminTab('bookings')} badgeCount={unreadBookingsCount} />
            </nav>
            <div className="flex items-center gap-4">
              <button onClick={() => setShowDashboard(false)} className="bg-stone-900 text-white px-6 py-3 rounded-full font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-stone-800 transition-all">
                <Home className="w-4 h-4" /> Return to Site
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20">
            {/* Branding Tab */}
            {adminTab === 'branding' && (
              <div className="max-w-4xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-3xl font-black">Site Branding</h3>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-400 mb-2">Site Name</label>
                      <input className="w-full bg-stone-50 border p-4 rounded-xl font-bold" value={branding.siteName} onChange={(e) => setBranding({...branding, siteName: e.target.value})} />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase text-stone-400 mb-2">Admin Email</label>
                      <input className="w-full bg-stone-50 border p-4 rounded-xl font-bold" value={branding.adminEmail} onChange={(e) => setBranding({...branding, adminEmail: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-stone-400 mb-2">Accent Highlight (Italicized Word)</label>
                    <input className="w-full bg-stone-50 border p-4 rounded-xl font-bold" value={branding.accentName} onChange={(e) => setBranding({...branding, accentName: e.target.value})} />
                  </div>
                </div>
              </div>
            )}

            {/* Fleet Tab */}
            {adminTab === 'fleet' && (
              <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-3xl font-black">Fleet Management</h3>
                  {!editingLlama && (
                    <button onClick={() => handleLlamaAction('add')} className="bg-green-800 text-white px-6 py-3 rounded-xl font-black text-sm flex items-center gap-2">
                      <Plus size={18} /> Add Llama
                    </button>
                  )}
                </div>

                {editingLlama ? (
                  <div className="bg-white p-10 rounded-[3rem] shadow-xl space-y-8 animate-in zoom-in">
                    <div className="flex items-center gap-4 mb-4">
                      <button onClick={() => setEditingLlama(null)} className="p-2 bg-stone-100 rounded-full"><ChevronLeft /></button>
                      <h4 className="text-2xl font-black">Edit {editingLlama.name}</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                      <div className="space-y-4">
                        <div className="aspect-square bg-stone-100 rounded-3xl overflow-hidden relative group">
                          <img src={editingLlama.imageUrl} className="w-full h-full object-cover" />
                          <button onClick={() => llamaPhotoInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-black text-xs uppercase transition-all">
                            Change Photo
                          </button>
                        </div>
                        <input type="file" ref={llamaPhotoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, 'llama')} />
                      </div>
                      <div className="space-y-6">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">Name</label>
                          <input className="w-full bg-stone-50 p-4 rounded-xl font-bold" value={editingLlama.name} onChange={(e) => setEditingLlama({...editingLlama, name: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">Age</label>
                            <input type="number" className="w-full bg-stone-50 p-4 rounded-xl font-bold" value={editingLlama.age} onChange={(e) => setEditingLlama({...editingLlama, age: parseInt(e.target.value) || 0})} />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">Max Load (lbs)</label>
                            <input type="number" className="w-full bg-stone-50 p-4 rounded-xl font-bold" value={editingLlama.maxLoad} onChange={(e) => setEditingLlama({...editingLlama, maxLoad: parseInt(e.target.value) || 0})} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-stone-400 mb-1">Personality</label>
                          <textarea className="w-full bg-stone-50 p-4 rounded-xl font-bold h-24" value={editingLlama.personality} onChange={(e) => setEditingLlama({...editingLlama, personality: e.target.value})} />
                        </div>
                        <button onClick={() => handleLlamaAction('save')} className="w-full bg-green-800 text-white py-4 rounded-xl font-black">Save Llama Profile</button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {llamas.map(l => (
                      <div key={l.id} className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-stone-200">
                        <img src={l.imageUrl} className="w-full h-32 object-cover rounded-2xl mb-4" />
                        <h4 className="text-xl font-black">{l.name}</h4>
                        <div className="flex gap-2 mt-4">
                          <button onClick={() => handleLlamaAction('edit', l)} className="flex-1 bg-stone-100 p-2 rounded-lg text-stone-600 font-bold text-xs">Edit</button>
                          <button onClick={() => handleLlamaAction('delete', l)} className="p-2 bg-red-50 text-red-500 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Gallery Tab */}
            {adminTab === 'gallery' && (
              <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-3xl font-black">Gallery Engine</h3>
                <div className="bg-white p-10 rounded-[3rem] shadow-xl">
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {gallery.map((img, idx) => (
                      <div key={idx} className="aspect-square bg-stone-100 rounded-2xl overflow-hidden relative group">
                        <img src={img.url} className="w-full h-full object-cover" />
                        <button onClick={() => {
                          const updated = [...gallery];
                          updated.splice(idx, 1);
                          setGallery(updated);
                        }} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100">
                          <X size={14}/>
                        </button>
                      </div>
                    ))}
                    <button className="aspect-square border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-stone-300 hover:text-green-800 hover:border-green-800 transition-all">
                      <Plus size={32}/>
                      <span className="text-[10px] font-black uppercase">Upload</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {adminTab === 'bookings' && (
              <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4">
                <h3 className="text-3xl font-black">Expedition Logs</h3>
                {bookings.length === 0 ? (
                  <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed">
                    <Clock className="w-16 h-16 text-stone-200 mx-auto mb-4" />
                    <p className="text-stone-400 font-bold">No active leads found.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(b => (
                      <div key={b.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${b.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
                            {b.status === 'confirmed' ? <CheckCircle size={24}/> : <Clock size={24}/>}
                          </div>
                          <div>
                            <h4 className="text-xl font-black">{b.name}</h4>
                            <p className="text-stone-400 text-xs font-bold">{b.startDate} to {b.endDate} • {b.numLlamas} Llamas</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleBookingAction(b.id, 'confirm')} className="px-4 py-2 bg-green-800 text-white rounded-xl text-xs font-black uppercase">Confirm</button>
                          <button onClick={() => handleBookingAction(b.id, 'delete')} className="p-3 bg-red-50 text-red-500 rounded-xl"><Trash2 size={18}/></button>
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

      {/* Main Landing Layout */}
      {!showDashboard && (
        <>
          <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-lg border-b h-20 flex items-center">
            <div className="max-w-7xl mx-auto px-4 w-full flex justify-between items-center">
              <Logo branding={branding} defaultBranding={defaultBranding} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <div className="hidden md:flex items-center gap-8 font-black uppercase text-xs tracking-widest">
                <NavLink href="#about" id="about" onClick={scrollToSection}>The Herd</NavLink>
                <NavLink href="#benefits" id="benefits" onClick={scrollToSection}>Benefits</NavLink>
                <NavLink href="#gear" id="gear" onClick={scrollToSection}>Gear Guide</NavLink>
                <NavLink href="#gallery" id="gallery" onClick={scrollToSection}>Gallery</NavLink>
                <NavLink href="#faq" id="faq" onClick={scrollToSection}>FAQ</NavLink>
                <a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="bg-green-800 text-white px-6 py-3 rounded-full flex items-center gap-2 shadow-lg shadow-green-900/20 hover:bg-green-900 transition-all">Book <ChevronRight size={14} /></a>
              </div>
              <button className="md:hidden p-2 text-stone-900" onClick={() => setIsMenuOpen(true)}><Menu size={28} /></button>
            </div>
          </nav>

          <section className="relative h-[95vh] flex items-center justify-center text-center overflow-hidden">
            <div className="absolute inset-0 -z-10"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.4] scale-105" /></div>
            <div className="max-w-5xl px-4 text-white">
              <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] animate-in slide-in-from-top-12 duration-1000">Elevate the Trek. <br /><span className="italic text-green-400 font-light">Unload the Journey.</span></h1>
              <p className="text-xl md:text-2xl text-stone-200 mb-12 max-w-3xl mx-auto animate-in fade-in duration-1000 delay-300">{slogan}</p>
              <div className="flex flex-col sm:flex-row gap-6 justify-center">
                <a href="#booking" onClick={(e)=>scrollToSection(e,'booking')} className="bg-green-600 px-12 py-5 rounded-full text-lg font-black shadow-xl hover:bg-green-500 transition-all active:scale-95">Plan Your Adventure</a>
              </div>
            </div>
          </section>

          <section id="benefits" className="py-32 bg-white"><div className="max-w-7xl mx-auto px-4 text-center"><h2 className="text-5xl font-black mb-20 text-center">Built for the Backcountry</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-8">{BENEFITS.map((b,i)=><div key={i} className="p-10 bg-stone-50 rounded-[2.5rem] border border-stone-100 text-left hover:border-green-200 hover:bg-white transition-all group"><div className="mb-6 group-hover:scale-110 transition-transform">{b.icon}</div><h3 className="text-2xl font-black mb-4">{b.title}</h3><p className="text-stone-500 font-medium leading-relaxed">{b.description}</p></div>)}</div></div></section>

          <section id="about" className="py-32 bg-stone-100"><div className="max-w-7xl mx-auto px-4"><h2 className="text-5xl font-black mb-16 text-center">The Herd</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">{llamas.map(l=><LlamaCard key={l.id} llama={l} />)}</div></div></section>

          <section id="gear" className="py-32 bg-white"><div className="max-w-7xl mx-auto px-4"><h2 className="text-5xl font-black mb-20 text-center">Gear Guide</h2><GearSection /></div></section>

          <section id="gallery" className="py-32 bg-stone-950 text-white">
            <div className="max-w-7xl mx-auto px-4">
              <header className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <h2 className="text-5xl md:text-7xl font-black tracking-tight">Wilderness Journal</h2>
              </header>
              <PhotoCarousel images={gallery} />
            </div>
          </section>

          <section id="faq" className="py-32 bg-stone-50 relative overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 relative z-10">
              <FAQSection />
            </div>
          </section>

          <section id="booking" className="py-32 bg-white">
            <div className="max-w-5xl mx-auto px-4">
              <h2 className="text-5xl font-black mb-20 text-center">Mission Control</h2>
              <BookingForm />
            </div>
          </section>

          <footer className="bg-stone-950 text-stone-500 py-24">
            <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
              <Logo branding={branding} defaultBranding={defaultBranding} light onClick={() => window.scrollTo({top:0, behavior:'smooth'})} />
              <div className="flex gap-4">
                <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center transition-all">
                  {isAdmin ? <Unlock /> : <Lock />}
                </button>
                {isAdmin && (
                  <button 
                    onClick={() => { setShowDashboard(true); setAdminTab('bookings'); }} 
                    className="bg-white text-stone-900 px-6 py-3 rounded-xl font-black text-xs uppercase"
                  >
                    Open CMS {unreadBookingsCount > 0 && `(${unreadBookingsCount})`}
                  </button>
                )}
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} {branding.siteName}</p>
            </div>
          </footer>
        </>
      )}
    </div>
  );
};

export default App;
