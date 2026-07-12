import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  Image as ImageIcon, 
  Download, 
  Trash2, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Sliders, 
  Maximize2, 
  Sparkles, 
  RefreshCw, 
  FileImage, 
  Info, 
  X, 
  Heart,
  Coins,
  ArrowRight
} from 'lucide-react';
import { ImageFile, OptimizationPreset, OptimizationSettings } from './types';
import { 
  getImageDimensions, 
  processImageToWebP, 
  formatBytes 
} from './utils/imageProcessor';
import ImageComparer from './components/ImageComparer';

// Configuraciones iniciales recomendadas
const DEFAULT_SETTINGS: OptimizationSettings = {
  preset: 'balanced',
  quality: 80,
  maxWidth: 1920,
  maxHeight: 0,
  prefix: '',
  suffix: '-optimized',
};

export default function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [settings, setSettings] = useState<OptimizationSettings>(DEFAULT_SETTINGS);
  const [activeCompareImage, setActiveCompareImage] = useState<ImageFile | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hasChangedSettings, setHasChangedSettings] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Limpieza de URLs creadas al desmontar
  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.originalUrl);
        if (img.optimizedUrl) URL.revokeObjectURL(img.optimizedUrl);
      });
    };
  }, []);

  // Función para procesar una sola imagen
  const processSingleImage = async (imgId: string, currentSettings: OptimizationSettings, fallbackImg?: ImageFile) => {
    setImages(prev => prev.map(img => 
      img.id === imgId ? { ...img, status: 'processing', progress: 30 } : img
    ));

    const targetImg = fallbackImg || images.find(img => img.id === imgId);
    if (!targetImg) return;

    try {
      setImages(prev => prev.map(img => 
        img.id === imgId ? { ...img, progress: 60 } : img
      ));

      const result = await processImageToWebP(
        targetImg.originalUrl,
        targetImg.originalWidth,
        targetImg.originalHeight,
        currentSettings
      );

      setImages(prev => prev.map(img => {
        if (img.id === imgId) {
          // Si ya tenía una URL optimizada previa, la revocamos para no fugar memoria
          if (img.optimizedUrl) URL.revokeObjectURL(img.optimizedUrl);
          return {
            ...img,
            status: 'completed',
            progress: 100,
            optimizedUrl: result.url,
            optimizedSize: result.blob.size,
            optimizedWidth: result.width,
            optimizedHeight: result.height,
          };
        }
        return img;
      }));
    } catch (error: any) {
      console.error(error);
      setImages(prev => prev.map(img => 
        img.id === imgId ? { 
          ...img, 
          status: 'error', 
          progress: 0, 
          error: error.message || 'Error al optimizar' 
        } : img
      ));
    }
  };

  // Manejar la adición de nuevos archivos
  const handleFilesAdded = async (filesList: FileList | null) => {
    if (!filesList) return;
    const files = Array.from(filesList);
    
    const newImageFiles: ImageFile[] = [];

    for (const file of files) {
      // Validar si es PNG (o cualquier imagen soportada)
      const isPNG = file.type === 'image/png' || file.name.toLowerCase().endsWith('.png');
      
      try {
        const dimensions = await getImageDimensions(file);
        
        const newImg: ImageFile = {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          originalSize: file.size,
          originalWidth: dimensions.width,
          originalHeight: dimensions.height,
          originalUrl: dimensions.url,
          status: 'pending',
          progress: 0,
        };
        
        newImageFiles.push(newImg);
      } catch (err) {
        console.error('Error cargando archivo:', file.name, err);
      }
    }

    if (newImageFiles.length === 0) return;

    // Agregar a la lista de imágenes
    setImages(prev => [...prev, ...newImageFiles]);

    // Procesar automáticamente en segundo plano
    for (const img of newImageFiles) {
      await processSingleImage(img.id, settings, img);
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  // Cambiar preajustes (Presets)
  const applyPreset = (preset: OptimizationPreset) => {
    let updatedSettings: OptimizationSettings;
    
    switch (preset) {
      case 'high-compression':
        updatedSettings = {
          ...settings,
          preset,
          quality: 55,
          maxWidth: 1200,
        };
        break;
      case 'high-quality':
        updatedSettings = {
          ...settings,
          preset,
          quality: 92,
          maxWidth: 0, // Sin límite de tamaño
        };
        break;
      case 'balanced':
      default:
        updatedSettings = {
          ...settings,
          preset,
          quality: 80,
          maxWidth: 1920,
        };
        break;
    }
    
    setSettings(updatedSettings);
    setHasChangedSettings(true);
  };

  // Manejar cambios manuales de configuración
  const handleSettingChange = (key: keyof OptimizationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
      preset: 'custom', // Al tocar algo manual, pasa a preajuste "Personalizado"
    }));
    setHasChangedSettings(true);
  };

  // Re-optimizar todo con la nueva configuración
  const reoptimizeAllImages = async () => {
    setHasChangedSettings(false);
    for (const img of images) {
      await processSingleImage(img.id, settings, img);
    }
  };

  // Eliminar una imagen de la lista
  const deleteImage = (id: string) => {
    const imgToDelete = images.find(img => img.id === id);
    if (imgToDelete) {
      URL.revokeObjectURL(imgToDelete.originalUrl);
      if (imgToDelete.optimizedUrl) URL.revokeObjectURL(imgToDelete.optimizedUrl);
    }
    setImages(prev => prev.filter(img => img.id !== id));
  };

  // Limpiar todos los archivos
  const clearAll = () => {
    images.forEach(img => {
      URL.revokeObjectURL(img.originalUrl);
      if (img.optimizedUrl) URL.revokeObjectURL(img.optimizedUrl);
    });
    setImages([]);
    setHasChangedSettings(false);
  };

  // Descargar una imagen individual
  const downloadSingleImage = (img: ImageFile) => {
    if (!img.optimizedUrl) return;
    
    // Preparar el nombre del archivo de salida
    const originalNameNoExt = img.name.substring(0, img.name.lastIndexOf('.')) || img.name;
    const cleanPrefix = settings.prefix.trim();
    const cleanSuffix = settings.suffix.trim();
    const finalName = `${cleanPrefix}${originalNameNoExt}${cleanSuffix}.webp`;

    const link = document.createElement('a');
    link.href = img.optimizedUrl;
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Descargar todas las optimizadas secuencialmente con un pequeño retraso
  const downloadAll = async () => {
    const completedImages = images.filter(img => img.status === 'completed');
    for (let i = 0; i < completedImages.length; i++) {
      downloadSingleImage(completedImages[i]);
      // Pequeño delay de 150ms para no saturar el navegador y evitar bloqueos de popups
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  };

  // Calcular métricas globales de ahorro
  const completedImages = images.filter(img => img.status === 'completed');
  const totalOriginalSize = completedImages.reduce((sum, img) => sum + img.originalSize, 0);
  const totalOptimizedSize = completedImages.reduce((sum, img) => sum + (img.optimizedSize || 0), 0);
  const totalSavingsBytes = Math.max(0, totalOriginalSize - totalOptimizedSize);
  const totalSavingsPercentage = totalOriginalSize > 0 
    ? Math.round((totalSavingsBytes / totalOriginalSize) * 100) 
    : 0;

  // Obtener texto de recomendación basado en la calidad actual
  const getQualityGuideline = (q: number) => {
    if (q < 60) return { text: "⚠️ Calidad baja (Ultra-Compresión): Excelente peso pero pueden aparecer distorsiones o grano fino.", color: "text-amber-700 bg-amber-50 border-amber-200/60" };
    if (q >= 60 && q < 75) return { text: "🚀 Calidad móvil optimizada: Carga instantánea con calidad ideal para pantallas pequeñas.", color: "text-emerald-700 bg-emerald-50 border-emerald-200/60" };
    if (q >= 75 && q <= 85) return { text: "🎯 Calidad Equilibrada (Recomendada): El balance perfecto de compresión web sin pérdidas visibles.", color: "text-blue-700 bg-blue-50 border-blue-200/60" };
    if (q > 85 && q <= 95) return { text: "✨ Alta Fidelidad: Retiene el máximo detalle para banners principales o catálogos exigentes.", color: "text-indigo-700 bg-indigo-50 border-indigo-200/60" };
    return { text: "💎 Calidad Profesional (Sin pérdida aparente): Muy cercana al PNG original, compresión moderada.", color: "text-purple-700 bg-purple-50 border-purple-200/60" };
  };

  const guideline = getQualityGuideline(settings.quality);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      
      {/* Header */}
      <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)] font-extrabold text-lg">
              W
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-[#1E293B] tracking-tight flex items-center gap-2">
                WebP Express
                <span className="bg-blue-50 border border-blue-200 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                  Multiformato
                </span>
              </h1>
              <p className="text-[#64748B] text-xs">Optimiza tus imágenes al instante y sin límites</p>
            </div>
          </div>
          
          <div className="hidden sm:flex items-center gap-2 text-xs text-[#64748B] bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-medium">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Seguro: Procesamiento 100% en el Navegador</span>
          </div>
        </div>
      </header>

      {/* Main Workspace - Bento Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Drag-and-Drop Area & File List (Bento Column span 8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* File Upload Dropzone */}
          <div
            id="dropzone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-3xl border-2 border-dashed p-8 text-center cursor-pointer transition-all duration-300 group ${
              isDragging 
                ? 'border-blue-500 bg-blue-500/5 shadow-[0_0_25px_rgba(37,99,235,0.1)]' 
                : 'border-slate-200 bg-white hover:bg-slate-50/50 hover:border-slate-300 shadow-sm'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFilesAdded(e.target.files)}
              className="hidden"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif, image/avif, image/bmp, image/svg+xml"
              multiple
            />
            
            <div className="flex flex-col items-center justify-center gap-3">
              <div className={`p-4 rounded-full bg-slate-50 border border-slate-100 text-slate-400 transition-all duration-300 group-hover:scale-110 group-hover:border-blue-500/30 group-hover:text-blue-600 ${
                isDragging ? 'scale-110 border-blue-500 text-blue-600 shadow-sm' : ''
              }`}>
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-slate-800 font-bold text-base">
                  Arrastra tus imágenes aquí o <span className="text-blue-600 font-bold group-hover:underline">selecciona archivos</span>
                </p>
                <p className="text-[#64748B] text-xs mt-1">
                  Soporta PNG, JPEG, JPG, WEBP, GIF, AVIF, BMP, SVG. Procesamiento 100% local.
                </p>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">MÁX: ILIMITADO</span>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">ENTRADAS: MULTIFORMATO</span>
                <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-2 py-0.5 rounded border border-slate-200">SALIDA: .WEBP</span>
              </div>
            </div>
          </div>

          {/* List of Images */}
          {images.length > 0 ? (
            <div className="flex-1 flex flex-col gap-4">
              
              {/* Batch Actions and Counters */}
              <div className="flex items-center justify-between bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
                <div className="text-xs text-[#64748B] font-medium">
                  Total cargados:{' '}
                  <span className="text-slate-800 font-bold font-mono">{images.length}</span>
                  {completedImages.length > 0 && (
                    <span>
                      {' '}| Completados:{' '}
                      <span className="text-blue-600 font-bold font-mono">
                        {completedImages.length}
                      </span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {completedImages.length > 0 && (
                    <button
                      id="btn-download-all"
                      onClick={downloadAll}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg shadow-sm hover:shadow-blue-500/10 transition-all cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Descargar Todas ({completedImages.length})</span>
                    </button>
                  )}
                  <button
                    id="btn-clear-all"
                    onClick={clearAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-600 hover:text-red-600 text-xs rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Limpiar Todo</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Re-optimize Notice */}
              <AnimatePresence>
                {hasChangedSettings && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="bg-blue-50 border border-blue-200 p-3 rounded-2xl flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2 text-blue-700 font-medium">
                      <Info className="w-4 h-4 flex-shrink-0 text-blue-600" />
                      <span>Los parámetros cambiaron. ¿Deseas volver a procesar todas las fotos con los nuevos ajustes?</span>
                    </div>
                    <button
                      id="btn-apply-settings"
                      onClick={reoptimizeAllImages}
                      className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-500 transition-colors shrink-0 cursor-pointer"
                    >
                      Aplicar y Re-optimizar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Images Queue List */}
              <div className="space-y-3">
                {images.map((img) => {
                  const hasSavings = img.optimizedSize && img.optimizedSize < img.originalSize;
                  const itemSavings = hasSavings && img.optimizedSize
                    ? Math.round(((img.originalSize - img.optimizedSize) / img.originalSize) * 100)
                    : 0;

                  return (
                    <div
                      key={img.id}
                      className="bg-white border border-slate-200/80 rounded-2xl p-4 hover:border-slate-300 transition-all flex flex-col sm:flex-row items-center gap-4 group shadow-sm"
                    >
                      {/* Left: Thumbnail & basic data */}
                      <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative">
                        <img
                          src={img.originalUrl}
                          alt={img.name}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-4 h-4 text-white" />
                        </div>
                      </div>

                      {/* Middle: Name & Sizes comparison */}
                      <div className="flex-1 min-w-0 text-center sm:text-left">
                        <h4 className="text-[#1E293B] text-sm font-bold truncate" title={img.name}>
                          {img.name}
                        </h4>
                        
                        {/* Sizes */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-2 gap-y-1 mt-1 text-xs text-[#64748B] font-mono">
                          <span>{formatBytes(img.originalSize)}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          
                          {img.status === 'completed' && img.optimizedSize ? (
                            <span className="text-emerald-600 font-bold">
                              {formatBytes(img.optimizedSize)}
                            </span>
                          ) : img.status === 'processing' ? (
                            <span className="text-blue-500 italic">Optimizando...</span>
                          ) : img.status === 'error' ? (
                            <span className="text-red-500">Error</span>
                          ) : (
                            <span className="text-slate-400">En espera</span>
                          )}
                          
                          {img.originalWidth > 0 && (
                            <span className="text-slate-400 text-[10px]">
                              • {img.originalWidth}x{img.originalHeight} px
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Savings pill & actions */}
                      <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                        {/* Saving badge */}
                        {img.status === 'completed' && itemSavings > 0 && (
                          <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold font-mono">
                            -{itemSavings}% 🔥
                          </div>
                        )}

                        {/* Status label if pending / error */}
                        {img.status === 'processing' && (
                          <div className="w-16 h-1 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 transition-all duration-300" 
                              style={{ width: `${img.progress}%` }}
                            />
                          </div>
                        )}

                        {img.status === 'error' && (
                          <span className="text-xs text-red-600 bg-red-50 px-2.5 py-1 rounded border border-red-200 flex items-center gap-1 max-w-[200px] truncate" title={img.error}>
                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                            {img.error}
                          </span>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-1.5 self-stretch sm:self-auto justify-center">
                          {img.status === 'completed' && (
                            <>
                              <button
                                id={`btn-compare-${img.id}`}
                                onClick={() => setActiveCompareImage(img)}
                                className="p-2 bg-white border border-slate-200 hover:border-slate-300 hover:text-slate-800 rounded-lg text-slate-600 transition-colors flex items-center gap-1.5 text-xs font-bold shadow-sm cursor-pointer"
                                title="Ver comparación visual"
                              >
                                <Maximize2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Comparar</span>
                              </button>
                              
                              <button
                                id={`btn-download-${img.id}`}
                                onClick={() => downloadSingleImage(img)}
                                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium shadow-sm cursor-pointer"
                                title="Descargar WebP"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          
                          <button
                            id={`btn-delete-${img.id}`}
                            onClick={() => deleteImage(img.id)}
                            className="p-2 bg-white border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                            title="Eliminar de la lista"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* Empty State */
            <div className="flex-1 border border-slate-200/80 rounded-3xl bg-white p-12 text-center flex flex-col items-center justify-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4">
                <FileImage className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-slate-800 font-bold text-base">No hay archivos en cola</h3>
              <p className="text-[#64748B] text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                Sube o arrastra tus imágenes en el recuadro superior para convertirlas a WebP y optimizarlas automáticamente para tu web.
              </p>
            </div>
          )}

        </div>

        {/* Right Side: Optimization & Compressing Settings panel (Bento Column span 4) */}
        <div className="w-full lg:col-span-4 flex flex-col gap-6">
          
          {/* Settings Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Settings className="w-4 h-4 text-blue-600" />
              <h3 className="text-[#1E293B] font-bold text-sm">Ajustes de Optimización</h3>
            </div>

            {/* Presets Grid */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Preajuste de Compresión</label>
              <div className="grid grid-cols-1 gap-2">
                
                {/* Preset: Balanced */}
                <button
                  id="preset-balanced"
                  onClick={() => applyPreset('balanced')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.preset === 'balanced'
                      ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Equilibrado (Recomendado)</span>
                    {settings.preset === 'balanced' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                    Calidad 80%, Max Ancho 1920px. Ideal para la mayoría de webs.
                  </p>
                </button>

                {/* Preset: High Compression */}
                <button
                  id="preset-high-comp"
                  onClick={() => applyPreset('high-compression')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.preset === 'high-compression'
                      ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Alta Compresión (Mobile)</span>
                    {settings.preset === 'high-compression' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                    Calidad 55%, Max Ancho 1200px. Diseñado para cargar ultra rápido.
                  </p>
                </button>

                {/* Preset: High Quality */}
                <button
                  id="preset-high-quality"
                  onClick={() => applyPreset('high-quality')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    settings.preset === 'high-quality'
                      ? 'bg-blue-50 border-blue-200 text-blue-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Máxima Fidelidad</span>
                    {settings.preset === 'high-quality' && (
                      <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                    Calidad 92%, Tamaño Original. Sin pérdida de detalle visible.
                  </p>
                </button>

                {/* Preset: Custom */}
                <div
                  className={`p-3 rounded-xl border text-left ${
                    settings.preset === 'custom'
                      ? 'bg-slate-50 border-slate-200 text-slate-800'
                      : 'bg-slate-50/20 border-slate-100 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Ajustes Personalizados</span>
                    {settings.preset === 'custom' && (
                      <span className="bg-blue-50 border border-blue-150 text-blue-600 text-[9px] px-1.5 py-0.5 rounded font-mono font-semibold">
                        ACTIVO
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                    Edita los parámetros manuales abajo para adaptarlos a tu gusto.
                  </p>
                </div>

              </div>
            </div>

            {/* Quality Slider */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <label className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Calidad WebP</label>
                <span className="text-xs font-bold font-mono text-blue-600">{settings.quality}%</span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                value={settings.quality}
                onChange={(e) => handleSettingChange('quality', Number(e.target.value))}
                className="w-full accent-blue-600 h-1.5 bg-slate-100 rounded-lg cursor-pointer"
              />
              
              {/* Dynamic Guidance Warning */}
              <div className={`p-2.5 rounded-xl border text-[10px] leading-relaxed transition-all duration-300 ${guideline.color}`}>
                {guideline.text}
              </div>
            </div>

            {/* Sizing Limit */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Limitar Ancho Máximo (px)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={settings.maxWidth === 0 ? '' : settings.maxWidth}
                  onChange={(e) => {
                    const val = e.target.value === '' ? 0 : Math.max(0, Number(e.target.value));
                    handleSettingChange('maxWidth', val);
                  }}
                  placeholder="Sin límite (Original)"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-[#1E293B] w-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                />
                
                {/* Fast size picks */}
                <select
                  value={settings.maxWidth}
                  onChange={(e) => handleSettingChange('maxWidth', Number(e.target.value))}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                >
                  <option value={0}>Original</option>
                  <option value={800}>800px</option>
                  <option value={1200}>1200px</option>
                  <option value={1920}>1920px</option>
                  <option value={2560}>2K (2560)</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                Las imágenes que superen este ancho se redimensionarán proporcionalmente preservando el ratio.
              </p>
            </div>

            {/* Filename modifier */}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-[#64748B] font-bold uppercase tracking-wider">Nombre de Archivos de Salida</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Prefijo</span>
                  <input
                    type="text"
                    value={settings.prefix}
                    onChange={(e) => handleSettingChange('prefix', e.target.value)}
                    placeholder="Ninguno"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-[#1E293B] w-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block mb-1">Sufijo</span>
                  <input
                    type="text"
                    value={settings.suffix}
                    onChange={(e) => handleSettingChange('suffix', e.target.value)}
                    placeholder="Ninguno"
                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-mono text-[#1E293B] w-full focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-600"
                  />
                </div>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] text-slate-500 font-mono">
                Ej: imagen.png → <span className="text-blue-600 font-bold">{settings.prefix || ''}imagen{settings.suffix || ''}.webp</span>
              </div>
            </div>

          </div>

          {/* Savings summary banner (Total metrics) */}
          {completedImages.length > 0 && totalSavingsBytes > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-3xl p-6 flex flex-col gap-4 relative overflow-hidden shadow-md"
            >
              {/* background graphic element */}
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-4 translate-y-4">
                <Sparkles className="w-32 h-32 text-white" />
              </div>

              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-white" />
                <h4 className="text-white text-xs font-extrabold uppercase tracking-wider">Ahorro en este Lote</h4>
              </div>

              <div>
                <p className="text-xs text-blue-100">Ahorro total de almacenamiento:</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-5xl font-extrabold font-mono tracking-tight text-white">
                    {totalSavingsPercentage}%
                  </span>
                  <span className="text-xs text-blue-100 font-bold">MENOR PESO</span>
                </div>
              </div>

              <div className="bg-white/10 p-4 rounded-xl border border-white/15">
                <div className="text-xs text-blue-100 mb-1">Carga de red estimada</div>
                <div className="font-extrabold text-white text-sm">+{totalSavingsPercentage * 5}% carga más rápida</div>
              </div>

              <div className="border-t border-white/15 pt-3.5 flex flex-col gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-blue-100">Total Original:</span>
                  <span className="font-mono font-bold">{formatBytes(totalOriginalSize)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-100">Total WebP Optimizado:</span>
                  <span className="font-mono font-bold text-emerald-300">{formatBytes(totalOptimizedSize)}</span>
                </div>
                <div className="flex justify-between border-t border-white/10 mt-1.5 pt-1.5 text-white">
                  <span className="font-bold">Espacio Liberado:</span>
                  <span className="font-mono font-bold text-emerald-300">{formatBytes(totalSavingsBytes)}</span>
                </div>
              </div>
            </motion.div>
          )}

        </div>

      </main>

      {/* Visual Image Comparer Slide Overlay Modal */}
      <ImageComparer
        image={activeCompareImage}
        onClose={() => setActiveCompareImage(null)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-[#64748B] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 justify-center">
            <span>Desarrollado con</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>para una web más ágil y rápida</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} WebP Express • Procesamiento 100% en local</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
