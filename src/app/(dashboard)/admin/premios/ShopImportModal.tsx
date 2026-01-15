'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button, Input } from '@/components/ui';
import { fetchUmaPencaProducts, type ImportedProduct } from '@/actions/shop-import';
import { createReward } from '@/actions/rewards-admin';
import { X, ShoppingBag, Check, Loader2 } from 'lucide-react';

interface ShopImportModalProps {
  storeUrl?: string;
}

export function ShopImportButton({ storeUrl = 'https://umapenca.com/omocodoteamo/' }: ShopImportModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Card className="p-5">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-4 border-2 border-dashed border-purple-300 rounded-lg text-purple-600 hover:border-purple-500 hover:bg-purple-50 transition-colors flex items-center justify-center gap-2"
        >
          <ShoppingBag className="w-5 h-5" />
          <span>Importar da Loja Uma Penca</span>
        </button>
      </Card>

      {isOpen && (
        <ShopImportModal storeUrl={storeUrl} onClose={() => setIsOpen(false)} />
      )}
    </>
  );
}

interface ShopImportModalInnerProps {
  storeUrl: string;
  onClose: () => void;
}

function ShopImportModal({ storeUrl, onClose }: ShopImportModalInnerProps) {
  const router = useRouter();
  const [products, setProducts] = useState<ImportedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Map<string, { coinsCost: number; stock: number; isLimited: boolean }>>(new Map());
  const [isImporting, setIsImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ success: number; errors: string[] } | null>(null);

  // Buscar produtos ao abrir o modal
  useEffect(() => {
    async function loadProducts() {
      setIsLoading(true);
      setError(null);

      const result = await fetchUmaPencaProducts(storeUrl);

      if (result.success) {
        setProducts(result.products);
      } else {
        setError(result.error || 'Erro ao carregar produtos');
      }

      setIsLoading(false);
    }

    loadProducts();
  }, [storeUrl]);

  // Toggle seleção de produto
  const toggleProduct = (product: ImportedProduct) => {
    const newSelected = new Map(selectedProducts);

    if (newSelected.has(product.id)) {
      newSelected.delete(product.id);
    } else {
      // Sugerir custo em corações baseado no preço (1 real = 10 corações)
      const suggestedCost = Math.round(product.price * 10);
      newSelected.set(product.id, { coinsCost: suggestedCost, stock: 1, isLimited: true });
    }

    setSelectedProducts(newSelected);
  };

  // Atualizar custo de um produto selecionado
  const updateProductCost = (productId: string, coinsCost: number) => {
    const newSelected = new Map(selectedProducts);
    const current = newSelected.get(productId);
    if (current) {
      newSelected.set(productId, { ...current, coinsCost });
      setSelectedProducts(newSelected);
    }
  };

  // Atualizar estoque de um produto selecionado
  const updateProductStock = (productId: string, stock: number) => {
    const newSelected = new Map(selectedProducts);
    const current = newSelected.get(productId);
    if (current) {
      newSelected.set(productId, { ...current, stock });
      setSelectedProducts(newSelected);
    }
  };

  // Toggle edição limitada
  const toggleLimited = (productId: string) => {
    const newSelected = new Map(selectedProducts);
    const current = newSelected.get(productId);
    if (current) {
      newSelected.set(productId, { ...current, isLimited: !current.isLimited });
      setSelectedProducts(newSelected);
    }
  };

  // Importar produtos selecionados
  const handleImport = async () => {
    if (selectedProducts.size === 0) return;

    setIsImporting(true);
    const results = { success: 0, errors: [] as string[] };

    for (const [productId, config] of Array.from(selectedProducts)) {
      const product = products.find(p => p.id === productId);
      if (!product) continue;

      try {
        console.log('Importando produto:', product.name, 'Imagem:', product.imageUrl, 'Limitado:', config.isLimited, 'Cores:', product.colors);

        // Preparar opções disponíveis (cores da loja + tamanhos padrão)
        const availableOptions = {
          colors: product.colors && product.colors.length > 0 ? product.colors : undefined,
          sizes: ['PP', 'P', 'M', 'G', 'GG', 'XG'], // Tamanhos padrão
        };

        const result = await createReward({
          name: product.name.trim(),
          description: `Produto da loja: ${product.productUrl}`,
          coins_required: config.coinsCost,
          quantity_available: config.isLimited ? config.stock : null,
          type: 'physical',
          image_url: product.imageUrl || null,
          available_options: availableOptions,
        });

        console.log('Resultado:', result);

        if (result.error) {
          results.errors.push(`${product.name}: ${result.error}`);
        } else {
          results.success++;
        }
      } catch (err) {
        console.error('Erro ao importar:', err);
        results.errors.push(`${product.name}: Erro ao importar - ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    setImportResults(results);
    setIsImporting(false);

    if (results.success > 0) {
      router.refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center justify-between bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5" />
            <h2 className="font-bold text-lg">Importar da Loja</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
              <p className="text-gray-500">Carregando produtos da loja...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Tentar Novamente
              </Button>
            </div>
          ) : importResults ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {importResults.success} prêmio(s) importado(s)!
              </h3>
              {importResults.errors.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 rounded-lg text-left max-w-md mx-auto">
                  <p className="text-sm text-red-600 font-medium mb-2">Erros:</p>
                  {importResults.errors.map((err, i) => (
                    <p key={i} className="text-xs text-red-500">{err}</p>
                  ))}
                </div>
              )}
              <Button onClick={onClose} className="mt-6">
                Fechar
              </Button>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum produto encontrado na loja</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500 mb-4">
                Selecione os produtos que deseja importar como prêmios.
                O custo em corações é calculado automaticamente (R$1 = 10 corações).
              </p>

              {products.map((product) => {
                const isSelected = selectedProducts.has(product.id);
                const config = selectedProducts.get(product.id);

                return (
                  <div
                    key={product.id}
                    className={`border rounded-lg overflow-hidden transition-all ${
                      isSelected ? 'border-purple-500 ring-2 ring-purple-200' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div
                      className="flex items-center gap-4 p-3 cursor-pointer"
                      onClick={() => toggleProduct(product)}
                    >
                      {/* Checkbox */}
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected ? 'bg-purple-500 border-purple-500' : 'border-gray-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>

                      {/* Imagem */}
                      {product.imageUrl && (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-500">
                          R$ {product.price.toFixed(2)}
                          {product.priceOld && (
                            <span className="line-through ml-2 text-gray-400">
                              R$ {product.priceOld.toFixed(2)}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Configuração quando selecionado */}
                    {isSelected && config && (
                      <div className="px-3 pb-3 pt-0 border-t bg-purple-50">
                        <div className="flex items-center gap-4 pt-3">
                          <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Custo (corações)
                            </label>
                            <Input
                              type="number"
                              value={config.coinsCost}
                              onChange={(e) => updateProductCost(product.id, parseInt(e.target.value) || 0)}
                              onFocus={(e) => e.target.select()}
                              min="1"
                              className="h-9 text-sm"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>

                          {/* Toggle Edição Limitada */}
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => toggleLimited(product.id)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                config.isLimited ? 'bg-purple-500' : 'bg-gray-300'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  config.isLimited ? 'translate-x-4' : 'translate-x-0.5'
                                }`}
                              />
                            </button>
                            <span className="text-xs text-gray-600 whitespace-nowrap">
                              {config.isLimited ? 'Limitado' : 'Ilimitado'}
                            </span>
                          </div>

                          {/* Estoque - só aparece se for limitado */}
                          {config.isLimited && (
                            <div className="w-20">
                              <label className="block text-xs font-medium text-gray-600 mb-1">
                                Qtd
                              </label>
                              <Input
                                type="number"
                                value={config.stock}
                                onChange={(e) => updateProductStock(product.id, parseInt(e.target.value) || 1)}
                                onFocus={(e) => e.target.select()}
                                min="1"
                                className="h-9 text-sm"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {!isLoading && !error && !importResults && products.length > 0 && (
          <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {selectedProducts.size} produto(s) selecionado(s)
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} disabled={isImporting}>
                Cancelar
              </Button>
              <Button
                onClick={handleImport}
                disabled={selectedProducts.size === 0 || isImporting}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isImporting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>Importar {selectedProducts.size} Prêmio(s)</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
