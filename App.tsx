
import React, { useState, useEffect, useRef } from 'react';
import { LLAMAS, GALLERY_IMAGES, FAQS, BENEFITS } from './constants';
import { LlamaCard } from './components/LlamaCard';
import { BookingForm } from './components/BookingForm';
import { Testimonials } from './components/Testimonials';
import { PhotoCarousel } from './components/PhotoCarousel';
import { GearSection } from './components/GearSection';
import { generateWelcomeSlogan, getLlamaAdvice, generateBackdrop } from './services/geminiService';
import { GalleryImage, Llama } from './types';
import { 
  Menu, 
  X, 
  ChevronRight, 
  MessageCircle, 
  ArrowRight,
  CalendarDays,
  Mountain,
  MapPin,
  Backpack,
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
  CheckCircle2,
  Copy,
  Settings,
  RefreshCcw,
  Palette,
  Eye,
  LayoutDashboard,
  ClipboardList,
  ArrowUpRight,
  GraduationCap,
  Users,
  Camera,
  Edit3,
  Home,
  Monitor,
  Check,
  AlertTriangle,
  Zap,
  Type
} from 'lucide-react';

/**
 * UTILITY: Automatic Image Compression
 * Downscales images and converts to JPEG to fit within localStorage limits
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
      // Force JPEG to significantly reduce string size compared to PNG
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
  });
};

// Safety wrapper for localStorage to prevent site crashes on quota errors
const safeSave = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Storage failed for ${key}:`, e);
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      alert("Storage Full: Your browser's memory is full. Please remove some photos or clear your browser cache.");
    }
  }
};

// Helper components moved outside to resolve type inference issues with children
interface Branding {
  siteName: string;
  accentName: string;
  logoType: 'icon' | 'image';
  logoUrl: string;
  heroImageUrl: string;
  guideImageUrl: string;
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
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState<'branding' | 'gallery' | 'bookings' | 'fleet'>('branding');
  const [passwordInput, setPasswordInput] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Branding State - Robust Initialization
  const defaultBranding: Branding = {
    siteName: "Helena Backcountry Llamas",
    accentName: "Llamas",
    logoType: 'icon',
    logoUrl: "",
    heroImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=2400",
    guideImageUrl: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800"
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

  // Fleet Management State - Robust Initialization
  const [llamas, setLlamas] = useState<Llama[]>(() => {
    try {
      const saved = localStorage.getItem('hbl_llamas');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : LLAMAS;
    } catch {
      return LLAMAS;
    }
  });

  // Gallery Management - Robust Initialization
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
  const heroInputRef = useRef<HTMLInputElement>(null);
  const guideInputRef = useRef<HTMLInputElement>(null);
  const llamaPhotoInputRef = useRef<HTMLInputElement>(null);
  const [activeLlamaEdit, setActiveLlamaEdit] = useState<string | null>(null);

  useEffect(() => {
    generateWelcomeSlogan().then(val => {
      if (val) setSlogan(val);
    });
  }, []);

  // Sync state to local storage safely
  useEffect(() => {
    if (gallery.length > 0) safeSave('hbl_gallery', gallery);
  }, [gallery]);

  useEffect(() => {
    safeSave('hbl_branding', branding);
    document.title = branding?.siteName || "Helena Backcountry Llamas";
  }, [branding]);

  useEffect(() => {
    if (llamas.length > 0) safeSave('hbl_llamas', llamas);
  }, [llamas]);

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "llama123") {
      setIsAdmin(true);
      setShowAdminLogin(false);
      setPasswordInput("");
    } else {
      alert("Invalid Password. Access Denied.");
    }
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
    // Ensure file is treated as a Blob for safety
    if (file && (file instanceof Blob) && isAdmin) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawResult = reader.result as string;
          const compressed = await compressImage(rawResult);
          
          if (target === 'logo') setBranding(prev => ({ ...prev, logoUrl: compressed, logoType: 'image' }));
          if (target === 'hero') setBranding(prev => ({ ...prev, heroImageUrl: compressed }));
          if (target === 'guide') setBranding(prev => ({ ...prev, guideImageUrl: compressed }));
          if (target === 'llama' && activeLlamaEdit) {
            setLlamas(prev => prev.map(l => l.id === activeLlamaEdit ? { ...l, imageUrl: compressed } : l));
          }
        } catch (err) {
          alert("Could not process image. Please try another format.");
        } finally {
          setIsProcessing(false);
        }
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
        // Ensure files are handled as a known list of Files/Blobs
        const fileList = Array.from(files) as File[];
        for (const file of fileList) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
          const compressed = await compressImage(dataUrl);
          results.push(compressed);
        }
        setLocalPreviews(prev => [...prev, ...results]);
      } catch (err) {
        alert("Some images could not be optimized.");
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleConfirmUpload = async () => {
    if (localPreviews.length === 0 || !isAdmin) return;
    setIsUploadingFile(true);
    await new Promise(resolve => setTimeout(resolve, 300));
    const newImages: GalleryImage[] = localPreviews.map(url => ({
      url,
      caption: `Expedition Photo ${new Date().toLocaleDateString()}`
    }));
    
    setGallery(prev => [...newImages, ...prev]);
    setLocalPreviews([]);
    setIsUploadingFile(false);
  };

  const handleDeleteImage = (index: number) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to remove this image?")) {
      const updatedGallery = [...gallery];
      updatedGallery.splice(index, 1);
      setGallery(updatedGallery);
    }
  };

  const clearAllData = () => {
    if (confirm("DANGER: This will delete all customized branding, fleet updates, and uploaded gallery images. Restore factory defaults?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const items = [...gallery];
    const item = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, item);
    
    setDraggedIndex(index);
    setGallery(items);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <div className="min-h-screen text-left">
      {/* Universal Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] bg-stone-900/40 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white px-10 py-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in duration-300">
             <div className="w-16 h-16 bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                <Zap className="w-8 h-8" />
             </div>
             <div className="text-center">
               <h3 className="text-2xl font-black text-stone-900">Processing Asset</h3>
               <p className="text-stone-500 font-bold uppercase text-[10px] tracking-widest mt-1 text-center">Optimizing image for peak performance...</p>
             </div>
             <Loader2 className="w-8 h-8 text-green-800 animate-spin" />
          </div>
        </div>
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8 text-left">
              <h3 className="text-3xl font-black text-stone-900 leading-tight">Admin Login</h3>
              <button onClick={() => setShowAdminLogin(false)} className="p-2 hover:bg-stone-100 rounded-full">
                <X />
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div className="text-left">
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 text-left">Management Password</label>
                <input 
                  type="password"
                  placeholder="Enter 'llama123' for demo"
                  className="w-full bg-stone-100 border border-stone-200 px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-green-700/10 focus:border-green-800"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="w-full bg-green-800 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-green-900 shadow-xl">
                <LogIn className="w-5 h-5" /> Access Management
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE ADMIN DASHBOARD OVERLAY */}
      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-stone-100 flex flex-col animate-in fade-in duration-300 overflow-hidden">
          
          {/* Top Persistent Dashboard Header */}
          <header className="bg-white border-b border-stone-200 px-4 md:px-12 py-6 flex items-center justify-between shrink-0 z-20">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-green-800 text-white rounded-xl flex items-center justify-center shadow-lg"><Settings className="w-5 h-5" /></div>
               <div className="hidden sm:block text-left">
                 <h2 className="text-xl font-black text-stone-900 leading-none">Management Console</h2>
                 <p className="text-[10px] text-stone-400 font-black uppercase tracking-widest mt-1">Live Website Editor</p>
               </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden lg:flex items-center gap-2 bg-stone-50 p-1.5 rounded-full border border-stone-200">
              <AdminTabButton id="branding" currentTab={adminTab} label="Identity" icon={Palette} onClick={() => setAdminTab('branding')} />
              <AdminTabButton id="fleet" currentTab={adminTab} label="Herd" icon={Users} onClick={() => setAdminTab('fleet')} />
              <AdminTabButton id="gallery" currentTab={adminTab} label="Gallery" icon={ImageIcon} onClick={() => setAdminTab('gallery')} />
              <AdminTabButton id="bookings" currentTab={adminTab} label="Bookings" icon={ClipboardList} onClick={() => setAdminTab('bookings')} />
            </nav>

            <button 
              onClick={() => setShowDashboard(false)}
              className="bg-stone-100 hover:bg-stone-200 text-stone-900 px-6 py-3 rounded-full font-black text-xs flex items-center gap-2 transition-all"
            >
              <Home className="w-4 h-4" /> <span className="hidden sm:inline">Return to Website</span><span className="sm:hidden">Exit</span>
            </button>
          </header>

          {/* Main Dashboard Workspace */}
          <main className="flex-1 overflow-y-auto bg-stone-50 p-6 md:p-12 lg:p-20 relative">
            
            {/* Identity/Branding Tab */}
            {adminTab === 'branding' && (
              <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500 text-left">
                 <div className="flex justify-between items-end">
                    <div className="text-left">
                      <h3 className="text-4xl font-black text-stone-900 mb-2 text-left">Visual Identity</h3>
                      <p className="text-stone-500 font-medium text-left">Customize your brand name, logos, and key section imagery.</p>
                    </div>
                    <div className="flex gap-4 mb-2">
                       <button onClick={clearAllData} className="text-[10px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 flex items-center gap-2 transition-colors">
                          <Trash2 className="w-3 h-3" /> Clear All Local Cache
                       </button>
                       <button onClick={() => setBranding(defaultBranding)} className="text-[10px] font-black uppercase tracking-widest text-stone-400 hover:text-stone-600 flex items-center gap-2 transition-colors border-l border-stone-200 pl-4">
                          <RefreshCcw className="w-3 h-3" /> Reset Branding
                       </button>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-10 text-left">
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-200 space-y-8">
                        <h4 className="text-sm font-black uppercase tracking-widest text-stone-900 flex items-center gap-2 text-left"><Type className="w-4 h-4 text-green-800" /> Typography & Copy</h4>
                        <div>
                          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 text-left">Company Display Name</label>
                          <input 
                            type="text"
                            className="w-full bg-stone-50 border border-stone-200 px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-green-800/5 focus:border-green-800 font-black text-lg"
                            value={branding?.siteName || ""}
                            onChange={(e) => setBranding({...branding, siteName: e.target.value})}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-3 text-left">Accent Styled Word</label>
                          <input 
                            type="text"
                            className="w-full bg-stone-50 border border-stone-200 px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-green-800/5 focus:border-green-800 font-black italic text-green-700"
                            value={branding?.accentName || ""}
                            onChange={(e) => setBranding({...branding, accentName: e.target.value})}
                          />
                        </div>
                     </div>

                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-200 space-y-8">
                        <h4 className="text-sm font-black uppercase tracking-widest text-stone-900 flex items-center gap-2 text-left"><ImageIcon className="w-4 h-4 text-green-800" /> Brand Mark</h4>
                        <div className="flex bg-stone-50 p-1.5 rounded-2xl border border-stone-100">
                          <button 
                            onClick={() => setBranding({...branding, logoType: 'icon'})}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${branding.logoType === 'icon' ? 'bg-white shadow-sm text-green-800' : 'text-stone-400 hover:text-stone-600'}`}
                          >
                            <Mountain className="w-4 h-4" /> Default Icon
                          </button>
                          <button 
                            onClick={() => setBranding({...branding, logoType: 'image'})}
                            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-xs transition-all ${branding.logoType === 'image' ? 'bg-white shadow-sm text-green-800' : 'text-stone-400 hover:text-stone-600'}`}
                          >
                            <ImageIcon className="w-4 h-4" /> Custom Image
                          </button>
                        </div>

                        {branding.logoType === 'image' && (
                          <div className="space-y-4 animate-in fade-in duration-300">
                            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest text-left">Upload Logo Asset</label>
                            <button 
                              onClick={() => logoInputRef.current?.click()}
                              className="w-full flex items-center gap-6 p-6 bg-stone-50 rounded-2xl border-2 border-dashed border-stone-200 hover:border-green-800 group transition-all"
                            >
                              <div className="w-16 h-16 bg-white rounded-xl flex items-center justify-center shadow-inner overflow-hidden shrink-0">
                                {branding.logoUrl ? (
                                  <img src={branding.logoUrl} className="w-full h-full object-contain p-2" />
                                ) : (
                                  <Upload className="w-6 h-6 text-stone-300" />
                                )}
                              </div>
                              <div className="text-left">
                                <p className="font-black text-xs text-stone-900 uppercase text-left">Change Logo Image</p>
                                <p className="text-[10px] text-stone-400 font-bold text-left">Transparent PNG recommended</p>
                              </div>
                            </button>
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, 'logo')} />
                          </div>
                        )}
                     </div>
                   </div>

                   <div className="space-y-12">
                     <div className="bg-stone-900 p-12 rounded-[3.5rem] shadow-2xl text-white space-y-8 sticky top-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500 text-left">Live Header Preview</p>
                        <div className="p-8 border border-white/5 rounded-[2rem] bg-white/5 flex justify-center">
                          <Logo branding={branding} defaultBranding={defaultBranding} light onClick={() => {}} />
                        </div>
                        <div className="p-8 border border-black/5 rounded-[2rem] bg-white flex justify-center">
                          <Logo branding={branding} defaultBranding={defaultBranding} onClick={() => {}} />
                        </div>
                     </div>
                   </div>
                 </div>
              </div>
            )}

            {/* Gallery Tab with Drag and Drop */}
            {adminTab === 'gallery' && (
              <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500 text-left">
                <header className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-10 gap-6">
                  <div className="text-left">
                    <h2 className="text-4xl font-black text-stone-900 mb-2 text-left">Expedition Journal</h2>
                    <p className="text-stone-500 font-medium text-left">Drag and drop images to reorder. Changes persist automatically.</p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-stone-800 shrink-0"
                    >
                      <Upload className="w-5 h-5" /> Upload Photos
                    </button>
                    <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileSelect} />
                  </div>
                </header>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {gallery.map((img, i) => (
                    <div 
                      key={img.url + i} 
                      draggable
                      onDragStart={(e) => handleDragStart(e, i)}
                      onDragOver={(e) => handleDragOver(e, i)}
                      onDragEnd={handleDragEnd}
                      className={`aspect-square rounded-[2rem] overflow-hidden bg-white shadow-sm border-2 relative group transition-all duration-300 cursor-grab active:cursor-grabbing ${draggedIndex === i ? 'opacity-30 scale-95 border-green-500 border-dashed' : 'border-stone-100 hover:-translate-y-2 hover:shadow-2xl'}`}
                    >
                       <img src={img.url} className="w-full h-full object-cover pointer-events-none" />
                       <div className="absolute top-4 left-4 bg-black/40 backdrop-blur-md text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                         <GripVertical className="w-4 h-4" />
                       </div>
                       <div className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteImage(i); }} 
                            className="bg-red-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform pointer-events-auto"
                          >
                             <Trash2 className="w-6 h-6" />
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {adminTab === 'fleet' && (
              <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500 text-left">
                <header className="flex justify-between items-end border-b border-stone-200 pb-10 text-left">
                  <div className="text-left">
                    <h2 className="text-4xl font-black text-stone-900 mb-2 text-left">Herd Profiles</h2>
                    <p className="text-stone-500 font-medium text-left">Individual stats and biographies for your packing fleet.</p>
                  </div>
                  <button 
                    onClick={() => {
                      const newLlama: Llama = {
                        id: Date.now().toString(),
                        name: 'New Llama',
                        age: 5,
                        personality: 'New herd member...',
                        maxLoad: 70,
                        imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
                        specialty: 'Backpacking'
                      };
                      setLlamas([...llamas, newLlama]);
                    }}
                    className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-stone-800 transition-all"
                  >
                    <Plus className="w-5 h-5" /> Add Llama
                  </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
                  {llamas.map((llama) => (
                    <div key={llama.id} className="bg-white border border-stone-200 rounded-[3rem] p-8 space-y-6 shadow-sm group hover:shadow-xl transition-all text-left">
                      <div className="w-full aspect-[4/3] rounded-[2rem] overflow-hidden bg-stone-100 relative shadow-inner">
                        <img src={llama.imageUrl} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => {
                            setActiveLlamaEdit(llama.id);
                            llamaPhotoInputRef.current?.click();
                          }}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white"
                        >
                          <Camera className="w-10 h-10 mb-2" />
                          <span className="font-black text-[10px] uppercase tracking-widest text-center">Swap Portrait</span>
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center gap-4 text-left">
                           <input 
                             className="text-2xl font-black text-stone-900 w-full outline-none bg-transparent focus:bg-stone-50 px-2 rounded-lg text-left"
                             value={llama.name}
                             onChange={(e) => setLlamas(llamas.map(l => l.id === llama.id ? {...l, name: e.target.value} : l))}
                           />
                           <button onClick={() => setLlamas(llamas.filter(l => l.id !== llama.id))} className="text-stone-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-left">
                           <div>
                              <label className="block text-[10px] font-black uppercase text-stone-400 mb-2 text-left">Primary Role</label>
                              <select 
                                className="w-full bg-stone-50 border border-stone-100 p-2 rounded-xl text-xs font-bold"
                                value={llama.specialty}
                                onChange={(e) => setLlamas(llamas.map(l => l.id === llama.id ? {...l, specialty: e.target.value as Llama['specialty']} : l))}
                              >
                                <option>Lead Llama</option>
                                <option>Hunting</option>
                                <option>Backpacking</option>
                                <option>Gentle Soul</option>
                              </select>
                           </div>
                           <div>
                              <label className="block text-[10px] font-black uppercase text-stone-400 mb-2 text-left">Max Capacity</label>
                              <div className="flex items-center gap-2 bg-stone-50 px-3 py-2 rounded-xl border border-stone-100">
                                <input 
                                  type="number" 
                                  className="w-full bg-transparent font-black text-xs outline-none" 
                                  value={llama.maxLoad} 
                                  onChange={(e) => setLlamas(llamas.map(l => l.id === llama.id ? {...l, maxLoad: parseInt(e.target.value)} : l))}
                                />
                                <span className="text-[10px] font-black text-stone-400">LBS</span>
                              </div>
                           </div>
                        </div>
                        <textarea 
                           className="w-full h-24 bg-stone-50 border border-stone-100 p-4 rounded-xl text-xs font-medium resize-none outline-none focus:bg-white focus:ring-2 focus:ring-green-800/10 text-left"
                           placeholder="Llama personality..."
                           value={llama.personality}
                           onChange={(e) => setLlamas(llamas.map(l => l.id === llama.id ? {...l, personality: e.target.value} : l))}
                        />
                      </div>
                    </div>
                  ))}
                  <input type="file" ref={llamaPhotoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, 'llama')} />
                </div>
              </div>
            )}

            {adminTab === 'bookings' && (
              <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500 text-left">
                 <header className="border-b border-stone-200 pb-10 text-left">
                    <h2 className="text-4xl font-black text-stone-900 mb-2 text-left">Fleet Logistics</h2>
                    <p className="text-stone-500 font-medium text-left">Monitoring the current deployment of the backcountry herd.</p>
                 </header>
                 <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden text-left">
                    <table className="w-full text-left">
                      <thead className="bg-stone-100/50 text-left">
                        <tr>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-left">Explorer</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-left">Window</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400 text-left">Unit Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-left">
                         <tr className="hover:bg-stone-50 transition-colors">
                            <td className="px-8 py-8 font-black text-stone-900 text-left">Sarah Miller</td>
                            <td className="px-8 py-8 font-medium text-stone-500 text-left">Aug 12 - 18</td>
                            <td className="px-8 py-8 text-left"><span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">4 Units</span></td>
                         </tr>
                      </tbody>
                    </table>
                 </div>
              </div>
            )}
          </main>

          {/* Staging Bar */}
          {localPreviews.length > 0 && (
            <div className="fixed bottom-24 sm:bottom-12 left-1/2 -translate-x-1/2 w-[90%] max-w-2xl bg-stone-900 text-white p-6 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center justify-between z-50 animate-in slide-in-from-bottom-10">
               <div className="flex items-center gap-4 text-left">
                  <div className="flex -space-x-4 shrink-0">
                     {localPreviews.slice(0, 3).map((p, i) => (
                        <div key={i} className="w-10 h-10 rounded-full border-2 border-stone-900 overflow-hidden bg-stone-700">
                           <img src={p} className="w-full h-full object-cover" />
                        </div>
                     ))}
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-black tracking-tight text-left">{localPreviews.length} images ready</h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest text-left">Optimized & Staged</p>
                  </div>
               </div>
               <div className="flex gap-3">
                  <button onClick={() => setLocalPreviews([])} className="px-4 py-2 text-stone-400 font-black text-xs uppercase hover:text-white transition-colors">Discard</button>
                  <button onClick={handleConfirmUpload} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg transition-all active:scale-95">
                    {isUploadingFile ? <Loader2 className="animate-spin w-4 h-4" /> : "Save Changes"}
                  </button>
               </div>
            </div>
          )}

          {/* Mobile Admin Nav */}
          <nav className="lg:hidden bg-white border-t border-stone-200 px-6 py-4 flex items-center justify-around shrink-0 z-20">
             <button onClick={() => setAdminTab('branding')} className={`flex flex-col items-center gap-1 ${adminTab === 'branding' ? 'text-green-800' : 'text-stone-300'}`}>
                <Palette className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-widest">Identity</span>
             </button>
             <button onClick={() => setAdminTab('fleet')} className={`flex flex-col items-center gap-1 ${adminTab === 'fleet' ? 'text-green-800' : 'text-stone-300'}`}>
                <Users className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-widest">Herd</span>
             </button>
             <button onClick={() => setAdminTab('gallery')} className={`flex flex-col items-center gap-1 ${adminTab === 'gallery' ? 'text-green-800' : 'text-stone-300'}`}>
                <ImageIcon className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-widest">Gallery</span>
             </button>
          </nav>
        </div>
      )}

      {/* Website Navigation */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-lg border-b border-stone-200 text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Logo branding={branding} defaultBranding={defaultBranding} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            <div className="hidden md:flex items-center gap-8 text-left">
              <NavLink href="#about" id="about" onClick={scrollToSection}>The Herd</NavLink>
              <NavLink href="#benefits" id="benefits" onClick={scrollToSection}>Why Llamas?</NavLink>
              <NavLink href="#gear" id="gear" onClick={scrollToSection}>Gear Guide</NavLink>
              <NavLink href="#gallery" id="gallery" onClick={scrollToSection}>Gallery</NavLink>
              <a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="bg-green-800 text-white px-7 py-3 rounded-full font-black hover:bg-green-900 transition-all flex items-center gap-2 shadow-lg shadow-green-800/30 active:scale-95">
                Book Your Trek <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <button className="md:hidden p-2 hover:bg-stone-100 rounded-lg" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-stone-200 p-6 space-y-4 shadow-xl text-left animate-in slide-in-from-top duration-300">
            <NavLink href="#about" id="about" onClick={scrollToSection}>The Herd</NavLink>
            <NavLink href="#benefits" id="benefits" onClick={scrollToSection}>Why Llamas?</NavLink>
            <NavLink href="#gear" id="gear" onClick={scrollToSection}>Gear Guide</NavLink>
            <NavLink href="#gallery" id="gallery" onClick={scrollToSection}>Gallery</NavLink>
            <a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="block w-full text-center bg-green-800 text-white py-4 rounded-2xl font-black">Book Your Trek</a>
          </div>
        )}
      </nav>

      {/* Website Sections */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden text-center group text-left">
        <div className="absolute inset-0 z-0 text-left">
          <img src={branding?.heroImageUrl || defaultBranding.heroImageUrl} alt="Montana Peaks" className="w-full h-full object-cover brightness-[0.4] scale-105 text-left" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900/80 text-left"></div>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-[1.1] text-center">Elevate the Trek. <br /><span className="italic text-green-400 font-light">Unload the Journey.</span></h1>
          <p className="text-xl md:text-2xl text-stone-200 mb-12 max-w-3xl mx-auto leading-relaxed font-medium text-center">{slogan}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-12 py-5 rounded-full text-lg font-black transition-all shadow-2xl shadow-green-900/40 active:scale-95 text-center">Plan Your Adventure</a>
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 text-white px-12 py-5 rounded-full text-lg font-black transition-all text-center">Meet the Crew</a>
          </div>
        </div>
      </section>

      <section id="benefits" className="py-32 bg-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-6 tracking-tight text-center">Built for the Backcountry</h2>
            <div className="w-24 h-2 bg-green-800 mx-auto rounded-full mb-8"></div>
            <p className="text-stone-500 max-w-2xl mx-auto text-xl leading-relaxed text-center">Llamas possess a unique physiological advantage that makes them the gold standard for high-altitude trekking and hunting.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-left">
            {BENEFITS.map((benefit, idx) => (
              <div key={idx} className="p-10 rounded-[2.5rem] bg-stone-50 border border-stone-100 hover:shadow-2xl transition-all group hover:-translate-y-2 text-left">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-8 group-hover:bg-green-800 transition-all duration-500">
                  <div className="group-hover:text-white transition-colors duration-500">{benefit.icon}</div>
                </div>
                <h3 className="text-2xl font-black text-stone-900 mb-4 text-left">{benefit.title}</h3>
                <p className="text-stone-600 leading-relaxed text-lg font-medium text-left">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-32 bg-stone-100/50 backdrop-blur-sm text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8 text-left">
            <div className="max-w-2xl text-left">
              <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-6 tracking-tight text-left">Meet the Professionals</h2>
              <p className="text-stone-600 text-xl leading-relaxed font-medium text-left">Our herd is meticulously trained for the variable conditions of the Northern Rockies.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 text-left">
            {llamas.map(llama => <LlamaCard key={llama.id} llama={llama} />)}
          </div>
        </div>
      </section>

      <section id="gallery" className="py-32 bg-stone-950 text-white text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-left">
          <h2 className="text-5xl md:text-7xl font-black mb-16 tracking-tight text-center">Wilderness Journal</h2>
          <PhotoCarousel images={gallery} />
        </div>
      </section>

      <section id="booking" className="py-32 bg-white text-center">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-5xl md:text-7xl font-black text-stone-900 mb-20 tracking-tight text-center">Mission Control</h2>
          <BookingForm />
        </div>
      </section>

      <footer className="bg-stone-950 text-stone-500 py-24 text-left">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 text-left">
            <Logo branding={branding} defaultBranding={defaultBranding} light onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
            <div className="flex items-center gap-4 text-left">
              <button 
                onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} 
                className="w-12 h-12 rounded-2xl bg-stone-900 flex items-center justify-center hover:bg-stone-800 transition-all text-left"
              >
                {isAdmin ? <Unlock /> : <Lock />}
              </button>
              {isAdmin && (
                <button onClick={() => setShowDashboard(true)} className="bg-white text-stone-900 px-6 py-3 rounded-xl font-black text-xs uppercase text-left">Open CMS</button>
              )}
            </div>
            <p className="font-black text-[10px] uppercase tracking-widest text-left">© {new Date().getFullYear()} {branding?.siteName || defaultBranding.siteName}.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;