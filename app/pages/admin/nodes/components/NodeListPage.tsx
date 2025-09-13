'use client';
import React from 'react';
import Link from 'next/link';

import type { Node } from '../types/NodeType';
import {Icon} from "@/app/pages/clients/ui/Icon";

interface NodeListPageProps {
    nodes: Node[];
    onDelete: (uuid: string) => void;
}

// Componente de helper para renderizar uma única linha de node no novo estilo de cartão.
const NodeRow = ({ node, onDelete }: { node: Node; onDelete: (uuid: string) => void; }) => {
    const statusConfig = {
        online: { text: 'Online', color: 'bg-teal-500' },
        offline: { text: 'Offline', color: 'bg-rose-500' },
    };
    const currentStatus = statusConfig[node.status] || statusConfig.offline;

    // Impede a navegação do Link ao clicar no botão de deletar.
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onDelete(node.uuid);
    };

    return (
        <Link href={`/admin/nodes/edit/${node.uuid}`} className="block group">
            <div className="flex items-center bg-zinc-900/40 backdrop-blur-2xl rounded-lg p-4 transition-all duration-300 hover:bg-zinc-900/60 hover:ring-2 hover:ring-zinc-700/80">
                {/* Barra de Status */}
                <div className={`w-1.5 h-16 rounded-full ${currentStatus.color}`}></div>

                {/* Informações Principais */}
                <div className="ml-5 flex-grow">
                    <h3 className="text-lg font-bold text-white">{node.name}</h3>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-mono mt-1">
                        <Icon name="globe" className="w-4 h-4" />
                        <span>{node.ip}</span>
                    </div>
                </div>

                {/* Stats do Node */}
                <div className="hidden lg:flex items-center gap-4 text-sm mx-6">
                    <div title={`Status: ${currentStatus.text}`} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${currentStatus.color === 'bg-teal-500' ? 'bg-teal-500/10 text-teal-300' : 'bg-rose-500/10 text-rose-300'}`}>
                        <div className={`w-2 h-2 rounded-full ${currentStatus.color}`}></div>
                        {currentStatus.text}
                    </div>
                    <div className={`px-3 py-1 text-xs rounded-full font-semibold ${node.ssl ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>
                        SSL {node.ssl ? 'Ativo' : 'Inativo'}
                    </div>
                </div>

                {/* Ações */}
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={handleDeleteClick} className="p-2 text-zinc-400 hover:text-rose-400 transition-colors" title="Deletar Node">
                        <Icon name="trash" className="w-5 h-5" />
                    </button>
                    <Icon name="chevronRight" className="w-6 h-6 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
            </div>
        </Link>
    );
};


// Componente principal que renderiza a página de lista de nodes.
const NodeListPage: React.FC<NodeListPageProps> = ({ nodes, onDelete }) => {
    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">Gerenciamento de Nodes</h1>
                    <p className="text-zinc-400 mt-1">Crie, monitore e gerencie seus nodes de aplicação.</p>
                </div>
                <Link href="/admin/nodes/create" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-teal-500/50">
                    <Icon name="plus" className="w-5 h-5" />
                    Criar Novo Node
                </Link>
            </header>

            <div className="flex flex-col gap-4">
                {nodes.length > 0 ? (
                    nodes.map(node => (
                        <NodeRow key={node.uuid} node={node} onDelete={onDelete} />
                    ))
                ) : (
                    <div className="text-center py-16 bg-zinc-900/40 rounded-lg border border-dashed border-zinc-700">
                        <p className="text-zinc-400">Nenhum node encontrado.</p>
                        <p className="text-zinc-500 text-sm mt-2">Comece criando um novo node para vê-lo aqui.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default NodeListPage;

