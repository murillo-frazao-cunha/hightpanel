'use client';
import React, {useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCores, deleteCore, saveCore, getCoreByUuid, exportCore, importCore } from './api';
import type { Core } from './types/CoreType';
import CoreListPage from './components/CoreListPage';
import CoreFormPage from './components/CoreFormPage';
import { Background } from '@/app/pages/clients/ui/Background';
import { AdminSidebar } from "@/app/pages/admin/ui/AdminSidebar";
import { ConfirmModal } from '@/app/pages/clients/ui/ModalConfirm';
import { ToastProvider, useToast } from '@/app/contexts/ToastContext';

interface CoresContainerProps {
    action?: string;
    id?: string;
}

const CoresContent: React.FC<CoresContainerProps> = ({ action, id }) => {
    const [cores, setCores] = useState<Core[]>([]);
    const [editingCore, setEditingCore] = useState<Core | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const { addToast } = useToast();

    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [selectedCoreUuid, setSelectedCoreUuid] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsLoading(true);
        setError(null);
        if (action === 'edit' && id) {
            getCoreByUuid(id).then(core => {
                setEditingCore(core);
                setIsLoading(false);
            });
        } else if (action === 'create') {
            setEditingCore(null);
            setIsLoading(false);
        } else {
            getCores().then(data => {
                setCores(data);
                setIsLoading(false);
            });
        }
    }, [action, id]);

    const requestDeleteCore = (uuid: string) => {
        setSelectedCoreUuid(uuid);
        setIsConfirmModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedCoreUuid) return;
        setIsSubmitting(true);
        try {
            await deleteCore(selectedCoreUuid);
            addToast('Core deletado com sucesso!', 'success');
            // Refetch a lista após deletar
            getCores().then(setCores);
        } catch (e: any) {
            addToast(`Falha ao deletar o core: ${e.message}`, 'error');
        } finally {
            setIsConfirmModalOpen(false);
            setSelectedCoreUuid(null);
            setIsSubmitting(false);
        }
    };

    const handleSaveCore = async (coreData: Core) => {
        setIsSubmitting(true);
        setError(null);
        try {
            await saveCore(coreData);
            addToast(`Core "${coreData.name}" salvo com sucesso!`, 'success');
            router.push('/admin/cores');
        } catch (error: any) {
            addToast(error.message, 'error');
            setError(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleExport = async (uuid: string) => {
        try {
            const data = await exportCore(uuid);
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            const name = data?.core?.name || 'core';
            a.download = `${name}.core.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(()=>URL.revokeObjectURL(a.href), 1500);
            addToast('Core exportado!', 'success');
        } catch (e: any) {
            addToast(e.message || 'Falha ao exportar core', 'error');
        }
    };

    const handleImport = async (file: File) => {
        try {
            const text = await file.text();
            let json: any;
            try { json = JSON.parse(text); } catch { throw new Error('JSON inválido.'); }
            const result = await importCore(json);
            addToast(`Core "${result.core?.name || ''}" importado!`, 'success');
            const data = await getCores();
            setCores(data);
        } catch (e: any) {
            addToast(e.message || 'Falha ao importar core', 'error');
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
            return <CoreFormPage core={editingCore} onSave={handleSaveCore} isSubmitting={isSubmitting} error={error} clearError={clearError} />;
        }

        return <CoreListPage cores={cores} onDelete={requestDeleteCore} onExport={handleExport} onImport={handleImport} />;
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
                message="Você tem certeza que deseja deletar este core? Servidores que o utilizam podem apresentar problemas."
                icon="trash"
                confirmText="Sim, Deletar"
                confirmColor="rose"
            />
        </>
    );
};

export default function CoresContainer({ action, id }: CoresContainerProps) {
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
                <CoresContent action={action} id={id} />
            </div>
        </ToastProvider>
    );
}
