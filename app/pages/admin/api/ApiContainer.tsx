'use client';
import React, { useState, useEffect } from 'react';
import { getApiKeys, createApiKey, deleteApiKey } from './api';
import type { ApiType } from './types/ApiType';
import ApiListPage from './components/ApiListPage';
import { CreateApiModal } from './components/CreateApiModal';
import { ConfirmModal } from '@/app/pages/clients/ui/ModalConfirm';
import { Background } from '@/app/pages/clients/ui/Background';
import { AdminSidebar } from "@/app/pages/admin/ui/AdminSidebar";
import { ToastProvider, useToast } from '@/app/contexts/ToastContext';

const ApiContent: React.FC = () => {
    const [apiKeys, setApiKeys] = useState<ApiType[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        getApiKeys()
            .then(setApiKeys)
            .catch(err => addToast(err.message, 'error'))
            .finally(() => setIsLoading(false));
    }, [addToast]);

    const handleApiKeyCreated = (newKey: ApiType) => {
        setApiKeys(prevKeys => [newKey, ...prevKeys]);
        addToast('Chave de API criada com sucesso!', 'success');
    };

    const requestDelete = (id: string) => {
        setSelectedKeyId(id);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedKeyId) return;
        setIsSubmitting(true);
        try {
            await deleteApiKey(selectedKeyId);
            setApiKeys(prevKeys => prevKeys.filter(key => key.id !== selectedKeyId));
            addToast('Chave de API deletada com sucesso!', 'success');
        } catch (e: any) {
            addToast(`Falha ao deletar a chave: ${e.message}`, 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setSelectedKeyId(null);
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
        return <ApiListPage apiKeys={apiKeys} onDelete={requestDelete} onOpenCreateModal={() => setIsCreateModalOpen(true)} />;
    };

    return (
        <>
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
                {renderContent()}
            </main>

            <CreateApiModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onApiKeyCreated={handleApiKeyCreated}
                createApiKey={createApiKey}
            />

            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja deletar esta chave de API? Esta ação não pode ser desfeita."
                icon="trash"
                confirmText="Sim, Deletar"
                confirmColor="rose"

            />
        </>
    );
};

export default function ApiContainer() {
    return (
        <ToastProvider>
            <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans-serif] flex">
                <style>{`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                    @keyframes pulse-slow { 50% { opacity: 0.6; } }
                    .animate-pulse-slow { animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                    .custom-scrollbar::-webkit-scrollbar { width: 8px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; border: 2px solid transparent; background-clip: content-box; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: #52525b; }
                `}</style>
                <Background />
                <AdminSidebar />
                <ApiContent />
            </div>
        </ToastProvider>
    );
}
