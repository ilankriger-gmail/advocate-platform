'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { analyzeUnanalyzedLeads } from '@/actions/leads';
import { Button } from '@/components/ui/Button';

export function AnalyzeButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ analyzed: number; errors: number } | null>(null);

  async function handleAnalyze() {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await analyzeUnanalyzedLeads();

      if (response.error) {
        alert(response.error);
      } else if (response.data) {
        setResult(response.data);
        if (response.data.analyzed > 0) {
          router.refresh();
        }
      }
    } catch {
      alert('Erro ao analisar leads');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={handleAnalyze}
        disabled={isLoading}
        className="text-purple-600 border-purple-300 hover:bg-purple-50"
      >
        {isLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2" />
            Analisando...
          </>
        ) : (
          <>
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            Analisar com AI
          </>
        )}
      </Button>

      {/* Resultado */}
      {result && (
        <div className="absolute top-full right-0 mt-2 p-3 bg-white rounded-lg shadow-lg border border-gray-200 text-sm z-10 whitespace-nowrap">
          {result.analyzed > 0 ? (
            <p className="text-green-600">
              {result.analyzed} lead(s) analisado(s)!
            </p>
          ) : (
            <p className="text-gray-600">
              Nenhum lead pendente de analise
            </p>
          )}
          {result.errors > 0 && (
            <p className="text-red-600">
              {result.errors} erro(s)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
