import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, LayoutGrid, ZoomIn, ZoomOut, Maximize2, Minimize2, Info, ArrowLeftRight } from 'lucide-react';
import { ImageFile } from '../types';
import { formatBytes } from '../utils/imageProcessor';

interface ImageComparerProps {
  image: ImageFile | null;
  onClose: () => void;
}

export default function ImageComparer({ image, onClose }: ImageComparerProps) {
  const [viewMode, setViewMode] = useState<'slider' | 'side-by-side'>('slider');
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [zoomLevel, setZoomLevel] = useState<number>(100); // Percentage 50% to 200%
  const [isZoomFit, setIsZoomFit] = useState<boolean>(true);

  if (!image || !image.optimizedUrl) return null;

  const savings = image.optimizedSize 
    ? Math.round(((image.originalSize - image.optimizedSize) / image.originalSize) * 100)
    : 0;

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 25, 300));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 25, 50));

  return (
    <AnimatePresence>
      <div id="comparer-backdrop" className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
        <motion.div
          id="comparer-card"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/50">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-white font-medium text-lg leading-snug truncate max-w-[280px] sm:max-w-md">
                  {image.name}
                </h3>
                <p className="text-slate-400 text-xs font-mono">
                  Comparación original vs. optimizado
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center flex-wrap gap-2">
              {/* Toggle View Mode */}
              <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex gap-1">
                <button
                  id="btn-mode-slider"
                  onClick={() => setViewMode('slider')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'slider'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Deslizador</span>
                </button>
                <button
                  id="btn-mode-side"
                  onClick={() => setViewMode('side-by-side')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    viewMode === 'side-by-side'
                      ? 'bg-emerald-500 text-slate-950 shadow-md'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Lado a Lado</span>
                </button>
              </div>

              {/* Zoom Controls */}
              {!isZoomFit && (
                <div className="bg-slate-950 rounded-xl border border-slate-800 flex items-center p-1">
                  <button
                    id="btn-zoom-out"
                    onClick={handleZoomOut}
                    disabled={zoomLevel <= 50}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                    title="Alejar"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-slate-300 text-xs px-2 font-mono w-12 text-center">
                    {zoomLevel}%
                  </span>
                  <button
                    id="btn-zoom-in"
                    onClick={handleZoomIn}
                    disabled={zoomLevel >= 300}
                    className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none"
                    title="Acercar"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Fit toggle */}
              <button
                id="btn-zoom-fit"
                onClick={() => {
                  setIsZoomFit(!isZoomFit);
                  if (isZoomFit) setZoomLevel(100);
                }}
                className={`p-2.5 rounded-xl border transition-all ${
                  isZoomFit 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                }`}
                title={isZoomFit ? "Ajuste manual de zoom" : "Ajustar a pantalla"}
              >
                {isZoomFit ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                id="btn-comparer-close"
                onClick={onClose}
                className="p-2.5 bg-slate-950 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:bg-slate-900 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Canvas comparison workspace */}
          <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center p-6 select-none">
            
            {viewMode === 'slider' ? (
              /* SLIDER VIEW MODE */
              <div 
                className="relative max-w-full max-h-full rounded-lg overflow-hidden border border-slate-800 bg-slate-900"
                style={{
                  width: isZoomFit ? 'auto' : `${zoomLevel}%`,
                  height: isZoomFit ? 'auto' : 'auto',
                  aspectRatio: `${image.originalWidth} / ${image.originalHeight}`,
                  maxHeight: isZoomFit ? '100%' : 'none',
                }}
              >
                {/* Background image (Optimized WebP - Right side by default) */}
                <img
                  src={image.optimizedUrl}
                  alt="Optimized WebP"
                  className="w-full h-full object-contain pointer-events-none"
                  referrerPolicy="no-referrer"
                />
                
                {/* Top image (Original PNG - Left side by default) clipped dynamically */}
                <div 
                  className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden"
                  style={{
                    clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                  }}
                >
                  <img
                    src={image.originalUrl}
                    alt="Original PNG"
                    className="absolute inset-0 w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* Floating labels */}
                <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs text-white font-medium flex items-center gap-2 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Original (PNG)
                </div>
                <div className="absolute top-4 right-4 bg-emerald-950/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-emerald-500/30 text-xs text-emerald-400 font-medium flex items-center gap-2 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Optimizado (WebP)
                </div>

                {/* Slider bar & drag handle overlay */}
                <div 
                  className="absolute top-0 bottom-0 w-0.5 bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)] pointer-events-none z-20"
                  style={{ left: `${sliderPosition}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-emerald-400 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-950 text-slate-950 cursor-ew-resize">
                    <ArrowLeftRight className="w-4 h-4" />
                  </div>
                </div>

                {/* Accessibility Transparent Input Range Overlay */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={sliderPosition}
                  onChange={(e) => setSliderPosition(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-30"
                  title="Desliza para comparar"
                />
              </div>
            ) : (
              /* SIDE-BY-SIDE VIEW MODE */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full h-full max-h-[100%] items-center overflow-auto py-2">
                
                {/* Original PNG */}
                <div className="flex flex-col h-full justify-between items-center bg-slate-900/30 border border-slate-800/60 rounded-xl p-4 min-h-[300px]">
                  <div className="text-slate-400 text-xs font-medium mb-3 bg-slate-950/80 px-3 py-1.5 rounded-lg border border-slate-800 self-start flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                    Original (PNG)
                  </div>
                  <div 
                    className="flex-1 flex items-center justify-center overflow-hidden w-full max-h-[350px] md:max-h-[450px]"
                    style={{ width: isZoomFit ? '100%' : `${zoomLevel}%` }}
                  >
                    <img
                      src={image.originalUrl}
                      alt="Original"
                      className="max-w-full max-h-full object-contain rounded-lg border border-slate-800/40 bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-white text-sm font-semibold">{formatBytes(image.originalSize)}</p>
                    <p className="text-slate-400 text-xs font-mono mt-0.5">{image.originalWidth} x {image.originalHeight} px</p>
                  </div>
                </div>

                {/* Optimized WebP */}
                <div className="flex flex-col h-full justify-between items-center bg-emerald-950/5 border border-emerald-500/10 rounded-xl p-4 min-h-[300px]">
                  <div className="text-emerald-400 text-xs font-medium mb-3 bg-emerald-950/80 px-3 py-1.5 rounded-lg border border-emerald-500/20 self-start flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    Optimizado (WebP)
                  </div>
                  <div 
                    className="flex-1 flex items-center justify-center overflow-hidden w-full max-h-[350px] md:max-h-[450px]"
                    style={{ width: isZoomFit ? '100%' : `${zoomLevel}%` }}
                  >
                    <img
                      src={image.optimizedUrl}
                      alt="Optimized"
                      className="max-w-full max-h-full object-contain rounded-lg border border-emerald-500/15 bg-slate-950"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="mt-3 text-center">
                    <p className="text-emerald-400 text-sm font-semibold flex items-center justify-center gap-2">
                      <span>{formatBytes(image.optimizedSize || 0)}</span>
                      {savings > 0 && (
                        <span className="bg-emerald-500/10 text-emerald-400 text-xs px-2 py-0.5 rounded-full border border-emerald-500/20">
                          -{savings}% de ahorro
                        </span>
                      )}
                    </p>
                    <p className="text-slate-400 text-xs font-mono mt-0.5">
                      {image.optimizedWidth || image.originalWidth} x {image.optimizedHeight || image.originalHeight} px
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* Footer - Metrics comparison summary banner */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-500" />
                <span>Conversión WebP:</span>
                <span className="text-white font-medium">Mayor velocidad de carga</span>
              </div>
              <span>•</span>
              <div>
                <span>Tamaño inicial:</span>
                <span className="text-slate-200 font-mono font-medium ml-1">{formatBytes(image.originalSize)}</span>
              </div>
              <span>•</span>
              <div>
                <span>Tamaño final:</span>
                <span className="text-emerald-400 font-mono font-medium ml-1">{formatBytes(image.optimizedSize || 0)}</span>
              </div>
            </div>

            {savings > 0 && (
              <div className="flex items-center gap-2">
                <div className="text-right hidden sm:block">
                  <p className="text-slate-400 text-xs">Ahorro total de almacenamiento</p>
                  <p className="text-slate-300 text-xs font-mono">
                    Liberado: <span className="text-emerald-400 font-medium">{formatBytes(image.originalSize - (image.optimizedSize || 0))}</span>
                  </p>
                </div>
                <div className="bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-xl text-lg flex items-center gap-1 shadow-[0_0_15px_rgba(52,211,153,0.2)]">
                  <span>-{savings}%</span>
                  <span className="text-xs font-medium uppercase tracking-wider block leading-tight">Menos<br/>peso</span>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
