export interface ImageFile {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalUrl: string;
  
  // Estado de procesamiento
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  
  // Resultados optimizados
  optimizedUrl?: string;
  optimizedSize?: number;
  optimizedWidth?: number;
  optimizedHeight?: number;
}

export type OptimizationPreset = 'balanced' | 'high-compression' | 'high-quality' | 'custom';

export interface OptimizationSettings {
  preset: OptimizationPreset;
  quality: number; // 1 to 100
  maxWidth: number; // 0 means original
  maxHeight: number; // 0 means original
  prefix: string;
  suffix: string;
}
