'use client';

import { useState } from 'react';
import { Button, Input, Textarea } from '@/components/ui';
import { generateDescription } from '@/actions/ai';
import type { ChallengeDescriptionInput } from '@/lib/ai/generate-description';

interface AIDescriptionGeneratorProps {
  challengeData: Omit<ChallengeDescriptionInput, 'idea'>;
  onDescriptionGenerated: (description: string) => void;
}

/**
 * Componente para gerar descrições de desafios usando IA
 */
export function AIDescriptionGenerator({
  challengeData,
  onDescriptionGenerated,
}: AIDescriptionGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedDescription, setGeneratedDescription] = useState<string | null>(null);

  const handleGenerate = async () => {
    setError(null);
    setIsLoading(true);

    const result = await generateDescription({
      ...challengeData,
      idea,
    });

    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Erro ao gerar descrição');
      return;
    }

    setGeneratedDescription(result.description || '');
  };

  const handleUseDescription = () => {
    if (generatedDescription) {
      onDescriptionGenerated(generatedDescription);
      setIsOpen(false);
      setGeneratedDescription(null);
      setIdea('');
    }
  };

  const handleRegenerate = () => {
    setGeneratedDescription(null);
    handleGenerate();
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
      >
        <SparklesIcon className="w-4 h-4" />
        Gerar com IA
      </button>
    );
  }

  return (
    <div className="mt-3 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <SparklesIcon className="w-5 h-5 text-indigo-600" />
          <h3 className="font-medium text-gray-900">Assistente de Descrição</h3>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setGeneratedDescription(null);
            setError(null);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {!generatedDescription ? (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descreva a ideia do desafio
            </label>
            <Textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Ex: A pessoa precisa fazer 50 flexões e gravar um vídeo mostrando a execução completa..."
              rows={3}
              className="bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              Seja específico sobre o que o participante precisa fazer, gravar ou publicar.
            </p>
          </div>

          {error && (
            <div className="mb-3 p-2 bg-red-50 text-red-600 text-sm rounded">
              {error}
            </div>
          )}

          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isLoading || !idea.trim()}
            className="w-full"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <LoadingSpinner />
                Gerando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <SparklesIcon className="w-4 h-4" />
                Gerar Descrição
              </span>
            )}
          </Button>
        </>
      ) : (
        <>
          <div className="mb-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição Gerada
            </label>
            <div className="p-3 bg-white rounded-lg border border-gray-200 text-gray-800">
              {generatedDescription}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleRegenerate}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? <LoadingSpinner /> : 'Gerar Outra'}
            </Button>
            <Button
              type="button"
              onClick={handleUseDescription}
              className="flex-1"
            >
              Usar Esta
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

function SparklesIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
