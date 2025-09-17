'use client';
import React, { useState } from 'react';
import type { ApiType } from '../types/ApiType';
import { Icon } from "@/app/pages/clients/ui/Icon";
import { format } from 'date-fns';

interface ApiKeyRowProps {
    apiKey: ApiType;
    onDelete: (id: string) => void;
}

const ApiKeyRow: React.FC<ApiKeyRowProps> = ({ apiKey, onDelete }) => {
    const [hasCopied, setHasCopied] = useState(false);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onDelete(apiKey.id);
    };

    const copyToClipboard = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        console.log(apiKey)
        navigator.clipboard.writeText(apiKey.id);
        setHasCopied(true);
        setTimeout(() => setHasCopied(false), 2000); // Reset after 2s
    };

    return (
        <div className="block group">
            <div className="flex items-center bg-zinc-900/40 backdrop-blur-2xl rounded-lg p-4 transition-all duration-300 hover:bg-zinc-900/60 hover:ring-2 hover:ring-zinc-700/80">
                <div className="bg-zinc-800/50 p-3 rounded-lg">
                    <Icon name="key" className="w-6 h-6 text-amber-400" />
                </div>
                <div className="ml-5 flex-grow">
                    <h3 className="text-lg font-bold text-white">{apiKey.name}</h3>
                    <p className="text-zinc-400 text-sm mt-1 line-clamp-1 max-w-xl">{apiKey.description || 'Sem descrição.'}</p>
                    {/* Token Display */}
                    <div className="mt-3">
                        <p className="text-xs text-zinc-500 mb-1">Token</p>
                        <div className="relative bg-zinc-950 p-2.5 rounded-lg border border-zinc-700 flex items-center justify-between">
                            <code className="text-purple-300 break-all text-sm">{apiKey.id}</code>
                            <button onClick={copyToClipboard} className="p-2 text-zinc-400 hover:text-white transition-colors" title="Copiar Token">
                                <Icon name={hasCopied ? 'check' : 'copy'} className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <p className="text-zinc-500 text-xs mt-3">
                        Criado em: {format(new Date(apiKey.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                    </p>
                </div>
                <div className="ml-auto flex items-center self-start gap-2 pl-4">
                    <button onClick={handleDeleteClick} className="p-2 text-zinc-400 hover:text-rose-400 transition-colors" title="Deletar Chave">
                        <Icon name="trash" className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

interface ApiListPageProps {
    apiKeys: ApiType[];
    onDelete: (id: string) => void;
    onOpenCreateModal: () => void;
}

const ApiListPage: React.FC<ApiListPageProps> = ({ apiKeys, onDelete, onOpenCreateModal }) => {
    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">Chaves de API</h1>
                    <p className="text-zinc-400 mt-1">Gerencie chaves de API para integrar com serviços externos.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <button onClick={onOpenCreateModal} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-purple-500/50">
                        <Icon name="plus" className="w-5 h-5" />
                        Criar Nova Chave
                    </button>
                </div>
            </header>
            <div className="flex flex-col gap-4">
                {apiKeys.length > 0 ? (
                    apiKeys.map(key => (
                        <ApiKeyRow key={key.id} apiKey={key} onDelete={onDelete} />
                    ))
                ) : (
                    <div className="text-center py-16 bg-zinc-900/40 rounded-lg border border-dashed border-zinc-700">
                        <p className="text-zinc-400">Nenhuma chave de API encontrada.</p>
                        <p className="text-zinc-500 text-sm mt-2">Crie uma nova chave para começar a usar a API.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default ApiListPage;
