'use client';
import React, { Fragment, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Icon } from '../../../ui/Icon';
import { motion, AnimatePresence } from 'framer-motion';

// Pequeno componente para a rodinha de progresso
const CircularProgress = ({ progress, size = 24 }: { progress: number; size?: number }) => {
    const strokeWidth = 3;
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (progress / 100) * circumference;

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
            <circle cx={center} cy={center} r={radius} strokeWidth={strokeWidth} className="stroke-zinc-700" fill="none" />
            <circle cx={center} cy={center} r={radius} strokeWidth={strokeWidth} className="stroke-purple-500 transition-all duration-300" fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
            />
        </svg>
    );
};

export interface UploadItem {
    id: string;
    name: string;
    progress: number;
    status: 'uploading' | 'completed' | 'error';
}

interface UploadModalProps {
    isOpen: boolean;
    uploads: UploadItem[];
    onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, uploads, onClose }) => {
    const allDone = useMemo(() => uploads.every(u => u.status === 'completed' || u.status === 'error'), [uploads]);

    useEffect(() => {
        if (isOpen && allDone && uploads.length > 0) {
            const timer = setTimeout(() => {
                onClose();
            }, 1500); // Fecha o modal 1.5s depois de tudo terminar
            return () => clearTimeout(timer);
        }
    }, [isOpen, allDone, onClose, uploads.length]);

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => { /* Evita fechar no clique externo */ }}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-700/50 p-6 text-left align-middle shadow-xl transition-all">
                                <div className="flex justify-between items-center">
                                    <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white">
                                        File Uploads
                                    </Dialog.Title>
                                    <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-800">
                                        <Icon name="close" className="w-5 h-5 text-zinc-400"/>
                                    </button>
                                </div>
                                <p className="text-sm text-zinc-400 mt-2">Os seguintes arquivos estão sendo enviados para o seu servidor.</p>

                                <motion.div layout className="mt-4 max-h-60 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                                    <AnimatePresence>
                                        {uploads.map(upload => (
                                            <motion.div
                                                key={upload.id}
                                                layout
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                className="flex items-center gap-3 bg-zinc-800/50 p-3 rounded-lg"
                                            >
                                                <div className="flex-shrink-0">
                                                    {upload.status === 'uploading' && <CircularProgress progress={upload.progress} />}
                                                    {upload.status === 'completed' && <Icon name="check-circle" className="w-6 h-6 text-emerald-500"/>}
                                                    {upload.status === 'error' && <Icon name="alert-circle" className="w-6 h-6 text-rose-500"/>}
                                                </div>
                                                <div className="flex-grow text-sm text-zinc-200 truncate">{upload.name}</div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </motion.div>

                                <div className="mt-6 flex justify-end gap-3">
                                    <button type="button" onClick={onClose} className="inline-flex justify-center rounded-lg border border-zinc-700 bg-transparent px-5 py-2 text-sm font-medium text-zinc-300 hover:bg-zinc-800 transition-colors">
                                        {allDone ? 'Fechar' : 'Fechar e Cancelar'}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};
