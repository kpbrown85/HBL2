
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
  const [copySuccess, setCopySuccess] = useState(false);

  // Branding State - Robust Initialization
  const defaultBranding = {
    siteName: "Helena Backcountry Llamas",
    accentName: "Llamas",
    logoType: 'icon' as 'icon' | 'image',
    logoUrl: "",
    heroImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=2400",
    guideImageUrl: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800"
  };

  const [branding, setBranding] = useState(() => {
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
  
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
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

  const openAdminTab = (tab: typeof adminTab) => {
    setAdminTab(tab);
    setShowDashboard(true);
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

  const NavLink = ({ href, id, children }: { href: string; id: string; children: React.ReactNode }) => (
    <a 
      href={href} 
      onClick={(e) => scrollToSection(e, id)} 
      className="text-sm font-black text-stone-600 hover:text-green-800 transition-colors uppercase tracking-widest block md:inline"
    >
      {children}
    </a>
  );

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

  const handleAiGenerate = async () => {
    if (!aiPrompt || !isAdmin) return;
    setIsGenerating(true);
    try {
      const imageUrl = await generateBackdrop(aiPrompt);
      const newImage: GalleryImage = {
        url: imageUrl,
        caption: `AI Generated: ${aiPrompt}`
      };
      setGallery([newImage, ...gallery]);
      setAiPrompt("");
    } catch (error) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'hero' | 'guide' | 'llama') => {
    const file = e.target.files?.[0];
    if (file && isAdmin) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const rawResult = reader.result as string;
          // COMPRESS BEFORE SAVING TO STATE
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
        for (const file of Array.from(files)) {
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

  const Logo = ({ light = false }: { light?: boolean }) => {
    const siteTitle = (branding?.siteName || defaultBranding.siteName).toString();
    const accent = (branding?.accentName || defaultBranding.accentName).toString();
    
    // Improved regex-based split to handle case sensitivity and multiple matches
    const regex = new RegExp(`(${accent})`, 'gi');
    const parts = siteTitle.split(regex);
    
    return (
      <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
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

  const AdminTabButton = ({ id, label, icon: Icon }: { id: typeof adminTab, label: string, icon: any }) => (
    <button 
      onClick={() => setAdminTab(id)}
      className={`flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm transition-all ${adminTab === id ? 'bg-stone-900 text-white shadow-lg' : 'text-stone-400 hover:bg-stone-100 hover:text-stone-900'}`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen">
      {/* Universal Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 z-[200] bg-stone-900/40 backdrop-blur-md flex items-center justify-center">
          <div className="bg-white px-10 py-12 rounded-[3rem] shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in duration-300">
             <div className="w-16 h-16 bg-green-800 text-white rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
                <Zap className="w-8 h-8" />
             </div>
             <div className="text-center">
               <h3 className="text-2xl font-black text-stone-900">Optimizing Asset</h3>
               <p className="text-stone-500 font-bold uppercase text-[10px] tracking-widest mt-1">Compressing image for peak performance...</p>
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
                <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Management Password</label>
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
              <AdminTabButton id="branding" label="Identity" icon={Palette} />
              <AdminTabButton id="fleet" label="Herd" icon={Users} />
              <AdminTabButton id="gallery" label="Gallery" icon={ImageIcon} />
              <AdminTabButton id="bookings" label="Bookings" icon={ClipboardList} />
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
                      <h3 className="text-4xl font-black text-stone-900 mb-2">Visual Identity</h3>
                      <p className="text-stone-500 font-medium">Customize your brand name, logos, and key section imagery.</p>
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
                   {/* Left Column: Form Settings */}
                   <div className="space-y-10 text-left">
                     {/* Text Brand Settings */}
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-200 space-y-8">
                        <h4 className="text-sm font-black uppercase tracking-widest text-stone-900 flex items-center gap-2"><Type className="w-4 h-4 text-green-800" /> Typography & Copy</h4>
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

                     {/* Logo & Icon Mark Settings */}
                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-200 space-y-8">
                        <h4 className="text-sm font-black uppercase tracking-widest text-stone-900 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-green-800" /> Brand Mark</h4>
                        
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
                                <p className="font-black text-xs text-stone-900 uppercase">Change Logo Image</p>
                                <p className="text-[10px] text-stone-400 font-bold">Transparent PNG recommended</p>
                              </div>
                            </button>
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, 'logo')} />
                          </div>
                        )}
                     </div>

                     <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-stone-200 space-y-8">
                        <h4 className="text-sm font-black uppercase tracking-widest text-stone-900 flex items-center gap-2"><ImageIcon className="w-4 h-4 text-green-800" /> Hero & Staff Assets</h4>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-left block">Hero Backdrop</label>
                              <button onClick={() => heroInputRef.current?.click()} className="w-full aspect-square bg-stone-100 rounded-2xl overflow-hidden border-2 border-dashed border-stone-200 group relative">
                                {branding?.heroImageUrl ? <img src={branding.heroImageUrl} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-stone-300" />}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black uppercase">
                                  <Upload className="w-5 h-5 mb-1" /> Swap Image
                                </div>
                              </button>
                              <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, 'hero')} />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[10px] font-black text-stone-400 uppercase tracking-widest text-left block">Guide Portrait</label>
                              <button onClick={() => guideInputRef.current?.click()} className="w-full aspect-square bg-stone-100 rounded-2xl overflow-hidden border-2 border-dashed border-stone-200 group relative">
                                {branding?.guideImageUrl ? <img src={branding.guideImageUrl} className="w-full h-full object-cover" /> : <Camera className="w-6 h-6 text-stone-300" />}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[10px] font-black uppercase">
                                  <Upload className="w-5 h-5 mb-1" /> Swap Image
                                </div>
                              </button>
                              <input type="file" ref={guideInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, 'guide')} />
                           </div>
                        </div>
                     </div>
                   </div>

                   {/* Right Column: Live Preview Card */}
                   <div className="space-y-12">
                     <div className="bg-stone-900 p-12 rounded-[3.5rem] shadow-2xl text-white space-y-8 sticky top-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-stone-500">Live Header Preview</p>
                        <div className="p-8 border border-white/5 rounded-[2rem] bg-white/5 flex justify-center">
                          <Logo light />
                        </div>
                        <div className="p-8 border border-black/5 rounded-[2rem] bg-white flex justify-center">
                          <Logo />
                        </div>
                        <div className="pt-8 border-t border-white/10 space-y-4 text-left">
                           <h5 className="font-bold text-lg">Visual Status</h5>
                           <div className="flex flex-wrap gap-2">
                              <div className="bg-green-500/20 text-green-400 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2"><Check className="w-3 h-3" /> Auto-Optimized</div>
                              <div className="bg-white/10 text-white/60 px-4 py-1.5 rounded-full text-[10px] font-black uppercase flex items-center gap-2"><Monitor className="w-3 h-3" /> Responsive</div>
                           </div>
                           <div className="mt-4 p-4 bg-green-900/20 border border-green-900/30 rounded-2xl flex items-start gap-3">
                             <Zap className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                             <p className="text-[10px] text-green-200 leading-relaxed font-medium">Auto-compression is active. All uploads are automatically resized and converted to high-efficiency JPEGs to ensure your site stays lightning fast and stable.</p>
                           </div>
                        </div>
                     </div>
                   </div>
                 </div>
              </div>
            )}

            {/* Herd/Fleet Tab */}
            {adminTab === 'fleet' && (
              <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                <header className="flex justify-between items-end border-b border-stone-200 pb-10">
                  <div className="text-left">
                    <h2 className="text-4xl font-black text-stone-900 mb-2">Herd Profiles</h2>
                    <p className="text-stone-500 font-medium">Individual stats and biographies for your packing fleet.</p>
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

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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
                          <span className="font-black text-[10px] uppercase tracking-widest">Swap Portrait</span>
                        </button>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center gap-4">
                           <input 
                             className="text-2xl font-black text-stone-900 w-full outline-none bg-transparent focus:bg-stone-50 px-2 rounded-lg"
                             value={llama.name}
                             onChange={(e) => setLlamas(llamas.map(l => l.id === llama.id ? {...l, name: e.target.value} : l))}
                           />
                           <button onClick={() => setLlamas(llamas.filter(l => l.id !== llama.id))} className="text-stone-300 hover:text-red-500 transition-colors">
                              <Trash2 className="w-5 h-5" />
                           </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
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
                           className="w-full h-24 bg-stone-50 border border-stone-100 p-4 rounded-xl text-xs font-medium resize-none outline-none focus:bg-white focus:ring-2 focus:ring-green-800/10"
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

            {/* Gallery Tab */}
            {adminTab === 'gallery' && (
              <div className="max-w-6xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-stone-200 pb-10 gap-6">
                  <div className="text-left">
                    <h2 className="text-4xl font-black text-stone-900 mb-2">Expedition Journal</h2>
                    <p className="text-stone-500 font-medium">Manage the photo gallery shown to prospective trekkers.</p>
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
                    <div key={i} className="aspect-square rounded-[2rem] overflow-hidden bg-white shadow-sm border border-stone-200 relative group transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl">
                       <img src={img.url} className="w-full h-full object-cover" />
                       <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button onClick={() => handleDeleteImage(i)} className="bg-red-500 text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform">
                             <Trash2 className="w-6 h-6" />
                          </button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {adminTab === 'bookings' && (
              <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-bottom-4 duration-500">
                 <header className="border-b border-stone-200 pb-10 text-left">
                    <h2 className="text-4xl font-black text-stone-900 mb-2">Fleet Logistics</h2>
                    <p className="text-stone-500 font-medium">Monitoring the current deployment of the backcountry herd.</p>
                 </header>
                 <div className="bg-white rounded-[3rem] border border-stone-200 shadow-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead className="bg-stone-100/50">
                        <tr>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Explorer</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Window</th>
                          <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Unit Count</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-left">
                         <tr className="hover:bg-stone-50 transition-colors">
                            <td className="px-8 py-8 font-black text-stone-900">Sarah Miller</td>
                            <td className="px-8 py-8 font-medium text-stone-500">Aug 12 - 18</td>
                            <td className="px-8 py-8"><span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">4 Units</span></td>
                         </tr>
                         <tr className="hover:bg-stone-50 transition-colors">
                            <td className="px-8 py-8 font-black text-stone-900">Tom Hudson</td>
                            <td className="px-8 py-8 font-medium text-stone-500">Sep 05 - 12</td>
                            <td className="px-8 py-8"><span className="bg-amber-100 text-amber-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">2 Units</span></td>
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
                     {localPreviews.length > 3 && (
                        <div className="w-10 h-10 rounded-full border-2 border-stone-900 bg-stone-700 flex items-center justify-center text-[10px] font-black">
                           +{localPreviews.length - 3}
                        </div>
                     )}
                  </div>
                  <div>
                    <h4 className="text-sm font-black tracking-tight">{localPreviews.length} images ready</h4>
                    <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Compressed & Optimized</p>
                  </div>
               </div>
               <div className="flex gap-3">
                  <button onClick={() => setLocalPreviews([])} className="px-4 py-2 text-stone-400 font-black text-xs uppercase hover:text-white transition-colors">Discard</button>
                  <button onClick={handleConfirmUpload} className="bg-green-600 hover:bg-green-500 text-white px-6 py-3 rounded-xl font-black text-xs uppercase shadow-lg transition-all active:scale-95">
                    {isUploadingFile ? <Loader2 className="animate-spin w-4 h-4" /> : "Save to Fleet"}
                  </button>
               </div>
            </div>
          )}

          {/* Mobile Bottom Navigation Bar */}
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
             <button onClick={() => setAdminTab('bookings')} className={`flex flex-col items-center gap-1 ${adminTab === 'bookings' ? 'text-green-800' : 'text-stone-300'}`}>
                <ClipboardList className="w-6 h-6" />
                <span className="text-[9px] font-black uppercase tracking-widest">Trips</span>
             </button>
          </nav>
        </div>
      )}

      {/* Standard Website UI */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-lg border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Logo />
            <div className="hidden md:flex items-center gap-8 text-left">
              <NavLink href="#about" id="about">The Herd</NavLink>
              <NavLink href="#benefits" id="benefits">Why Llamas?</NavLink>
              <NavLink href="#gear" id="gear">Gear Guide</NavLink>
              <NavLink href="#gallery" id="gallery">Gallery</NavLink>
              <NavLink href="#reviews" id="reviews">Reviews</NavLink>
              <NavLink href="#faq" id="faq">Guide FAQ</NavLink>
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
            <NavLink href="#about" id="about">The Herd</NavLink>
            <NavLink href="#benefits" id="benefits">Why Llamas?</NavLink>
            <NavLink href="#gear" id="gear">Gear Guide</NavLink>
            <NavLink href="#gallery" id="gallery">Gallery</NavLink>
            <NavLink href="#reviews" id="reviews">Reviews</NavLink>
            <NavLink href="#faq" id="faq">Guide FAQ</NavLink>
            <a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="block w-full text-center bg-green-800 text-white py-4 rounded-2xl font-black">Book Your Trek</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden text-left md:text-center group">
        <div className="absolute inset-0 z-0">
          <img src={branding?.heroImageUrl || defaultBranding.heroImageUrl} alt="Montana Peaks" className="w-full h-full object-cover brightness-[0.4] scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900/80"></div>
        </div>
        
        {/* Management Quick Edit */}
        {isAdmin && (
           <button 
            onClick={() => openAdminTab('branding')}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-green-800/80 backdrop-blur-xl text-white p-8 rounded-full border-4 border-white/20 shadow-2xl opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 flex flex-col items-center"
          >
            <Camera className="w-12 h-12 mb-2" />
            <span className="font-black uppercase text-[10px] tracking-widest">Edit Backdrop</span>
          </button>
        )}

        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <h1 className="text-6xl md:text-8xl font-black text-white mb-8 leading-[1.1]">Elevate the Trek. <br /><span className="italic text-green-400 font-light">Unload the Journey.</span></h1>
          <p className="text-xl md:text-2xl text-stone-200 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">{slogan}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-12 py-5 rounded-full text-lg font-black transition-all shadow-2xl shadow-green-900/40 active:scale-95">Plan Your Adventure</a>
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 text-white px-12 py-5 rounded-full text-lg font-black transition-all">Meet the Crew</a>
          </div>
        </div>
      </section>

      {/* Management Quick Access Bar */}
      {isAdmin && (
        <div className="bg-stone-900 text-white py-3 px-4 flex flex-wrap items-center justify-center gap-6 sticky top-20 z-40 shadow-2xl border-b border-white/10 animate-in slide-in-from-top duration-500">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-left"><Unlock className="w-3 h-3 text-green-400" /> Management Mode Active</span>
          <button 
            onClick={() => setShowDashboard(true)} 
            className="flex items-center gap-2 bg-white text-stone-900 hover:bg-stone-100 px-4 py-1.5 rounded-full text-xs font-black transition-all"
          >
            <LayoutDashboard className="w-3 h-3" /> Open Dashboard
          </button>
          <div className="h-4 w-px bg-white/20" />
          <button onClick={() => setIsAdmin(false)} className="text-[10px] font-black uppercase text-white/60 hover:text-white transition-all">
            Exit Admin
          </button>
        </div>
      )}

      {/* Content Sections */}
      <section id="benefits" className="py-32 bg-white relative text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-6 tracking-tight">Built for the Backcountry</h2>
            <div className="w-24 h-2 bg-green-800 mx-auto rounded-full mb-8"></div>
            <p className="text-stone-500 max-w-2xl mx-auto text-xl leading-relaxed">Llamas possess a unique physiological advantage that makes them the gold standard for high-altitude trekking and hunting.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS.map((benefit, idx) => (
              <div key={idx} className="p-10 rounded-[2.5rem] bg-stone-50 border border-stone-100 hover:shadow-2xl transition-all group hover:-translate-y-2 text-left">
                <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-8 group-hover:bg-green-800 transition-all duration-500">
                  <div className="group-hover:text-white transition-colors duration-500">{benefit.icon}</div>
                </div>
                <h3 className="text-2xl font-black text-stone-900 mb-4">{benefit.title}</h3>
                <p className="text-stone-600 leading-relaxed text-lg font-medium">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-32 bg-stone-100/50 backdrop-blur-sm relative overflow-hidden text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-6 tracking-tight">Meet the Professionals</h2>
              <p className="text-stone-600 text-xl leading-relaxed font-medium">Our herd is meticulously trained for the variable conditions of the Northern Rockies.</p>
            </div>
            {isAdmin && (
              <button onClick={() => openAdminTab('fleet')} className="bg-stone-900 text-white px-8 py-4 rounded-full font-black text-xs uppercase flex items-center gap-2 shadow-lg active:scale-95"><Edit3 className="w-4 h-4" /> Edit Fleet</button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {llamas.map(llama => <LlamaCard key={llama.id} llama={llama} />)}
          </div>
        </div>
      </section>

      <section id="gear" className="py-32 bg-stone-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-stone-500 mb-6 text-sm font-black uppercase tracking-[0.3em]"><Backpack className="w-5 h-5 text-green-700" /> Pro Kit Guide</div>
            <h2 className="text-5xl md:text-7xl font-black text-stone-900 mb-8 tracking-tight">Essential Gear</h2>
            <p className="text-stone-600 max-w-2xl mx-auto text-xl leading-relaxed font-medium">We provide the llama and the saddle system. Here's what else you'll need.</p>
          </div>
          <GearSection />
        </div>
      </section>

      <section id="gallery" className="py-32 bg-stone-950 text-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-left">
          <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-8 text-left">
            <div>
              <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-left">Wilderness Journal</h2>
              <div className="flex items-center gap-4">
                <p className="text-stone-400 text-xl max-w-xl font-medium text-left">A glimpse into our most recent expedition routes.</p>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => openAdminTab('gallery')} className="bg-green-800 hover:bg-green-700 px-8 py-4 rounded-full font-black text-xs uppercase shadow-xl flex items-center gap-2 transition-all active:scale-95">
                <Settings className="w-5 h-5" /> Manage Assets
              </button>
            )}
          </div>
          
          <PhotoCarousel images={gallery} />

          <div className="mt-20 flex items-center justify-between mb-10 text-left">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-stone-500 flex items-center gap-3">
              Expedition Snapshots
            </h4>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8 text-left">
            {gallery.map((img, i) => (
              <div 
                key={img.url + i} 
                className="relative group overflow-hidden rounded-[2rem] break-inside-avoid shadow-2xl bg-stone-900/50 min-h-[200px] transition-all duration-300"
              >
                <img src={img.url} alt={img.caption} loading="lazy" className="w-full h-auto object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-transparent opacity-0 group-hover:opacity-100 transition-all flex items-end p-8">
                  <div className="flex justify-between w-full items-end">
                    <div className="text-left">
                      <p className="text-lg font-black text-white mb-2">{img.caption}</p>
                      <p className="text-[10px] text-green-400 font-black uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Montana High Country
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="reviews" className="py-32 bg-white text-center">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black text-stone-900 mb-8 tracking-tight">Voices from the Path</h2>
          </div>
          <Testimonials />
        </div>
      </section>

      <section className="py-32 bg-green-50/50 text-left">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-700 to-green-900"></div>
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="flex-1 text-left">
                <div className="inline-flex items-center gap-2 text-green-800 bg-green-100 px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8"><MessageCircle className="w-4 h-4" /> Herd Wisdom</div>
                <h2 className="text-5xl font-black text-stone-900 mb-8 tracking-tight text-left">Ask Our Head Guide</h2>
                <form onSubmit={handleAdviceSubmit} className="relative mb-8 group">
                  <input type="text" placeholder="e.g. Best weight distribution?" className="w-full bg-stone-50 border-2 border-stone-100 px-8 py-6 rounded-[2rem] outline-none focus:border-green-300 transition-all font-black" value={adviceQuery} onChange={(e) => setAdviceQuery(e.target.value)} />
                  <button disabled={isAdviceLoading} className="absolute right-3 top-3 bottom-3 bg-green-800 text-white px-10 rounded-[1.5rem] font-black active:scale-95 disabled:opacity-50">
                    {isAdviceLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                  </button>
                </form>
                {adviceResponse && <div className="p-8 bg-green-50 rounded-[2rem] border-2 border-green-100/50 animate-in slide-in-from-bottom-4"><p className="text-green-900 italic font-black leading-relaxed">"{adviceResponse}"</p></div>}
              </div>
              
              {/* Head Guide Photo Section */}
              <div className="w-full md:w-2/5 aspect-[4/5] rounded-[3rem] overflow-hidden bg-stone-100 shadow-2xl relative group shrink-0">
                <img src={branding?.guideImageUrl || defaultBranding.guideImageUrl} className="w-full h-full object-cover" />
                {isAdmin && (
                  <button 
                    onClick={() => openAdminTab('branding')}
                    className="absolute inset-0 bg-stone-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-4"
                  >
                    <Camera className="w-12 h-12 mb-2" />
                    <span className="font-black text-[10px] uppercase tracking-widest text-center">Swap Profile Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-32 bg-white text-center">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-20 tracking-tight text-center">Frequently Asked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-stone-50 rounded-[2.5rem] p-10 border border-stone-100 hover:border-green-100 transition-colors group">
                <h3 className="text-2xl font-black text-stone-900 mb-6 flex items-start gap-4 transition-colors group-hover:text-green-800 leading-tight"><span className="w-8 h-8 rounded-full bg-green-800 text-white flex-shrink-0 flex items-center justify-center text-xs">?</span>{faq.question}</h3>
                <p className="text-stone-600 pl-12 leading-relaxed font-medium">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="booking" className="py-32 bg-stone-50 relative overflow-hidden text-center">
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 text-stone-500 mb-6 text-sm font-black uppercase tracking-[0.3em]"><CalendarDays className="w-5 h-5" /> Mission Control</div>
          <h2 className="text-5xl md:text-7xl font-black text-stone-900 mb-20 tracking-tight text-center">Ready to Gear Up?</h2>
          <BookingForm />
        </div>
      </section>

      <footer className="bg-stone-950 text-stone-500 py-32 relative text-left">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 border-b border-stone-800 pb-20 mb-20 text-left">
            <div className="col-span-1 md:col-span-2 text-left">
              <div className="flex items-center gap-3 mb-10 text-left">
                <Logo light />
              </div>
              <p className="max-w-md mb-12 text-lg font-medium text-left">Pioneering backcountry exploration in Helena, Montana since 2018.</p>
              <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isAdmin ? 'bg-green-800 text-white rotate-0' : 'bg-stone-900 rotate-12 hover:rotate-0 shadow-lg shadow-black'}`}>
                {isAdmin ? <Unlock /> : <Lock />}
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 font-black text-xs uppercase tracking-widest text-left">
            <p>© {new Date().getFullYear()} {branding?.siteName || defaultBranding.siteName}.</p>
            <div className="flex gap-8">
               <a href="#" className="hover:text-white transition-colors">Safety Protocols</a>
               <a href="#" className="hover:text-white transition-colors">Privacy</a>
               <a href="#" className="hover:text-white transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
