'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';

interface CopyUrlButtonProps {
  url: string;
  urlDireto?: string;
}

export function CopyUrlButton({ url, urlDireto }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState<'nps' | 'direto' | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopy = async (type: 'nps' | 'direto') => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const urlToCopy = type === 'direto' && urlDireto ? urlDireto : url;
    const fullUrl = `${baseUrl}${urlToCopy}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(type);
      setShowDropdown(false);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Se não tem URL direto, mostra botão simples
  if (!urlDireto) {
    return (
      <Button
        onClick={() => handleCopy('nps')}
        size="sm"
        variant="outline"
        className={copied === 'nps' ? 'border-green-300 text-green-600 bg-green-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
      >
        {copied === 'nps' ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </Button>
    );
  }

  // Com URL direto, mostra dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        onClick={() => setShowDropdown(!showDropdown)}
        size="sm"
        variant="outline"
        className={copied ? 'border-green-300 text-green-600 bg-green-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
      >
        {copied ? (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={() => handleCopy('nps')}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Link com NPS</p>
              <p className="text-xs text-gray-500">Passa pela pesquisa primeiro</p>
            </div>
          </button>
          <button
            onClick={() => handleCopy('direto')}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Link Direto</p>
              <p className="text-xs text-gray-500">Cadastro sem pesquisa NPS</p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
