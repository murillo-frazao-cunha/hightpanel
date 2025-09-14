'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Importando componentes e tipos de seus próprios arquivos
import ServerListPage from './components/ServerListPage';
import ServerFormPage from './components/ServerFormPage';
import type { Server } from './types/ServerType';
import { getServers, getServerByUuid, saveServer, deleteServer } from './api';

// Assumindo que esses componentes de UI existem em algum lugar central
import { Background } from '@/app/pages/clients/ui/Background';
import { AdminSidebar } from "@/app/pages/admin/ui/AdminSidebar";
import { ConfirmModal } from '@/app/pages/clients/ui/ModalConfirm';
import { ToastProvider, useToast } from '@/app/contexts/ToastContext';

// --- MAIN CONTAINER ---

interface ServersContainerProps {
    action?: string;
    id?: string;
}

const ServersContent: React.FC<ServersContainerProps> = ({ action, id }) => {
    const [servers, setServers] = useState<Server[]>([]);
    const [editingServer, setEditingServer] = useState<Server | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { addToast } = useToast();
    const router = useRouter(); // Adicionado para navegação
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedServerUuid, setSelectedServerUuid] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);

        if (action === 'edit' && id) {
            getServerByUuid(id).then(server => {
                setEditingServer(server);
                setIsLoading(false);
            }).catch(err => {
                addToast('Falha ao carregar dados do servidor.', 'error');
                setIsLoading(false);
            });
        } else if (action === 'create') {
            setEditingServer(null);
            setIsLoading(false);
        } else {
            getServers().then(data => {
                setServers(data);
                setIsLoading(false);
            }).catch(err => {
                addToast('Falha ao carregar servidores.', 'error');
                setIsLoading(false);
            });
        }
    }, [action, id, addToast]);

    const requestDeleteServer = (uuid: string) => {
        setSelectedServerUuid(uuid);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedServerUuid) return;
        try {
            await deleteServer(selectedServerUuid);
            addToast('Servidor deletado com sucesso!', 'success');
            // Atualiza a lista de servidores no estado para refletir a exclusão
            setServers(prev => prev.filter(s => s.id !== selectedServerUuid));
            // Se o usuário estiver na página de edição do servidor deletado, redireciona
            if (action === 'edit' && id === selectedServerUuid) {
                router.push('/admin/servers');
            }
        } catch (err: any) {
            addToast(err.message || 'Falha ao deletar o servidor.', 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setSelectedServerUuid(null);
        }
    };

    const handleSaveServer = async (serverData: Omit<Server, 'id' | 'status'> & Partial<Pick<Server, 'id'>>) => {
        setIsSubmitting(true);
        setError(null);
        try {
            const server = await saveServer(serverData);
            addToast(`Servidor "${serverData.name}" salvo com sucesso!`, 'success');
            router.push(`/admin/servers/edit/${server.id}`); // Navega de volta para a lista
        } catch (error: any) {
            addToast(error.message, 'error');
            setError(error.message);
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

        if (action === 'create' || (action === 'edit' && id)) {
            return (
                <ServerFormPage
                    server={editingServer}
                    onSave={handleSaveServer}
                    isSubmitting={isSubmitting}
                    error={error}
                    clearError={() => setError(null)}
                />
            );
        }
        return <ServerListPage servers={servers} onDelete={requestDeleteServer} />;
    };

    return (
        <>
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">{renderContent()}</main>
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja deletar este servidor? Esta ação não pode ser desfeita."
            />
        </>
    );
};

export default function ServersContainer({ action, id }: ServersContainerProps) {
    return (
        <ToastProvider>
            <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans_serif] flex">
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'); .custom-scrollbar::-webkit-scrollbar { width: 8px; } .custom-scrollbar::-webkit-scrollbar-track { background: transparent; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #3f3f46; border-radius: 10px; }`}</style>
                <Background />
                <AdminSidebar />
                <ServersContent action={action} id={id} />
            </div>
        </ToastProvider>
    );
}