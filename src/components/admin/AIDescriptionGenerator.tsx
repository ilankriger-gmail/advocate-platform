'use client';

import { useState } from 'react';
import { generateDescription } from '@/actions/ai';
import type { ChallengeDescriptionInput } from '@/lib/ai/generate-description';

interface AIDescriptionGeneratorProps {
  challengeData: ChallengeDescriptionInput;
  onDescriptionGenerated: (description: string) => void;
}

/**
 * Botão para gerar descrições de desafios usando IA
 */
export function AIDescriptionGenerator({
  challengeData,
  onDescriptionGenerated,
}: AIDescriptionGeneratorProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = async () => {
    if (!challengeData.title || challengeData.title.trim().length < 3) {
      return;
    }

    setIsLoading(true);

    const result = await generateDescription(challengeData);

    setIsLoading(false);

    if (result.success && result.description) {
      onDescriptionGenerated(result.description);
    }
  };

  const isDisabled = isLoading || !challengeData.title || challengeData.title.trim().length < 3;

  return (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={isDisabled}
      className={`inline-flex items-center gap-1.5 text-sm font-medium transition-colors ${
        isDisabled
          ? 'text-gray-400 cursor-not-allowed'
          : 'text-indigo-600 hover:text-indigo-700'
      }`}
    >
      {isLoading ? (
        <>
          <LoadingSpinner />
          Gerando...
        </>
      ) : (
        <>
          <SparklesIcon className="w-4 h-4" />
          Gerar com IA
        </>
      )}
    </button>
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
