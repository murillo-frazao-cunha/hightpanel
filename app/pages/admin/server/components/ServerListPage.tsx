'use client';
import React from 'react';
import Link from 'next/link';
import type { Server } from '../types/ServerType';
import { Icon } from '@/app/pages/clients/ui/Icon';

interface ServerListPageProps {
    servers: Server[];
    onDelete: (uuid: string) => void;
}

const ServerRow: React.FC<{ server: Server; onDelete: (uuid: string) => void; }> = ({ server, onDelete }) => {
    const statusConfig = {
        running: { text: 'Online', color: 'bg-teal-500' },
        stopped: { text: 'Offline', color: 'bg-rose-500' },
        installing: { text: 'Instalando', color: 'bg-amber-500' },
        error: { text: 'Erro', color: 'bg-rose-700' }
    } as const;
    const currentStatus = statusConfig[server.status] || statusConfig.stopped;

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onDelete(server.id);
    };

    return (
        <Link href={`/admin/servers/edit/${server.id}`} className="block group cursor-pointer">
            <div className="flex items-center bg-zinc-900/40 rounded-lg p-4 transition-all hover:bg-zinc-900/60 hover:ring-2 hover:ring-zinc-700/80">
                <div className={`w-1.5 h-16 rounded-full ${currentStatus.color}`}></div>
                <div className="ml-5 flex-grow">
                    <h3 className="text-lg font-bold text-white">{server.name}</h3>
                    <p className="text-zinc-400 text-sm mt-1">Dono: <span className="font-semibold text-zinc-300">{server.owner.email}</span></p>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                    <button onClick={handleDeleteClick} className="p-2 text-zinc-400 hover:text-rose-400">
                        <Icon name="trash" className="w-5 h-5" />
                    </button>
                    <Icon name="chevronRight" className="w-6 h-6 text-zinc-600 group-hover:text-white" />
                </div>
            </div>
        </Link>
    );
};

const ServerListPage: React.FC<ServerListPageProps> = ({ servers, onDelete }) => {
    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">Gerenciamento de Servidores</h1>
                    <p className="text-zinc-400 mt-1">Crie, configure e gerencie os servidores dos seus clientes.</p>
                </div>
                <Link href="/admin/servers/create" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all">
                    <Icon name="plus" className="w-5 h-5" />
                    Criar Novo Servidor
                </Link>
            </header>
            <div className="flex flex-col gap-4">
                {servers.length > 0 ? (
                    servers.map(server => (
                        <ServerRow key={server.id} server={server} onDelete={onDelete} />
                    ))
                ) : (
                    <div className="text-center py-16 bg-zinc-900/40 rounded-lg border border-dashed border-zinc-700">
                        <p className="text-zinc-400">Nenhum servidor encontrado.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default ServerListPage;