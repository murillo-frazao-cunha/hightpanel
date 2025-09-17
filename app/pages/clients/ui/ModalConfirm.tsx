'use client';
import React, { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Icon } from './Icon';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    icon?: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'rose' | 'purple' | 'amber';
}

const colorSchemes = {
    rose: {
        bg: 'bg-rose-600',
        hoverBg: 'bg-rose-700',
        iconBg: 'bg-rose-100',
        iconText: 'text-rose-600',
        shadow: 'shadow-rose-500/50',
    },
    purple: {
        bg: 'bg-purple-600',
        hoverBg: 'bg-purple-700',
        iconBg: 'bg-purple-500/20',
        iconText: 'text-purple-400',
        shadow: 'shadow-purple-500/50',
    },
    amber: {
        bg: 'bg-amber-500',
        hoverBg: 'bg-amber-600',
        iconBg: 'bg-amber-100',
        iconText: 'text-amber-600',
        shadow: 'shadow-amber-500/50',
    },
};

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
                                                              isOpen,
                                                              onClose,
                                                              onConfirm,
                                                              title,
                                                              message,
                                                              icon = 'alert-triangle',
                                                              confirmText = 'Confirmar',
                                                              cancelText = 'Cancelar',
                                                              confirmColor = 'rose',
                                                          }) => {
    const colors = colorSchemes[confirmColor];

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-700/50 p-6 text-left align-middle shadow-xl transition-all">
                                <div className="sm:flex sm:items-start">
                                    <div className={`mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${colors.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                                        <Icon name={icon} className={`h-6 w-6 ${colors.iconText}`} aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white">
                                            {title}
                                        </Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-zinc-400">
                                                {message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                                    <button
                                        type="button"
                                        className={`inline-flex w-full justify-center rounded-lg border border-transparent ${colors.bg} px-4 py-2 text-base font-medium text-white shadow-[0_0_20px_-5px] ${colors.shadow} hover:${colors.hoverBg} focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 focus-visible:ring-red-500 sm:w-auto sm:text-sm transition-all transform hover:scale-105`}
                                        onClick={() => {
                                            onConfirm();
                                            onClose();
                                        }}
                                    >
                                        {confirmText}
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 focus-visible:ring-zinc-500 sm:mt-0 sm:w-auto sm:text-sm transition-colors"
                                        onClick={onClose}
                                    >
                                        {cancelText}
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
