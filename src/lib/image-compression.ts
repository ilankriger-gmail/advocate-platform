/**
 * Utilitário de compressão de imagem client-side
 * Usa Canvas API nativo para redimensionar e comprimir imagens
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg';
}

export interface CompressionResult {
  blob: Blob;
  base64: string;
  originalSize: number;
  compressedSize: number;
  width: number;
  height: number;
}

const DEFAULT_OPTIONS: Required<CompressionOptions> = {
  maxWidth: 800,
  maxHeight: 800,
  quality: 0.8,
  format: 'webp',
};

/**
 * Verifica se o browser suporta WebP
 */
function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

/**
 * Carrega uma imagem a partir de um File
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calcula as novas dimensões mantendo aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth;
  let height = originalHeight;

  // Se a imagem já é menor que o máximo, não redimensiona
  if (width <= maxWidth && height <= maxHeight) {
    return { width, height };
  }

  // Calcula o ratio de redimensionamento
  const widthRatio = maxWidth / width;
  const heightRatio = maxHeight / height;
  const ratio = Math.min(widthRatio, heightRatio);

  width = Math.round(width * ratio);
  height = Math.round(height * ratio);

  return { width, height };
}

/**
 * Comprime uma imagem usando Canvas API
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const originalSize = file.size;

  // Carrega a imagem
  const img = await loadImage(file);

  // Calcula novas dimensões
  const { width, height } = calculateDimensions(
    img.naturalWidth,
    img.naturalHeight,
    opts.maxWidth,
    opts.maxHeight
  );

  // Cria canvas e desenha a imagem redimensionada
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Não foi possível criar contexto 2D');
  }

  // Desenha com smoothing para melhor qualidade
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // Limpa o object URL
  URL.revokeObjectURL(img.src);

  // Determina o formato de saída
  const useWebP = opts.format === 'webp' && supportsWebP();
  const mimeType = useWebP ? 'image/webp' : 'image/jpeg';

  // Converte para blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Falha ao criar blob da imagem'));
        }
      },
      mimeType,
      opts.quality
    );
  });

  // Converte para base64
  const base64 = await blobToBase64(blob);

  return {
    blob,
    base64,
    originalSize,
    compressedSize: blob.size,
    width,
    height,
  };
}

/**
 * Converte Blob para base64
 */
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Formata tamanho de arquivo para exibição
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Calcula porcentagem de economia
 */
export function calculateSavings(originalSize: number, compressedSize: number): number {
  if (originalSize === 0) return 0;
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

/**
 * Valida se o arquivo é uma imagem suportada
 */
export function isValidImageType(file: File): boolean {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  return validTypes.includes(file.type);
}

/**
 * Verifica se o arquivo excede o tamanho máximo
 */
export function exceedsMaxSize(file: File, maxSizeMB: number = 10): boolean {
  return file.size > maxSizeMB * 1024 * 1024;
}
