
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

/**
 * UTILITY: Automatic Image Compression
 */
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
  const [adviceQuery, setAdviceQuery] = useState("");
  const [adviceResponse, setAdviceResponse] = useState("");
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState<'branding' | 'gallery' | 'bookings' | 'fleet'>('branding');
  const [passwordInput, setPasswordInput] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Lead and Booking State
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
  
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const llamaPhotoInputRef = useRef<HTMLInputElement>(null);
  const [activeLlamaEdit, setActiveLlamaEdit] = useState<string | null>(null);
  const [editingLlama, setEditingLlama] = useState<Llama | null>(null);

  useEffect(() => {
    generateWelcomeSlogan().then(val => { if (val) setSlogan(val); });
    
    // Initial Load of Bookings
    const loadBookings = () => {
      const saved = JSON.parse(localStorage.getItem('hbl_bookings') || '[]');
      setBookings(saved);
    };
    loadBookings();

    // Listen for new bookings
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

  const handleAdviceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adviceQuery) return;
    setIsAdviceLoading(true);
    const response = await getLlamaAdvice(adviceQuery);
    setAdviceResponse(response || "");
    setIsAdviceLoading(false);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'hero' | 'guide' | 'llama') => {
    const file = e.target.files?.[0];
    if (file && (file instanceof Blob) && isAdmin) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const compressed = await compressImage(reader.result as string);
          if (target === 'logo') setBranding(prev => ({ ...prev, logoUrl: compressed, logoType: 'image' }));
          if (target === 'hero') setBranding(prev => ({ ...prev, heroImageUrl: compressed }));
          if (target === 'guide') setBranding(prev => ({ ...prev, guideImageUrl: compressed }));
          if (target === 'llama' && activeLlamaEdit) {
            if (editingLlama) {
                setEditingLlama({ ...editingLlama, imageUrl: compressed });
            }
            setLlamas(prev => prev.map(l => l.id === activeLlamaEdit ? { ...l, imageUrl: compressed } : l));
          }
        } catch (err) { alert("Processing failed."); } finally { setIsProcessing(false); }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && isAdmin) {
      setIsProcessing(true);
      try {
        const results: string[] = [];
        const fileList = Array.from(files) as File[];
        for (const file of fileList) {
          const dataUrl = await new Promise<string>(r => {
            const rd = new FileReader(); rd.onloadend = () => r(rd.result as string); rd.readAsDataURL(file);
          });
          results.push(await compressImage(dataUrl));
        }
        setLocalPreviews(prev => [...prev, ...results]);
      } catch { alert("Optimization failed."); } finally { setIsProcessing(false); }
    }
  };

  const handleConfirmUpload = async () => {
    if (localPreviews.length === 0 || !isAdmin) return;
    setIsUploadingFile(true);
    await new Promise(r => setTimeout(r, 300));
    const newImages: GalleryImage[] = localPreviews.map(url => ({ url, caption: `Expedition ${new Date().toLocaleDateString()}` }));
    setGallery(prev => [...newImages, ...prev]);
    setLocalPreviews([]);
    setIsUploadingFile(false);
  };

  const handleDeleteImage = (index: number) => {
    if (isAdmin && confirm("Remove image?")) {
      const updated = [...gallery]; updated.splice(index, 1); setGallery(updated);
    }
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
      if (confirm(`Are you sure you want to retire ${llama.name} from the active fleet?`)) {
        setLlamas(prev => prev.filter(l => l.id !== llama.id));
      }
    } else if (action === 'save' && editingLlama) {
      setLlamas(prev => {
        const exists = prev.find(l => l.id === editingLlama.id);
        if (exists) {
          return prev.map(l => l.id === editingLlama.id ? editingLlama : l);
        } else {
          return [...prev, editingLlama];
        }
      });
      setEditingLlama(null);
      setActiveLlamaEdit(null);
    }
  };

  const clearAllData = () => {
    if (confirm("Reset all settings?")) { localStorage.clear(); window.location.reload(); }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault(); if (draggedIndex === null || draggedIndex === index) return;
    const items = [...gallery]; const item = items[draggedIndex];
    items.splice(draggedIndex, 1); items.splice(index, 0, item);
    setDraggedIndex(index); setGallery(items);
  };
  const handleDragEnd = () => { setDraggedIndex(null); };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault(); const el = document.getElementById(id);
    if (el) {
      const offset = 80; const bodyRect = document.body.getBoundingClientRect().top;
      const elRect = el.getBoundingClientRect().top; const pos = elRect - bodyRect - offset;
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  const unreadBookingsCount = bookings.filter(b => !b.isRead).length;

  return (
    <div className="min-h-screen text-left">
      <input 
        type="file" 
        ref={llamaPhotoInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={(e) => handleImageFileChange(e, 'llama')} 
      />

      {isProcessing && (
        <div className="fixed inset-0 z-[200] bg-stone-900/40 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white px-10 py-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in duration-300">
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
              <input 
                type="password" 
                placeholder="Enter Admin Password" 
                className="w-full bg-stone-100 border p-4 rounded-2xl outline-none" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                autoFocus 
              />
              <button type="submit" className="w-full bg-green-800 text-white py-4 rounded-2xl font-black">Verify Identity</button>
            </form>
          </div>
        </div>
      )}

      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-stone-100 flex flex-col animate-in fade-in overflow-hidden">
          <header className="bg-white border-b px-4 md:px-12 py-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-green-800 text-white rounded-xl flex items-center justify-center shadow-lg">
                <Settings className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-black">CMS</h2>
            </div>
            
            <nav className="hidden lg:flex items-center gap-2 bg-stone-50 p-1 rounded-full border border-stone-100">
              <AdminTabButton id="branding" currentTab={adminTab} label="Branding" icon={Palette} onClick={() => setAdminTab('branding')} />
              <AdminTabButton id="fleet" currentTab={adminTab} label="Llama Fleet" icon={Users} onClick={() => setAdminTab('fleet')} />
              <AdminTabButton id="gallery" currentTab={adminTab} label="Gallery" icon={ImageIcon} onClick={() => setAdminTab('gallery')} />
              <AdminTabButton id="bookings" currentTab={adminTab} label="Expedition Logs" icon={ClipboardList} onClick={() => setAdminTab('bookings')} badgeCount={unreadBookingsCount} />
            </nav>

            <div className="flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={() => setAdminTab('bookings')}
                  className={`p-3 rounded-xl transition-all ${unreadBookingsCount > 0 ? 'bg-orange-50 text-orange-600' : 'bg-stone-50 text-stone-400'}`}
                >
                  <Bell size={20} />
                  {unreadBookingsCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-600 w-3 h-3 rounded-full border-2 border-white" />
                  )}
                </button>
              </div>
              <button onClick={() => setShowDashboard(false)} className="bg-stone-900 text-white px-6 py-3 rounded-full font-black text-xs uppercase flex items-center gap-2 shadow-lg hover:bg-stone-800 transition-all">
                <Home className="w-4 h-4" /> Return to Site
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20">
            {adminTab === 'branding' && (
              <div className="max-w-5xl mx-auto space-y-12">
                 <div className="flex justify-between items-end">
                    <div>
                      <h3 className="text-4xl font-black">Site Settings</h3>
                      <p className="text-stone-500 font-medium mt-2">Adjust your identity and landing experience.</p>
                    </div>
                    <button onClick={clearAllData} className="text-red-400 font-black text-[10px] uppercase hover:text-red-600 transition-colors">Emergency Reset</button>
                 </div>
                 
                 <div className="space-y-8">
                   <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-stone-100 space-y-10">
                      <h4 className="text-xl font-black flex items-center gap-2"><Palette className="text-green-800"/> Identity</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-stone-400 mb-3 tracking-[0.2em]">Site Name</label>
                          <div className="flex items-center gap-4 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                            <Type className="text-stone-300" />
                            <input className="w-full bg-transparent font-black text-2xl outline-none" value={branding.siteName} onChange={(e) => setBranding({...branding, siteName: e.target.value})} />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-stone-400 mb-3 tracking-[0.2em]">Brand Highlight</label>
                          <div className="flex items-center gap-4 bg-stone-50 p-6 rounded-2xl border border-stone-100">
                            <Sparkles className="text-green-600" />
                            <input className="w-full bg-transparent italic font-black text-2xl text-green-800 outline-none" value={branding.accentName} onChange={(e) => setBranding({...branding, accentName: e.target.value})} />
                          </div>
                        </div>
                      </div>
                   </div>

                   <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-stone-100 space-y-10">
                      <h4 className="text-xl font-black flex items-center gap-2"><Mail className="text-green-800"/> Notifications</h4>
                      <div className="p-8 bg-green-50/50 rounded-[2rem] border border-green-100 flex flex-col md:flex-row gap-8 items-center">
                         <div className="w-16 h-16 bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-lg"><Bell /></div>
                         <div className="flex-1">
                            <h5 className="font-black text-stone-900">Administrator Alerts</h5>
                            <p className="text-stone-500 text-sm font-medium">New expedition leads will trigger a persistent alert in this dashboard and send a summary email to the address below.</p>
                         </div>
                         <div className="w-full md:w-auto min-w-[300px]">
                            <label className="block text-[10px] font-black uppercase text-stone-400 mb-2 tracking-widest">Target Admin Email</label>
                            <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-stone-200 shadow-inner">
                               <Send className="w-4 h-4 text-green-800" />
                               <input 
                                  className="w-full bg-transparent font-black text-stone-900 outline-none"
                                  value={branding.adminEmail}
                                  onChange={(e) => setBranding({...branding, adminEmail: e.target.value})}
                                  placeholder="admin@example.com"
                               />
                            </div>
                         </div>
                      </div>
                   </div>
                 </div>
              </div>
            )}

            {adminTab === 'gallery' && (
              <div className="max-w-6xl mx-auto space-y-12">
                <header className="flex flex-col md:flex-row md:items-end justify-between border-b pb-10 gap-6">
                  <div><h2 className="text-4xl font-black">Gallery Engine</h2><p className="text-stone-500">Choose between manual uploads or automated cloud sync.</p></div>
                  <div className="flex bg-stone-50 p-1 rounded-full border">
                    <button onClick={() => setBranding({...branding, galleryMode: 'manual'})} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase transition-all ${branding.galleryMode === 'manual' ? 'bg-white shadow-sm text-green-800' : 'text-stone-400'}`}>Manual Mode</button>
                    <button onClick={() => setBranding({...branding, galleryMode: 'cloud'})} className={`px-6 py-2 rounded-full font-black text-[10px] uppercase transition-all ${branding.galleryMode === 'cloud' ? 'bg-white shadow-sm text-green-800' : 'text-stone-400'}`}>Cloud Sync</button>
                  </div>
                </header>

                {branding.galleryMode === 'cloud' ? (
                  <div className="bg-white p-12 rounded-[3rem] shadow-xl border-2 border-green-800/10 space-y-8 animate-in zoom-in">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 bg-green-50 text-green-800 rounded-2xl flex items-center justify-center"><Cloud className="w-8 h-8" /></div>
                      <div>
                        <h4 className="text-xl font-black">Google Photos Integration</h4>
                        <p className="text-stone-500 font-medium">Paste your shared album link or an embed code (e.g., from Elfsight).</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 bg-stone-50 p-4 rounded-2xl border">
                        <LinkIcon className="text-stone-400 w-5 h-5" />
                        <input 
                          className="w-full bg-transparent outline-none font-bold"
                          placeholder="https://photos.app.goo.gl/..."
                          value={branding.cloudFeedUrl}
                          onChange={(e) => setBranding({...branding, cloudFeedUrl: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-12 animate-in fade-in">
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-20 border-2 border-dashed rounded-[3rem] border-stone-200 hover:border-green-800 flex flex-col items-center transition-all group">
                       <Upload className="w-12 h-12 text-stone-300 group-hover:text-green-800 mb-4" />
                       <span className="font-black text-xs uppercase tracking-widest">Drop expedition photos here</span>
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileSelect} />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      {gallery.map((img, i) => (
                        <div key={img.url+i} draggable onDragStart={(e)=>handleDragStart(e,i)} onDragOver={(e)=>handleDragOver(e,i)} onDragEnd={handleDragEnd} className={`aspect-square rounded-[2rem] overflow-hidden bg-white shadow-sm border-2 transition-all cursor-grab active:cursor-grabbing ${draggedIndex === i ? 'opacity-30 scale-95 border-green-500' : 'border-stone-100 hover:shadow-xl'}`}>
                           <img src={img.url} className="w-full h-full object-cover pointer-events-none" />
                           <button onClick={(e) => { e.stopPropagation(); handleDeleteImage(i); }} className="absolute bottom-4 right-4 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {adminTab === 'fleet' && (
                <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4">
                    <header className="border-b pb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h2 className="text-4xl font-black">Fleet Management</h2>
                            <p className="text-stone-500 font-medium mt-2">Manage your pack llamas, their stats, and specialties.</p>
                        </div>
                        {!editingLlama && (
                             <button 
                                onClick={() => handleLlamaAction('add')}
                                className="bg-green-800 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase flex items-center gap-2 hover:bg-green-900 shadow-xl transition-all"
                             >
                                <Plus size={20} /> Add New Llama
                             </button>
                        )}
                    </header>

                    {editingLlama ? (
                        <div className="bg-white p-8 md:p-12 rounded-[3rem] shadow-xl border border-stone-200 animate-in zoom-in duration-300 max-w-4xl mx-auto">
                            <div className="flex items-center gap-4 mb-10">
                                <button onClick={() => setEditingLlama(null)} className="p-3 bg-stone-50 rounded-full hover:bg-stone-100 transition-all text-stone-400"><ChevronLeft /></button>
                                <h3 className="text-3xl font-black">{editingLlama.id.length > 9 ? 'Add Llama' : `Edit ${editingLlama.name}`}</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="relative group overflow-hidden rounded-[2.5rem] aspect-square bg-stone-50 border border-stone-200">
                                        <img src={editingLlama.imageUrl} className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => llamaPhotoInputRef.current?.click()}
                                            className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center text-white gap-2 font-black uppercase text-xs"
                                        >
                                            <Camera /> Update Portrait
                                        </button>
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-stone-400 text-center tracking-widest">Llama ID: {editingLlama.id}</p>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Name</label>
                                            <input 
                                                className="w-full bg-stone-50 p-4 rounded-xl font-bold border border-transparent focus:bg-white focus:border-green-800 outline-none transition-all"
                                                value={editingLlama.name}
                                                onChange={(e) => setEditingLlama({ ...editingLlama, name: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Age (Years)</label>
                                            <input 
                                                type="number"
                                                className="w-full bg-stone-50 p-4 rounded-xl font-bold border border-transparent focus:bg-white focus:border-green-800 outline-none transition-all"
                                                value={editingLlama.age}
                                                onChange={(e) => setEditingLlama({ ...editingLlama, age: parseInt(e.target.value) || 1 })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Specialty</label>
                                        <select 
                                            className="w-full bg-stone-50 p-4 rounded-xl font-bold border border-transparent focus:bg-white focus:border-green-800 outline-none transition-all appearance-none"
                                            value={editingLlama.specialty}
                                            onChange={(e) => setEditingLlama({ ...editingLlama, specialty: e.target.value as any })}
                                        >
                                            <option value="Backpacking">Backpacking</option>
                                            <option value="Hunting">Hunting</option>
                                            <option value="Lead Llama">Lead Llama</option>
                                            <option value="Gentle Soul">Gentle Soul</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Max Load (lbs)</label>
                                        <input 
                                            type="number"
                                            className="w-full bg-stone-50 p-4 rounded-xl font-bold border border-transparent focus:bg-white focus:border-green-800 outline-none transition-all"
                                            value={editingLlama.maxLoad}
                                            onChange={(e) => setEditingLlama({ ...editingLlama, maxLoad: parseInt(e.target.value) || 50 })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-stone-400 mb-2">Personality Blurb</label>
                                        <textarea 
                                            className="w-full bg-stone-50 p-4 rounded-xl font-bold border border-transparent focus:bg-white focus:border-green-800 outline-none transition-all h-24 resize-none"
                                            value={editingLlama.personality}
                                            onChange={(e) => setEditingLlama({ ...editingLlama, personality: e.target.value })}
                                        />
                                    </div>

                                    <button 
                                        onClick={() => handleLlamaAction('save')}
                                        className="w-full bg-green-800 text-white py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-green-900 transition-all shadow-lg"
                                    >
                                        <Save size={18} /> Save Profile
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {llamas.map((llama) => (
                                <div key={llama.id} className="bg-white rounded-[2.5rem] border border-stone-200 overflow-hidden shadow-sm group hover:shadow-xl hover:border-green-200 transition-all flex flex-col">
                                    <div className="h-48 overflow-hidden relative">
                                        <img src={llama.imageUrl} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                                        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-green-800">
                                            {llama.specialty}
                                        </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col">
                                        <div className="flex justify-between items-center mb-4">
                                            <h4 className="text-xl font-black">{llama.name}</h4>
                                            <span className="text-xs font-bold text-stone-400">{llama.age}yr</span>
                                        </div>
                                        <p className="text-stone-500 text-sm italic line-clamp-2 mb-6 flex-1">"{llama.personality}"</p>
                                        <div className="flex items-center justify-between border-t border-stone-50 pt-4">
                                            <div className="flex gap-2">
                                                <button 
                                                    onClick={() => handleLlamaAction('edit', llama)}
                                                    className="p-2 bg-stone-50 rounded-lg text-stone-400 hover:bg-green-50 hover:text-green-800 transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleLlamaAction('delete', llama)}
                                                    className="p-2 bg-stone-50 rounded-lg text-stone-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-[9px] font-black uppercase text-stone-300 block">Payload</span>
                                                <span className="font-black text-stone-900">{llama.maxLoad} lbs</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            
            {adminTab === 'bookings' && (
              <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4">
                 <header className="border-b pb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                       <h2 className="text-4xl font-black">Expedition Logs</h2>
                       <p className="text-stone-500 font-medium mt-2">Manage incoming leads, confirm mission logistics, and update client statuses.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {unreadBookingsCount > 0 && (
                        <div className="bg-orange-100 text-orange-700 px-6 py-3 rounded-2xl flex items-center gap-2 border border-orange-200 animate-bounce">
                          <AlertCircle size={18} />
                          <span className="font-black text-xs uppercase tracking-widest">{unreadBookingsCount} New Leads</span>
                        </div>
                      )}
                      <div className="bg-stone-50 px-6 py-3 rounded-full border flex items-center gap-4">
                         <span className="text-[10px] font-black uppercase text-stone-400">Total Database:</span>
                         <span className="font-black text-stone-900">{bookings.length}</span>
                      </div>
                    </div>
                 </header>

                 {bookings.length === 0 ? (
                   <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-stone-200 flex flex-col items-center">
                      <Clock className="w-16 h-16 text-stone-200 mb-6" />
                      <h3 className="text-2xl font-black text-stone-400">The trail is quiet.</h3>
                      <p className="text-stone-400 font-medium">No active leads or archived logs found.</p>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 gap-6 pb-20">
                      {bookings.map((booking) => (
                        <div 
                          key={booking.id} 
                          onMouseEnter={() => !booking.isRead && handleBookingAction(booking.id, 'read')}
                          className={`bg-white p-8 rounded-[2.5rem] border shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 group transition-all relative overflow-hidden ${!booking.isRead ? 'border-orange-300 ring-2 ring-orange-500/10' : 'border-stone-200 hover:shadow-xl hover:border-green-200'}`}
                        >
                           {!booking.isRead && (
                             <div className="absolute top-0 left-0 w-2 h-full bg-orange-500" />
                           )}
                           
                           <div className="flex items-center gap-6 min-w-[280px]">
                              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
                                booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 
                                booking.status === 'canceled' ? 'bg-red-50 text-red-500' :
                                'bg-orange-50 text-orange-600'
                              }`}>
                                 {booking.status === 'confirmed' ? <CheckCircle size={28} /> : 
                                  booking.status === 'canceled' ? <Ban size={28} /> : 
                                  <Clock size={28} />}
                              </div>
                              <div>
                                 <div className="flex items-center gap-3">
                                   <h4 className="text-2xl font-black text-stone-900">{booking.name}</h4>
                                   {!booking.isRead && <span className="bg-orange-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">New</span>}
                                 </div>
                                 <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                    Log ID: #{booking.id.toUpperCase()} • {new Date(booking.timestamp).toLocaleDateString()}
                                 </p>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 md:grid-cols-4 gap-8 flex-1">
                              <div>
                                 <span className="text-[10px] font-black uppercase text-stone-400 block mb-1 tracking-widest">Expedition Window</span>
                                 <span className="font-bold text-sm text-stone-900">{booking.startDate} <ArrowRight size={10} className="inline mx-1 text-stone-300" /> {booking.endDate}</span>
                              </div>
                              <div>
                                 <span className="text-[10px] font-black uppercase text-stone-400 block mb-1 tracking-widest">Herd Requirement</span>
                                 <span className="font-bold text-sm text-stone-900">{booking.numLlamas} Pack Llamas</span>
                              </div>
                              <div>
                                 <span className="text-[10px] font-black uppercase text-stone-400 block mb-1 tracking-widest">Tactical Prep</span>
                                 <div className="flex gap-2">
                                    {booking.trailerNeeded ? <Truck size={16} className="text-green-700" title="Trailer Rental Required" /> : <div className="w-4 h-4 rounded-full bg-stone-50" />}
                                    {booking.isFirstTimer ? <GraduationCap size={16} className="text-green-700" title="Clinic Orientation Required" /> : <div className="w-4 h-4 rounded-full bg-stone-50" />}
                                 </div>
                              </div>
                              <div className="flex flex-col gap-2">
                                 <a href={`mailto:${booking.email}`} className="text-[11px] font-black text-stone-600 hover:text-green-800 flex items-center gap-2 group/link">
                                   <div className="w-6 h-6 bg-stone-100 rounded-lg flex items-center justify-center group-hover/link:bg-green-100 transition-colors"><Mail size={12} /></div>
                                   {booking.email}
                                 </a>
                                 <a href={`tel:${booking.phone}`} className="text-[11px] font-black text-stone-600 hover:text-green-800 flex items-center gap-2 group/link">
                                   <div className="w-6 h-6 bg-stone-100 rounded-lg flex items-center justify-center group-hover/link:bg-green-100 transition-colors"><Phone size={12} /></div>
                                   {booking.phone}
                                 </a>
                              </div>
                           </div>

                           <div className="flex flex-col items-center gap-3">
                              <div className="flex bg-stone-50 p-1 rounded-xl border border-stone-100">
                                <button 
                                  onClick={() => handleBookingAction(booking.id, 'confirm')}
                                  disabled={booking.status === 'confirmed'}
                                  className={`px-5 py-2.5 rounded-lg font-black text-[10px] uppercase transition-all ${booking.status === 'confirmed' ? 'bg-green-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-900'}`}
                                >
                                  Confirm
                                </button>
                                <button 
                                  onClick={() => handleBookingAction(booking.id, 'cancel')}
                                  disabled={booking.status === 'canceled'}
                                  className={`px-5 py-2.5 rounded-lg font-black text-[10px] uppercase transition-all ${booking.status === 'canceled' ? 'bg-red-600 text-white shadow-md' : 'text-stone-400 hover:text-stone-900'}`}
                                >
                                  Cancel
                                </button>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-black text-green-700 uppercase tracking-widest flex items-center gap-1">
                                  <CheckCircle size={10} /> Alert Sent to Admin
                                </span>
                                <button 
                                  onClick={() => handleBookingAction(booking.id, 'delete')}
                                  className="bg-stone-50 text-stone-400 p-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition-all border border-stone-100"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
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
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu /></button>
        </div>
      </nav>

      <section className="relative h-[95vh] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 -z-10"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.4] scale-105" /></div>
        <div className="max-w-5xl px-4 text-white">
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1] animate-in slide-in-from-top-12 duration-1000">Elevate the Trek. <br /><span className="italic text-green-400 font-light">Unload the Journey.</span></h1>
          <p className="text-xl md:text-2xl text-stone-200 mb-12 max-w-3xl mx-auto animate-in fade-in duration-1000 delay-300">{slogan}</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center animate-in slide-in-from-bottom-12 duration-1000 delay-500">
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
            <div className="flex items-center gap-3 text-stone-400 text-xs font-black uppercase tracking-widest">
              {branding.galleryMode === 'cloud' ? <><Cloud size={14} className="text-green-500"/> Live Cloud Feed</> : <><Camera size={14} className="text-green-500"/> Local Collection</>}
            </div>
          </header>

          {branding.galleryMode === 'cloud' && branding.cloudFeedUrl ? (
            <div className="w-full bg-white/5 rounded-[3rem] p-12 min-h-[400px] flex items-center justify-center border border-white/10 animate-in zoom-in">
              <div className="text-center max-w-md">
                 <Cloud className="w-16 h-16 text-stone-700 mx-auto mb-6" />
                 <h3 className="text-2xl font-black mb-4">Cloud Feed Active</h3>
                 <p className="text-stone-500 mb-8 font-medium">Your live Google Photos album is being retrieved from the cloud server.</p>
                 <a href={branding.cloudFeedUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white text-stone-900 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest hover:bg-green-500 hover:text-white transition-all">
                    View Original Album <ArrowUpRight size={14}/>
                 </a>
              </div>
            </div>
          ) : (
            <div className="space-y-12">
              <PhotoCarousel images={gallery} />
            </div>
          )}
        </div>
      </section>

      <section id="faq" className="py-32 bg-stone-100">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-5xl font-black mb-20 text-center">Trail Intelligence</h2>
          <FAQSection />
        </div>
      </section>

      <section id="booking" className="py-32 bg-white"><div className="max-w-5xl mx-auto px-4"><h2 className="text-5xl font-black mb-20 text-center">Mission Control</h2><BookingForm /></div></section>

      <footer className="bg-stone-950 text-stone-500 py-24">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <Logo branding={branding} defaultBranding={defaultBranding} light onClick={() => window.scrollTo({top:0, behavior:'smooth'})} />
          <div className="flex gap-4">
            <div className="relative">
              <button 
                onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} 
                className={`w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center transition-all ${unreadBookingsCount > 0 ? 'ring-2 ring-orange-500 ring-offset-4 ring-offset-stone-950' : ''}`}
              >
                {isAdmin ? <Unlock /> : <Lock />}
              </button>
              {unreadBookingsCount > 0 && !isAdmin && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-stone-950">
                  {unreadBookingsCount}
                </span>
              )}
            </div>
            {isAdmin && (
              <button 
                onClick={() => { setShowDashboard(true); setAdminTab('bookings'); }} 
                className="bg-white text-stone-900 px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 hover:bg-green-400 transition-all"
              >
                <Bell size={14} className={unreadBookingsCount > 0 ? 'animate-bounce text-red-600' : ''} />
                Open CMS {unreadBookingsCount > 0 && `(${unreadBookingsCount})`}
              </button>
            )}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} {branding.siteName}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
