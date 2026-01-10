'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { addCoinsToUser } from '@/actions/rewards-admin';

interface UserSearchProps {
  initialSearch: string;
}

export function UserSearch({ initialSearch }: UserSearchProps) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/admin/usuários?q=${encodeURIComponent(search.trim())}`);
    } else {
      router.push('/admin/usuários');
    }
  };

  return (
    <form onSubmit={handleSearch} className="flex gap-2">
      <Input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar por nome, email ou Instagram..."
        className="flex-1"
      />
      <Button type="submit">Buscar</Button>
      {initialSearch && (
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSearch('');
            router.push('/admin/usuários');
          }}
        >
          Limpar
        </Button>
      )}
    </form>
  );
}

interface AddCoinsButtonProps {
  userId: string;
  userName: string;
}

export function AddCoinsButton({ userId, userName }: AddCoinsButtonProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return;
    }

    setIsLoading(true);

    const result = await addCoinsToUser(
      userId,
      amountNum,
      description || `Adicionado manualmente`
    );

    if (result.success) {
      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      router.refresh();
    }
    setIsLoading(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        size="sm"
        variant="outline"
      >
        + Coracoes
      </Button>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Adicionar Coracoes</h3>
            <p className="text-sm text-gray-500 mb-4">Para: {userName}</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Quantidade de Coracoes *
                </label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="100"
                  min="1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição (opcional)
                </label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Motivo da adicao..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading || !amount}
                  className="flex-1"
                >
                  {isLoading ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
