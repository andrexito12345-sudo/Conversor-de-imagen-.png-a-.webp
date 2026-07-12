import { OptimizationSettings } from '../types';

export function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  if (maxWidth > 0 && width > maxWidth) {
    height = (maxWidth * height) / width;
    width = maxWidth;
  }

  if (maxHeight > 0 && height > maxHeight) {
    width = (maxHeight * width) / height;
    height = maxHeight;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('No se pudo cargar la imagen original. Asegúrate de que es un archivo de imagen válido (PNG, JPG, JPEG, WEBP, AVIF, GIF, BMP, SVG).'));
    img.src = url;
  });
}

export function getImageDimensions(file: File): Promise<{ width: number; height: number; url: string }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        url,
      });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudieron leer las dimensiones de la imagen.'));
    };
    img.src = url;
  });
}

export async function processImageToWebP(
  originalUrl: string,
  originalWidth: number,
  originalHeight: number,
  settings: OptimizationSettings
): Promise<{ blob: Blob; url: string; width: number; height: number }> {
  const img = await loadImage(originalUrl);
  
  // Calcular nuevas dimensiones
  const { width, height } = calculateDimensions(
    originalWidth,
    originalHeight,
    settings.maxWidth,
    settings.maxHeight
  );

  // Crear canvas y dibujar
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('No se pudo obtener el contexto 2D del Canvas.');
  }

  // Limpiar el canvas y dibujar
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(img, 0, 0, width, height);

  // Convertir a blob WebP
  return new Promise((resolve, reject) => {
    const qualityDecimal = settings.quality / 100;
    
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Error al generar el archivo WebP.'));
          return;
        }
        const url = URL.createObjectURL(blob);
        resolve({
          blob,
          url,
          width,
          height,
        });
      },
      'image/webp',
      qualityDecimal
    );
  });
}

export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
