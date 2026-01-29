'use client';

import { useState } from 'react';
import { Bug, X, Send, CheckCircle } from 'lucide-react';
import { submitBugReport } from '@/actions/feedback';

export function ReportBugButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      await submitBugReport({
        description,
        url: window.location.href,
        userAgent: navigator.userAgent,
      });
      setSubmitted(true);
      setDescription('');
      setTimeout(() => {
        setIsOpen(false);
        setSubmitted(false);
      }, 2000);
    } catch (error) {
      console.error('Erro ao enviar bug:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Botão flutuante chamativo */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white rounded-full shadow-xl shadow-red-500/30 transition-all hover:scale-105 animate-pulse-slow"
        title="Reportar um bug"
      >
        <Bug className="w-5 h-5" />
        <span className="text-sm font-bold">Reportar Bug</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bug className="w-6 h-6 text-white" />
                <h3 className="text-lg font-bold text-white">Reportar Bug</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4">
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h4 className="text-xl font-bold text-gray-900 mb-2">Obrigado!</h4>
                  <p className="text-gray-600">Seu feedback foi enviado.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Descreva o problema
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="O que aconteceu? O que você esperava que acontecesse?"
                      rows={4}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  <p className="text-xs text-gray-500">
                    📍 Página: {typeof window !== 'undefined' ? window.location.pathname : ''}
                  </p>

                  <button
                    type="submit"
                    disabled={isSubmitting || !description.trim()}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {isSubmitting ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Enviar Relatório
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes scale-in {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.2s ease-out;
        }
        @keyframes pulse-slow {
          0%, 100% { box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3); }
          50% { box-shadow: 0 4px 25px rgba(239, 68, 68, 0.5); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
