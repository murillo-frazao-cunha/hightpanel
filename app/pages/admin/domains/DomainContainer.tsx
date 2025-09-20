'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Background } from '@/app/pages/clients/ui/Background';
import { AdminSidebar } from '@/app/pages/admin/ui/AdminSidebar';
import { ConfirmModal } from '@/app/pages/clients/ui/ModalConfirm';
import { ToastProvider, useToast } from '@/app/contexts/ToastContext';

import DomainListPage from './components/DomainListPage';
import DomainFormPage from './components/DomainFormPage';
import type { Domain } from './types/DomainType';
import { deleteDomain, getDomainByUuid, getDomains, saveDomain } from './api';

interface DomainsContainerProps {
  action?: string;
  id?: string;
}

const DomainsContent: React.FC<DomainsContainerProps> = ({ action, id }) => {
  const [domains, setDomains] = useState<Domain[]>([]);
  const [editingDomain, setEditingDomain] = useState<Domain | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);

  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    if (action === 'edit' && id) {
      getDomainByUuid(id)
        .then((d) => {
          setEditingDomain(d);
        })
        .finally(() => setIsLoading(false));
    } else if (action === 'create') {
      setIsLoading(false);
    } else {
      getDomains()
        .then(setDomains)
        .finally(() => setIsLoading(false));
    }
  }, [action, id]);

  const requestDeleteDomain = (uuid: string) => {
    setSelectedDomainId(uuid);
    setIsConfirmModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedDomainId) return;
    const result = await deleteDomain(selectedDomainId);
    if (result.success) {
      addToast('Domínio deletado com sucesso!', 'success');
      const list = await getDomains();
      setDomains(list);
    } else {
      addToast('Falha ao deletar o domínio.', 'error');
    }
  };

  const handleSaveDomain = async (data: Domain) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await saveDomain(data);
      addToast(`Domínio "${data.domainName}" salvo com sucesso!`, 'success');
      router.push('/admin/domains');
    } catch (e: any) {
      setError(e?.message || 'Erro ao salvar domínio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full">
          <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      );
    }

    if (action === 'create') {
      return (
        <DomainFormPage
          onSave={handleSaveDomain}
          isSubmitting={isSubmitting}
          error={error}
          clearError={() => setError(null)}
        />
      );
    }

    if (action === 'edit' && id) {
      return (
        <DomainFormPage
          domain={editingDomain}
          onSave={handleSaveDomain}
          isSubmitting={isSubmitting}
          error={error}
          clearError={() => setError(null)}
        />
      );
    }

    return <DomainListPage domains={domains} onDelete={requestDeleteDomain} />;
  };

  return (
    <>
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">{renderContent()}</main>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Você tem certeza que deseja deletar este domínio? Esta ação não pode ser desfeita."
        icon="trash"
        confirmText="Sim, Deletar"
        confirmColor="rose"
      />
    </>
  );
};

export default function DomainsContainer({ action, id }: DomainsContainerProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans_serif] flex">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          @keyframes pulse-slow { 50% { opacity: 0.6; transform: scale(1.1); } }
          .animate-pulse-slow { animation: pulse-slow 8s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
          .animation-delay-2000 { animation-delay: 2s; }
          .custom-checkbox { appearance: none; background-color: transparent; width: 1.15rem; height: 1.15rem; border: 2px solid #52525b; border-radius: 0.375rem; display: inline-block; position: relative; cursor: pointer; transition: all 0.2s; flex-shrink: 0; }
          .custom-checkbox:hover { border-color: #71717a; }
          .custom-checkbox:checked { background-color: #8b5cf6; border-color: #8b5cf6; }
          .custom-checkbox:checked::after { content: ''; position: absolute; left: 4px; top: 1px; width: 5px; height: 10px; border: solid white; border-width: 0 2px 2px 0; transform: rotate(45deg); }
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #52525b; }
        `}</style>
        <Background />
        <AdminSidebar />
        <DomainsContent action={action} id={id} />
      </div>
    </ToastProvider>
  );
}

