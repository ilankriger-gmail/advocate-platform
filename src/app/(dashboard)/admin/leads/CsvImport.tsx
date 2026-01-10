'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { importLeadsFromCSV } from '@/actions/leads';
import { Button } from '@/components/ui/Button';

export function CsvImport() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setResult(null);

    try {
      const text = await file.text();
      const response = await importLeadsFromCSV(text);

      if (response.error) {
        setResult({ imported: 0, errors: [response.error] });
      } else if (response.data) {
        setResult(response.data);
        if (response.data.imported > 0) {
          router.refresh();
        }
      }
    } catch {
      setResult({ imported: 0, errors: ['Erro ao processar arquivo'] });
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="text-gray-600"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        Importar CSV
      </Button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Importar Leads de Teste
              </h3>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setResult(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Instrucoes */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-700 mb-2">Formato do CSV:</p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded block mb-2">
                  name,email,phone,score,reason
                </code>
                <p className="text-gray-600 mb-2">Exemplo:</p>
                <code className="text-xs bg-gray-200 px-2 py-1 rounded block whitespace-pre-wrap">
{`name,email,phone,score,reason
Maria Silva,maria@teste.com,11999999999,9,Amo o conteudo!
Joao Santos,joao@teste.com,,7,Bom mas pode melhorar
Ana Costa,ana@teste.com,21988888888,10,Perfeito!`}
                </code>
              </div>

              {/* Upload */}
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-upload"
                />
                <label
                  htmlFor="csv-upload"
                  className={`flex items-center justify-center w-full px-4 py-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                    isLoading
                      ? 'border-gray-200 bg-gray-50 cursor-wait'
                      : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600" />
                      Importando...
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className="text-sm text-gray-600">
                        Clique para selecionar ou arraste o arquivo CSV
                      </p>
                    </div>
                  )}
                </label>
              </div>

              {/* Resultado */}
              {result && (
                <div className={`rounded-lg p-4 ${
                  result.imported > 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                }`}>
                  {result.imported > 0 && (
                    <p className="text-green-700 font-medium mb-2">
                      {result.imported} lead(s) importado(s) com sucesso!
                    </p>
                  )}
                  {result.errors.length > 0 && (
                    <div>
                      <p className="text-red-700 font-medium mb-1">Erros:</p>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {result.errors.slice(0, 5).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {result.errors.length > 5 && (
                          <li>...e mais {result.errors.length - 5} erro(s)</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Botoes */}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsOpen(false);
                    setResult(null);
                  }}
                >
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
