'use client';
import React, { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Icon } from './Icon';

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (inputValue: string) => void;
    title: string;
    message: string;
    icon?: string;
    confirmText?: string;
    cancelText?: string;
    placeholder?: string;
    initialValue?: string;
}

export const InputModal: React.FC<InputModalProps> = ({
                                                          isOpen,
                                                          onClose,
                                                          onConfirm,
                                                          title,
                                                          message,
                                                          icon = 'file-plus',
                                                          confirmText = 'Criar',
                                                          cancelText = 'Cancelar',
                                                          placeholder = '',
                                                          initialValue = '',
                                                      }) => {
    const [inputValue, setInputValue] = useState(initialValue);

    useEffect(() => {
        if (isOpen) {
            // Reseta o valor quando o modal abre
            setInputValue(initialValue);
            // Adiciona um pequeno delay para focar no input, garantindo que ele esteja renderizado
            setTimeout(() => {
                document.getElementById('input-modal-field')?.focus();
            }, 100);
        }
    }, [isOpen, initialValue]);

    const handleConfirm = () => {
        if (inputValue.trim()) {
            onConfirm(inputValue.trim());
            onClose();
        }
    };

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900 border border-zinc-700/50 p-6 text-left align-middle shadow-xl transition-all">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-purple-500/20 sm:mx-0 sm:h-10 sm:w-10">
                                        <Icon name={icon} className="h-6 w-6 text-purple-400" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                        <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white">{title}</Dialog.Title>
                                        <div className="mt-2">
                                            <p className="text-sm text-zinc-400">{message}</p>
                                            <input
                                                id="input-modal-field"
                                                type="text"
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                                placeholder={placeholder}
                                                className="mt-3 w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 outline-none focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-3">
                                    <button type="button" onClick={handleConfirm} className="inline-flex w-full justify-center rounded-lg border border-transparent bg-purple-600 px-4 py-2 text-base font-medium text-white shadow-[0_0_20px_-5px] shadow-purple-500/50 hover:bg-purple-700 focus:outline-none sm:w-auto sm:text-sm transition-all transform hover:scale-105">
                                        {confirmText}
                                    </button>
                                    <button type="button" onClick={onClose} className="mt-3 inline-flex w-full justify-center rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-base font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none sm:mt-0 sm:w-auto sm:text-sm transition-colors">
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