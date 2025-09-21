'use client';
import React, { useState } from 'react';
import { Icon } from '../../ui/Icon';
import { ConfirmModal } from '../../ui/ModalConfirm';
import { useServer } from '../context/ServerContext';
import { changeAllocation, ClientServerAllocation } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center">
        <svg
            className="animate-spin h-10 w-10 text-purple-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading"
            role="img"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    </div>
);

const AllocationRow = ({
                           allocation,
                           isPrimary,
                           onRemove,
                           isSubmitting,
                       }: {
    allocation: ClientServerAllocation;
    isPrimary: boolean;
    onRemove?: (allocation: ClientServerAllocation) => void;
    isSubmitting: boolean;
}) => {
    return (
        <div className="bg-zinc-900/60 p-5 rounded-2xl flex items-center gap-5 shadow-md shadow-black/40">
            <Icon
                name="network"
                className="w-7 h-7 text-zinc-500 flex-shrink-0"
                aria-hidden="true"
            />

            <div className="flex-grow">
                <label className="block text-xs text-zinc-400 mb-1 select-none">HOSTNAME</label>
                <input
                    type="text"
                    readOnly
                    value={`${allocation.externalIp}:${allocation.port}`}
                    className="w-full bg-zinc-950/90 rounded-xl px-4 py-2 text-zinc-300 font-mono text-sm cursor-copy select-text"
                    onClick={(e) => navigator.clipboard.writeText(e.currentTarget.value)}
                    title="Clique para copiar"
                    aria-label={`Hostname ${allocation.externalIp}:${allocation.port}, clique para copiar`}
                />
            </div>

            <div className="flex items-center gap-4 ml-auto pl-6">
                {isPrimary ? (
                    <span className="px-4 py-1.5 text-xs font-bold text-white bg-purple-600 rounded-full select-none">
                        Primary
                    </span>
                ) : (
                    <button
                        onClick={() => onRemove && onRemove(allocation)}
                        disabled={isSubmitting}
                        className="p-3 rounded-full text-zinc-400 hover:bg-rose-500/25 hover:text-rose-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Remover Alocação"
                        aria-label={`Remover alocação ${allocation.externalIp}:${allocation.port}`}
                        type="button"
                    >
                        <Icon name="trash" className="w-5 h-5" />
                    </button>
                )}
            </div>
        </div>
    );
};

export const NetworkPage: React.FC = () => {
    const { server, isLoading, refreshServer } = useServer();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [allocationToDelete, setAllocationToDelete] = useState<ClientServerAllocation | null>(null);

    const handleAllocationChange = async (allocationId: string | null) => {
        if (!server?.id || isSubmitting) return;

        setIsSubmitting(true);
        setErrorMessage(null);

        try {
            await changeAllocation(server.id, allocationId);
            await refreshServer();
            setAllocationToDelete(null);
        } catch (error: any) {
            setErrorMessage(error.message || 'Ocorreu uma falha ao modificar a alocação.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = () => {
        if (allocationToDelete?.id) {
            handleAllocationChange(allocationToDelete.id);
        }
    };

    if (isLoading || !server) {
        return <LoadingSpinner />;
    }

    const primaryAllocation = server.primaryAllocation;
    const additionalAllocations = server.additionalAllocation || [];
    const maxAdditional = server.addicionalAllocationsNumbers || 0;
    const canAddMore = additionalAllocations.length < maxAdditional;

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col gap-8"
        >
            <ConfirmModal
                isOpen={!!allocationToDelete}
                onClose={() => setAllocationToDelete(null)}
                onConfirm={handleConfirmDelete}
                title="Remover Alocação"
                message={`Tem certeza que deseja remover a alocação "${allocationToDelete?.externalIp}:${allocationToDelete?.port}"? Esta ação não pode ser desfeita.`}
                confirmText="Sim, Remover"
            />

            {errorMessage && (
                <div className="bg-rose-600/20 border border-rose-500/40 text-rose-300 p-4 rounded-2xl flex items-center gap-3 text-sm select-none shadow-md shadow-rose-700/40">
                    <Icon name="alert-triangle" className="w-5 h-5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <motion.div layout className="space-y-5">
                <AnimatePresence>
                    {primaryAllocation && (
                        <motion.div
                            key="primary"
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <AllocationRow
                                allocation={{
                                    ...primaryAllocation,
                                    externalIp: primaryAllocation.externalIp ?? undefined,
                                }}
                                isPrimary={true}
                                isSubmitting={isSubmitting}
                            />
                        </motion.div>
                    )}

                    {additionalAllocations.map((alloc) => (
                        <motion.div
                            key={alloc.id}
                            layout
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                        >
                            <AllocationRow
                                allocation={{
                                    ...alloc,
                                    externalIp: alloc.externalIp ?? undefined,
                                }}
                                isPrimary={false}
                                onRemove={setAllocationToDelete}
                                isSubmitting={isSubmitting}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </motion.div>

            <div className="flex justify-between items-center mt-6">
                <p className="text-sm text-zinc-400 select-none">
                    Você pode adicionar mais{' '}
                    <span className="font-semibold text-white">
                        {maxAdditional - additionalAllocations.length}
                    </span>{' '}
                    alocação(ões).
                </p>
                <button
                    onClick={() => handleAllocationChange(null)}
                    disabled={!canAddMore || isSubmitting}
                    className="px-6 py-3 rounded-2xl bg-purple-700 text-white font-semibold hover:bg-purple-800 transition-colors duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center gap-3 shadow-md shadow-purple-700/50 select-none"
                    type="button"
                    aria-disabled={!canAddMore || isSubmitting}
                >
                    <Icon
                        name={isSubmitting && !allocationToDelete ? 'loader' : 'plus'}
                        className={`w-5 h-5 ${isSubmitting && !allocationToDelete ? 'animate-spin' : ''}`}
                        aria-hidden="true"
                    />
                    {isSubmitting && !allocationToDelete ? 'Processando...' : 'Adicionar Alocação'}
                </button>
            </div>
        </motion.div>
    );
};

export default NetworkPage;