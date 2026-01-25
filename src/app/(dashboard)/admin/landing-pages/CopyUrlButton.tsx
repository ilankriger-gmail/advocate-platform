'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';
import { Check, Copy, ChevronDown, FileText, Zap } from 'lucide-react';

interface CopyUrlButtonProps {
  url: string;
  urlDireto?: string;
  label?: string;
  variant?: 'primary' | 'secondary' | 'dropdown';
}

export function CopyUrlButton({ url, urlDireto, label, variant = 'dropdown' }: CopyUrlButtonProps) {
  const [copied, setCopied] = useState(false);
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

  const handleCopy = async (urlToCopy: string) => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${baseUrl}${urlToCopy}`;

    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setShowDropdown(false);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erro ao copiar:', err);
    }
  };

  // Modo simples com label (primary ou secondary)
  if (variant === 'primary' || variant === 'secondary') {
    const isPrimary = variant === 'primary';
    return (
      <button
        onClick={() => handleCopy(url)}
        className={`
          px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5
          ${copied 
            ? 'bg-green-100 text-green-700 border border-green-300' 
            : isPrimary
              ? 'bg-green-500 text-white hover:bg-green-600'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
          }
        `}
      >
        {copied ? (
          <Check className="w-3.5 h-3.5" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
        {label || 'Copiar'}
      </button>
    );
  }

  // Modo dropdown (padrão) - com opção NPS e Direto
  if (!urlDireto) {
    return (
      <Button
        onClick={() => handleCopy(url)}
        size="sm"
        variant="outline"
        className={copied ? 'border-green-300 text-green-600 bg-green-50' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
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
          <Check className="w-4 h-4" />
        ) : (
          <>
            <Copy className="w-4 h-4" />
            <ChevronDown className="w-3 h-3 ml-1" />
          </>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          <button
            onClick={() => handleCopy(url)}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <FileText className="w-4 h-4 text-purple-500" />
            <div>
              <p className="font-medium text-gray-900">Link com NPS</p>
              <p className="text-xs text-gray-500">Passa pela pesquisa primeiro</p>
            </div>
          </button>
          <button
            onClick={() => handleCopy(urlDireto)}
            className="w-full px-4 py-2.5 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
          >
            <Zap className="w-4 h-4 text-green-500" />
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
