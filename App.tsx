
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { LLAMAS, GALLERY_IMAGES, BENEFITS, LLAMA_FACTS } from './constants';
import { LlamaCard } from './components/LlamaCard';
import { BookingForm } from './components/BookingForm';
import { PhotoCarousel } from './components/PhotoCarousel';
import { GearSection } from './components/GearSection';
import { FAQSection } from './components/FAQSection';
import { PackingListGenerator } from './components/PackingListGenerator';
import { generateWelcomeSlogan, generateBackdrop } from './services/geminiService';
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
  Users,
  Home,
  Zap,
  CheckCircle,
  CheckCircle2,
  XCircle,
  User,
  Clock,
  ChevronLeft,
  ArrowUp,
  ArrowDown,
  Mail,
  Save,
  LogOut,
  Edit3,
  Calendar,
  Sparkles,
  Info,
  Camera,
  Palette,
  ClipboardList,
  Phone,
  Truck,
  GraduationCap,
  Ban,
  Activity,
  MapPin,
  ExternalLink,
  CreditCard,
  Settings,
  RefreshCcw,
  Layout,
  Globe,
  Eye,
  Type,
  Wind
} from 'lucide-react';

const APP_VERSION = "3.7.0-Conditions-Sync";

interface Branding {
  siteName: string;
  accentName: string;
  heroImageUrl: string;
  adminEmail: string;
  logoUrl?: string;
}

interface UploadStatus {
  current: number;
  total: number;
}

const compressImage = (base64Str: string, maxWidth = 1000, quality = 0.6): Promise<string> => {
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
      if (!ctx) return reject(new Error("Canvas context error"));
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = reject;
  });
};

const Logo = ({ branding, light = false, onClick }: { branding: Branding, light?: boolean, onClick?: () => void }) => {
  const accent = branding.accentName || "Llamas";
  const safeAccent = accent.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${safeAccent})`, 'gi');
  const parts = (branding.siteName || "Helena Backcountry Llamas").split(regex);
  const hasCustomLogo = branding.logoUrl && branding.logoUrl.trim() !== '';

  return (
    <div className="flex items-center gap-3 cursor-pointer select-none group" onClick={onClick}>
      <div className={`w-10 h-10 ${light ? 'bg-white text-green-800' : 'bg-green-800 text-white'} rounded-lg flex items-center justify-center shadow-lg transition-all group-hover:scale-110 active:scale-95 overflow-hidden ring-1 ring-stone-100/10`}>
        {hasCustomLogo ? (
          <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
        ) : (
          <Mountain className="w-6 h-6" />
        )}
      </div>
      <span className={`text-xl font-black tracking-tight ${light ? 'text-white' : 'text-stone-900'}`}>
        {parts.map((part, i) => (
          part.toLowerCase() === accent.toLowerCase() 
            ? <span key={i} className={`${light ? 'text-green-400' : 'text-green-800'} italic font-display`}>{part}</span>
            : <span key={i}>{part}</span>
        ))}
      </span>
    </div>
  );
};

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slogan, setSlogan] = useState("Forging Unbreakable Bonds in the Montana Wild.");
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<UploadStatus | null>(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(() => sessionStorage.getItem('hbl_isAdmin') === 'true');
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(isAdmin);
  const [adminTab, setAdminTab] = useState<'branding' | 'fleet' | 'gallery' | 'bookings' | 'billing'>('branding');
  const [passwordInput, setPasswordInput] = useState("");
  const [editingLlama, setEditingLlama] = useState<Llama | null>(null);
  const [editingGalleryItem, setEditingGalleryItem] = useState<GalleryImage | null>(null);

  const [branding, setBranding] = useState<Branding>(() => {
    const saved = localStorage.getItem('hbl_branding');
    const defaults = {
      siteName: "Helena Backcountry Llamas",
      accentName: "Llamas",
      heroImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2400",
      adminEmail: 'kevin.paul.brown@gmail.com',
      logoUrl: ''
    };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...defaults, ...parsed };
      } catch (e) {
        return defaults;
      }
    }
    return defaults;
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
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiError, setApiError] = useState<string | null>(null);

  const dailyFact = useMemo(() => {
    const day = new Date().getDate();
    return LLAMA_FACTS[day % LLAMA_FACTS.length];
  }, []);

  useEffect(() => {
    generateWelcomeSlogan().then(val => { if (val) setSlogan(val); });
    
    const checkApi = async () => {
      const pingUrl = `${window.location.origin}/api/ping`;
      try {
        const response = await fetch(pingUrl);
        if (response.ok) {
          setApiStatus('online');
          setApiError(null);
        } else {
          setApiStatus('offline');
          setApiError(`HTTP ${response.status}`);
        }
      } catch (err: any) {
        setApiStatus('offline');
        setApiError(err.message || 'Connection failed');
      }
    };

    const loadLogs = async () => {
      const logsUrl = `${window.location.origin}/api/get-bookings`;
      try {
        const response = await fetch(logsUrl);
        if (response.ok) {
          const data = await response.json();
          setBookings(data);
          localStorage.setItem('hbl_bookings', JSON.stringify(data));
        } else {
          setBookings(JSON.parse(localStorage.getItem('hbl_bookings') || '[]'));
        }
      } catch (error) {
        setBookings(JSON.parse(localStorage.getItem('hbl_bookings') || '[]'));
      }
    };

    checkApi();
    loadLogs();
    window.addEventListener('hbl_new_booking', loadLogs);
    
    const checkApiKey = async () => {
      if (typeof window.aistudio !== 'undefined') {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkApiKey();
    
    return () => window.removeEventListener('hbl_new_booking', loadLogs);
  }, []);

  useEffect(() => { 
    localStorage.setItem('hbl_branding', JSON.stringify(branding)); 
    document.title = branding.siteName + " | Montana Pack Strings"; 
  }, [branding]);
  useEffect(() => { localStorage.setItem('hbl_llamas', JSON.stringify(llamas)); }, [llamas]);
  useEffect(() => { localStorage.setItem('hbl_gallery', JSON.stringify(gallery)); }, [gallery]);
  useEffect(() => { sessionStorage.setItem('hbl_isAdmin', isAdmin.toString()); }, [isAdmin]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === "llama123") {
      setIsAdmin(true); 
      setShowAdminLogin(false); 
      setPasswordInput(""); 
      setShowDashboard(true);
      setAdminTab('branding');
    } else {
      alert("Invalid Access Key");
    }
  };

  const handleSelectKey = async () => {
    console.log("Select Key Triggered");
    const aistudio = (window as any).aistudio;
    
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      try {
        await aistudio.openSelectKey();
        const hasKey = await aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
        console.log("API Key selection successful:", hasKey);
      } catch (err) {
        console.error("API Key selection failed:", err);
        alert("Failed to open key selection dialog.");
      }
    } else {
      // On live site, we just show a helpful message
      alert("API Key management is handled by the platform. If AI features aren't working, please ensure an API key is configured in the project settings.");
    }
  };

  const handleGenerateHero = async () => {
    setIsProcessing(true);
    try {
      const url = await generateBackdrop("A sweeping panorama of the Elkhorn Mountains near Helena, Montana at sunset.");
      setBranding({ ...branding, heroImageUrl: url });
    } catch (err: any) {
      if (err.message?.includes("Requested entity was not found")) {
        alert("API Key expired or invalid. Please re-select your API key in the next dialog.");
        setHasApiKey(false);
        if (typeof window.aistudio !== 'undefined') {
          await window.aistudio.openSelectKey();
          setHasApiKey(true);
        }
      } else {
        alert("Generation failed: " + err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBooking = async (id: string, action: 'confirm' | 'cancel' | 'delete') => {
    console.log(`Attempting ${action} on booking ${id}`);
    const apiPath = `${window.location.origin}/api/${action === 'delete' ? 'delete-booking' : 'update-booking'}`;
    
    try {
      const body = action === 'delete' ? { id } : { id, status: action === 'confirm' ? 'confirmed' : 'canceled', isRead: true };
      
      const response = await fetch(apiPath, { 
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = `Server error (${response.status})`;
        
        if (contentType && contentType.includes("application/json")) {
          const errData = await response.json();
          const rawError = errData.error || errorMessage;
          errorMessage = typeof rawError === 'object' ? JSON.stringify(rawError) : String(rawError);
        } else {
          const text = await response.text();
          errorMessage += `: ${String(text).substring(0, 100)}`;
        }
        throw new Error(errorMessage);
      }
      
      console.log(`${action} successful for ${id}`);
      window.dispatchEvent(new Event('hbl_new_booking'));
    } catch (error: any) {
      console.error("Booking action error:", error);
      const msg = error instanceof Error ? error.message : String(error);
      alert(`Action Failed: ${msg}\n\nTarget URL: ${window.location.origin}${apiPath}`);
    }
  };

  const testApiConnectivity = async () => {
    try {
      const paths = ['/vite-ping', '/api/ping', '/ping', '/debug-test'];
      const results: any = {};

      for (const path of paths) {
        try {
          const res = await fetch(path);
          const hblHeader = res.headers.get("X-HBL-Server");
          const apiHeader = res.headers.get("X-HBL-API");
          const data = res.ok ? await res.json() : `FAILED (${res.status})`;
          results[path] = {
            data,
            server: hblHeader || "NONE",
            api: apiHeader || "NONE"
          };
        } catch (e: any) {
          results[path] = `ERROR: ${e.message}`;
        }
      }

      alert(`DIAGNOSTIC RESULTS (V6)\n\n${JSON.stringify(results, null, 2)}`);
    } catch (err: any) {
      alert(`DIAGNOSTIC ERROR\n\n${err.message || String(err)}`);
    }
  };

  const unreadCount = bookings.filter(b => !b.isRead).length;

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const optimized = await compressImage(ev.target?.result as string, 400, 0.8);
          setBranding({ ...branding, logoUrl: optimized });
        } catch (err) {
          console.error("Logo processing failed:", err);
          alert("Failed to process logo image.");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLlamaImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingLlama) {
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const optimized = await compressImage(ev.target?.result as string, 800, 0.7);
          setEditingLlama({ ...editingLlama, imageUrl: optimized });
        } catch (err) {
          console.error("Llama image processing failed:", err);
          alert("Failed to process image.");
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const saveLlama = (llama: Llama) => {
    const exists = llamas.find(l => l.id === llama.id);
    if (exists) {
      setLlamas(llamas.map(l => l.id === llama.id ? llama : l));
    } else {
      setLlamas([...llamas, llama]);
    }
    setEditingLlama(null);
  };

  const deleteLlama = (id: string) => {
    if (confirm("Are you sure you want to remove this llama from the herd?")) {
      setLlamas(llamas.filter(l => l.id !== id));
    }
  };

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessing(true);
    setUploadStatus({ current: 0, total: files.length });

    const newImages: GalleryImage[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadStatus({ current: i + 1, total: files.length });
      
      try {
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => resolve(ev.target?.result as string);
          reader.readAsDataURL(file);
        });

        const optimized = await compressImage(base64, 1200, 0.7);
        newImages.push({
          url: optimized,
          caption: file.name.split('.')[0].replace(/[-_]/g, ' ')
        });
      } catch (err) {
        console.error("Failed to process gallery image:", err);
      }
    }

    setGallery([...newImages, ...gallery]);
    setIsProcessing(false);
    setUploadStatus(null);
  };

  const deleteGalleryItem = (index: number) => {
    if (confirm("Remove this entry from the Journal?")) {
      setGallery(gallery.filter((_, i) => i !== index));
    }
  };

  const updateGalleryCaption = (index: number, caption: string) => {
    const next = [...gallery];
    next[index] = { ...next[index], caption };
    setGallery(next);
  };

  return (
    <div className="min-h-screen selection:bg-green-100 selection:text-green-900">
      {/* Admin Quick Trigger */}
      <button 
        onClick={() => isAdmin ? setShowDashboard(true) : setShowAdminLogin(true)}
        className="fixed bottom-8 right-8 z-[150] w-16 h-16 bg-white border border-stone-100 rounded-full shadow-2xl flex flex-col items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <span className="text-3xl group-hover:rotate-12 transition-transform">🦙</span>
        {isAdmin && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1">
             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
        )}
      </button>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[300] bg-stone-950/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="bg-white rounded-[4rem] p-12 max-w-sm w-full shadow-2xl animate-in zoom-in duration-500">
             <div className="w-20 h-20 bg-green-800 text-white rounded-3xl flex items-center justify-center mx-auto mb-10 shadow-xl ring-8 ring-green-800/10">
               <Lock size={36} />
             </div>
             <h3 className="text-3xl font-black text-center mb-12 tracking-tight text-stone-900">Mission Control</h3>
             <form onSubmit={handleAuth} className="space-y-6">
               <input 
                type="password" 
                placeholder="Access Key" 
                className="w-full bg-stone-50 border border-stone-100 p-5 rounded-2xl outline-none focus:ring-4 focus:ring-green-500/10 font-black text-center text-lg text-stone-900" 
                value={passwordInput} 
                onChange={(e) => setPasswordInput(e.target.value)} 
                autoFocus 
               />
               <button type="submit" className="w-full bg-green-800 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-lg hover:bg-green-900 transition-colors">Authenticate</button>
               <button type="button" onClick={() => setShowAdminLogin(false)} className="w-full py-3 text-stone-400 font-bold text-xs uppercase tracking-widest hover:text-stone-600">Close</button>
             </form>
          </div>
        </div>
      )}

      {/* Admin Dashboard Overlay */}
      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[200] bg-white flex flex-col overflow-hidden animate-in slide-in-from-bottom-12 duration-700">
          <header className="bg-white border-b px-12 py-8 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-12">
                <Logo branding={branding} onClick={() => setShowDashboard(false)} />
                <div className="hidden lg:flex items-center gap-4 bg-stone-50 px-4 py-2 rounded-full border border-stone-100">
                  <Globe size={14} className="text-stone-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-stone-500">
                    API Status: <span className={apiStatus === 'online' ? 'text-green-600' : 'text-red-600'}>
                      {apiStatus.toUpperCase()} {apiError ? `(${apiError})` : ''}
                    </span>
                  </span>
                  <button 
                    onClick={testApiConnectivity}
                    className="text-[9px] font-bold text-stone-400 hover:text-stone-600 underline decoration-stone-200 underline-offset-2"
                  >
                    DIAGNOSTIC PING
                  </button>
                </div>
              </div>
            <nav className="flex items-center gap-2 bg-stone-50 p-2 rounded-3xl border border-stone-100">
              {[
                { id: 'branding' as const, icon: Palette, label: 'Branding' },
                { id: 'fleet' as const, icon: Users, label: 'Herd' },
                { id: 'gallery' as const, icon: ImageIcon, label: 'Journal' },
                { id: 'bookings' as const, icon: ClipboardList, label: 'Logs' },
                { id: 'billing' as const, icon: CreditCard, label: 'API' }
              ].map(t => (
                <button 
                  key={t.id} 
                  onClick={() => { setAdminTab(t.id); setEditingLlama(null); }} 
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${adminTab === t.id ? 'bg-stone-900 text-white shadow-xl' : 'text-stone-400 hover:bg-stone-100'}`}
                >
                  <t.icon size={18} /> <span className="hidden lg:inline">{t.label}</span>
                  {t.id === 'bookings' && unreadCount > 0 && <span className="bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] ml-1 animate-pulse">{unreadCount}</span>}
                </button>
              ))}
            </nav>
            <div className="flex gap-4">
              <button onClick={() => setShowDashboard(false)} className="px-8 py-4 rounded-2xl border border-stone-100 font-black text-[10px] uppercase tracking-widest text-stone-500 flex items-center gap-2 hover:bg-stone-50 transition-all shadow-sm"><Home size={16} /> Exit Admin</button>
              <button onClick={() => { setIsAdmin(false); setShowDashboard(false); }} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm"><LogOut size={20} /></button>
            </div>
          </header>

          <main className="flex-1 bg-stone-50/50 overflow-y-auto p-12 lg:p-24">
            <div className="max-w-7xl mx-auto">
              {/* Admin Tabs implementation remains similar */}
              {adminTab === 'branding' && (
                <div className="max-w-6xl space-y-16 animate-in slide-in-from-bottom-8">
                  <header className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                      <h2 className="text-6xl font-black tracking-tighter text-stone-900 leading-none">Branding & Assets</h2>
                      <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">Control site-wide identity for {branding.siteName}</p>
                    </div>
                  </header>
                  
                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
                    <div className="xl:col-span-2 space-y-12">
                      <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-12">
                        {/* Business Info */}
                        <div className="space-y-10">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-stone-900 text-white rounded-xl flex items-center justify-center shadow-lg"><Globe size={20}/></div>
                            <h3 className="text-2xl font-black text-stone-900">Identity Details</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-3">
                              <label className="label-cms">Business Display Name</label>
                              <div className="relative">
                                <input className="input-cms pl-14" value={branding.siteName} onChange={e => setBranding({...branding, siteName: e.target.value})} />
                                <Type className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <label className="label-cms">Admin Email (Public/Booking)</label>
                              <div className="relative">
                                <input className="input-cms pl-14" value={branding.adminEmail} onChange={e => setBranding({...branding, adminEmail: e.target.value})} />
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Logo Control Area */}
                        <div className="pt-12 border-t border-stone-50 space-y-10">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-green-800 text-white rounded-xl flex items-center justify-center shadow-lg"><Palette size={20}/></div>
                            <h3 className="text-2xl font-black text-stone-900">Primary Logo & Branding</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-4">
                              <label className="label-cms">Logo Accent Text</label>
                              <div className="relative">
                                <input className="input-cms pl-14 font-black italic text-green-800" value={branding.accentName} onChange={e => setBranding({...branding, accentName: e.target.value})} />
                                <Zap className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                              </div>
                            </div>
                            <div className="space-y-4">
                              <label className="label-cms">Custom Brand Image</label>
                              <div className="bg-stone-50 p-6 rounded-3xl border border-stone-100 flex flex-col sm:flex-row items-center gap-6 shadow-inner">
                                <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-xl border-4 border-white ring-1 ring-stone-200 shrink-0">
                                  {branding.logoUrl ? (
                                    <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                                  ) : (
                                    <Mountain className="text-stone-200 w-12 h-12" />
                                  )}
                                </div>
                                <div className="flex-1 w-full space-y-3">
                                  <input type="file" id="dashboard-logo-uploader" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                  <button onClick={() => document.getElementById('dashboard-logo-uploader')?.click()} className="w-full py-4 bg-stone-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl">
                                    <Upload size={16}/> Change Logo Image
                                  </button>
                                  {branding.logoUrl && (
                                    <button onClick={() => setBranding({...branding, logoUrl: ''})} className="w-full py-2 text-red-500 font-black text-[9px] uppercase tracking-widest hover:text-red-700 transition-colors flex items-center justify-center gap-2">
                                      <Trash2 size={12} /> Revert to Default Icon
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Hero Backdrop Section */}
                        <div className="pt-12 border-t border-stone-50 space-y-10">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500 text-white rounded-xl flex items-center justify-center shadow-lg"><ImageIcon size={20}/></div>
                            <h3 className="text-2xl font-black text-stone-900">Hero Landscape</h3>
                          </div>
                          <div className="space-y-6">
                            <div className="relative">
                              <input className="input-cms pl-14" value={branding.heroImageUrl} onChange={e => setBranding({...branding, heroImageUrl: e.target.value})} />
                              <Camera className="absolute left-5 top-1/2 -translate-y-1/2 text-stone-300" size={18} />
                            </div>
                            <button onClick={handleGenerateHero} disabled={isProcessing} className="w-full bg-green-800 text-white py-6 rounded-[2rem] flex items-center justify-center gap-3 hover:bg-green-900 transition-all active:scale-95 disabled:opacity-50 shadow-2xl shadow-green-900/20">
                              {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                              <span className="font-black text-xs uppercase tracking-[0.2em]">Generate High-Country Backdrop</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-8">
                      <div className="bg-stone-900 p-12 rounded-[4rem] shadow-2xl border border-white/5 text-white sticky top-12">
                        <header className="flex items-center gap-3 mb-10 pb-8 border-b border-white/5">
                          <Eye size={20} className="text-green-500" />
                          <h3 className="text-2xl font-black tracking-tight leading-none">Real-time Preview</h3>
                        </header>
                        <div className="space-y-12">
                          <div className="space-y-4"><label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 block">Header Context</label><div className="bg-white p-8 rounded-3xl border border-white/10 flex items-center justify-center shadow-inner"><Logo branding={branding} /></div></div>
                          <div className="space-y-4"><label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-500 block">Footer Context</label><div className="bg-stone-950 p-8 rounded-3xl border border-white/5 flex items-center justify-center shadow-inner"><Logo branding={branding} light /></div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other tabs fleet, gallery, bookings, billing implementation... */}
              {adminTab === 'fleet' && (
                <div className="space-y-16 animate-in slide-in-from-bottom-8">
                   <header className="flex justify-between items-end">
                    <div><h2 className="text-6xl font-black tracking-tighter text-stone-900 leading-none">The Herd</h2><p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">Manage active pack animal string</p></div>
                    {!editingLlama && <button onClick={() => setEditingLlama({ id: Date.now().toString(), name: 'New Llama', age: 4, personality: 'A fresh recruit to the mountain string.', maxLoad: 75, imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800', specialty: 'Backpacking' })} className="bg-green-800 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-green-900 transition-all active:scale-95"><Plus size={20}/> New Recruit</button>}
                  </header>
                  
                  {editingLlama ? (
                    <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 grid grid-cols-1 lg:grid-cols-2 gap-16">
                      <div className="space-y-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 block">Llama Identity</label>
                          <input 
                            type="text" 
                            value={editingLlama.name} 
                            onChange={e => setEditingLlama({...editingLlama, name: e.target.value})}
                            className="w-full bg-stone-50 border-none rounded-3xl p-6 text-2xl font-black tracking-tight focus:ring-2 focus:ring-green-800 outline-none"
                            placeholder="Name"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 block">Age (Years)</label>
                            <input 
                              type="number" 
                              value={editingLlama.age} 
                              onChange={e => setEditingLlama({...editingLlama, age: parseInt(e.target.value)})}
                              className="w-full bg-stone-50 border-none rounded-3xl p-6 text-xl font-black focus:ring-2 focus:ring-green-800 outline-none"
                            />
                          </div>
                          <div className="space-y-4">
                            <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 block">Max Load (Lbs)</label>
                            <input 
                              type="number" 
                              value={editingLlama.maxLoad} 
                              onChange={e => setEditingLlama({...editingLlama, maxLoad: parseInt(e.target.value)})}
                              className="w-full bg-stone-50 border-none rounded-3xl p-6 text-xl font-black focus:ring-2 focus:ring-green-800 outline-none"
                            />
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 block">Specialty</label>
                          <select 
                            value={editingLlama.specialty}
                            onChange={e => setEditingLlama({...editingLlama, specialty: e.target.value as any})}
                            className="w-full bg-stone-50 border-none rounded-3xl p-6 text-lg font-bold focus:ring-2 focus:ring-green-800 outline-none"
                          >
                            <option value="Backpacking">Backpacking</option>
                            <option value="Hunting">Hunting</option>
                            <option value="Lead Llama">Lead Llama</option>
                            <option value="Gentle Soul">Gentle Soul</option>
                          </select>
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 block">Personality Profile</label>
                          <textarea 
                            value={editingLlama.personality} 
                            onChange={e => setEditingLlama({...editingLlama, personality: e.target.value})}
                            className="w-full bg-stone-50 border-none rounded-3xl p-6 text-lg font-medium leading-relaxed focus:ring-2 focus:ring-green-800 outline-none h-40 resize-none"
                            placeholder="Describe their temperament..."
                          />
                        </div>
                        <div className="flex gap-4 pt-8">
                          <button onClick={() => saveLlama(editingLlama)} className="flex-1 bg-green-800 text-white py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-xl hover:bg-green-900 transition-all active:scale-95">Save Changes</button>
                          <button onClick={() => setEditingLlama(null)} className="flex-1 bg-stone-100 text-stone-900 py-6 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-stone-200 transition-all active:scale-95">Cancel</button>
                        </div>
                      </div>
                      <div className="space-y-10">
                        <div className="space-y-4">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 block">Profile Image</label>
                          <div className="relative group aspect-square rounded-[3rem] overflow-hidden bg-stone-100 border-4 border-stone-50 shadow-inner">
                            <img src={editingLlama.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer text-white gap-4">
                              <Upload size={48} />
                              <span className="font-black uppercase tracking-widest text-xs">Replace Photo</span>
                              <input type="file" accept="image/*" className="hidden" onChange={handleLlamaImageUpload} />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                      {llamas.map(l => (
                        <div key={l.id} className="bg-white p-8 rounded-[3rem] shadow-xl border border-stone-100 flex items-center gap-8 group hover:border-green-200 transition-all">
                          <div className="w-24 h-24 rounded-3xl overflow-hidden bg-stone-100 flex-shrink-0">
                            <img src={l.imageUrl} alt={l.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xl font-black tracking-tight truncate">{l.name}</h4>
                            <p className="text-stone-400 text-[10px] font-bold uppercase tracking-widest mt-1">{l.specialty}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => setEditingLlama(l)} className="p-4 bg-stone-50 text-stone-400 rounded-2xl hover:bg-green-50 hover:text-green-800 transition-all"><Edit3 size={18}/></button>
                            <button onClick={() => deleteLlama(l.id)} className="p-4 bg-stone-50 text-stone-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all"><Trash2 size={18}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {adminTab === 'gallery' && (
                <div className="space-y-16 animate-in slide-in-from-bottom-8">
                  <header className="flex justify-between items-end">
                    <div>
                      <h2 className="text-6xl font-black tracking-tighter text-stone-900 leading-none">Expedition Journal</h2>
                      <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">Manage field notes and high-country imagery</p>
                    </div>
                    <div className="flex gap-4">
                      <input 
                        type="file" 
                        id="bulk-gallery-upload" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleGalleryUpload} 
                      />
                      <button 
                        onClick={() => document.getElementById('bulk-gallery-upload')?.click()} 
                        className="bg-green-800 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-2xl hover:bg-green-900 transition-all active:scale-95"
                      >
                        <Upload size={20}/> Bulk Upload
                      </button>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {gallery.map((img, idx) => (
                      <div key={idx} className="bg-white rounded-[3rem] overflow-hidden shadow-xl border border-stone-100 group">
                        <div className="aspect-video relative overflow-hidden">
                          <img src={img.url} alt={img.caption} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                            <button 
                              onClick={() => deleteGalleryItem(idx)}
                              className="w-12 h-12 bg-red-600 text-white rounded-2xl flex items-center justify-center shadow-xl hover:bg-red-700 transition-all"
                            >
                              <Trash2 size={20} />
                            </button>
                          </div>
                        </div>
                        <div className="p-8">
                          <label className="text-[10px] font-black uppercase tracking-[0.4em] text-stone-400 block mb-3">Field Note / Caption</label>
                          <textarea 
                            value={img.caption}
                            onChange={(e) => updateGalleryCaption(idx, e.target.value)}
                            className="w-full bg-stone-50 border-none rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-green-800 outline-none h-24 resize-none"
                            placeholder="Describe this moment..."
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {adminTab === 'bookings' && (
                <div className="space-y-12 animate-in slide-in-from-bottom-8">
                  <header className="flex justify-between items-end">
                    <div>
                      <h2 className="text-6xl font-black tracking-tighter text-stone-900 leading-none">Expedition Logs</h2>
                      <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">Review and manage incoming mission requests</p>
                    </div>
                  </header>

                  <div className="space-y-6">
                    {bookings.length === 0 ? (
                      <div className="bg-white p-24 rounded-[4rem] border border-stone-100 text-center">
                        <div className="w-20 h-20 bg-stone-50 text-stone-200 rounded-3xl flex items-center justify-center mx-auto mb-6">
                          <ClipboardList size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-stone-900 mb-2">No Requests Found</h3>
                        <p className="text-stone-400 font-medium">Your expedition queue is currently clear.</p>
                      </div>
                    ) : (
                      bookings.map((booking) => (
                        <div key={booking.id} className={`bg-white p-10 rounded-[3rem] shadow-xl border-2 transition-all ${!booking.isRead ? 'border-green-500/20 bg-green-50/5' : 'border-stone-100'}`}>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-12">
                            <div className="flex-1 space-y-8">
                              <div className="flex items-center gap-6">
                                <div className="w-16 h-16 bg-stone-900 text-white rounded-2xl flex items-center justify-center shadow-lg shrink-0">
                                  <User size={24} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-3 mb-1">
                                    <h4 className="text-2xl font-black tracking-tight">{booking.name}</h4>
                                    {!booking.isRead && <span className="px-3 py-1 bg-green-800 text-white text-[9px] font-black uppercase tracking-widest rounded-full">New</span>}
                                    {booking.status === 'confirmed' && <span className="px-3 py-1 bg-blue-100 text-blue-700 text-[9px] font-black uppercase tracking-widest rounded-full">Confirmed</span>}
                                    {booking.status === 'canceled' && <span className="px-3 py-1 bg-red-100 text-red-700 text-[9px] font-black uppercase tracking-widest rounded-full">Canceled</span>}
                                  </div>
                                  <div className="flex items-center gap-4 text-stone-400 font-bold text-xs">
                                    <span className="flex items-center gap-1.5"><Mail size={12}/> {booking.email}</span>
                                    <span className="flex items-center gap-1.5"><Phone size={12}/> {booking.phone}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-8 border-t border-stone-100">
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Expedition Window</p>
                                  <p className="font-bold text-stone-900 text-sm">{booking.startDate} to {booking.endDate}</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Fleet Size</p>
                                  <p className="font-bold text-stone-900 text-sm">{booking.numLlamas} Pack Animals</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Equipment</p>
                                  <p className="font-bold text-stone-900 text-sm">{booking.trailerNeeded ? 'Trailer' : 'No Trailer'} • {booking.isFirstTimer ? 'Clinic' : 'Pro'}</p>
                                </div>
                                <div className="space-y-2">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-stone-400">Timestamp</p>
                                  <p className="font-bold text-stone-900 text-sm">{new Date(booking.timestamp).toLocaleDateString()}</p>
                                </div>
                              </div>
                            </div>

                            <div className="flex lg:flex-col gap-3 shrink-0">
                              {booking.status === 'pending' && (
                                <>
                                  <button onClick={() => updateBooking(booking.id, 'confirm')} className="flex-1 lg:w-48 bg-green-800 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-900 transition-all shadow-lg flex items-center justify-center gap-2">
                                    <CheckCircle2 size={16}/> Confirm Trip
                                  </button>
                                  <button onClick={() => updateBooking(booking.id, 'cancel')} className="flex-1 lg:w-48 bg-stone-100 text-stone-600 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center justify-center gap-2">
                                    <XCircle size={16}/> Cancel Request
                                  </button>
                                </>
                              )}
                              <button onClick={() => updateBooking(booking.id, 'delete')} className="p-4 bg-stone-50 text-stone-400 rounded-2xl hover:bg-red-50 hover:text-red-600 transition-all">
                                <Trash2 size={20}/>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
              {/* ... billing, gallery etc ... */}
              {adminTab === 'billing' && (
                 <div className="max-w-4xl space-y-16 animate-in slide-in-from-bottom-8">
                  <header><h2 className="text-6xl font-black tracking-tighter text-stone-900 leading-none">Billing & API</h2><p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px] mt-6">Secure connection to Google AI services</p></header>
                  <div className="bg-white p-12 rounded-[4rem] shadow-2xl border border-stone-100 space-y-10">
                    <div className="flex items-center justify-between gap-12 bg-stone-50 p-10 rounded-[2.5rem] border border-stone-100">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full animate-pulse ${hasApiKey ? 'bg-green-500' : 'bg-orange-500'}`} />
                          <h4 className="text-2xl font-black tracking-tight">{hasApiKey ? 'API Connection Active' : 'API Setup Required'}</h4>
                        </div>
                        <p className="text-stone-500 text-sm font-medium leading-relaxed max-w-md">Required for high-res imagery and real-time conditions sync.</p>
                      </div>
                      <button onClick={handleSelectKey} className="bg-stone-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-xl hover:bg-black transition-all active:scale-95">
                        <Settings size={20}/> {hasApiKey ? 'Reconfigure Key' : 'Connect API Key'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      )}

      {/* Public Facing Website */}
      {!showDashboard && (
        <>
          <nav className="fixed w-full z-[100] bg-white/95 backdrop-blur-2xl border-b h-24 flex items-center shadow-sm">
            <div className="max-w-7xl mx-auto px-8 w-full flex justify-between items-center">
              <Logo branding={branding} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
              <div className="hidden md:flex items-center gap-12 font-black uppercase text-[11px] tracking-[0.2em]">
                {['Benefits', 'About', 'Gear', 'Gallery', 'FAQ', 'Contact'].map(item => (
                  <a key={item} href={`#${item.toLowerCase()}`} className="text-stone-500 hover:text-green-800 transition-all py-2 border-b-2 border-transparent hover:border-green-800">{item}</a>
                ))}
                <a href="#booking" className="bg-green-800 text-white px-10 py-5 rounded-2xl flex items-center gap-2 shadow-2xl shadow-green-900/20 hover:bg-green-900 transition-all active:scale-95">Book Trek <ChevronRight size={14} /></a>
              </div>
              <button className="md:hidden p-3 text-stone-900" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={28} /> : <Menu size={28} />}</button>
            </div>
          </nav>

          <div className={`fixed inset-0 z-[110] bg-stone-950 transition-all duration-700 md:hidden ${isMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            <div className="p-16 pt-32 flex flex-col h-full space-y-12">
              {['Benefits', 'About', 'Gear', 'Gallery', 'FAQ', 'Contact'].map(l => (
                <a key={l} href={`#${l.toLowerCase()}`} onClick={() => setIsMenuOpen(false)} className="text-6xl font-black text-white hover:text-green-400 transition-all tracking-tighter uppercase">{l}</a>
              ))}
              <a href="#booking" onClick={() => setIsMenuOpen(false)} className="bg-green-600 text-white py-12 rounded-[3rem] text-3xl font-black uppercase tracking-widest text-center shadow-2xl">Plan My Trek</a>
            </div>
          </div>

          <main>
            {/* Hero Section */}
            <section className="relative h-screen flex items-center justify-center text-center overflow-hidden">
              <div className="absolute inset-0 -z-10"><img src={branding.heroImageUrl} className="w-full h-full object-cover brightness-[0.4] scale-105 animate-in zoom-in duration-[10000ms]" alt="Landscape" /></div>
              <div className="max-w-5xl px-8 text-white">
                <h1 className="text-7xl md:text-9xl font-black mb-12 leading-[0.85] tracking-tighter animate-in slide-in-from-top-12 duration-1000">Master the Montana Peaks. <br /><span className="italic text-green-400 font-light font-display">Elite Strings for the High Country.</span></h1>
                <p className="text-2xl md:text-4xl text-stone-200 mb-20 max-w-4xl mx-auto font-medium leading-relaxed tracking-tight">{slogan}</p>
                <a href="#booking" className="bg-green-600 px-20 py-8 rounded-3xl text-3xl font-black shadow-2xl shadow-green-900/40 hover:bg-green-500 transition-all active:scale-95 inline-block">Secure Your String</a>
              </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-64 bg-white"><div className="max-w-7xl mx-auto px-8"><h2 className="text-8xl font-black mb-32 text-center tracking-tighter leading-none">Intelligence.</h2><div className="grid grid-cols-1 md:grid-cols-4 gap-16">{BENEFITS.map((b,i)=>(<div key={i} className="p-12 bg-stone-50 rounded-[4rem] border border-stone-100 hover:border-green-200 hover:bg-white transition-all group hover:shadow-2xl duration-500 text-center"><div className="mb-12 flex justify-center group-hover:scale-110 transition-transform duration-500 text-green-700">{b.icon}</div><h3 className="text-3xl font-black mb-6 tracking-tight leading-none">{b.title}</h3><p className="text-stone-500 font-medium leading-relaxed text-lg">{b.description}</p></div>))}</div></div></section>
            
            {/* The Herd Section */}
            <section id="about" className="py-64 bg-stone-100"><div className="max-w-7xl mx-auto px-8"><h2 className="text-8xl font-black mb-32 text-center tracking-tighter leading-none">The Herd.</h2><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">{llamas.map(l=><LlamaCard key={l.id} llama={l} />)}</div></div></section>
            
            {/* Gear Section */}
            <section id="gear" className="py-64 bg-white"><div className="max-w-7xl mx-auto px-8"><h2 className="text-8xl font-black mb-32 text-center tracking-tighter leading-none">Expedition Assets.</h2><GearSection /></div></section>
            
            {/* Packing List Section */}
            <section id="packing" className="py-64 bg-stone-50">
              <div className="max-w-7xl mx-auto px-8">
                <header className="text-center mb-24">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-green-700 mb-4">Precision Planning</h4>
                  <h2 className="text-8xl font-black tracking-tighter leading-none mb-8">Load Intel.</h2>
                  <p className="text-stone-500 text-xl font-medium max-w-2xl mx-auto">Generate a personalized mission gear list using our AI Trail Advisor.</p>
                </header>
                <PackingListGenerator />
              </div>
            </section>

            {/* Gallery Section */}
            <section id="gallery" className="py-64 bg-stone-950 text-white"><div className="max-w-7xl mx-auto px-8"><header className="flex flex-col md:flex-row justify-between items-end mb-32 gap-8"><h2 className="text-9xl font-black tracking-tighter leading-none">Journal.</h2><div className="bg-white/5 border border-white/10 px-12 py-6 rounded-full text-green-400 font-black uppercase tracking-widest text-xs">High Country Field Notes</div></header><PhotoCarousel images={gallery} /></div></section>
            
            {/* FAQ Section */}
            <section id="faq" className="py-64 bg-stone-50"><div className="max-w-7xl mx-auto px-8"><FAQSection /></div></section>
            
            {/* Booking Section */}
            <section id="booking" className="py-64 bg-white"><div className="max-w-5xl mx-auto px-8 text-center"><h2 className="text-8xl font-black mb-32 tracking-tighter leading-none">Logistics.</h2><BookingForm /></div></section>
            
            {/* Contact Section */}
            <section id="contact" className="py-64 bg-stone-50 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-32 opacity-[0.03] rotate-12 pointer-events-none">
                 <Mountain size={600} />
               </div>
               <div className="max-w-7xl mx-auto px-8 relative z-10">
                 <header className="text-center mb-24">
                   <h2 className="text-8xl font-black tracking-tighter leading-none mb-8">Base Camp.</h2>
                   <p className="text-stone-500 text-xl font-medium max-w-2xl mx-auto">Reach out to finalize your high country deployment intel.</p>
                 </header>
                 
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                   <div className="bg-white p-16 rounded-[4rem] border border-stone-100 shadow-xl group hover:shadow-2xl transition-all duration-500 text-left">
                     <div className="w-20 h-20 bg-green-50 text-green-800 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-green-800 group-hover:text-white transition-all shadow-lg">
                       <MapPin size={36} />
                     </div>
                     <h3 className="text-2xl font-black mb-4 tracking-tight">Deployment Point</h3>
                     <p className="text-stone-500 font-medium leading-relaxed mb-10">310 Lump Gulch Road<br />Clancy, MT 59634</p>
                     <a href="https://www.google.com/maps/search/310+Lump+Gulch+Road+Clancy,+MT+59634" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-green-800 font-black text-xs uppercase tracking-widest hover:gap-4 transition-all">
                       Get Bearings <ExternalLink size={14} />
                     </a>
                   </div>

                   <div className="bg-white p-16 rounded-[4rem] border border-stone-100 shadow-xl group hover:shadow-2xl transition-all duration-500 text-left">
                     <div className="w-20 h-20 bg-green-50 text-green-800 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-green-800 group-hover:text-white transition-all shadow-lg">
                       <Phone size={36} />
                     </div>
                     <h3 className="text-2xl font-black mb-4 tracking-tight">Direct Line</h3>
                     <p className="text-stone-500 font-medium leading-relaxed mb-10">Available for trail updates and technical kit support.</p>
                     <a href="tel:8013720353" className="text-3xl font-black text-stone-900 hover:text-green-800 transition-colors">801-372-0353</a>
                   </div>

                   <div className="bg-white p-16 rounded-[4rem] border border-stone-100 shadow-xl group hover:shadow-2xl transition-all duration-500 text-left">
                     <div className="w-20 h-20 bg-green-50 text-green-800 rounded-3xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-green-800 group-hover:text-white transition-all shadow-lg">
                       <Mail size={36} />
                     </div>
                     <h3 className="text-2xl font-black mb-4 tracking-tight">Dispatch</h3>
                     <p className="text-stone-500 font-medium leading-relaxed mb-10">Send over your itinerary or custom hunt requests.</p>
                     <a href="mailto:kevin.paul.brown@gmail.com" className="font-black text-stone-900 border-b-4 border-green-800/20 hover:border-green-800 transition-all py-1">kevin.paul.brown@gmail.com</a>
                   </div>
                 </div>
               </div>
            </section>
          </main>

          {/* Footer */}
          <footer className="bg-stone-950 text-stone-500 pt-48 pb-24 border-t border-white/5 relative">
            <div className="max-w-7xl mx-auto px-8">
              <div className="mb-24 p-12 bg-white/5 rounded-[3rem] border border-white/10 flex flex-col md:flex-row items-center gap-8 group transition-all hover:bg-white/[0.08] hover:border-green-500/30">
                <div className="w-16 h-16 bg-green-800/20 text-green-400 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-green-900/20">
                  <Sparkles size={24} className="animate-float" />
                </div>
                <div className="flex-1 text-left">
                  <h5 className="text-[10px] font-black uppercase tracking-[0.4em] text-green-500 mb-2">Llama Fact of the Day</h5>
                  <p className="text-stone-300 text-lg md:text-xl font-medium italic leading-relaxed">"{dailyFact}"</p>
                </div>
                <div className="hidden lg:block">
                   <Mountain size={48} className="text-white/5" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-24 mb-32 text-left">
                <div className="space-y-10 max-w-xl">
                  <Logo branding={branding} light onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} />
                  <p className="text-stone-500 font-medium leading-relaxed text-lg">Providing elite mountain-trained pack strings for adventures since 2018. We specialize in low-impact, high-efficiency wilderness logistics across the Montana Rockies.</p>
                  <div className="space-y-2 pt-4">
                    <p className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><MapPin size={14} className="text-green-500"/> 310 Lump Gulch Road, Clancy, MT 59634</p>
                    <p className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><Phone size={14} className="text-green-500"/> 801-372-0353</p>
                    <p className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2"><Mail size={14} className="text-green-500"/> {branding.adminEmail}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-24">
                  <div className="space-y-8"><h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Exploration</h4><ul className="space-y-4 text-xs font-bold uppercase tracking-widest"><li><a href="#conditions" className="hover:text-green-500 transition-colors">Conditions</a></li><li><a href="#benefits" className="hover:text-green-500 transition-colors">Benefits</a></li><li><a href="#about" className="hover:text-green-500 transition-colors">The Herd</a></li></ul></div>
                  <div className="space-y-8"><h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-white">Intel</h4><ul className="space-y-4 text-xs font-bold uppercase tracking-widest"><li><a href="#faq" className="hover:text-green-500 transition-colors">Field Manual</a></li><li><a href="#booking" className="hover:text-green-500 transition-colors">Deployment</a></li><li><a href="#contact" className="hover:text-green-500 transition-colors">Base Camp</a></li></ul></div>
                </div>
              </div>
              <div className="pt-24 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-12 text-[10px] font-black uppercase tracking-[0.5em]">
                <p>© {new Date().getFullYear()} {branding.siteName}</p>
                <div className="flex gap-12 text-stone-800"><span>Helena, MT</span><span>46.5891° N, 112.0391° W</span></div>
              </div>
            </div>
          </footer>
        </>
      )}

      {/* Global Processing Loader */}
      {isProcessing && (
        <div className="fixed inset-0 z-[500] bg-stone-950/80 backdrop-blur-3xl flex items-center justify-center">
          <div className="bg-white px-20 py-24 rounded-[5rem] shadow-2xl flex flex-col items-center gap-12 animate-in zoom-in w-full max-w-lg mx-6 text-center">
             <div className="w-24 h-24 bg-green-800 text-white rounded-[2.5rem] flex items-center justify-center shadow-2xl animate-bounce"><Zap size={48} /></div>
             <div>
               <h3 className="text-4xl font-black text-stone-900 mb-4 tracking-tighter">
                 {uploadStatus ? "Syncing Terrain Assets" : "Optimizing Visuals"}
               </h3>
               {uploadStatus ? (
                 <div className="space-y-6">
                    <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px]">Deploying Entry {uploadStatus.current} of {uploadStatus.total}</p>
                    <div className="w-full bg-stone-100 h-3 rounded-full overflow-hidden shadow-inner ring-1 ring-stone-200"><div className="h-full bg-green-800 transition-all duration-500" style={{ width: `${(uploadStatus.current / uploadStatus.total) * 100}%` }} /></div>
                 </div>
               ) : <p className="text-stone-400 font-bold uppercase tracking-[0.4em] text-[10px]">Polishing High-Res Expedition Intel...</p>}
             </div>
             <Loader2 className="w-12 h-12 text-green-800 animate-spin mt-4" />
          </div>
        </div>
      )}

      <style>{`
        .label-cms { display: block; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #a8a29e; margin-bottom: 0.75rem; letter-spacing: 0.3em; }
        .input-cms { width: 100%; background-color: #fafaf9; border: 1px solid #f5f5f4; padding: 1.5rem; border-radius: 1.5rem; font-weight: 700; outline: none; transition: all 0.2s; color: #1c1917; }
        .input-cms:focus { background-color: white; border-color: #166534; box-shadow: 0 0 0 6px rgba(22, 101, 52, 0.05); }
      `}</style>
    </div>
  );
};

export default App;
