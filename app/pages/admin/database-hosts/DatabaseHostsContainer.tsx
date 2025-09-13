'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Background } from '@/app/pages/clients/ui/Background';
import { AdminSidebar } from '@/app/pages/admin/ui/AdminSidebar';
import { ToastProvider, useToast } from '@/app/contexts/ToastContext';
import { ConfirmModal } from '@/app/pages/clients/ui/ModalConfirm';
import { getDatabaseHosts, getDatabaseHostByUuid, saveDatabaseHost, deleteDatabaseHost } from './api';
import type { DatabaseHost } from './types/DatabaseHostType';
import DatabaseHostListPage from './components/DatabaseHostListPage';
import DatabaseHostFormPage from './components/DatabaseHostFormPage';

interface DatabaseHostsContainerProps {
  action?: string;
  id?: string;
}

const DatabaseHostsContent: React.FC<DatabaseHostsContainerProps> = ({ action, id }) => {
  const [hosts, setHosts] = useState<DatabaseHost[]>([]);
  const [editingHost, setEditingHost] = useState<DatabaseHost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedUuid, setSelectedUuid] = useState<string | null>(null);
  const router = useRouter();
  const { addToast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    if (action === 'edit' && id) {
      getDatabaseHostByUuid(id).then(host => { setEditingHost(host); setIsLoading(false); });
    } else if (action === 'create') {
      setEditingHost(null);
      setIsLoading(false);
    } else {
      getDatabaseHosts().then(data => { setHosts(data); setIsLoading(false); });
    }
  }, [action, id]);

  const requestDelete = (uuid: string) => { setSelectedUuid(uuid); setIsConfirmModalOpen(true); };

  const handleConfirmDelete = async () => {
    if (!selectedUuid) return;
    setIsSubmitting(true);
    try {
      const res = await deleteDatabaseHost(selectedUuid);
      if (res.success) {
        addToast('Host deletado com sucesso!', 'success');
        getDatabaseHosts().then(setHosts);
      } else {
        addToast('Falha ao deletar host.', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Erro ao deletar host.', 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setSelectedUuid(null);
      setIsSubmitting(false);
    }
  };

  const handleSaveHost = async (data: DatabaseHost) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await saveDatabaseHost(data);
      addToast(`Host "${data.name}" salvo!`, 'success');
      router.push('/admin/database-hosts');
    } catch (e: any) {
      addToast(e.message, 'error');
      setError(e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

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

    if (action === 'create' || (action === 'edit' && id)) {
      return (
        <DatabaseHostFormPage
          host={editingHost}
          onSave={handleSaveHost}
          isSubmitting={isSubmitting}
          error={error}
          clearError={clearError}
        />
      );
    }

    return <DatabaseHostListPage hosts={hosts} onDelete={requestDelete} />;
  };

  return (
    <>
      <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">{renderContent()}</main>
      <ConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Confirmar Exclusão"
        message="Tem certeza que deseja deletar este host de database? Isso não remove databases existentes."
        icon="trash"
        confirmText="Deletar"
        confirmColor="rose"
      />
    </>
  );
};

export default function DatabaseHostsContainer({ action, id }: DatabaseHostsContainerProps) {
  return (
    <ToastProvider>
      <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans-serif] flex">
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          .custom-scrollbar::-webkit-scrollbar { width: 8px; }
          .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; }
        `}</style>
        <Background />
        <AdminSidebar />
        <DatabaseHostsContent action={action} id={id} />
      </div>
    </ToastProvider>
  );
}

