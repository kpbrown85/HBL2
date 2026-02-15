
import React, { useState, useEffect, useRef } from 'react';
import { LLAMAS, GALLERY_IMAGES, FAQS, BENEFITS } from './constants';
import { LlamaCard } from './components/LlamaCard';
import { BookingForm } from './components/BookingForm';
import { Testimonials } from './components/Testimonials';
import { PhotoCarousel } from './components/PhotoCarousel';
import { GearSection } from './components/GearSection';
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
  // Added missing icon imports used in the admin dashboard
  Truck,
  GraduationCap
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

const AdminTabButton = ({ id, currentTab, label, icon: Icon, onClick }: { id: string, currentTab: string, label: string, icon: any, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm transition-all ${currentTab === id ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-900'}`}
  >
    <Icon className="w-4 h-4" />
    {label}
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

  // New Booking State
  const [bookings, setBookings] = useState<BookingData[]>([]);

  const defaultBranding: Branding = {
    siteName: "Helena Backcountry Llamas",
    accentName: "Llamas",
    logoType: 'icon',
    logoUrl: "",
    heroImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=2400",
    guideImageUrl: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800",
    galleryMode: 'manual',
    cloudFeedUrl: ''
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

  const handleBookingAction = (id: string, action: 'delete' | 'confirm') => {
    if (!isAdmin) return;
    let updated = [...bookings];
    if (action === 'delete') {
      if (!confirm("Delete this lead?")) return;
      updated = updated.filter(b => b.id !== id);
    } else {
      updated = updated.map(b => b.id === id ? { ...b, status: 'confirmed' } : b);
    }
    setBookings(updated);
    localStorage.setItem('hbl_bookings', JSON.stringify(updated));
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

  return (
    <div className="min-h-screen text-left">
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
              <input type="password" placeholder="Password (llama123)" className="w-full bg-stone-100 border p-4 rounded-2xl outline-none" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} autoFocus />
              <button type="submit" className="w-full bg-green-800 text-white py-4 rounded-2xl font-black">Verify Identity</button>
            </form>
          </div>
        </div>
      )}

      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-stone-100 flex flex-col animate-in fade-in overflow-hidden">
          <header className="bg-white border-b px-4 md:px-12 py-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4"><div className="w-10 h-10 bg-green-800 text-white rounded-xl flex items-center justify-center"><Settings className="w-5 h-5" /></div><h2 className="text-xl font-black">CMS</h2></div>
            <nav className="hidden lg:flex items-center gap-2 bg-stone-50 p-1 rounded-full">
              <AdminTabButton id="branding" currentTab={adminTab} label="Branding" icon={Palette} onClick={() => setAdminTab('branding')} />
              <AdminTabButton id="fleet" currentTab={adminTab} label="Fleet" icon={Users} onClick={() => setAdminTab('fleet')} />
              <AdminTabButton id="gallery" currentTab={adminTab} label="Gallery" icon={ImageIcon} onClick={() => setAdminTab('gallery')} />
              <AdminTabButton id="bookings" currentTab={adminTab} label="Expedition Logs" icon={ClipboardList} onClick={() => setAdminTab('bookings')} />
            </nav>
            <button onClick={() => setShowDashboard(false)} className="bg-stone-100 px-6 py-3 rounded-full font-black text-xs uppercase flex items-center gap-2"><Home className="w-4 h-4" /> Return</button>
          </header>

          <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-20">
            {adminTab === 'branding' && (
              <div className="max-w-5xl mx-auto space-y-12">
                 <div className="flex justify-between items-end">
                    <h3 className="text-4xl font-black">Branding Settings</h3>
                    <button onClick={clearAllData} className="text-red-400 font-black text-[10px] uppercase">Reset Site</button>
                 </div>
                 <div className="bg-white p-8 rounded-[2.5rem] shadow-sm space-y-8">
                    <label className="block text-[10px] font-black uppercase text-stone-400">Site Title</label>
                    <input className="w-full bg-stone-50 p-4 rounded-2xl font-black" value={branding.siteName} onChange={(e) => setBranding({...branding, siteName: e.target.value})} />
                    <label className="block text-[10px] font-black uppercase text-stone-400">Accent Word</label>
                    <input className="w-full bg-stone-50 p-4 rounded-2xl italic text-green-700" value={branding.accentName} onChange={(e) => setBranding({...branding, accentName: e.target.value})} />
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

            {adminTab === 'fleet' && <div className="max-w-6xl mx-auto"><h3 className="text-4xl font-black">Herd Management</h3><p>Manage llama profiles here.</p></div>}
            
            {adminTab === 'bookings' && (
              <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4">
                 <header className="border-b pb-10 flex justify-between items-end">
                    <div>
                       <h2 className="text-4xl font-black">Expedition Logs</h2>
                       <p className="text-stone-500 font-medium mt-2">Manage incoming leads and rental requests.</p>
                    </div>
                    <div className="bg-stone-50 px-6 py-3 rounded-full border flex items-center gap-4">
                       <span className="text-[10px] font-black uppercase text-stone-400">Total Leads:</span>
                       <span className="font-black text-green-800">{bookings.length}</span>
                    </div>
                 </header>

                 {bookings.length === 0 ? (
                   <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-stone-200">
                      <Clock className="w-16 h-16 text-stone-200 mx-auto mb-6" />
                      <h3 className="text-2xl font-black text-stone-400">No active leads found.</h3>
                   </div>
                 ) : (
                   <div className="grid grid-cols-1 gap-6">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="bg-white p-8 rounded-[2.5rem] border border-stone-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-8 group hover:shadow-xl hover:border-green-200 transition-all">
                           <div className="flex items-center gap-6">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${booking.status === 'confirmed' ? 'bg-green-100 text-green-700' : 'bg-orange-50 text-orange-600'}`}>
                                 {booking.status === 'confirmed' ? <CheckCircle /> : <Clock />}
                              </div>
                              <div>
                                 <h4 className="text-xl font-black text-stone-900">{booking.name}</h4>
                                 <p className="text-stone-400 text-[10px] font-black uppercase tracking-widest mt-1">
                                    Requested on {new Date(booking.timestamp).toLocaleDateString()}
                                 </p>
                              </div>
                           </div>

                           <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                              <div>
                                 <span className="text-[9px] font-black uppercase text-stone-400 block mb-1">Window</span>
                                 <span className="font-bold text-xs">{booking.startDate} - {booking.endDate}</span>
                              </div>
                              <div>
                                 <span className="text-[9px] font-black uppercase text-stone-400 block mb-1">Fleet Count</span>
                                 <span className="font-bold text-xs">{booking.numLlamas} Llamas</span>
                              </div>
                              <div>
                                 <span className="text-[9px] font-black uppercase text-stone-400 block mb-1">Extras</span>
                                 <div className="flex gap-1">
                                    {booking.trailerNeeded && <Truck size={12} className="text-green-700" title="Trailer Needed" />}
                                    {booking.isFirstTimer && <GraduationCap size={12} className="text-green-700" title="Clinic Needed" />}
                                 </div>
                              </div>
                              <div className="flex flex-col gap-1">
                                 <a href={`mailto:${booking.email}`} className="text-[10px] font-bold text-stone-600 hover:text-green-800 flex items-center gap-1"><Mail size={10} /> {booking.email}</a>
                                 <a href={`tel:${booking.phone}`} className="text-[10px] font-bold text-stone-600 hover:text-green-800 flex items-center gap-1"><Phone size={10} /> {booking.phone}</a>
                              </div>
                           </div>

                           <div className="flex items-center gap-3">
                              {booking.status === 'pending' && (
                                <button 
                                  onClick={() => handleBookingAction(booking.id, 'confirm')}
                                  className="bg-green-800 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase hover:bg-green-900 transition-all shadow-lg"
                                >
                                  Confirm
                                </button>
                              )}
                              <button 
                                onClick={() => handleBookingAction(booking.id, 'delete')}
                                className="bg-stone-50 text-stone-400 p-3 rounded-xl hover:bg-red-50 hover:text-red-500 transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
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
            <a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="bg-green-800 text-white px-6 py-3 rounded-full flex items-center gap-2">Book <ChevronRight size={14} /></a>
          </div>
          <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}><Menu /></button>
        </div>
      </nav>

      <section className="relative h-[95vh] flex items-center justify-center text-center overflow-hidden">
        <div className="absolute inset-0 -z-10"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.4] scale-105" /></div>
        <div className="max-w-5xl px-4 text-white">
          <h1 className="text-6xl md:text-8xl font-black mb-8 leading-[1.1]">Elevate the Trek. <br /><span className="italic text-green-400 font-light">Unload the Journey.</span></h1>
          <p className="text-xl md:text-2xl text-stone-200 mb-12 max-w-3xl mx-auto">{slogan}</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a href="#booking" onClick={(e)=>scrollToSection(e,'booking')} className="bg-green-600 px-12 py-5 rounded-full text-lg font-black shadow-xl">Plan Your Adventure</a>
          </div>
        </div>
      </section>

      <section id="benefits" className="py-32 bg-white"><div className="max-w-7xl mx-auto px-4 text-center"><h2 className="text-5xl font-black mb-20 text-center">Built for the Backcountry</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-8">{BENEFITS.map((b,i)=><div key={i} className="p-10 bg-stone-50 rounded-[2.5rem] border text-left"><div className="mb-6">{b.icon}</div><h3 className="text-2xl font-black mb-4">{b.title}</h3><p className="text-stone-500 font-medium">{b.description}</p></div>)}</div></div></section>

      <section id="about" className="py-32 bg-stone-100"><div className="max-w-7xl mx-auto px-4"><h2 className="text-5xl font-black mb-16 text-center">The Herd</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-8">{llamas.map(l=><LlamaCard key={l.id} llama={l} />)}</div></div></section>

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

      <section id="booking" className="py-32 bg-white"><div className="max-w-5xl mx-auto px-4"><h2 className="text-5xl font-black mb-20 text-center">Mission Control</h2><BookingForm /></div></section>

      <footer className="bg-stone-950 text-stone-500 py-24">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <Logo branding={branding} defaultBranding={defaultBranding} light onClick={() => window.scrollTo({top:0, behavior:'smooth'})} />
          <div className="flex gap-4">
            <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} className="w-12 h-12 rounded-xl bg-stone-900 flex items-center justify-center">{isAdmin ? <Unlock /> : <Lock />}</button>
            {isAdmin && <button onClick={() => setShowDashboard(true)} className="bg-white text-stone-900 px-6 py-3 rounded-xl font-black text-xs uppercase">Open CMS</button>}
          </div>
          <p className="text-[10px] font-black uppercase tracking-widest">© {new Date().getFullYear()} {branding.siteName}</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
