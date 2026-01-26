'use client';

import { useState, useEffect } from 'react';
import { Gift, Copy, Share2, Check, Users, Heart } from 'lucide-react';
import { Card } from '@/components/ui';
import { getMyReferralCode, getReferralLink } from '@/actions/referrals';

interface ReferralStats {
  code: string | null;
  link: string | null;
  totalReferred: number;
  totalEarned: number;
}

export function ReferralCard() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadReferralData() {
      try {
        const [codeData, link] = await Promise.all([
          getMyReferralCode(),
          getReferralLink()
        ]);
        setStats({
          code: codeData.code,
          link,
          totalReferred: codeData.totalReferred,
          totalEarned: codeData.totalEarned,
        });
      } catch (error) {
        console.error('Erro ao carregar dados de indicação:', error);
      } finally {
        setLoading(false);
      }
    }
    loadReferralData();
  }, []);

  const handleCopy = async () => {
    if (!stats?.link) return;
    try {
      await navigator.clipboard.writeText(stats.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback para mobile
      const textArea = document.createElement('textarea');
      textArea.value = stats.link;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (!stats?.link) return;
    
    const shareText = `🎁 Entra na comunidade Arena Te Amo e ganha 100 corações! Use meu link:`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Arena Te Amo - Convite',
          text: shareText,
          url: stats.link,
        });
      } catch {
        // Usuário cancelou ou erro
      }
    } else {
      // Fallback: copiar
      handleCopy();
    }
  };

  if (loading) {
    return (
      <Card className="animate-pulse bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200">
        <div className="p-6 space-y-4">
          <div className="h-8 bg-amber-200 rounded w-2/3"></div>
          <div className="h-12 bg-amber-200 rounded"></div>
          <div className="h-10 bg-amber-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!stats?.code) {
    return null;
  }

  return (
    <Card className="relative overflow-hidden border-2 border-amber-400 shadow-xl shadow-amber-200/50">
      {/* Background decorativo */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-400 via-orange-400 to-red-400 opacity-10" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/20 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-400/20 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative p-5 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
            <Gift className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-lg text-gray-900">Indique e Ganhe!</h3>
            <p className="text-sm text-amber-700">Você e seu amigo ganham 100 ❤️</p>
          </div>
        </div>

        {/* Explicação */}
        <div className="bg-white/70 backdrop-blur rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xl">👉</span>
            <span className="text-gray-700">Compartilhe seu link com amigos</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xl">✨</span>
            <span className="text-gray-700">Quando ele se cadastrar, vocês dois ganham <strong>100 corações</strong></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-xl">🎁</span>
            <span className="text-gray-700">E você ainda ganha bônus em cascata!</span>
          </div>
        </div>

        {/* Código e Link */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Seu código de indicação
          </label>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white border-2 border-amber-300 rounded-xl px-4 py-3 font-mono font-bold text-lg text-amber-800 text-center">
              {stats.code}
            </div>
            <button
              onClick={handleCopy}
              className={`p-3 rounded-xl transition-all min-w-[52px] flex items-center justify-center ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              }`}
              title="Copiar link"
            >
              {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {copied && (
            <p className="text-center text-green-600 text-sm font-medium animate-in fade-in duration-200">
              ✅ Link copiado!
            </p>
          )}
        </div>

        {/* Botão de compartilhar */}
        <button
          onClick={handleShare}
          className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/30 transition-all"
        >
          <Share2 className="w-5 h-5" />
          Compartilhar Link
        </button>

        {/* Estatísticas */}
        {(stats.totalReferred > 0 || stats.totalEarned > 0) && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-white/70 backdrop-blur rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-amber-600">
                <Users className="w-4 h-4" />
                <span className="text-2xl font-bold">{stats.totalReferred}</span>
              </div>
              <p className="text-xs text-gray-500">Amigos indicados</p>
            </div>
            <div className="bg-white/70 backdrop-blur rounded-xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-pink-600">
                <Heart className="w-4 h-4 fill-pink-600" />
                <span className="text-2xl font-bold">{stats.totalEarned}</span>
              </div>
              <p className="text-xs text-gray-500">Corações ganhos</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
