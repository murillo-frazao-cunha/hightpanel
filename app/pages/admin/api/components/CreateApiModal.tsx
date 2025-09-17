'use client';
import React, { useState } from 'react';
import { Icon } from "@/app/pages/clients/ui/Icon";
import { ApiType } from '../types/ApiType';
import { ToastProvider, useToast } from '@/app/contexts/ToastContext';
interface CreateApiModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApiKeyCreated: (newKey: ApiType) => void; // Callback to update the list
    createApiKey: (name: string, description: string) => Promise<ApiType>;
}

export const CreateApiModal: React.FC<CreateApiModalProps> = ({ isOpen, onClose, onApiKeyCreated, createApiKey }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiType | null>(null);
    const [hasCopied, setHasCopied] = useState(false);

    const { addToast } = useToast();
    const handleClose = () => {
        // Reset state when closing
        setName('');
        setDescription('');
        setError(null);
        setIsSubmitting(false);
        setNewlyCreatedKey(null);
        setHasCopied(false);
        onClose();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) {
            setError('O nome é obrigatório.');
            return;
        }
        setError(null);
        setIsSubmitting(true);
        try {
            const newKey = await createApiKey(name, description);
            setNewlyCreatedKey(newKey);
            onApiKeyCreated(newKey); // Update the list in the parent component
        } catch (err: any) {
            addToast(err.message || 'Ocorreu um erro ao criar a chave.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const copyToClipboard = () => {
        if (newlyCreatedKey?.token) {
            navigator.clipboard.writeText(newlyCreatedKey.token);
            setHasCopied(true);
            setTimeout(() => setHasCopied(false), 2000); // Reset after 2s
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex justify-center items-center z-50 p-4" onClick={handleClose}>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl w-full max-w-lg transform transition-all" onClick={e => e.stopPropagation()}>
                <header className="flex items-center justify-between p-5 border-b border-zinc-800">
                    <h2 className="text-xl font-bold text-white">{newlyCreatedKey ? 'Chave de API Criada' : 'Criar Nova Chave de API'}</h2>
                    <button onClick={handleClose} className="text-zinc-400 hover:text-white transition-colors">
                        <Icon name="x" className="w-6 h-6" />
                    </button>
                </header>

                {newlyCreatedKey ? (
                    <div className="p-6 text-center">
                        <p className="text-zinc-300 mb-4">A chave foi criada com sucesso.</p>
                        <div className="relative bg-zinc-950 p-4 rounded-lg border border-zinc-700">
                            <code className="text-purple-300 break-all">{newlyCreatedKey.token}</code>
                            <button onClick={copyToClipboard} className="absolute top-2 right-2 p-2 text-zinc-400 hover:text-white transition-colors">
                                <Icon name={hasCopied ? 'check' : 'copy'} className="w-5 h-5" />
                            </button>
                        </div>
                        <button onClick={handleClose} className="mt-6 w-full bg-purple-600 text-white font-semibold py-3 rounded-lg hover:bg-purple-700 transition-all">
                            Entendi, fechar
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="apiKeyName" className="block text-sm font-medium text-zinc-300 mb-2">Nome</label>
                                <input
                                    id="apiKeyName"
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder='Ex: Integração com Discord'
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="apiKeyDescription" className="block text-sm font-medium text-zinc-300 mb-2">Descrição (Opcional)</label>
                                <textarea
                                    id="apiKeyDescription"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    rows={3}
                                    placeholder='Usada para o bot de notificações do Discord.'
                                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                            {error && <p className="text-rose-400 text-sm">{error}</p>}
                        </div>
                        <footer className="flex justify-end gap-4 p-5 border-t border-zinc-800">
                            <button type="button" onClick={handleClose} className="px-5 py-2.5 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-all">
                                Cancelar
                            </button>
                            <button type="submit" disabled={isSubmitting} className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all disabled:bg-purple-800 disabled:cursor-not-allowed flex items-center gap-2">
                                {isSubmitting && <Icon name="loader" className="animate-spin w-5 h-5" />}
                                {isSubmitting ? 'Criando...' : 'Criar Chave'}
                            </button>
                        </footer>
                    </form>
                )}
            </div>
        </div>
    );
};