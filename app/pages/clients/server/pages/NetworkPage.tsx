// app/components/server/pages/NetworkPage.tsx
'use client';
import React, { useState } from 'react';
import { Panel } from '../../ui/Panel';
import { Icon } from '../../ui/Icon';
import { ConfirmModal } from '../../ui/ModalConfirm'; // Importando o modal
import { useServer } from '../context/ServerContext';
import { changeAllocation, ClientServerAllocation } from '../api';

// --- Helper Components ---

// Componente para a linha de cada alocação
const AllocationRow = ({ allocation, isPrimary, onRemove, isSubmitting }: any) => {
    return (
        <Panel className="bg-zinc-900/60 p-4 flex items-center gap-4 border border-zinc-800">
            <Icon name="network" className="w-6 h-6 text-zinc-500 flex-shrink-0" />

            <div className="flex-grow">
                <label className="block text-xs text-zinc-400 mb-1">HOSTNAME</label>
                <input
                    type="text"
                    readOnly
                    value={`${allocation.externalIp}:${allocation.port}`}
                    className="w-full bg-zinc-950/80 border border-zinc-700 rounded-md px-3 py-1.5 text-zinc-300 font-mono text-sm cursor-copy"
                    onClick={(e) => navigator.clipboard.writeText(e.currentTarget.value)}
                    title="Clique para copiar"
                />
            </div>

            {/* Ações */}
            <div className="flex items-center gap-3 ml-auto pl-4">
                {isPrimary ? (
                    <span className="px-3 py-1 text-xs font-bold text-white bg-sky-600 rounded-full">
                        Primary
                    </span>
                ) : (
                    <button
                        onClick={() => onRemove(allocation)} // Passa o objeto 'allocation' para o handler
                        disabled={isSubmitting}
                        className="p-2 rounded-full text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remover Alocação"
                    >
                        <Icon name="trash" className="w-4 h-4" />
                    </button>
                )}
            </div>
        </Panel>
    );
};


// --- Main Component ---

export const NetworkPage: React.FC = () => {
    const { server, isLoading, refreshServer } = useServer();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    // Novo estado para controlar o modal de confirmação
    const [allocationToDelete, setAllocationToDelete] = useState<ClientServerAllocation | null>(null);

    // Função genérica para adicionar ou remover alocações
    const handleAllocationChange = async (allocationId: string | null) => {
        if (!server?.id || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            await changeAllocation(server.id, allocationId);
            await refreshServer();
        } catch (error: any) {
            setErrorMessage(error.message || 'Ocorreu uma falha ao modificar a alocação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Função chamada quando a exclusão é confirmada no modal
    const handleConfirmDelete = () => {
        if (allocationToDelete?.id) {
            handleAllocationChange(allocationToDelete.id);
        }
    };

    if (isLoading || !server) {
        return <Panel className="p-6 text-center text-zinc-400">Carregando informações de rede...</Panel>;
    }

    const primaryAllocation = server.primaryAllocation;
    const additionalAllocations = server.additionalAllocation || [];
    const canAddMore = additionalAllocations.length < (server.addicionalAllocationsNumbers || 0);

    return (
        <>
            <ConfirmModal
                isOpen={!!allocationToDelete}
                onClose={() => setAllocationToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Remover Alocação"
                message={`Tem certeza que deseja remover a alocação "${allocationToDelete?.externalIp}:${allocationToDelete?.port}"? Esta ação não pode ser desfeita.`}
                confirmText="Sim, Remover"
            />

            <div className="flex flex-col gap-6">


                {errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg flex items-center text-sm">
                        <Icon name="alert-triangle" className="w-5 h-5 mr-2 flex-shrink-0" />
                        {errorMessage}
                    </div>
                )}

                <div className="space-y-4">
                    {/* Alocação Primária */}
                    {primaryAllocation && (
                        <AllocationRow
                            allocation={primaryAllocation}
                            isPrimary={true}
                            isSubmitting={isSubmitting}
                        />
                    )}

                    {/* Alocações Adicionais */}
                    {additionalAllocations.map(alloc => (
                        <AllocationRow
                            key={alloc.id}
                            allocation={alloc}
                            isPrimary={false}
                            onRemove={setAllocationToDelete} // Define qual alocação será deletada
                            isSubmitting={isSubmitting}
                        />
                    ))}
                </div>

                {/* Painel de Ações */}
                <Panel className="bg-zinc-900/50 p-4 border border-zinc-800 flex justify-between items-center mt-4">
                    <p className="text-sm text-zinc-400">
                        Você pode adicionar mais { (server.addicionalAllocationsNumbers || 0) - additionalAllocations.length } alocação(ões).
                    </p>
                    <button
                        onClick={() => handleAllocationChange(null)} // `null` para adicionar
                        disabled={!canAddMore || isSubmitting}
                        className="px-4 py-2 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Icon name={isSubmitting && !allocationToDelete ? 'loader' : 'plus'} className={`w-4 h-4 ${(isSubmitting && !allocationToDelete) && 'animate-spin'}`} />
                        {isSubmitting && !allocationToDelete ? 'Processando...' : 'Adicionar Alocação'}
                    </button>
                </Panel>
            </div>
        </>
    );
};

export default NetworkPage;