import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Crop,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Move,
  Check,
  X,
  Maximize2,
  Minimize2,
  RefreshCw,
  Grid,
  Sparkles,
  Sliders,
  Layers,
  CheckCircle2,
  Loader2
} from 'lucide-react';

interface ImageCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  onSaveCrop: (croppedDataUrl: string) => void;
  aspectRatio?: '1:1' | '16:9' | '4:3' | 'free';
  title?: string;
}

export const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  onSaveCrop,
  aspectRatio = '1:1',
  title = 'Görsel Kırpma & Kareye Konumlandırma'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [naturalDimensions, setNaturalDimensions] = useState({ width: 0, height: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  // Transformation states
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [rotation, setRotation] = useState<number>(0);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [selectedRatio, setSelectedRatio] = useState<'1:1' | '16:9' | '4:3'>(aspectRatio === 'free' ? '1:1' : aspectRatio);

  // Dragging state
  const isDragging = useRef<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const posStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Reset and load image when modal opens or image changes
  useEffect(() => {
    if (isOpen && imageUrl) {
      setImageLoaded(false);
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = imageUrl;
      img.onload = () => {
        imageRef.current = img;
        setNaturalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setImageLoaded(true);

        // Auto calculate initial scale so it nicely fills or fits the frame
        if (img.naturalWidth && img.naturalHeight) {
          const ratio = img.naturalWidth / img.naturalHeight;
          if (ratio > 1) {
            // Landscape: scale to height
            setScale(1.05);
          } else {
            // Portrait: scale to width
            setScale(1.05);
          }
        }
      };
      img.onerror = () => {
        // Fallback without crossOrigin if CORS fails
        const fallbackImg = new Image();
        fallbackImg.src = imageUrl;
        fallbackImg.onload = () => {
          imageRef.current = fallbackImg;
          setNaturalDimensions({ width: fallbackImg.naturalWidth, height: fallbackImg.naturalHeight });
          setImageLoaded(true);
        };
      };
    }
  }, [isOpen, imageUrl]);

  // Handle Drag / Pan with mouse
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    posStart.current = { ...position };
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setPosition({
      x: posStart.current.x + dx,
      y: posStart.current.y + dy
    });
  }, [position]);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // Handle Touch drag / pan on mobile/tablets
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      isDragging.current = true;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      posStart.current = { ...position };
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    setPosition({
      x: posStart.current.x + dx,
      y: posStart.current.y + dy
    });
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.08 : -0.08;
    setScale((prev) => Math.min(Math.max(0.4, Number((prev + zoomDelta).toFixed(2))), 4));
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Actions
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFitToSquare = () => {
    if (!naturalDimensions.width || !naturalDimensions.height) return;
    const maxDim = Math.max(naturalDimensions.width, naturalDimensions.height);
    const minDim = Math.min(naturalDimensions.width, naturalDimensions.height);
    setScale(Number((minDim / maxDim).toFixed(2)));
    setPosition({ x: 0, y: 0 });
  };

  const handleFillSquare = () => {
    if (!naturalDimensions.width || !naturalDimensions.height) return;
    const maxDim = Math.max(naturalDimensions.width, naturalDimensions.height);
    const minDim = Math.min(naturalDimensions.width, naturalDimensions.height);
    setScale(Number((maxDim / minDim).toFixed(2)));
    setPosition({ x: 0, y: 0 });
  };

  // Export cropped canvas
  const handleApplyCrop = async () => {
    if (!imageRef.current) return;
    setIsProcessing(true);

    try {
      // Determine output canvas dimensions (standard high-res square: 1080x1080)
      const targetSize = selectedRatio === '1:1' ? { w: 1080, h: 1080 } : selectedRatio === '16:9' ? { w: 1280, h: 720 } : { w: 1080, h: 810 };
      
      const canvas = document.createElement('canvas');
      canvas.width = targetSize.w;
      canvas.height = targetSize.h;
      const ctx = canvas.getContext('2d', { alpha: false });

      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      // Background color for luxury theme
      ctx.fillStyle = '#0A0A0A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // We need to map viewport coordinates to the 1080x1080 canvas
      // The viewport frame box has a current rendered width/height
      const frameEl = document.getElementById('crop-viewport-box');
      const frameRect = frameEl?.getBoundingClientRect() || { width: 360, height: 360 };

      const scaleMultiplier = targetSize.w / frameRect.width;

      ctx.save();
      // Move to center of canvas
      ctx.translate(canvas.width / 2, canvas.height / 2);

      // Apply User's Translation (scaled to canvas size)
      ctx.translate(position.x * scaleMultiplier, position.y * scaleMultiplier);

      // Apply User's Rotation
      ctx.rotate((rotation * Math.PI) / 180);

      // Apply User's Scale
      const baseRenderWidth = frameRect.width;
      const baseRenderHeight = (frameRect.width / (naturalDimensions.width || 1)) * (naturalDimensions.height || 1);

      const drawWidth = baseRenderWidth * scale * scaleMultiplier;
      const drawHeight = baseRenderHeight * scale * scaleMultiplier;

      // Draw the image centered at translated origin
      ctx.drawImage(
        imageRef.current,
        -drawWidth / 2,
        -drawHeight / 2,
        drawWidth,
        drawHeight
      );

      ctx.restore();

      // Export as high-quality WebP or JPEG
      let dataUrl: string;
      try {
        dataUrl = canvas.toDataURL('image/webp', 0.88);
      } catch (err) {
        dataUrl = canvas.toDataURL('image/jpeg', 0.88);
      }

      onSaveCrop(dataUrl);
      onClose();
    } catch (err) {
      console.error('Kırpma hatası:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-4xl max-h-[95vh] bg-[#0D0D11] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-black/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#C5A059]/15 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059]">
              <Crop className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-sm">{title}</h3>
              <p className="text-[11px] text-zinc-400">
                Görseli sürükleyerek kare çerçeve içinde hizalayın, boyutu (zoom) ayarlayın.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Editor Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col lg:flex-row gap-6 items-center lg:items-stretch">
          
          {/* Left / Center: Interactive Crop Viewport Frame */}
          <div className="flex-1 w-full flex flex-col items-center justify-center min-h-[340px] sm:min-h-[420px] bg-black/60 rounded-2xl border border-white/10 p-4 relative select-none">
            
            {/* Viewport Box (The Target Square) */}
            <div 
              id="crop-viewport-box"
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onWheel={handleWheel}
              className={`relative overflow-hidden cursor-grab active:cursor-grabbing border-2 border-[#C5A059] shadow-[0_0_30px_rgba(197,160,89,0.25)] rounded-2xl bg-black ${
                selectedRatio === '1:1' 
                  ? 'w-[280px] h-[280px] sm:w-[360px] sm:h-[360px]' 
                  : selectedRatio === '16:9'
                  ? 'w-[320px] h-[180px] sm:w-[440px] sm:h-[247px]'
                  : 'w-[300px] h-[225px] sm:w-[400px] sm:h-[300px]'
              }`}
            >
              {!imageLoaded ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#C5A059]" />
                  <span className="text-xs">Görsel yükleniyor...</span>
                </div>
              ) : (
                /* The Image Canvas with Transform */
                <div 
                  className="w-full h-full flex items-center justify-center pointer-events-none"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px)`
                  }}
                >
                  <img
                    src={imageUrl}
                    alt="Kırpılacak Görsel"
                    draggable={false}
                    className="max-w-none transition-transform duration-75 origin-center"
                    style={{
                      transform: `rotate(${rotation}deg) scale(${scale})`,
                      width: '100%',
                      height: 'auto'
                    }}
                  />
                </div>
              )}

              {/* Rule-of-Thirds Grid Overlay */}
              {showGrid && imageLoaded && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 z-20">
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-r border-b border-white/20" />
                  <div className="border-b border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="border-r border-white/20" />
                  <div className="" />
                </div>
              )}

              {/* Frame Corner Accents */}
              <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white pointer-events-none z-30" />
              <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-white pointer-events-none z-30" />
              <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-white pointer-events-none z-30" />
              <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white pointer-events-none z-30" />
            </div>

            {/* Helper Caption */}
            <div className="mt-3 flex items-center gap-2 text-zinc-400 text-[11px]">
              <Move className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Görseli kare içinde istediğiniz gibi kaydırın veya tekerlekle büyütün</span>
            </div>
          </div>

          {/* Right Panel: Controls & Live Settings */}
          <div className="w-full lg:w-72 flex flex-col gap-4 bg-black/40 border border-white/10 rounded-2xl p-4">
            
            {/* Aspect Ratio Selection */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">
                Kırpma Oranı
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: '1:1', label: '1:1 Kare (Standart)' },
                  { id: '4:3', label: '4:3 Katalog' },
                  { id: '16:9', label: '16:9 Banner' }
                ].map((ratio) => (
                  <button
                    key={ratio.id}
                    type="button"
                    onClick={() => {
                      setSelectedRatio(ratio.id as any);
                      setPosition({ x: 0, y: 0 });
                    }}
                    className={`px-2 py-1.5 rounded-xl text-[11px] font-medium transition-all cursor-pointer ${
                      selectedRatio === ratio.id
                        ? 'bg-[#C5A059] text-black font-bold shadow'
                        : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200'
                    }`}
                  >
                    {ratio.id}
                  </button>
                ))}
              </div>
            </div>

            {/* Zoom / Scale Control */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-300 font-medium flex items-center gap-1.5">
                  <ZoomIn className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Boyut & Yakınlaştırma</span>
                </span>
                <span className="font-mono text-[#C5A059] font-bold text-[11px]">
                  {Math.round(scale * 100)}%
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setScale((prev) => Math.max(0.4, Number((prev - 0.1).toFixed(2))))}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                  title="Uzaklaştır"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                
                <input
                  type="range"
                  min="0.4"
                  max="3.5"
                  step="0.05"
                  value={scale}
                  onChange={(e) => setScale(Number(e.target.value))}
                  className="flex-1 accent-[#C5A059] cursor-pointer"
                />

                <button
                  type="button"
                  onClick={() => setScale((prev) => Math.min(3.5, Number((prev + 0.1).toFixed(2))))}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-colors"
                  title="Yakınlaştır"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Quick Fit & Alignment Buttons */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <span className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">
                Hızlı Hizalama
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleFitToSquare}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs transition-colors"
                  title="Tüm görseli kare içine sığdır"
                >
                  <Minimize2 className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Kareye Sığdır</span>
                </button>

                <button
                  type="button"
                  onClick={handleFillSquare}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs transition-colors"
                  title="Kareyi tamamen doldur"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Kareyi Doldur</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleRotate}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs transition-colors"
                  title="90 Derece Döndür"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Döndür (90°)</span>
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs transition-colors"
                  title="Konum ve Boyutu Sıfırla"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Sıfırla</span>
                </button>
              </div>
            </div>

            {/* Grid Overlay Toggle */}
            <div className="pt-2 border-t border-white/5">
              <label className="flex items-center justify-between text-xs text-zinc-300 cursor-pointer select-none">
                <span className="flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span>Kılavuz Çizgileri (3x3 Grid)</span>
                </span>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="rounded border-white/20 bg-black/40 text-[#C5A059] focus:ring-[#C5A059]"
                />
              </label>
            </div>

            {/* Image Specs */}
            {naturalDimensions.width > 0 && (
              <div className="p-2.5 rounded-xl bg-black/60 border border-white/5 text-[11px] text-zinc-400 space-y-1 font-mono">
                <div className="flex justify-between">
                  <span>Orijinal Boyut:</span>
                  <span className="text-zinc-200">{naturalDimensions.width} × {naturalDimensions.height} px</span>
                </div>
                <div className="flex justify-between">
                  <span>Hedef Çıktı:</span>
                  <span className="text-[#C5A059]">1080 × 1080 px (Kare)</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-4 border-t border-white/10 bg-black/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs transition-colors"
          >
            İptal
          </button>

          <button
            type="button"
            disabled={isProcessing || !imageLoaded}
            onClick={handleApplyCrop}
            className="px-6 py-2.5 bg-[#C5A059] hover:bg-[#d6b26b] text-black font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Kırpılıyor & Kaydediliyor...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Kırp & Kare Olarak Kaydet</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
