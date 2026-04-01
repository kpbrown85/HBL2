
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { GalleryImage } from '../types';

interface PhotoCarouselProps {
  images: GalleryImage[];
  autoPlayInterval?: number;
}

export const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ 
  images, 
  autoPlayInterval = 6000 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [loadedIndices, setLoadedIndices] = useState<Set<number>>(new Set([0]));
  const progressTimerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  const nextSlide = useCallback(() => {
    const nextIdx = currentIndex === images.length - 1 ? 0 : currentIndex + 1;
    setCurrentIndex(nextIdx);
    setLoadedIndices(prev => new Set(prev).add(nextIdx));
    setProgress(0);
    startTimeRef.current = Date.now();
  }, [currentIndex, images.length]);

  const prevSlide = () => {
    const prevIdx = currentIndex === 0 ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(prevIdx);
    setLoadedIndices(prev => new Set(prev).add(prevIdx));
    setProgress(0);
    startTimeRef.current = Date.now();
  };

  // Preload adjacent images
  useEffect(() => {
    const nextIdx = (currentIndex + 1) % images.length;
    const prevIdx = (currentIndex - 1 + images.length) % images.length;
    setLoadedIndices(prev => {
      if (prev.has(nextIdx) && prev.has(prevIdx)) return prev;
      const nextSet = new Set(prev);
      nextSet.add(nextIdx);
      nextSet.add(prevIdx);
      return nextSet;
    });
  }, [currentIndex, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide]);

  // Progress and Auto-play Logic
  useEffect(() => {
    if (images.length <= 1) return;

    if (!isPaused) {
      const step = 100;
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            nextSlide();
            return 0;
          }
          return prev + (step / autoPlayInterval) * 100;
        });
      }, step);

      return () => clearInterval(interval);
    }
  }, [isPaused, nextSlide, autoPlayInterval, images.length]);

  if (!images || images.length === 0) return null;

  return (
    <div 
      className="relative w-full h-[500px] md:h-[750px] rounded-[3rem] overflow-hidden group shadow-2xl border border-white/10 bg-stone-950"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Photo Gallery Carousel"
    >
      {/* Slides */}
      {images.map((img, index) => {
        const isLoaded = loadedIndices.has(index);
        return (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
            }`}
          >
            {isLoaded ? (
              <img
                src={img.url}
                alt={img.caption}
                decoding="async"
                className="w-full h-full object-cover animate-in fade-in duration-700"
              />
            ) : (
              <div className="w-full h-full bg-stone-900 flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-white/10 border-t-gold rounded-full animate-spin" />
              </div>
            )}
            {/* Caption Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent">
              <div className="absolute bottom-16 left-8 md:left-16 right-8 md:right-16 text-left">
                <div className="overflow-hidden">
                  <p className={`text-gold text-xs font-black uppercase tracking-[0.4em] mb-4 transition-transform duration-700 delay-100 ${index === currentIndex ? 'translate-y-0' : 'translate-y-full'}`}>
                    Expedition Logs
                  </p>
                </div>
                <div className="overflow-hidden">
                  <h3 className={`text-white text-3xl md:text-6xl font-black tracking-tight leading-tight transition-transform duration-700 delay-200 ${index === currentIndex ? 'translate-y-0' : 'translate-y-full'}`}>
                    {img.caption}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/10 z-30">
        <div 
          className="h-full bg-gold transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Navigation Arrows */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 z-30 pointer-events-none">
        <button
          onClick={prevSlide}
          className="w-16 h-16 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-gold transition-all opacity-0 group-hover:opacity-100 pointer-events-auto active:scale-90"
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
        <button
          onClick={nextSlide}
          className="w-16 h-16 bg-black/20 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-gold transition-all opacity-0 group-hover:opacity-100 pointer-events-auto active:scale-90"
          aria-label="Next slide"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* Play/Pause & Counter Overlay */}
      <div className="absolute top-8 right-8 z-30 flex items-center gap-4">
        <div className="px-4 py-2 bg-black/40 backdrop-blur-md rounded-full text-white/80 text-xs font-black tracking-widest border border-white/10">
          {currentIndex + 1} / {images.length}
        </div>
        <button 
          onClick={() => setIsPaused(!isPaused)}
          className="w-12 h-12 bg-black/40 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:text-gold transition-colors"
          title={isPaused ? "Play" : "Pause"}
        >
          {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
        </button>
      </div>

      {/* Bottom Navigation Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 z-30">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setCurrentIndex(index);
              setLoadedIndices(prev => new Set(prev).add(index));
              setProgress(0);
            }}
            className="group py-4 px-1"
            aria-label={`Go to slide ${index + 1}`}
          >
            <div className={`h-1 rounded-full transition-all duration-500 ${
              index === currentIndex ? 'w-12 bg-gold' : 'w-4 bg-white/30 group-hover:bg-white/60'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
};
