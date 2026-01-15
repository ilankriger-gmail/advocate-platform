'use client';

import { useState, useCallback } from 'react';
import {
  compressImage,
  formatFileSize,
  calculateSavings,
  isValidImageType,
  exceedsMaxSize,
} from '@/lib/image-compression';
import { ImagePlus, X, Loader2, CheckCircle } from 'lucide-react';

interface RewardImageUploaderProps {
  currentUrl?: string | null;
  onImageChange: (base64: string | null) => void;
  disabled?: boolean;
}

interface CompressionInfo {
  originalSize: number;
  compressedSize: number;
  savings: number;
}

/**
 * Componente de upload de imagem para prêmios
 * Com compressão automática e drag-and-drop
 */
export function RewardImageUploader({
  currentUrl,
  onImageChange,
  disabled = false,
}: RewardImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compressionInfo, setCompressionInfo] = useState<CompressionInfo | null>(null);

  const processFile = useCallback(async (file: File) => {
    setError(null);
    setCompressionInfo(null);

    // Validação de tipo
    if (!isValidImageType(file)) {
      setError('Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.');
      return;
    }

    // Validação de tamanho
    if (exceedsMaxSize(file, 10)) {
      setError('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    setIsCompressing(true);

    try {
      const result = await compressImage(file, {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.8,
        format: 'webp',
      });

      setPreview(result.base64);
      setCompressionInfo({
        originalSize: result.originalSize,
        compressedSize: result.compressedSize,
        savings: calculateSavings(result.originalSize, result.compressedSize),
      });
      onImageChange(result.base64);
    } catch (err) {
      console.error('Erro ao comprimir imagem:', err);
      setError('Erro ao processar imagem. Tente novamente.');
    } finally {
      setIsCompressing(false);
    }
  }, [onImageChange]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    // Reset input para permitir selecionar o mesmo arquivo
    e.target.value = '';
  }, [processFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  }, [disabled, processFile]);

  const handleRemove = useCallback(() => {
    setPreview(null);
    setCompressionInfo(null);
    setError(null);
    onImageChange(null);
  }, [onImageChange]);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Imagem do Prêmio
      </label>

      {/* Área de upload / Preview */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg transition-all overflow-hidden
          ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-indigo-400'}
          ${preview ? 'border-solid border-gray-200' : ''}
        `}
      >
        {isCompressing ? (
          // Estado de compressão
          <div className="flex flex-col items-center justify-center py-8 px-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-2" />
            <p className="text-sm text-gray-600">Comprimindo imagem...</p>
          </div>
        ) : preview ? (
          // Preview da imagem
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-48 object-contain bg-gray-50"
            />
            {!disabled && (
              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          // Área de drop
          <label className={`flex flex-col items-center justify-center py-8 px-4 ${disabled ? '' : 'cursor-pointer'}`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              className="hidden"
              disabled={disabled}
            />
            <ImagePlus className={`w-10 h-10 mb-2 ${isDragging ? 'text-indigo-500' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-600 text-center">
              {isDragging ? (
                <span className="text-indigo-600 font-medium">Solte a imagem aqui</span>
              ) : (
                <>
                  <span className="text-indigo-600 font-medium">Clique para enviar</span>
                  {' '}ou arraste uma imagem
                </>
              )}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              JPEG, PNG, WebP ou GIF (máx. 10MB)
            </p>
          </label>
        )}
      </div>

      {/* Informação de compressão */}
      {compressionInfo && (
        <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 px-3 py-2 rounded-lg">
          <CheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Comprimido: {formatFileSize(compressionInfo.originalSize)} → {formatFileSize(compressionInfo.compressedSize)}
            <span className="font-medium ml-1">({compressionInfo.savings}% economia)</span>
          </span>
        </div>
      )}

      {/* Erro */}
      {error && (
        <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}

      {/* Trocar imagem quando já tem preview */}
      {preview && !disabled && !isCompressing && (
        <label className="inline-flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 cursor-pointer">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <ImagePlus className="w-4 h-4" />
          Trocar imagem
        </label>
      )}
    </div>
  );
}
