'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { uploadPostImages } from '@/actions/posts';

interface MediaUploaderProps {
  images: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function MediaUploader({
  images,
  onChange,
  maxImages = 5,
  disabled = false,
}: MediaUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setError(null);
    setUploading(true);

    try {
      // Verificar limite de imagens
      const remainingSlots = maxImages - images.length;
      if (files.length > remainingSlots) {
        setError(`Você pode adicionar no máximo ${remainingSlots} imagem(ns) mais`);
        setUploading(false);
        return;
      }

      // Criar FormData com os arquivos
      const formData = new FormData();
      Array.from(files).forEach((file) => {
        formData.append('files', file);
      });

      // Upload via server action
      const result = await uploadPostImages(formData);

      if (result.error) {
        setError(result.error);
      } else if (result.data) {
        onChange([...images, ...result.data]);
      }
    } catch {
      setError('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
      // Limpar input para permitir re-upload do mesmo arquivo
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    }
  }, [images, maxImages, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!disabled) {
      handleFiles(e.dataTransfer.files);
    }
  }, [disabled, handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removeImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  }, [images, onChange]);

  const moveImage = useCallback((from: number, to: number) => {
    if (to < 0 || to >= images.length) return;
    const newImages = [...images];
    const [removed] = newImages.splice(from, 1);
    newImages.splice(to, 0, removed);
    onChange(newImages);
  }, [images, onChange]);

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      {/* Área de Drop/Upload */}
      {canAddMore && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center transition-colors
            ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
            ${dragOver ? 'border-purple-500 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}
          `}
          onClick={() => !disabled && inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
            disabled={disabled || uploading}
          />

          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <div className="animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full" />
              <p className="text-gray-600">Fazendo upload...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <p className="text-gray-600">
                Arraste imagens aqui ou <span className="text-purple-600 font-medium">clique para selecionar</span>
              </p>
              <p className="text-sm text-gray-400">
                Até {maxImages} imagens, máx. 5MB cada
              </p>
            </div>
          )}
        </div>
      )}

      {/* Erro */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Preview das Imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {images.map((url, index) => (
            <div
              key={url}
              className="relative aspect-square group rounded-lg overflow-hidden border border-gray-200"
            >
              <Image
                src={url}
                alt={`Imagem ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
              />

              {/* Overlay com ações */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {/* Mover para esquerda */}
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index - 1)}
                    className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                    title="Mover para esquerda"
                  >
                    ←
                  </button>
                )}

                {/* Remover */}
                <button
                  type="button"
                  onClick={() => removeImage(index)}
                  className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600"
                  title="Remover imagem"
                >
                  ✕
                </button>

                {/* Mover para direita */}
                {index < images.length - 1 && (
                  <button
                    type="button"
                    onClick={() => moveImage(index, index + 1)}
                    className="p-1.5 bg-white rounded-full text-gray-700 hover:bg-gray-100"
                    title="Mover para direita"
                  >
                    →
                  </button>
                )}
              </div>

              {/* Badge de posição */}
              {images.length > 1 && (
                <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  {index + 1}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info de limite */}
      {images.length > 0 && (
        <p className="text-sm text-gray-500">
          {images.length} de {maxImages} imagens
        </p>
      )}
    </div>
  );
}
