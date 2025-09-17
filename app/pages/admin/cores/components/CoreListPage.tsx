'use client';
import React from 'react';
import Link from 'next/link';
import type { Core } from '../types/CoreType';
import { Icon } from "@/app/pages/clients/ui/Icon";

interface CoreListPageProps {
    cores: Core[];
    onDelete: (uuid: string) => void;
    onExport: (uuid: string) => void;
    onImport: (file: File) => void;
}

const CoreRow = ({ core, onDelete, onExport }: { core: Core; onDelete: (uuid: string) => void; onExport: (uuid: string) => void; }) => {
    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        onDelete(core.id);
    };

    return (
        <Link href={`/admin/cores/edit/${core.id}`} className="block group">
            <div className="flex items-center bg-zinc-900/40 backdrop-blur-2xl rounded-lg p-4 transition-all duration-300 hover:bg-zinc-900/60 hover:ring-2 hover:ring-zinc-700/80">
                {/* Ícone */}
                <div className="bg-zinc-800/50 p-3 rounded-lg">
                    <Icon name="cpu" className="w-6 h-6 text-purple-400" />
                </div>
                {/* Informações */}
                <div className="ml-5 flex-grow">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">{core.name}</h3>
                    <p className="text-zinc-400 text-sm mt-1 line-clamp-1 max-w-xl">{core.description || 'Sem descrição.'}</p>
                    <p className="text-zinc-500 text-[11px] mt-1">{core.creatorEmail ? `Criado por ${core.creatorEmail}` : ''}</p>
                </div>
                {/* Ações */}
                <div className="ml-auto flex items-center gap-2">
                    <button onClick={(e)=>{e.preventDefault();e.stopPropagation();onExport(core.id);}} className="p-2 text-zinc-400 hover:text-purple-400 transition-colors" title="Exportar Core"><Icon name="download" className="w-5 h-5"/></button>
                    <button onClick={handleDeleteClick} className="p-2 text-zinc-400 hover:text-rose-400 transition-colors" title="Deletar Core">
                        <Icon name="trash" className="w-5 h-5" />
                    </button>
                    <Icon name="chevronRight" className="w-6 h-6 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
            </div>
        </Link>
    );
};

const CoreListPage: React.FC<CoreListPageProps> = ({ cores, onDelete, onExport, onImport }) => {
    const fileInputId = 'import-core-input';
    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">Gerenciamento de Cores</h1>
                    <p className="text-zinc-400 mt-1">Crie, importe, exporte e gerencie as templates.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <input id={fileInputId} type="file" accept="application/json" className="hidden" onChange={(e)=>{const f=e.target.files?.[0]; if(f){onImport(f); e.target.value='';}}} />
                    <button onClick={()=>document.getElementById(fileInputId)?.click()} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-all duration-300">
                        <Icon name="upload" className="w-5 h-5" /> Importar Core
                    </button>
                    <Link href="/admin/cores/create" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-purple-500/50">
                        <Icon name="plus" className="w-5 h-5" />
                        Criar Novo Core
                    </Link>
                </div>
            </header>
            <div className="flex flex-col gap-4">
                {cores.length > 0 ? (
                    cores.map(core => (
                        <CoreRow key={core.id} core={core} onDelete={onDelete} onExport={onExport} />
                    ))
                ) : (
                    <div className="text-center py-16 bg-zinc-900/40 rounded-lg border border-dashed border-zinc-700">
                        <p className="text-zinc-400">Nenhum core encontrado.</p>
                        <p className="text-zinc-500 text-sm mt-2">Crie ou importe um core para vê-lo aqui.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default CoreListPage;