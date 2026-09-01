import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight, PlusCircle } from 'lucide-react';
import { HeroBanner } from '../types';

interface HeroSliderProps {
  banners: HeroBanner[];
  isLoading?: boolean;
  onOpenAdminBanners?: () => void;
  isAdmin?: boolean;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  banners,
  isLoading = false,
  onOpenAdminBanners,
  isAdmin,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchEndX, setTouchEndX] = useState<number | null>(null);

  // Filter only active banners
  const activeBanners = banners.filter(b => b.active);

  // Auto-advance slider every 6 seconds
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeBanners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [activeBanners.length]);

  // If loading and no banners yet, show sleek dark placeholder
  if (isLoading && activeBanners.length === 0) {
    return (
      <section className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:h-[65vh] lg:h-[70vh] min-h-[440px] sm:min-h-[480px] max-h-[800px] overflow-hidden bg-[#0D0D11] animate-pulse">
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/60 to-black/80" />
        <div className="relative z-20 w-full max-w-[1720px] mx-auto h-full px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col justify-end pb-12 sm:pb-20">
          <div className="max-w-2xl space-y-4">
            <div className="h-8 sm:h-14 bg-white/10 rounded-xl w-3/4" />
            <div className="h-4 sm:h-6 bg-white/5 rounded-lg w-1/2" />
            <div className="h-10 sm:h-12 bg-[#C5A059]/30 rounded-xl w-40 mt-2" />
          </div>
        </div>
      </section>
    );
  }

  // If no banners exist at all in database
  const displayBanners = activeBanners.length > 0 ? activeBanners : [
    {
      id: 'default-lumen',
      title: 'ÖZEL TASARIM HEYKELSİ AYDINLATMA',
      subtitle: 'El yapımı masif malzemeler, çocuk odası lambaları ve mimari aydınlatma koleksiyonları.',
      buttonText: 'Hemen Satın Al',
      linkUrl: '#koleksiyon',
      imageUrl: 'https://images.unsplash.com/photo-1540932239986-30128078f3c5?auto=format&fit=crop&w=2000&q=85',
      active: true
    }
  ];

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? displayBanners.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % displayBanners.length);
  };

  // Touch Swipe Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStartX || !touchEndX) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 45;

    if (distance > minSwipeDistance) {
      // Swiped Left -> Next slide
      nextSlide();
    } else if (distance < -minSwipeDistance) {
      // Swiped Right -> Prev slide
      prevSlide();
    }

    setTouchStartX(null);
    setTouchEndX(null);
  };

  const currentBanner = displayBanners[currentIndex] || displayBanners[0];

  const handleCtaClick = (linkUrl: string) => {
    if (linkUrl.startsWith('#')) {
      const el = document.querySelector(linkUrl);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = linkUrl;
    }
  };

  return (
    <section 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="relative w-full aspect-[16/10] sm:aspect-[16/9] md:h-[65vh] lg:h-[70vh] min-h-[440px] sm:min-h-[480px] max-h-[800px] overflow-hidden bg-[#0A0A0A] select-none"
    >
      {/* Background Image Slides */}
      {displayBanners.map((banner, idx) => (
        <div
          key={banner.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
          }`}
        >
          {/* Crisp High-Res Banner Image */}
          <img
            src={banner.imageUrl}
            alt={banner.title}
            className="w-full h-full object-cover object-center"
            loading={idx === 0 ? "eager" : "lazy"}
          />
          {/* Dark Luxury Vignette Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-[#0A0A0A]/40 to-black/50" />
        </div>
      ))}

      {/* Hero Content Overlay */}
      <div className="relative z-20 w-full max-w-[1720px] mx-auto h-full px-4 sm:px-6 lg:px-8 xl:px-12 flex flex-col justify-end pb-12 sm:pb-20">
        <div className="max-w-2xl space-y-3 sm:space-y-4">
          <h1 className="font-serif-luxury text-2xl sm:text-5xl lg:text-6xl font-medium tracking-tight text-white leading-[1.15] uppercase">
            {currentBanner.title}
          </h1>

          <p className="text-zinc-300 text-xs sm:text-base md:text-lg font-light leading-relaxed max-w-xl line-clamp-3 sm:line-clamp-none">
            {currentBanner.subtitle}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              id="hero-cta-btn"
              onClick={() => handleCtaClick(currentBanner.linkUrl)}
              className="group relative inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-3.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold text-xs sm:text-sm uppercase tracking-[0.2em] rounded-xl overflow-hidden shadow-lg transition-all"
            >
              <span>
                {currentBanner.buttonText === 'KOLEKSİYONU KEŞFET' || currentBanner.buttonText === 'İNCELE' || !currentBanner.buttonText
                  ? 'Hemen Satın Al'
                  : currentBanner.buttonText}
              </span>
              <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </button>

            {isAdmin && onOpenAdminBanners && (
              <button
                id="hero-admin-edit-btn"
                onClick={onOpenAdminBanners}
                className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 glass-panel hover:bg-white/10 text-zinc-200 text-xs font-semibold uppercase tracking-wider rounded-xl transition-all"
              >
                <PlusCircle className="w-4 h-4 text-[#C5A059]" />
                <span>Bannerları Yönet ({displayBanners.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      {displayBanners.length > 1 && (
        <>
          {/* Arrows: Hidden on Mobile to avoid blocking content, visible on SM+ screens */}
          <button
            id="hero-prev-btn"
            onClick={prevSlide}
            aria-label="Önceki Slayt"
            className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 text-white hover:text-white hover:bg-black/80 border border-white/20 hover:border-white/40 backdrop-blur-md transition-all focus:outline-none"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            id="hero-next-btn"
            onClick={nextSlide}
            aria-label="Sonraki Slayt"
            className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/50 text-white hover:text-white hover:bg-black/80 border border-white/20 hover:border-white/40 backdrop-blur-md transition-all focus:outline-none"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Dots Indicator: Compact & clean position */}
          <div className="absolute bottom-4 sm:bottom-6 right-4 sm:right-6 z-30 flex items-center space-x-1.5 sm:space-x-2 bg-black/40 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-white/10">
            {displayBanners.map((_, idx) => (
              <button
                key={idx}
                id={`hero-dot-${idx}`}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Slayt ${idx + 1}`}
                className={`h-1 sm:h-1.5 transition-all rounded-full ${
                  idx === currentIndex
                    ? 'w-5 sm:w-8 bg-[#C5A059]'
                    : 'w-1.5 sm:w-2 bg-zinc-600 hover:bg-zinc-400'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

