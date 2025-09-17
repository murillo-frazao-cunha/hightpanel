'use client';
import React from 'react';
import { Transition } from '@headlessui/react';
import { Icon } from './Icon';
import type { ToastMessage, ToastType } from '@/app/contexts/ToastContext';

interface ToastProps {
    toast: ToastMessage;
    onRemove: (id: number) => void;
}

const toastConfig: { [key in ToastType]: { icon: string; bg: string; border: string; text: string; } } = {
    success: { icon: 'check', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-300' },
    error: { icon: 'alert-triangle', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-300' },
    info: { icon: 'info', bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-300' },
    warning: { icon: 'alert-triangle', bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-300' },
};

const Toast: React.FC<ToastProps> = ({ toast, onRemove }) => {
    const config = toastConfig[toast.type];

    return (
        <Transition
            show={true}
            as="div"
            appear={true}
            enter="transform ease-out duration-300 transition"
            enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
            enterTo="translate-y-0 opacity-100 sm:translate-x-0"
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            className={`w-full max-w-sm rounded-lg shadow-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden ${config.bg} ${config.border} backdrop-blur-xl`}
        >
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <Icon name={config.icon} className={`w-6 h-6 ${config.text}`} />
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className={`text-sm font-semibold ${config.text}`}>
                            {toast.message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={() => onRemove(toast.id)}
                            className="inline-flex rounded-md text-zinc-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            <span className="sr-only">Close</span>
                            <Icon name="x" className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    );
};

interface ToastContainerProps {
    toasts: ToastMessage[];
    onRemove: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => (
    <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
            {toasts.map((toast) => (
                <Toast key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    </div>
);
