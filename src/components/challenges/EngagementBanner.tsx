'use client';

import { Heart, MessageCircle, UserPlus, Share2, Bookmark, ThumbsUp } from 'lucide-react';

const ENGAGEMENT_ACTIONS = [
  { icon: ThumbsUp, label: 'Curtir', hearts: 1 },
  { icon: MessageCircle, label: 'Comentar', hearts: 1 },
  { icon: Share2, label: 'Compartilhar', hearts: 1 },
  { icon: Bookmark, label: 'Salvar', hearts: 1 },
  { icon: UserPlus, label: 'Seguir', hearts: 1 },
];

export function EngagementBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 rounded-2xl shadow-xl shadow-pink-500/20">
      {/* Padrão de fundo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjAgMTBjNS41MjMgMCAxMCA0LjQ3NyAxMCAxMHMtNC40NzcgMTAtMTAgMTAtMTAtNC40NzctMTAtMTAgNC40NzctMTAgMTAtMTB6IiBmaWxsPSJub25lIiBzdHJva2U9IiNmZmYiIHN0cm9rZS13aWR0aD0iMiIvPjwvc3ZnPg==')]" />
      </div>

      <div className="relative p-4 sm:p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <Heart className="w-6 h-6 text-white fill-white" />
          </div>
          <div>
            <h2 className="text-white font-bold text-lg sm:text-xl">
              Todo engajamento vale corações!
            </h2>
            <p className="text-pink-100 text-sm">
              Cada ação na comunidade = 1 coração ❤️
            </p>
          </div>
        </div>

        {/* Lista de ações */}
        <div className="flex flex-wrap gap-2">
          {ENGAGEMENT_ACTIONS.map(({ icon: Icon, label, hearts }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 backdrop-blur rounded-full text-white text-sm"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
              <span className="font-bold">+{hearts}❤️</span>
            </div>
          ))}
        </div>

        {/* Call to action */}
        <div className="mt-4 p-3 bg-white/10 backdrop-blur rounded-xl border border-white/20">
          <p className="text-white text-sm text-center">
            💡 <strong>Dica:</strong> Quanto mais você interage, mais corações acumula para trocar por prêmios!
          </p>
        </div>
      </div>
    </div>
  );
}
