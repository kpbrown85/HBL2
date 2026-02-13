
import React, { useState, useEffect, useRef } from 'react';
import { LLAMAS, GALLERY_IMAGES, FAQS, BENEFITS } from './constants';
import { LlamaCard } from './components/LlamaCard';
import { BookingForm } from './components/BookingForm';
import { Testimonials } from './components/Testimonials';
import { PhotoCarousel } from './components/PhotoCarousel';
import { GearSection } from './components/GearSection';
import { generateWelcomeSlogan, getLlamaAdvice, generateBackdrop } from './services/geminiService';
import { GalleryImage } from './types';
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
  Eye
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
  const [showBrandingModal, setShowBrandingModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);

  // Branding State & Persistence
  const defaultBranding = {
    siteName: "Helena Backcountry Llamas",
    accentName: "Llamas",
    logoType: 'icon' as 'icon' | 'image',
    logoUrl: ""
  };

  const [branding, setBranding] = useState(() => {
    const saved = localStorage.getItem('hbl_branding');
    return saved ? JSON.parse(saved) : defaultBranding;
  });

  // Gallery Management
  const [gallery, setGallery] = useState<GalleryImage[]>(() => {
    const saved = localStorage.getItem('hbl_gallery');
    return saved ? JSON.parse(saved) : GALLERY_IMAGES;
  });
  
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [localPreviews, setLocalPreviews] = useState<string[]>([]);
  
  // Reordering state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    generateWelcomeSlogan().then(setSlogan);
  }, []);

  useEffect(() => {
    localStorage.setItem('hbl_gallery', JSON.stringify(gallery));
  }, [gallery]);

  useEffect(() => {
    localStorage.setItem('hbl_branding', JSON.stringify(branding));
    document.title = branding.siteName;
  }, [branding]);

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
      setIsAddingImage(false);
    } catch (error) {
      alert("Failed to generate image. Please try again.");
    } finally {
      setIsGenerating(false);
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isAdmin) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBranding({ ...branding, logoUrl: reader.result as string, logoType: 'image' });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (localPreviews.length === 0 || !isAdmin) return;
    setIsUploadingFile(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    const newImages: GalleryImage[] = localPreviews.map(url => ({
      url,
      caption: `Trail Log: ${new Date().toLocaleDateString()}`
    }));
    setGallery([...newImages, ...gallery]);
    setLocalPreviews([]);
    setIsUploadingFile(false);
    setIsAddingImage(false);
  };

  const handleDeleteImage = (index: number) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to remove this image?")) {
      const updatedGallery = [...gallery];
      updatedGallery.splice(index, 1);
      setGallery(updatedGallery);
    }
  };

  // Drag and Drop Logic for Reordering
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

  const resetGallery = () => {
    if (confirm("Reset gallery to original defaults?")) {
      setGallery(GALLERY_IMAGES);
      localStorage.removeItem('hbl_gallery');
    }
  };

  const resetBranding = () => {
    if (confirm("Restore original brand identity? This will reset the logo and site name.")) {
      setBranding(defaultBranding);
    }
  };

  const NavLink = ({ href, id, children }: { href: string, id: string, children: React.ReactNode }) => (
    <a 
      href={href} 
      onClick={(e) => scrollToSection(e, id)}
      className="text-stone-600 hover:text-green-700 font-medium transition-colors"
    >
      {children}
    </a>
  );

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

      {/* Enhanced Branding Manager Modal */}
      {showBrandingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
          <div className="bg-white rounded-[3rem] p-10 md:p-14 max-w-3xl w-full shadow-2xl animate-in fade-in zoom-in slide-in-from-bottom-8 duration-500 overflow-y-auto max-h-[90vh] border border-stone-100">
            <div className="flex justify-between items-start mb-10">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">
                  <Palette className="w-3 h-3" /> Visual Identity
                </div>
                <h3 className="text-4xl font-black text-stone-900">Branding Manager</h3>
                <p className="text-stone-500 font-medium">Customize your brand presence across the entire site.</p>
              </div>
              <button onClick={() => setShowBrandingModal(false)} className="p-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-full transition-all">
                <X />
              </button>
            </div>

            <div className="space-y-12">
              {/* Live Preview Section */}
              <div className="relative group">
                <div className="absolute -top-3 left-6 z-10 bg-white px-3 py-1 rounded-full border border-stone-100 shadow-sm flex items-center gap-2">
                  <Eye className="w-3 h-3 text-green-600" />
                  <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Real-time Preview</span>
                </div>
                <div className="bg-stone-50 rounded-[2.5rem] p-10 border-2 border-dashed border-stone-200 flex items-center justify-center">
                   <div className="bg-white px-8 py-5 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100">
                     <Logo />
                   </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* Text Customization */}
                <div className="space-y-8">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100 pb-3">Company Identity</h4>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Primary Site Name</label>
                      <input 
                        type="text"
                        className="w-full bg-stone-50 border border-stone-200 px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-green-700/5 focus:border-green-800 transition-all font-bold text-stone-900"
                        placeholder="e.g. Helena Backcountry Llamas"
                        value={branding.siteName}
                        onChange={(e) => setBranding({ ...branding, siteName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2">Accent Word (The Styled Word)</label>
                      <input 
                        type="text"
                        className="w-full bg-stone-50 border border-stone-200 px-6 py-4 rounded-2xl outline-none focus:ring-4 focus:ring-green-700/5 focus:border-green-800 transition-all font-bold text-green-700 italic"
                        placeholder="e.g. Llamas"
                        value={branding.accentName}
                        onChange={(e) => setBranding({ ...branding, accentName: e.target.value })}
                      />
                      <p className="mt-2 text-[10px] text-stone-400 font-medium italic">This word will automatically receive the brand highlight styling.</p>
                    </div>
                  </div>
                </div>

                {/* Logo Customization */}
                <div className="space-y-8">
                  <h4 className="text-xs font-black text-stone-400 uppercase tracking-[0.2em] border-b border-stone-100 pb-3">Logo & Mark</h4>
                  <div className="space-y-6">
                    <div className="flex p-1 bg-stone-100 rounded-2xl gap-1">
                      <button 
                        onClick={() => setBranding({ ...branding, logoType: 'icon' })}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${branding.logoType === 'icon' ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        <Mountain className="w-4 h-4" /> Preset Icon
                      </button>
                      <button 
                        onClick={() => setBranding({ ...branding, logoType: 'image' })}
                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${branding.logoType === 'image' ? 'bg-white text-stone-900 shadow-md' : 'text-stone-400 hover:text-stone-600'}`}
                      >
                        <ImageIcon className="w-4 h-4" /> Upload Custom
                      </button>
                    </div>

                    {branding.logoType === 'image' && (
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className="relative h-44 border-2 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center cursor-pointer hover:bg-stone-50 transition-all overflow-hidden group"
                      >
                        {branding.logoUrl ? (
                          <>
                            <img src={branding.logoUrl} className="w-full h-full object-contain p-6" alt="Logo Preview" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <div className="bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-full border border-white/30 text-white text-xs font-bold flex items-center gap-2">
                                  <RefreshCcw className="w-3 h-3" /> Change Logo
                               </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-center space-y-4">
                            <div className="w-14 h-14 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto text-stone-400 group-hover:scale-110 transition-transform">
                              <Upload />
                            </div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Click to browse files</p>
                          </div>
                        )}
                        <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-10 border-t border-stone-100">
                <button 
                  onClick={() => copyConfig(branding)} 
                  className="w-full sm:flex-1 bg-stone-900 text-white py-5 rounded-[1.5rem] font-bold flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95"
                >
                  {copySuccess ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                  {copySuccess ? "Config Copied" : "Export Branding JSON"}
                </button>
                <button 
                  onClick={resetBranding} 
                  className="w-full sm:w-auto px-10 bg-stone-100 text-stone-500 py-5 rounded-[1.5rem] font-bold hover:bg-stone-200 transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCcw className="w-4 h-4" /> Reset Defaults
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Bar */}
      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-lg border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <Logo />
            <div className="hidden md:flex items-center gap-8">
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
        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-stone-200 p-6 space-y-4 shadow-xl text-left animate-in slide-in-from-top duration-300">
            <NavLink href="#about" id="about">The Herd</NavLink>
            <NavLink href="#benefits" id="benefits">Why Llamas?</NavLink>
            <NavLink href="#gear" id="gear">Gear Guide</NavLink>
            <NavLink href="#gallery" id="gallery">Gallery</NavLink>
            <NavLink href="#reviews" id="reviews">Reviews</NavLink>
            <NavLink href="#faq" id="faq">Guide FAQ</NavLink>
            <a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="block w-full text-center bg-green-800 text-white py-4 rounded-2xl font-bold">Book Your Trek</a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden text-left md:text-center">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=2400" alt="Montana Peaks" className="w-full h-full object-cover brightness-[0.4] scale-105" />
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
        <div className="bg-green-900 text-white py-3 px-4 flex flex-wrap items-center justify-center gap-6 sticky top-20 z-40 shadow-xl border-b border-green-800">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2"><Unlock className="w-3 h-3" /> Management Mode Active</span>
          <button onClick={() => setShowBrandingModal(true)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold transition-all border border-white/20">
            <Settings className="w-3 h-3" /> Branding Manager
          </button>
          <button onClick={() => copyConfig(gallery)} className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-1.5 rounded-full text-xs font-bold transition-all border border-white/20">
            {copySuccess ? <CheckCircle2 className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
            {copySuccess ? "Gallery Copied!" : "Copy Gallery Config"}
          </button>
          <button onClick={resetGallery} className="flex items-center gap-2 bg-red-500/20 hover:bg-red-500/40 px-4 py-1.5 rounded-full text-xs font-bold transition-all border border-red-500/20">
            <Trash2 className="w-3 h-3" /> Reset Gallery
          </button>
        </div>
      )}

      {/* Main Content Sections (Benefits, About, Gear, etc.) */}
      {/* ... keeping sections as defined in constants ... */}
      
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
            {LLAMAS.map(llama => <LlamaCard key={llama.id} llama={llama} />)}
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

      {/* Gallery Section with Enhanced Reordering */}
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
              <div className="flex gap-4">
                <button onClick={() => {setIsAddingImage(!isAddingImage); setLocalPreviews([]);}} className="bg-green-800 hover:bg-green-700 px-8 py-4 rounded-full font-bold shadow-xl flex items-center gap-2 transition-all active:scale-95">
                  {isAddingImage ? <X /> : <Plus />} {isAddingImage ? "Cancel" : "Update Photos"}
                </button>
              </div>
            )}
          </div>

          {isAdmin && isAddingImage && (
            <div className="mb-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-[3rem] p-12 text-left animate-in slide-in-from-bottom duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-3"><Sparkles className="text-green-400 w-6 h-6" /><h3 className="text-2xl font-black">AI Scenic Generator</h3></div>
                  <input type="text" placeholder="e.g., Snowy peaks reflected in a lake" className="w-full bg-white/10 border border-white/20 px-6 py-4 rounded-2xl outline-none" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                  <button disabled={isGenerating || !aiPrompt} onClick={handleAiGenerate} className="w-full bg-green-600 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95">
                    {isGenerating ? <Loader2 className="animate-spin" /> : <ImageIcon />} {isGenerating ? "Generating..." : "Generate Landscape"}
                  </button>
                </div>
                <div className="space-y-8 md:border-l md:border-white/10 md:pl-12">
                  <div className="flex items-center justify-between"><div className="flex items-center gap-3"><Upload className="text-green-400 w-6 h-6" /><h3 className="text-2xl font-black">Batch Upload</h3></div>{localPreviews.length > 0 && <button onClick={() => setLocalPreviews([])} className="text-xs text-red-400 font-bold underline">Clear All</button>}</div>
                  <input type="file" className="hidden" ref={fileInputRef} accept="image/*" multiple onChange={handleFileSelect} />
                  
                  {localPreviews.length > 0 ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {localPreviews.map((preview, idx) => (
                          <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 bg-stone-900">
                            <img src={preview} alt="Staged" className="w-full h-full object-cover" />
                            <button onClick={() => setLocalPreviews(prev => prev.filter((_, i) => i !== idx))} className="absolute top-1 right-1 bg-black/60 rounded-full p-1"><X className="w-3 h-3" /></button>
                          </div>
                        ))}
                        <button onClick={() => fileInputRef.current?.click()} className="aspect-square border-2 border-dashed border-white/10 rounded-lg flex items-center justify-center hover:bg-white/5"><Plus className="w-5 h-5 text-stone-600" /></button>
                      </div>
                    </div>
                  ) : (
                    <div onClick={() => fileInputRef.current?.click()} className="h-40 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 group transition-colors">
                      <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Plus className="text-stone-600" /></div>
                      <span className="text-stone-500 font-bold">Choose multiple files...</span>
                    </div>
                  )}
                  <button disabled={localPreviews.length === 0 || isUploadingFile} onClick={handleConfirmUpload} className="w-full bg-green-800 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 active:scale-95">
                    {isUploadingFile ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} {isUploadingFile ? "Processing Batch..." : "Confirm & Upload to Site"}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <PhotoCarousel images={gallery} />

          <div className="mt-20 flex items-center justify-between mb-10">
            <h4 className="text-xs font-black uppercase tracking-[0.3em] text-stone-500 flex items-center gap-3">
              {isAdmin && <GripVertical className="w-4 h-4 text-green-600" />} {isAdmin ? "Drag cards to reorder fleet gallery" : "Expedition Snapshots"}
            </h4>
          </div>

          <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8 text-left">
            {gallery.map((img, i) => (
              <div 
                key={img.url + i} 
                draggable={isAdmin} 
                onDragStart={() => handleDragStart(i)} 
                onDragOver={(e) => handleDragOver(e, i)} 
                onDragLeave={handleDragLeave}
                onDrop={() => handleDrop(i)} 
                className={`relative group overflow-hidden rounded-[2rem] break-inside-avoid shadow-2xl bg-stone-900/50 min-h-[200px] transition-all duration-300 
                  ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''} 
                  ${draggedIndex === i ? 'opacity-40 grayscale blur-[2px] scale-95' : 'opacity-100'} 
                  ${dropTargetIndex === i ? 'ring-4 ring-green-600 ring-offset-4 ring-offset-stone-950 scale-[1.02]' : 'ring-0'}`}
              >
                <img src={img.url} alt={img.caption} loading="lazy" className="w-full h-auto object-cover transition-transform group-hover:scale-110" />
                
                {isAdmin && (
                  <>
                    <button onClick={() => handleDeleteImage(i)} className="absolute top-6 right-6 z-20 w-10 h-10 bg-red-600/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg active:scale-90">
                      <Trash2 className="w-5 h-5 text-white" />
                    </button>
                    <div className="absolute top-6 left-6 z-20 w-10 h-10 bg-green-800/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg pointer-events-none">
                      <GripVertical className="w-5 h-5 text-white" />
                    </div>
                  </>
                )}

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

      {/* Other Sections (Reviews, FAQ, etc.) */}
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
              <div className="w-full md:w-2/5 aspect-[4/5] rounded-[3rem] overflow-hidden bg-stone-100 shadow-2xl"><img src="https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800" className="w-full h-full object-cover" /></div>
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
