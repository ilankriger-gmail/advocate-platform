'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { NpsLead } from '@/lib/supabase/types';
import { bulkApproveLeads, bulkApproveAndNotify } from '@/actions/leads';
import { LeadCard } from './LeadCard';
import { Button } from '@/components/ui/Button';

interface LeadsListProps {
  leads: NpsLead[];
  currentStatus: string;
}

export function LeadsList({ leads, currentStatus }: LeadsListProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<'approve' | 'approveNotify' | null>(null);

  // Filtrar apenas leads pendentes para selecao
  const pendingLeads = leads.filter(l => l.status === 'pending');
  const hasPendingLeads = pendingLeads.length > 0;

  // Toggle selecao de um lead
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Selecionar/desselecionar todos os pendentes
  const toggleSelectAll = () => {
    if (selectedIds.size === pendingLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingLeads.map(l => l.id)));
    }
  };

  // Aprovar apenas (sem notificacao)
  const handleBulkApprove = async () => {
    setIsLoading(true);
    const result = await bulkApproveLeads(Array.from(selectedIds));
    setIsLoading(false);
    setShowConfirmModal(null);

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.data) {
      alert(`${result.data.approved} lead(s) aprovado(s) com sucesso!`);
    }

    setSelectedIds(new Set());
    router.refresh();
  };

  // Aprovar e enviar notificacoes
  const handleBulkApproveAndNotify = async () => {
    setIsLoading(true);
    const result = await bulkApproveAndNotify(Array.from(selectedIds));
    setIsLoading(false);
    setShowConfirmModal(null);

    if (result.error) {
      alert(result.error);
      return;
    }

    if (result.data) {
      alert(
        `${result.data.approved} lead(s) aprovado(s)!\n` +
        `${result.data.emailsSent} email(s) enviado(s)\n` +
        `${result.data.whatsappsSent} WhatsApp(s) enviado(s)`
      );
    }

    setSelectedIds(new Set());
    router.refresh();
  };

  const allSelected = hasPendingLeads && selectedIds.size === pendingLeads.length;
  const someSelected = selectedIds.size > 0;

  return (
    <div className="space-y-4">
      {/* Barra de acoes em massa - aparece quando ha leads pendentes */}
      {hasPendingLeads && currentStatus !== 'approved' && currentStatus !== 'rejected' && (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Checkbox selecionar todos */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500"
                />
                <span className="text-sm text-gray-600">
                  {allSelected ? 'Desselecionar todos' : `Selecionar todos (${pendingLeads.length})`}
                </span>
              </label>
              {someSelected && (
                <span className="px-2 py-1 bg-pink-100 text-pink-700 text-xs font-medium rounded-full">
                  {selectedIds.size} selecionado(s)
                </span>
              )}
            </div>

            {/* Botoes de acao */}
            {someSelected && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowConfirmModal('approve')}
                  disabled={isLoading}
                  className="text-green-600 border-green-300 hover:bg-green-50"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Aprovar ({selectedIds.size})
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowConfirmModal('approveNotify')}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  Aprovar e Notificar ({selectedIds.size})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lista de leads */}
      {leads.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {leads.map((lead: NpsLead) => (
            <div key={lead.id} className="relative">
              {/* Checkbox de selecao para leads pendentes */}
              {lead.status === 'pending' && (
                <div className="absolute top-4 right-4 z-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(lead.id)}
                    onChange={() => toggleSelect(lead.id)}
                    className="w-5 h-5 rounded border-gray-300 text-pink-600 focus:ring-pink-500 cursor-pointer"
                  />
                </div>
              )}
              <LeadCard lead={lead} />
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum lead encontrado</h3>
          <p className="text-gray-500">
            {currentStatus === 'pending'
              ? 'Nao ha leads pendentes no momento.'
              : currentStatus === 'approved'
              ? 'Nenhum lead foi aprovado ainda.'
              : currentStatus === 'rejected'
              ? 'Nenhum lead foi reprovado.'
              : 'Nao ha leads cadastrados.'}
          </p>
        </div>
      )}

      {/* Modal de confirmacao */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {showConfirmModal === 'approveNotify'
                ? 'Aprovar e Notificar Leads'
                : 'Aprovar Leads'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {showConfirmModal === 'approveNotify'
                ? `Voce esta prestes a aprovar ${selectedIds.size} lead(s) e enviar notificacoes de boas-vindas por email e WhatsApp. Deseja continuar?`
                : `Voce esta prestes a aprovar ${selectedIds.size} lead(s). Deseja continuar?`}
            </p>

            {showConfirmModal === 'approveNotify' && (
              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
                <p className="text-xs text-blue-700">
                  <strong>Nota:</strong> Os leads receberao um email com link para cadastro na plataforma.
                  Se tiverem telefone cadastrado, tambem receberao uma mensagem no WhatsApp.
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmModal(null)}
                disabled={isLoading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={showConfirmModal === 'approveNotify' ? handleBulkApproveAndNotify : handleBulkApprove}
                isLoading={isLoading}
                className={`flex-1 ${showConfirmModal === 'approveNotify' ? 'bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700' : 'bg-green-600 hover:bg-green-700'}`}
              >
                {showConfirmModal === 'approveNotify' ? 'Aprovar e Notificar' : 'Aprovar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
