'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getNodes, deleteNode, saveNode, getNodeByUuid, getStatus } from './api';
import type { Node } from './types/NodeType';
import NodeListPage from './components/NodeListPage';
import NodeFormPage from './components/NodeFormPage';
import { Background } from '@/app/pages/clients/ui/Background';
import { AdminSidebar } from "@/app/pages/admin/ui/AdminSidebar";
import { ConfirmModal } from '@/app/pages/clients/ui/ModalConfirm';
import { ToastProvider, useToast } from '@/app/contexts/ToastContext';

interface NodesContainerProps {
    action?: string;
    id?: string;
}

// O conteúdo principal é agora um componente separado para usar o hook useToast
const NodesContent: React.FC<NodesContainerProps> = ({ action, id }) => {
    const [nodes, setNodes] = useState<Node[]>([]);
    const [editingNode, setEditingNode] = useState<Node | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { addToast } = useToast(); // Hook para adicionar toasts

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedNodeUuid, setSelectedNodeUuid] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        if (action === 'edit' && id) {
            getNodeByUuid(id).then(node => {
                setEditingNode(node);
                setIsLoading(false);
            });
        } else if (action === 'create') {
            setIsLoading(false); // nada para carregar inicialmente
        } else {
            getNodes().then(data => {
                setNodes(data);
                setIsLoading(false);
            });
        }
    }, [action, id]);

    // Polling de status a cada 5s somente na listagem
    useEffect(() => {
        if (action) return; // Só roda quando estamos na lista (sem action)
        if (nodes.length === 0) return;
        let ativo = true;

        const atualizarStatus = async () => {
            try {
                const atualizados = await Promise.all(nodes.map(async (n) => {
                    try {
                        const rs = await getStatus(n.uuid);
                        if(rs.error) {
                            console.error(rs.error)
                        }
                        const statusValue = rs.status
                        if (statusValue === 'online' || statusValue === 'offline') {
                            return { ...n, status: statusValue } as Node;
                        }
                        return { ...n, status: 'offline' as const };
                    } catch {
                        return { ...n, status: 'offline' as const };
                    }
                }));
                if (!ativo) return;
                setNodes(prev => {
                    const mapa = new Map(prev.map(p => [p.uuid, p]));
                    atualizados.forEach(u => {
                        const existente = mapa.get(u.uuid);
                        if (existente) existente.status = u.status;
                    });
                    return Array.from(mapa.values());
                });
            } catch (e) {
                // Silencia erros de polling
            }
        };

        atualizarStatus();
        const intervalo = setInterval(atualizarStatus, 5000);
        return () => { ativo = false; clearInterval(intervalo); };
    }, [action, nodes.length]);

    const requestDeleteNode = (uuid: string) => {
        setSelectedNodeUuid(uuid);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedNodeUuid) return;

        const result = await deleteNode(selectedNodeUuid);
        if (result.success) {
            addToast('Node deletada com sucesso!', 'success');
            getNodes().then(setNodes);
        } else {
            addToast('Falha ao deletar a node.', 'error');
        }
    };

    const handleSaveNode = async (nodeData: Omit<Node, 'id' | 'status'>) => {
        setIsSubmitting(true);
        try {
            await saveNode(nodeData);
            addToast(`Node "${nodeData.name}" salvo com sucesso!`, 'success');
            router.push('/admin/nodes');
        } catch (error: any) {
            // A API agora joga um erro com a mensagem, que capturamos aqui
            addToast(error.message, 'error');
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
            return <NodeFormPage onSave={handleSaveNode} isSubmitting={isSubmitting} error={null}
                                 clearError={function (): void {
                                     throw new Error("Function not implemented.");
                                 }} />;
        }

        if (action === 'edit' && id) {
            return <NodeFormPage node={editingNode} onSave={handleSaveNode} isSubmitting={isSubmitting} error={null}
                                 clearError={function (): void {
                                     throw new Error("Function not implemented.");
                                 }} />;
        }

        return <NodeListPage nodes={nodes} onDelete={requestDeleteNode} />;
    };

    return (
        <>
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
                {renderContent()}
            </main>
            <ConfirmModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message="Você tem certeza que deseja deletar este node? Esta ação não pode ser desfeita."
                icon="trash"
                confirmText="Sim, Deletar"
                confirmColor="rose"
            />
        </>
    );
};

// O container principal agora envolve o conteúdo com o ToastProvider
export default function NodesContainer({ action, id }: NodesContainerProps) {
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
                <NodesContent action={action} id={id} />
            </div>
        </ToastProvider>
    );
}
