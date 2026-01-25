'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui';
import { CopyUrlButton } from './CopyUrlButton';
import { ExternalLink, Eye, EyeOff, ChevronDown } from 'lucide-react';

interface LPItem {
  id: string;
  title?: string;
  name?: string;
  icon?: string;
  type?: string;
  is_active: boolean;
  thumbnail_url?: string;
  image_url?: string;
  leadsCount: number;
  lpType: 'desafio' | 'premio';
  lpUrl: string;
  lpUrlDireto: string;
}

interface LPTypeSectionProps {
  title: string;
  icon: string;
  color: string;
  bgColor: string;
  items: LPItem[];
  defaultOpen?: boolean;
}

export function LPTypeSection({ title, icon, color, bgColor, items, defaultOpen = true }: LPTypeSectionProps) {
  // Força aberto por padrão - sempre inicia true
  const [isOpen, setIsOpen] = useState(true);
  
  const activeCount = items.filter(i => i.is_active).length;
  const totalLeads = items.reduce((acc, i) => acc + i.leadsCount, 0);

  return (
    <section className="space-y-3">
      {/* Header clicável */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 ${bgColor} hover:opacity-90 transition-all`}
      >
        <span className="text-3xl">{icon}</span>
        <div className="flex-1 text-left">
          <h2 className={`text-lg font-bold ${color}`}>{title}</h2>
          <p className="text-sm text-gray-500">
            {activeCount} ativas • {totalLeads} leads capturados
          </p>
        </div>
        <Badge className={`${bgColor} ${color} border text-base px-3 py-1`}>
          {items.length}
        </Badge>
        <ChevronDown 
          className={`w-6 h-6 ${color} transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Lista de LPs */}
      {isOpen && (
        <div className="grid gap-3 pl-2">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              Nenhum item cadastrado
            </div>
          ) : (
            items.map((item) => {
              const displayName = item.title || item.name || 'Sem nome';
              const imageUrl = item.thumbnail_url || item.image_url;
              
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-4 p-4 bg-white border rounded-xl hover:shadow-md transition-all ${!item.is_active ? 'opacity-50' : ''}`}
                >
                  {/* Imagem/Ícone */}
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {imageUrl ? (
                      <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : item.icon ? (
                      <span className="text-2xl">{item.icon}</span>
                    ) : (
                      <span className="text-2xl">{item.lpType === 'desafio' ? '🎯' : '🎁'}</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{displayName}</h3>
                      {!item.is_active && (
                        <Badge className="bg-gray-100 text-gray-500 text-xs flex items-center gap-1">
                          <EyeOff className="w-3 h-3" />
                          Oculto
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        👥 {item.leadsCount} leads
                      </span>
                      {item.type && (
                        <Badge className="bg-gray-100 text-gray-600 text-xs">
                          {item.type}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* URLs e Ações */}
                  <div className="flex items-center gap-2">
                    {/* LP com NPS */}
                    <div className="flex items-center gap-1">
                      <CopyUrlButton 
                        url={item.lpUrl} 
                        label="NPS"
                        variant="secondary"
                      />
                      <a
                        href={item.lpUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Abrir LP com NPS"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    {/* LP Direto */}
                    <div className="flex items-center gap-1">
                      <CopyUrlButton 
                        url={item.lpUrlDireto} 
                        label="Direto"
                        variant="primary"
                      />
                      <a
                        href={item.lpUrlDireto}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Abrir LP Direto"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>

                    {/* Link para editar */}
                    <Link
                      href={item.lpType === 'desafio' 
                        ? `/admin/desafios/${item.id}` 
                        : `/admin/premios`}
                      className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Gerenciar"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
}
