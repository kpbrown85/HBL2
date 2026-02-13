
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
  ExternalLink,
  GraduationCap,
  Users,
  Camera
} from 'lucide-react';

const App: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [slogan, setSlogan] = useState("Helena’s premier mountain-trained pack string.");
  const [adviceQuery, setAdviceQuery] = useState("");
  const [adviceResponse, setAdviceResponse] = useState("");
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  
  // Admin State
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [adminTab, setAdminTab] = useState<'branding' | 'gallery' | 'bookings' | 'fleet'>('branding');
  const [passwordInput, setPasswordInput] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Branding State
  const defaultBranding = {
    siteName: "Helena Backcountry Llamas",
    accentName: "Llamas",
    logoType: 'icon' as 'icon' | 'image',
    logoUrl: "",
    heroImageUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=2400",
    guideImageUrl: "https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800"
  };

  const [branding, setBranding] = useState(() => {
    const saved = localStorage.getItem('hbl_branding');
    return saved ? JSON.parse(saved) : defaultBranding;
  });

  // Fleet Management State
  const [llamas, setLlamas] = useState<Llama[]>(() => {
    const saved = localStorage.getItem('hbl_llamas');
    return saved ? JSON.parse(saved) : LLAMAS;
  });

  // Gallery Management
  const [gallery, setGallery] = useState<GalleryImage[]>(() => {
    const saved = localStorage.getItem('hbl_gallery');
    return saved ? JSON.parse(saved) : GALLERY_IMAGES;
  });
  
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  
  // Reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  
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

  useEffect(() => {
    localStorage.setItem('hbl_gallery', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem('hbl_branding', JSON.stringify(branding));
    document.title = branding.siteName;
  }, [branding]);

  useEffect(() => {
    localStorage.setItem('hbl_llamas', JSON.stringify(llamas));
  }, [llamas]);

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
      className="text-sm font-bold text-stone-600 hover:text-green-800 transition-colors uppercase tracking-widest block md:inline"
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

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'hero' | 'guide' | 'llama') => {
    const file = e.target.files?.[0];
    if (file && isAdmin) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        if (target === 'logo') setBranding({ ...branding, logoUrl: result, logoType: 'image' });
        if (target === 'hero') setBranding({ ...branding, heroImageUrl: result });
        if (target === 'guide') setBranding({ ...branding, guideImageUrl: result });
        if (target === 'llama' && activeLlamaEdit) {
          setLlamas(llamas.map(l => l.id === activeLlamaEdit ? { ...l, imageUrl: result } : l));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && isAdmin) {
      const readers = Array.from(files).map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
      });
      
      Promise.all(readers).then(results => {
        setLocalPreviews(prev => [...prev, ...results]);
      });
    }
  };

  const handleConfirmUpload = async () => {
    if (localPreviews.length === 0 || !isAdmin) return;
    setIsUploadingFile(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const newImages: GalleryImage[] = localPreviews.map(url => ({
      url,
      caption: `Bulk Upload ${new Date().toLocaleDateString()}`
    }));
    setGallery([...newImages, ...gallery]);
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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (index: number) => {
    if (draggedIndex === null || !isAdmin) return;
    const items = [...gallery];
    const [reorderedItem] = items.splice(draggedIndex, 1);
    items.splice(index, 0, reorderedItem);
    setGallery(items);
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const copyConfig = (data: any) => {
    const configString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(configString).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    });
  };

  const resetBranding = () => {
    if (confirm("Restore original brand identity?")) {
      setBranding(defaultBranding);
    }
  };

  const Logo = ({ light = false }: { light?: boolean }) => {
    const siteTitle = branding.siteName;
    const accent = branding.accentName;
    const parts = siteTitle.split(accent);
    
    return (
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
        {branding.logoType === 'icon' ? (
          <div className={`w-10 h-10 ${light ? 'bg-white text-green-800' : 'bg-green-800 text-white'} rounded-lg flex items-center justify-center shadow-lg`}>
            <Mountain className="w-6 h-6" />
          </div>
        ) : (
          <div className="w-10 h-10 rounded-lg overflow-hidden shadow-lg border border-stone-100 bg-white flex items-center justify-center">
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <ImageIcon className="text-stone-300 w-5 h-5" />
            )}
          </div>
        )}
        <span className={`text-xl font-bold tracking-tight ${light ? 'text-white' : 'text-stone-900'}`}>
          {parts[0]}
          {accent && <span className={`${light ? 'text-green-400' : 'text-green-800'} italic`}>{accent}</span>}
          {parts[1]}
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-3xl font-black text-stone-900">Admin Login</h3>
              <button onClick={() => setShowAdminLogin(false)} className="p-2 hover:bg-stone-100 rounded-full">
                <X />
              </button>
            </div>
            <form onSubmit={handleAdminLogin} className="space-y-6">
              <div>
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
              <button type="submit" className="w-full bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-900 shadow-xl">
                <LogIn className="w-5 h-5" /> Access Management
              </button>
            </form>
          </div>
        </div>
      )}

      {/* COMPREHENSIVE ADMIN DASHBOARD OVERLAY */}
      {showDashboard && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-stone-100/60 backdrop-blur-xl flex items-center justify-center p-0 md:p-8 animate-in fade-in duration-300">
          <div className="bg-white w-full h-full md:rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden border border-white relative">
            
            {/* Sidebar / Topbar Container */}
            <div className="flex flex-col md:flex-row h-full">
              
              {/* Sidebar */}
              <aside className="w-full md:w-80 bg-stone-900 text-white p-8 flex flex-col justify-between shrink-0">
                <div>
                  <div className="flex items-center gap-3 mb-12">
                    <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-stone-900">
                      <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-xl tracking-tight leading-none">Management</h3>
                      <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest mt-1">Admin Console</p>
                    </div>
                  </div>

                  <nav className="space-y-2">
                    <button 
                      onClick={() => setAdminTab('branding')}
                      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${adminTab === 'branding' ? 'bg-white text-stone-900 shadow-xl shadow-black/20' : 'text-stone-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Palette className="w-5 h-5" /> Brand Identity
                    </button>
                    <button 
                      onClick={() => setAdminTab('fleet')}
                      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${adminTab === 'fleet' ? 'bg-white text-stone-900 shadow-xl shadow-black/20' : 'text-stone-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Users className="w-5 h-5" /> Herd Profiles
                    </button>
                    <button 
                      onClick={() => setAdminTab('gallery')}
                      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${adminTab === 'gallery' ? 'bg-white text-stone-900 shadow-xl shadow-black/20' : 'text-stone-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <ImageIcon className="w-5 h-5" /> Media Gallery
                    </button>
                    <button 
                      onClick={() => setAdminTab('bookings')}
                      className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${adminTab === 'bookings' ? 'bg-white text-stone-900 shadow-xl shadow-black/20' : 'text-stone-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <ClipboardList className="w-5 h-5" /> Fleet Bookings
                    </button>
                  </nav>
                </div>

                <div className="space-y-4">
                  <button 
                    onClick={() => setShowDashboard(false)}
                    className="w-full bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-white/5"
                  >
                    <Eye className="w-4 h-4" /> Exit Dashboard
                  </button>
                  <button 
                    onClick={() => setIsAdmin(false)}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 px-6 py-4 rounded-2xl font-bold text-sm transition-all border border-red-500/10"
                  >
                    Sign Out
                  </button>
                </div>
              </aside>

              {/* Main Dashboard Content */}
              <main className="flex-1 overflow-y-auto p-6 md:p-12 lg:p-16">
                
                {/* BRANDING TAB */}
                {adminTab === 'branding' && (
                  <div className="max-w-4xl mx-auto space-y-12 animate-in slide-in-from-right-4 duration-500">
                    <header className="flex justify-between items-end border-b border-stone-100 pb-10">
                      <div>
                        <h2 className="text-4xl font-black text-stone-900 mb-2 text-left">Visual Identity</h2>
                        <p className="text-stone-500 font-medium text-left">Define your company's aesthetic presence across the platform.</p>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={resetBranding} className="p-3 hover:bg-stone-100 rounded-full text-stone-400" title="Reset to Defaults">
                          <RefreshCcw className="w-6 h-6" />
                        </button>
                      </div>
                    </header>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                      <div className="space-y-10 text-left">
                        <div className="space-y-6">
                          <div>
                            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Display Name</label>
                            <input 
                              type="text"
                              className="w-full bg-stone-50 border border-stone-200 px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-green-700/5 focus:border-green-800 transition-all font-bold"
                              value={branding.siteName}
                              onChange={(e) => setBranding({...branding, siteName: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Accent Word (Styled)</label>
                            <input 
                              type="text"
                              className="w-full bg-stone-50 border border-stone-200 px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-green-700/5 focus:border-green-800 transition-all font-bold italic text-green-700"
                              value={branding.accentName}
                              onChange={(e) => setBranding({...branding, accentName: e.target.value})}
                            />
                          </div>
                        </div>

                        <div className="space-y-6">
                          <h4 className="text-xs font-black uppercase tracking-widest text-stone-900 border-b border-stone-100 pb-2">Primary Section Images</h4>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                               <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">Hero Backdrop</label>
                               <button onClick={() => heroInputRef.current?.click()} className="w-full aspect-video bg-stone-100 rounded-xl overflow-hidden border-2 border-dashed border-stone-200 flex items-center justify-center group">
                                 {branding.heroImageUrl ? <img src={branding.heroImageUrl} className="w-full h-full object-cover" /> : <Camera className="text-stone-300" />}
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Upload className="text-white" /></div>
                               </button>
                               <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, 'hero')} />
                            </div>
                            <div className="space-y-2">
                               <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">Guide Sidebar</label>
                               <button onClick={() => guideInputRef.current?.click()} className="w-full aspect-video bg-stone-100 rounded-xl overflow-hidden border-2 border-dashed border-stone-200 flex items-center justify-center group">
                                 {branding.guideImageUrl ? <img src={branding.guideImageUrl} className="w-full h-full object-cover" /> : <Camera className="text-stone-300" />}
                                 <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Upload className="text-white" /></div>
                               </button>
                               <input type="file" ref={guideInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, 'guide')} />
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest">Logo Configuration</label>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => setBranding({...branding, logoType: 'icon'})}
                              className={`flex-1 py-4 px-6 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${branding.logoType === 'icon' ? 'border-green-800 bg-green-50 text-green-900' : 'border-stone-100 text-stone-400'}`}
                            >
                              <Mountain className="w-6 h-6" /> Preset Icon
                            </button>
                            <button 
                              onClick={() => logoInputRef.current?.click()}
                              className={`flex-1 py-4 px-6 rounded-2xl border-2 font-bold flex flex-col items-center gap-2 transition-all ${branding.logoType === 'image' ? 'border-green-800 bg-green-50 text-green-900' : 'border-stone-100 text-stone-400'}`}
                            >
                              <Upload className="w-6 h-6" /> Custom Mark
                            </button>
                            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageFileChange(e, 'logo')} />
                          </div>
                        </div>

                        <button 
                          onClick={() => copyConfig(branding)}
                          className="w-full bg-stone-900 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-xl active:scale-95"
                        >
                          {copySuccess ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                          {copySuccess ? "Config Copied" : "Export Theme JSON"}
                        </button>
                      </div>

                      <div className="bg-stone-50 rounded-[3rem] p-10 border border-stone-100 flex flex-col items-center justify-center space-y-8">
                        <p className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Live Header Preview</p>
                        <div className="bg-white px-10 py-6 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100">
                          <Logo />
                        </div>
                        <div className="bg-stone-900 px-10 py-6 rounded-2xl shadow-xl border border-stone-800">
                          <Logo light />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* FLEET TAB */}
                {adminTab === 'fleet' && (
                  <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right-4 duration-500">
                    <header className="flex justify-between items-end border-b border-stone-100 pb-10">
                      <div className="text-left">
                        <h2 className="text-4xl font-black text-stone-900 mb-2">Herd Profiles</h2>
                        <p className="text-stone-500 font-medium">Manage individual llama stats, personalities, and portraits.</p>
                      </div>
                      <button 
                        onClick={() => {
                          const newLlama: Llama = {
                            id: Date.now().toString(),
                            name: 'New Llama',
                            age: 5,
                            personality: 'Describe their personality...',
                            maxLoad: 70,
                            imageUrl: 'https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800',
                            specialty: 'Backpacking'
                          };
                          setLlamas([...llamas, newLlama]);
                        }}
                        className="bg-green-800 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2"
                      >
                        <Plus className="w-5 h-5" /> Add Llama
                      </button>
                    </header>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {llamas.map((llama) => (
                        <div key={llama.id} className="bg-white border border-stone-100 rounded-[2.5rem] p-8 flex gap-8 shadow-sm hover:shadow-md transition-shadow group text-left">
                          <div className="w-40 h-40 rounded-[2rem] overflow-hidden bg-stone-100 shrink-0 relative">
                            <img src={llama.imageUrl} className="w-full h-full object-cover" />
                            <button 
                              onClick={() => {
                                setActiveLlamaEdit(llama.id);
                                llamaPhotoInputRef.current?.click();
                              }}
                              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                            >
                              <Camera className="w-8 h-8" />
                            </button>
                          </div>
                          <div className="flex-1 space-y-4">
                            <div className="flex justify-between items-start">
                              <input 
                                className="text-2xl font-black text-stone-900 outline-none w-full bg-transparent focus:bg-stone-50 rounded px-2"
                                value={llama.name}
                                onChange={(e) => setLlamas(llamas.map(l => l.id === llama.id ? {...l, name: e.target.value} : l))}
                              />
                              <button 
                                onClick={() => setLlamas(llamas.filter(l => l.id !== llama.id))}
                                className="text-stone-300 hover:text-red-500 transition-colors p-2"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-black uppercase text-stone-400">Specialty</label>
                                <select 
                                  className="w-full bg-stone-50 border border-stone-100 rounded-lg p-2 text-sm font-bold"
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
                                <label className="text-[10px] font-black uppercase text-stone-400">Max Load (lbs)</label>
                                <input 
                                  type="number"
                                  className="w-full bg-stone-50 border border-stone-100 rounded-lg p-2 text-sm font-bold"
                                  value={llama.maxLoad}
                                  onChange={(e) => setLlamas(llamas.map(l => l.id === llama.id ? {...l, maxLoad: parseInt(e.target.value)} : l))}
                                />
                              </div>
                            </div>
                            <textarea 
                              className="w-full bg-stone-50 border border-stone-100 rounded-lg p-3 text-xs font-medium resize-none h-20"
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

                {/* GALLERY TAB */}
                {adminTab === 'gallery' && (
                  <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right-4 duration-500">
                    <header className="flex flex-col md:flex-row md:items-end justify-between border-b border-stone-100 pb-10 gap-6">
                      <div className="text-left">
                        <h2 className="text-4xl font-black text-stone-900 mb-2">Media Assets</h2>
                        <p className="text-stone-500 font-medium">Manage the visual storytelling of your backcountry routes.</p>
                      </div>
                      <div className="flex gap-4">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="bg-stone-900 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 shadow-xl"
                        >
                          <Upload className="w-5 h-5" /> Bulk Upload
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileSelect} />
                      </div>
                    </header>

                    {/* AI Generation Mini-tool */}
                    <div className="bg-green-50 p-8 rounded-[2.5rem] border border-green-100 flex flex-col md:flex-row items-center gap-8">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-green-700 shadow-sm shrink-0">
                        <Sparkles className="w-8 h-8" />
                      </div>
                      <div className="flex-1 space-y-1 text-center md:text-left">
                        <h4 className="font-black text-green-900">AI Background Generator</h4>
                        <p className="text-green-800/60 text-sm">Need a specific Montana landscape? Generate one instantly.</p>
                      </div>
                      <div className="flex w-full md:w-auto gap-3">
                        <input 
                          type="text"
                          placeholder="Glacial lake with granite peaks..."
                          className="flex-1 md:w-64 bg-white border border-green-200 px-6 py-4 rounded-xl outline-none focus:ring-4 focus:ring-green-700/5"
                          value={aiPrompt}
                          onChange={(e) => setAiPrompt(e.target.value)}
                        />
                        <button 
                          disabled={!aiPrompt || isGenerating}
                          onClick={handleAiGenerate}
                          className="bg-green-800 text-white px-6 py-4 rounded-xl font-bold disabled:opacity-50"
                        >
                          {isGenerating ? <Loader2 className="animate-spin" /> : "Generate"}
                        </button>
                      </div>
                    </div>

                    {/* Active Gallery Grid */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-[0.3em] text-stone-400">Current Fleet Assets</h4>
                        <button onClick={() => copyConfig(gallery)} className="text-[10px] font-black uppercase text-stone-400 hover:text-stone-900 transition-all flex items-center gap-2">
                          <Copy className="w-3 h-3" /> Export Gallery State
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {gallery.map((img, i) => (
                          <div 
                            key={i}
                            draggable
                            onDragStart={() => handleDragStart(i)}
                            onDragOver={(e) => handleDragOver(e, i)}
                            onDragLeave={handleDragLeave}
                            onDrop={() => handleDrop(i)}
                            className={`aspect-square rounded-3xl overflow-hidden bg-stone-100 relative group cursor-grab active:cursor-grabbing transition-all duration-300
                              ${draggedIndex === i ? 'opacity-20 scale-90' : 'opacity-100'}
                              ${dropTargetIndex === i ? 'ring-4 ring-green-600 ring-offset-4 ring-offset-white scale-105' : ''}`}
                          >
                            <img src={img.url} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-stone-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                              <button onClick={() => handleDeleteImage(i)} className="bg-red-500 text-white p-3 rounded-full hover:scale-110 transition-transform">
                                <Trash2 className="w-5 h-5" />
                              </button>
                              <div className="bg-white/20 backdrop-blur-md p-3 rounded-full text-white cursor-grab">
                                <GripVertical className="w-5 h-5" />
                              </div>
                            </div>
                            <div className="absolute bottom-4 left-4 right-4 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/20">
                              <p className="text-[10px] font-bold text-white truncate">{img.caption}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* BOOKINGS TAB (MOCK) */}
                {adminTab === 'bookings' && (
                  <div className="max-w-5xl mx-auto space-y-12 animate-in slide-in-from-right-4 duration-500">
                    <header className="border-b border-stone-100 pb-10 text-left">
                      <h2 className="text-4xl font-black text-stone-900 mb-2">Fleet Bookings</h2>
                      <p className="text-stone-500 font-medium">Review and confirm upcoming backcountry expeditions.</p>
                    </header>

                    <div className="bg-white rounded-[3rem] border border-stone-100 shadow-xl overflow-hidden">
                      <table className="w-full text-left">
                        <thead className="bg-stone-50 border-b border-stone-100">
                          <tr>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Client</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Dates</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Llamas</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-stone-400"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-stone-50">
                          {[
                            { name: 'Sarah Miller', date: 'Aug 12 - 18', count: 4, status: 'Confirmed', email: 'sarah@example.com' },
                            { name: 'Tom Hudson', date: 'Sep 05 - 12', count: 2, status: 'Pending', email: 'tom@hudson.co' },
                            { name: 'Gravel Expeditions', date: 'Oct 01 - 10', count: 8, status: 'Clinic Required', email: 'ops@gravel.com' },
                          ].map((item, i) => (
                            <tr key={i} className="hover:bg-stone-50/50 transition-colors group">
                              <td className="px-8 py-8">
                                <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 bg-stone-100 rounded-xl flex items-center justify-center text-stone-400 font-bold group-hover:bg-green-100 group-hover:text-green-700 transition-colors">
                                    {item.name[0]}
                                  </div>
                                  <div>
                                    <p className="font-bold text-stone-900 leading-none">{item.name}</p>
                                    <p className="text-xs text-stone-400 mt-1">{item.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-8 font-medium text-stone-600">{item.date}</td>
                              <td className="px-8 py-8">
                                <span className="bg-stone-100 px-3 py-1 rounded-lg text-xs font-black text-stone-600">
                                  {item.count} Units
                                </span>
                              </td>
                              <td className="px-8 py-8">
                                <div className={`flex items-center gap-2 text-xs font-bold ${item.status === 'Confirmed' ? 'text-green-600' : item.status === 'Pending' ? 'text-amber-500' : 'text-blue-500'}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'Confirmed' ? 'bg-green-600' : item.status === 'Pending' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                  {item.status}
                                </div>
                              </td>
                              <td className="px-8 py-8 text-right">
                                <button className="p-2 hover:bg-white rounded-lg text-stone-300 hover:text-stone-900 border border-transparent hover:border-stone-200 transition-all">
                                  <ArrowUpRight className="w-5 h-5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </main>
            </div>
          </div>
        </div>
      )}

      {/* Main UI */}
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
              <a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="bg-green-800 text-white px-7 py-3 rounded-full font-bold hover:bg-green-900 transition-all flex items-center gap-2 shadow-lg shadow-green-800/30 active:scale-95">
                Book Your Trek <ChevronRight className="w-4 h-4" />
              </a>
            </div>
            <button className="md:hidden p-2 hover:bg-stone-100 rounded-lg" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden text-left md:text-center">
        <div className="absolute inset-0 z-0">
          <img src={branding.heroImageUrl} alt="Montana Peaks" className="w-full h-full object-cover brightness-[0.4] scale-105" />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900/80"></div>
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-[1.1]">Elevate the Trek. <br /><span className="italic text-green-400 font-light">Unload the Journey.</span></h1>
          <p className="text-xl md:text-2xl text-stone-200 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">{slogan}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-12 py-5 rounded-full text-lg font-black transition-all shadow-2xl shadow-green-900/40 active:scale-95">Plan Your Adventure</a>
            <a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 text-white px-12 py-5 rounded-full text-lg font-bold transition-all">Meet the Crew</a>
          </div>
        </div>
      </section>

      {/* Admin Quick Bar */}
      {isAdmin && (
        <div className="bg-green-900 text-white py-3 px-4 flex flex-wrap items-center justify-center gap-6 sticky top-20 z-40 shadow-xl border-b border-green-800 animate-in slide-in-from-top duration-500">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 text-left"><Unlock className="w-3 h-3" /> Management Mode Active</span>
          <button 
            onClick={() => {
              setAdminTab('branding');
              setShowDashboard(true);
            }} 
            className="flex items-center gap-2 bg-white text-stone-900 hover:bg-stone-100 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
          >
            <LayoutDashboard className="w-3 h-3" /> Open Management Console
          </button>
          <div className="h-4 w-px bg-white/20" />
          <button onClick={() => setIsAdmin(false)} className="text-[10px] font-black uppercase text-white/60 hover:text-white transition-all">
            Exit Admin
          </button>
        </div>
      )}

      {/* Main Sections */}
      <section id="benefits" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-6">Built for the Backcountry</h2>
            <div className="w-24 h-2 bg-green-800 mx-auto rounded-full mb-8"></div>
            <p className="text-stone-500 max-w-2xl mx-auto text-xl leading-relaxed">Llamas possess a unique physiological advantage that makes them the gold standard for high-altitude trekking and hunting.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS.map((benefit, idx) => (
              <div key={idx} className="p-10 rounded-[2.5rem] bg-stone-50 border border-stone-100 hover:shadow-2xl transition-all group hover:-translate-y-2 text-left">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-8 group-hover:bg-green-800 transition-all duration-500">
                  <div className="group-hover:text-white transition-colors duration-500">{benefit.icon}</div>
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-4">{benefit.title}</h3>
                <p className="text-stone-600 leading-relaxed text-lg">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="py-32 bg-stone-100/50 backdrop-blur-sm relative overflow-hidden text-left">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-6 tracking-tight">Meet the Professionals</h2>
              <p className="text-stone-600 text-xl leading-relaxed">Our herd is meticulously trained for the variable conditions of the Northern Rockies.</p>
            </div>
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-8 text-left">
            <div>
              <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight">Wilderness Journal</h2>
              <div className="flex items-center gap-4">
                <p className="text-stone-400 text-xl max-w-xl">A glimpse into our most recent expedition routes.</p>
              </div>
            </div>
            {isAdmin && (
              <button onClick={() => setShowDashboard(true)} className="bg-green-800 hover:bg-green-700 px-8 py-4 rounded-full font-bold shadow-xl flex items-center gap-2 transition-all active:scale-95">
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
                    <div>
                      <p className="text-lg font-bold text-white mb-2">{img.caption}</p>
                      <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-2">
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

      <section id="reviews" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-5xl md:text-7xl font-black text-stone-900 mb-8">Voices from the Path</h2>
          </div>
          <Testimonials />
        </div>
      </section>

      <section className="py-32 bg-green-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl relative overflow-hidden text-left">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-700 to-green-900"></div>
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 text-green-800 bg-green-100 px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8"><MessageCircle className="w-4 h-4" /> Herd Wisdom</div>
                <h2 className="text-5xl font-black text-stone-900 mb-8">Ask Our Head Guide</h2>
                <form onSubmit={handleAdviceSubmit} className="relative mb-8 group">
                  <input type="text" placeholder="e.g. Best weight distribution?" className="w-full bg-stone-50 border-2 border-stone-100 px-8 py-6 rounded-[2rem] outline-none focus:border-green-300 transition-all" value={adviceQuery} onChange={(e) => setAdviceQuery(e.target.value)} />
                  <button disabled={isAdviceLoading} className="absolute right-3 top-3 bottom-3 bg-green-800 text-white px-10 rounded-[1.5rem] font-bold active:scale-95 disabled:opacity-50">
                    {isAdviceLoading ? <Loader2 className="animate-spin" /> : <ArrowRight />}
                  </button>
                </form>
                {adviceResponse && <div className="p-8 bg-green-50 rounded-[2rem] border-2 border-green-100/50 animate-in slide-in-from-bottom-4"><p className="text-green-900 italic font-bold leading-relaxed">"{adviceResponse}"</p></div>}
              </div>
              <div className="w-full md:w-2/5 aspect-[4/5] rounded-[3rem] overflow-hidden bg-stone-100 shadow-2xl">
                <img src={branding.guideImageUrl} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="py-32 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-20">Frequently Asked</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-stone-50 rounded-[2.5rem] p-10 border border-stone-100 hover:border-green-100 transition-colors group">
                <h3 className="text-2xl font-bold text-stone-900 mb-6 flex items-start gap-4 transition-colors group-hover:text-green-800"><span className="w-8 h-8 rounded-full bg-green-800 text-white flex-shrink-0 flex items-center justify-center text-xs">?</span>{faq.question}</h3>
                <p className="text-stone-600 pl-12 leading-relaxed">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="booking" className="py-32 bg-stone-50 relative overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 text-stone-500 mb-6 text-sm font-black uppercase tracking-[0.3em]"><CalendarDays className="w-5 h-5" /> Mission Control</div>
          <h2 className="text-5xl md:text-7xl font-black text-stone-900 mb-20">Ready to Gear Up?</h2>
          <BookingForm />
        </div>
      </section>

      <footer className="bg-stone-950 text-stone-500 py-32 relative text-left">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 border-b border-stone-800 pb-20 mb-20">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-3 mb-10">
                <Logo light />
              </div>
              <p className="max-w-md mb-12 text-lg">Pioneering backcountry exploration in Helena, Montana since 2018.</p>
              <button onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isAdmin ? 'bg-green-800 text-white rotate-0' : 'bg-stone-900 rotate-12 hover:rotate-0 shadow-lg shadow-black'}`}>
                {isAdmin ? <Unlock /> : <Lock />}
              </button>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 font-bold text-xs uppercase tracking-widest">
            <p>© {new Date().getFullYear()} {branding.siteName}.</p>
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
