
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
  Camera, 
  MessageCircle, 
  ArrowRight,
  Info,
  CalendarDays,
  Mountain,
  MapPin,
  ExternalLink,
  MessageSquareQuote,
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
  CheckCircle2
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
  const [passwordInput, setPasswordInput] = useState("");

  // Gallery Management
  const [gallery, setGallery] = useState<GalleryImage[]>(GALLERY_IMAGES);
  const [isAddingImage, setIsAddingImage] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    generateWelcomeSlogan().then(setSlogan);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
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
    const file = e.target.files?.[0];
    if (file && isAdmin) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmUpload = async () => {
    if (!localPreview || !isAdmin) return;
    setIsUploadingFile(true);
    
    // Simulate upload delay for visual feedback
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newImage: GalleryImage = {
      url: localPreview,
      caption: `Trail Log: ${new Date().toLocaleDateString()}`
    };
    
    setGallery([newImage, ...gallery]);
    setLocalPreview(null);
    setIsUploadingFile(false);
    setIsAddingImage(false);
  };

  const handleDeleteImage = (index: number) => {
    if (!isAdmin) return;
    if (confirm("Are you sure you want to remove this image from the journal?")) {
      const updatedGallery = [...gallery];
      updatedGallery.splice(index, 1);
      setGallery(updatedGallery);
    }
  };

  const handleDragStart = (index: number) => {
    if (!isAdmin) return;
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
  };

  const handleDrop = (index: number) => {
    if (!isAdmin || draggedIndex === null || draggedIndex === index) return;
    const updatedGallery = [...gallery];
    const [draggedItem] = updatedGallery.splice(draggedIndex, 1);
    updatedGallery.splice(index, 0, draggedItem);
    setGallery(updatedGallery);
    setDraggedIndex(null);
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
              <button 
                type="submit"
                className="w-full bg-green-800 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-green-900 shadow-xl"
              >
                <LogIn className="w-5 h-5" /> Access Management
              </button>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed w-full z-50 bg-white/90 backdrop-blur-lg border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 bg-green-800 rounded-lg flex items-center justify-center shadow-lg shadow-green-900/20">
                <Mountain className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight text-stone-900">
                Helena Backcountry <span className="text-green-800 italic">Llamas</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <NavLink href="#about" id="about">The Herd</NavLink>
              <NavLink href="#benefits" id="benefits">Why Llamas?</NavLink>
              <NavLink href="#gear" id="gear">Gear Guide</NavLink>
              <NavLink href="#gallery" id="gallery">Gallery</NavLink>
              <NavLink href="#reviews" id="reviews">Reviews</NavLink>
              <NavLink href="#faq" id="faq">Guide FAQ</NavLink>
              <a 
                href="#booking"
                onClick={(e) => scrollToSection(e, 'booking')}
                className="bg-green-800 text-white px-7 py-3 rounded-full font-bold hover:bg-green-900 transition-all flex items-center gap-2 shadow-lg shadow-green-800/30 active:scale-95"
              >
                Book Your Trek <ChevronRight className="w-4 h-4" />
              </a>
            </div>

            <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden bg-white border-b border-stone-200 p-6 space-y-4 shadow-xl">
            <NavLink href="#about" id="about">The Herd</NavLink>
            <NavLink href="#benefits" id="benefits">Why Llamas?</NavLink>
            <NavLink href="#gear" id="gear">Gear Guide</NavLink>
            <NavLink href="#gallery" id="gallery">Gallery</NavLink>
            <NavLink href="#reviews" id="reviews">Reviews</NavLink>
            <NavLink href="#faq" id="faq">Guide FAQ</NavLink>
            <a 
              href="#booking" 
              onClick={(e) => scrollToSection(e, 'booking')}
              className="block w-full text-center bg-green-800 text-white py-4 rounded-2xl font-bold"
            >
              Book Your Trek
            </a>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative h-[95vh] flex items-center justify-center overflow-hidden text-left md:text-center">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=90&w=2400" 
            alt="Montana Peaks" 
            className="w-full h-full object-cover brightness-[0.4] scale-105"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 via-transparent to-stone-900/80"></div>
        </div>
        
        <div className="relative z-10 max-w-5xl mx-auto px-4">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-8 leading-[1.1]">
            Elevate the Trek. <br />
            <span className="italic text-green-400 font-light">Unload the Journey.</span>
          </h1>
          <p className="text-xl md:text-2xl text-stone-200 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
            {slogan} Experience the rugged beauty of the Montana wilderness alongside the world's most agile and low-impact backcountry partners.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <a 
              href="#booking" 
              onClick={(e) => scrollToSection(e, 'booking')}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white px-12 py-5 rounded-full text-lg font-black transition-all shadow-2xl shadow-green-900/40 active:scale-95"
            >
              Plan Your Adventure
            </a>
            <a 
              href="#about" 
              onClick={(e) => scrollToSection(e, 'about')}
              className="w-full sm:w-auto bg-white/10 backdrop-blur-md border border-white/30 hover:bg-white/20 text-white px-12 py-5 rounded-full text-lg font-bold transition-all"
            >
              Meet the Crew
            </a>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-stone-300 animate-bounce">
          <span className="text-[10px] uppercase tracking-widest font-bold">Explore</span>
          <ChevronRight className="rotate-90 w-5 h-5" />
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-6 text-center">Built for the Backcountry</h2>
            <div className="w-24 h-2 bg-green-800 mx-auto rounded-full mb-8"></div>
            <p className="text-stone-500 max-w-2xl mx-auto text-xl leading-relaxed text-center">
              Llamas possess a unique physiological advantage that makes them the gold standard for high-altitude trekking and hunting.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS.map((benefit, idx) => (
              <div key={idx} className="p-10 rounded-[2.5rem] bg-stone-50 border border-stone-100 hover:shadow-2xl transition-all group hover:-translate-y-2 text-left">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-8 group-hover:bg-green-800 transition-all duration-500">
                  <div className="group-hover:text-white transition-colors duration-500">
                    {benefit.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-4">{benefit.title}</h3>
                <p className="text-stone-600 leading-relaxed text-lg">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 bg-stone-100/50 backdrop-blur-sm relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-2xl text-left">
              <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-6 tracking-tight">Meet the Professionals</h2>
              <p className="text-stone-600 text-xl leading-relaxed">
                Our herd is meticulously trained for the variable conditions of the Northern Rockies. They aren't just pack animals; they're elite mountain athletes.
              </p>
            </div>
            <div className="flex gap-4">
              <div className="w-12 h-1.5 rounded-full bg-green-800"></div>
              <div className="w-6 h-1.5 rounded-full bg-green-800/20"></div>
              <div className="w-6 h-1.5 rounded-full bg-green-800/20"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {LLAMAS.map(llama => (
              <LlamaCard key={llama.id} llama={llama} />
            ))}
          </div>
        </div>
      </section>

      {/* Gear Section */}
      <section id="gear" className="py-32 bg-stone-50 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-stone-500 mb-6 text-sm font-black uppercase tracking-[0.3em]">
              <Backpack className="w-5 h-5 text-green-700" /> Pro Kit Guide
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-stone-900 mb-8 tracking-tight text-center">Essential Gear</h2>
            <p className="text-stone-600 max-w-2xl mx-auto text-xl leading-relaxed font-medium text-center">
              We provide the llama and the saddle system. Here's what else you'll need depending on your mission profile.
            </p>
          </div>
          <GearSection />
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-32 bg-stone-950 text-white relative">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="topo-pattern w-full h-full filter invert"></div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-8 text-center md:text-left">
            <div className="text-left">
              <h2 className="text-5xl md:text-7xl font-black mb-6 tracking-tight text-white">Wilderness Journal</h2>
              <div className="flex items-center gap-4">
                <p className="text-stone-400 text-xl max-w-xl">A glimpse into our most recent expedition routes.</p>
                {isAdmin && (
                  <div className="hidden lg:flex items-center gap-2 bg-green-500/10 px-4 py-2 rounded-full border border-green-500/30 text-xs font-bold text-green-400">
                    <Unlock className="w-3 h-3" /> Management Mode Active
                  </div>
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="flex flex-wrap justify-center md:justify-end gap-4">
                <button 
                  onClick={() => {
                    setIsAddingImage(!isAddingImage);
                    setLocalPreview(null);
                  }}
                  className="flex items-center gap-3 bg-green-800 hover:bg-green-700 px-8 py-4 rounded-full transition-all font-bold shadow-xl shadow-green-900/40"
                >
                  {isAddingImage ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                  {isAddingImage ? "Cancel" : "Add to Journal"}
                </button>
              </div>
            )}
          </div>

          {/* Add Image UI (Admin Only) */}
          {isAdmin && isAddingImage && (
            <div className="mb-16 bg-white/5 backdrop-blur-md border border-white/10 rounded-[3rem] p-8 md:p-12 animate-in fade-in slide-in-from-top-10 duration-500">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                {/* AI Generator Column */}
                <div className="space-y-8">
                  <div className="flex items-center gap-3 mb-4">
                    <Sparkles className="text-green-400 w-6 h-6" />
                    <h3 className="text-2xl font-black">AI Scenic Generator</h3>
                  </div>
                  <p className="text-stone-400">Describe a Montana scene and our AI will manifest it for the journal.</p>
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="e.g., Snowy peaks reflected in a glass-calm alpine lake"
                      className="w-full bg-white/10 border border-white/20 px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-green-500 text-white placeholder:text-stone-600"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </div>
                  <button 
                    disabled={isGenerating || !aiPrompt}
                    onClick={handleAiGenerate}
                    className="w-full bg-green-600 hover:bg-green-500 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 transition-all"
                  >
                    {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImageIcon className="w-5 h-5" />}
                    {isGenerating ? "Manifesting..." : "Generate Landscape"}
                  </button>
                </div>
                
                {/* Local Upload Column */}
                <div className="space-y-8 md:border-l md:border-white/10 md:pl-12">
                  <div className="flex items-center gap-3 mb-4">
                    <Upload className="text-green-400 w-6 h-6" />
                    <h3 className="text-2xl font-black">Local Upload</h3>
                  </div>
                  <p className="text-stone-400">Add your own trail photos. Select a file to preview, then confirm the upload.</p>
                  
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef} 
                    accept="image/*"
                    onChange={handleFileSelect}
                  />

                  <div className="flex flex-col gap-6">
                    {localPreview ? (
                      <div className="relative aspect-video rounded-2xl overflow-hidden group/preview border border-white/10">
                        <img src={localPreview} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setLocalPreview(null)}
                            className="bg-red-600 text-white px-4 py-2 rounded-full font-bold text-xs"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full h-40 border-2 border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-all group"
                      >
                        <Plus className="w-8 h-8 text-stone-600 group-hover:text-green-400 mb-2 transition-colors" />
                        <span className="text-stone-500 font-bold">Choose a file...</span>
                      </div>
                    )}

                    <button 
                      disabled={!localPreview || isUploadingFile}
                      onClick={handleConfirmUpload}
                      className="w-full bg-green-800 hover:bg-green-700 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 disabled:opacity-50 transition-all shadow-xl shadow-green-900/40"
                    >
                      {isUploadingFile ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                      {isUploadingFile ? "Uploading to Journal..." : "Confirm & Upload to Journal"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <PhotoCarousel images={gallery} />
          
          <div className="mt-16 columns-1 sm:columns-2 lg:columns-3 gap-8 space-y-8">
            {gallery.map((img, i) => (
              <div 
                key={img.url + i} 
                draggable={isAdmin}
                onDragStart={() => handleDragStart(i)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(i)}
                className={`relative group overflow-hidden rounded-[2rem] break-inside-avoid shadow-2xl bg-stone-900/50 min-h-[200px] text-left transition-all duration-300 ${isAdmin ? 'cursor-grab active:cursor-grabbing' : ''} ${draggedIndex === i ? 'opacity-30 scale-95' : 'opacity-100 scale-100'}`}
              >
                <img 
                  src={img.url} 
                  alt={img.caption} 
                  loading="lazy"
                  decoding="async"
                  className="w-full h-auto object-cover transition-transform group-hover:scale-110 duration-1000 pointer-events-none"
                />
                
                {/* Admin Deletion Action */}
                {isAdmin && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteImage(i); }}
                    className="absolute top-6 right-6 z-20 w-10 h-10 bg-red-600/80 backdrop-blur-md rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-700 active:scale-90"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/90 via-stone-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-8">
                  <div className="flex justify-between items-end w-full">
                    <div>
                      <p className="text-lg font-bold tracking-wide mb-1 text-white">{img.caption}</p>
                      <p className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3" /> Trailhead: Helena, MT
                      </p>
                    </div>
                    {isAdmin && <GripVertical className="w-5 h-5 text-stone-500 opacity-50" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="py-32 bg-white relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-stone-500 mb-6 text-sm font-black uppercase tracking-[0.3em]">
              <MessageSquareQuote className="w-5 h-5 text-green-700" /> Trail Tales
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-stone-900 mb-8 tracking-tight text-center">Voices from the Path</h2>
            <p className="text-stone-600 max-w-2xl mx-auto text-xl leading-relaxed font-medium text-center">
              Real feedback from backcountry hunters, backpackers, and families who have explored Montana with our herd.
            </p>
          </div>
          <Testimonials />
        </div>
      </section>

      {/* AI Guide Section */}
      <section className="py-32 bg-green-50/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white p-12 md:p-20 rounded-[4rem] shadow-2xl border border-stone-100 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-700 to-green-900"></div>
            
            <div className="flex flex-col md:flex-row gap-16 items-center">
              <div className="flex-1 text-center md:text-left">
                <div className="inline-flex items-center gap-2 text-green-800 bg-green-100 px-5 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-8">
                  <MessageCircle className="w-4 h-4" /> Herd Wisdom
                </div>
                <h2 className="text-5xl font-black text-stone-900 mb-8 leading-tight">Ask Our Head Guide</h2>
                <p className="text-stone-600 mb-10 text-xl leading-relaxed font-medium">
                  Need trail-side advice or gear recommendations? Our AI guide draws from decades of backcountry experience.
                </p>
                
                <form onSubmit={handleAdviceSubmit} className="relative mb-8 group">
                  <input 
                    type="text" 
                    placeholder="e.g. Best weight distribution for a hunting pack?"
                    className="w-full bg-stone-50 border-2 border-stone-100 px-8 py-6 rounded-[2rem] outline-none focus:ring-4 focus:ring-green-700/10 focus:border-green-700 text-stone-800 text-lg transition-all shadow-inner"
                    value={adviceQuery}
                    onChange={(e) => setAdviceQuery(e.target.value)}
                  />
                  <button 
                    disabled={isAdviceLoading}
                    className="absolute right-3 top-3 bottom-3 bg-green-800 text-white px-10 rounded-[1.5rem] hover:bg-green-900 transition-all disabled:opacity-50 font-bold flex items-center justify-center gap-3 shadow-xl shadow-green-900/20 active:scale-95"
                  >
                    {isAdviceLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><ArrowRight className="w-5 h-5" /> Get Advice</>}
                  </button>
                </form>
                
                {adviceResponse && (
                  <div className="p-8 bg-green-50 rounded-[2rem] border-2 border-green-100/50 animate-in fade-in zoom-in duration-500 shadow-sm text-left">
                    <p className="text-green-900 italic font-bold text-lg leading-relaxed">
                      <span className="text-3xl font-serif text-green-300 block mb-2 leading-none">"</span>
                      {adviceResponse}
                    </p>
                  </div>
                )}
              </div>
              <div className="w-full md:w-2/5 relative">
                <div className="aspect-[4/5] rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] rotate-2 group-hover:rotate-0 transition-transform duration-700 bg-stone-100">
                  <img src="https://images.unsplash.com/photo-1591073113125-e46713c829ed?auto=format&fit=crop&q=80&w=800" loading="lazy" decoding="async" className="w-full h-full object-cover" alt="Expert Llama" />
                </div>
                <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-xl border border-stone-100 flex items-center gap-4 text-left">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">10+</div>
                  <div>
                    <p className="text-xs font-bold text-stone-400 uppercase tracking-widest text-left">Experience</p>
                    <p className="text-stone-900 font-black">Years Packing</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-32 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-black text-stone-900 mb-6 text-center">Frequently Asked</h2>
            <p className="text-stone-500 text-xl font-medium text-center">Preparation is the key to a successful backcountry expedition.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-stone-50 rounded-[2.5rem] p-10 hover:bg-stone-100 transition-all border border-stone-100 hover:border-green-200 text-left">
                <h3 className="text-2xl font-bold text-stone-900 mb-6 flex items-start gap-4">
                  <span className="w-8 h-8 rounded-full bg-green-800 text-white flex-shrink-0 flex items-center justify-center text-xs">?</span>
                  {faq.question}
                </h3>
                <p className="text-stone-600 leading-relaxed text-lg pl-12">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Booking Section */}
      <section id="booking" className="py-32 bg-stone-50 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-200 rounded-full blur-[120px] opacity-40"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-stone-300 rounded-full blur-[120px] opacity-40"></div>

        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="text-center mb-20">
            <div className="inline-flex items-center gap-2 text-stone-500 mb-6 text-sm font-black uppercase tracking-[0.3em]">
              <CalendarDays className="w-5 h-5" /> Mission Control
            </div>
            <h2 className="text-5xl md:text-7xl font-black text-stone-900 mb-8 tracking-tight text-center">Ready to Gear Up?</h2>
            <p className="text-stone-600 max-w-2xl mx-auto text-xl leading-relaxed font-medium text-center">
              Submit your request below. We handle the logistics so you can focus on the destination.
            </p>
          </div>
          <BookingForm />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-stone-950 text-stone-500 py-32 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 pointer-events-none filter grayscale brightness-0">
          <div className="topo-pattern w-full h-full"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-20 border-b border-stone-800 pb-20 mb-20">
            <div className="col-span-1 md:col-span-2 text-left">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-green-800 rounded-xl flex items-center justify-center shadow-lg cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  <Mountain className="text-white w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-white tracking-tight">
                  Helena Backcountry <span className="text-green-800">Llamas</span>
                </span>
              </div>
              <p className="max-w-md mb-12 text-lg leading-relaxed font-medium">
                Pioneering backcountry exploration in Helena, Montana since 2018. We believe the wilderness is best explored at a llama's pace.
              </p>
              <div className="flex gap-6">
                <button 
                  onClick={() => isAdmin ? setIsAdmin(false) : setShowAdminLogin(true)}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isAdmin ? 'bg-green-800 text-white' : 'bg-stone-900 hover:bg-stone-800 hover:text-white'}`}
                  title={isAdmin ? "Sign Out" : "Management Portal"}
                >
                  {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </button>
                <a href="#" className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center hover:bg-stone-800 hover:text-white transition-all"><ExternalLink className="w-5 h-5" /></a>
                <a href="#" className="w-12 h-12 bg-stone-900 rounded-2xl flex items-center justify-center hover:bg-stone-800 hover:text-white transition-all"><MapPin className="w-5 h-5" /></a>
              </div>
            </div>
            
            <div className="text-left">
              <h4 className="text-white font-black uppercase tracking-widest text-sm mb-10">Expedition</h4>
              <ul className="space-y-6 font-bold">
                <li><a href="#about" onClick={(e) => scrollToSection(e, 'about')} className="hover:text-green-500 transition-all flex items-center gap-2 group"><ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" /> Meet the Herd</a></li>
                <li><a href="#benefits" onClick={(e) => scrollToSection(e, 'benefits')} className="hover:text-green-500 transition-all flex items-center gap-2 group"><ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" /> Pack Advantages</a></li>
                <li><a href="#booking" onClick={(e) => scrollToSection(e, 'booking')} className="hover:text-green-500 transition-all flex items-center gap-2 group"><ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" /> Booking Portal</a></li>
              </ul>
            </div>
            
            <div className="text-left">
              <h4 className="text-white font-black uppercase tracking-widest text-sm mb-10">Headquarters</h4>
              <ul className="space-y-6 text-sm font-medium">
                <li className="flex items-start gap-4">
                  <MapPin className="w-5 h-5 text-green-800 flex-shrink-0" />
                  <span>123 Trailhead Loop<br />Helena, MT 59601</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-800"></div>
                  <span>(406) 555-0123</span>
                </li>
                <li className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-green-800"></div>
                  <span>dispatch@helenallamas.com</span>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 font-bold text-xs uppercase tracking-widest text-left">
            <p>© {new Date().getFullYear()} Helena Backcountry Llamas. Basecamp MT.</p>
            <div className="flex gap-12">
              <a href="#" className="hover:text-white transition-colors">Privacy Charter</a>
              <a href="#" className="hover:text-white transition-colors">Safety Protocol</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
