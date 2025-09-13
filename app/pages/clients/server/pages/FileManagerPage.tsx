// app/components/server/pages/FileManagerPage.tsx
'use client';
import React, { useState } from 'react';
import { Panel } from '../../ui/Panel';
import { Icon } from '../../ui/Icon';

// Mock File System Data
const fileSystem: { [key: string]: any[] } = {
    'root': [
        { name: 'config', type: 'folder' }, { name: 'plugins', type: 'folder' }, { name: 'world', type: 'folder' },
        { name: 'server.jar', type: 'file', size: '22.5 MB', lastModified: '2023-10-26 10:30' },
        { name: 'eula.txt', type: 'file', size: '1 KB', lastModified: '2023-10-26 10:30' }, { name: 'logs', type: 'folder' },
    ],
    'root/config': [ { name: 'main.yml', type: 'file', size: '15 KB', lastModified: '2023-10-27 11:00' }, { name: 'database.yml', type: 'file', size: '2 KB', lastModified: '2023-10-27 11:05' }, ],
    'root/plugins': [ { name: 'EssentialsX.jar', type: 'file', size: '1.2 MB', lastModified: '2023-10-25 14:00' }, { name: 'WorldEdit.jar', type: 'file', size: '3.5 MB', lastModified: '2023-10-25 14:01' }, ],
    'root/world': [],
    'root/logs': [ { name: 'latest.log', type: 'file', size: '5.8 MB', lastModified: '2023-10-28 09:00' }, { name: '2023-10-27-1.log.gz', type: 'file', size: '1.1 MB', lastModified: '2023-10-27 23:59' }, ]
};

const ActionButtonWithTooltip = ({ icon, label, onClick, className = '' }: any) => (
    <div className="relative group">
        <button onClick={onClick} className={`p-2 rounded-md text-zinc-400 hover:bg-zinc-700 hover:text-white ${className}`}>
            <Icon name={icon} className="w-4 h-4" />
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {label}
        </div>
    </div>
);

export const FileManagerPage = () => {
    const [path, setPath] = useState(['root']);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const currentPathString = path.join('/');
    const items = fileSystem[currentPathString] || [];
    const folders = items.filter(item => item.type === 'folder').sort((a,b) => a.name.localeCompare(b.name));
    const files = items.filter(item => item.type === 'file').sort((a,b) => a.name.localeCompare(b.name));
    const sortedItems = [...folders, ...files];

    const handleFolderClick = (folderName: string) => { setPath([...path, folderName]); setSelectedItems([]); };
    const handleBreadcrumbClick = (index: number) => { setPath(path.slice(0, index + 1)); setSelectedItems([]); };
    const handleSelect = (itemName: string) => { setSelectedItems(prev => prev.includes(itemName) ? prev.filter(name => name !== itemName) : [...prev, itemName]); };
    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedItems(sortedItems.map(item => item.name));
        } else {
            setSelectedItems([]);
        }
    };

    const allSelected = sortedItems.length > 0 && selectedItems.length === sortedItems.length;

    return (
        <Panel className="h-[564px] flex flex-col text-sm">
            <div className="flex justify-between items-center p-4">
                <div className="flex items-center text-zinc-400">
                    {path.map((segment, index) => (
                        <React.Fragment key={segment}>
                            <button onClick={() => handleBreadcrumbClick(index)} className="hover:text-white">{segment}</button>
                            {index < path.length - 1 && <span className="mx-2">/</span>}
                        </React.Fragment>
                    ))}
                </div>
                {selectedItems.length > 0 && (
                    <div className="flex items-center gap-1 p-1 bg-zinc-950/50 rounded-lg">
                        <span className="text-zinc-400 text-xs px-2">{selectedItems.length} selecionado(s)</span>
                        <ActionButtonWithTooltip icon="archive" label="Arquivar" className="hover:text-sky-400"/>
                        <ActionButtonWithTooltip icon="trash" label="Apagar" className="hover:text-rose-400"/>
                    </div>
                )}
            </div>
            <div className="flex items-center px-4 pb-3 text-xs uppercase tracking-wider text-zinc-500 font-bold">
                <div className="flex-grow flex items-center">
                    <input type="checkbox" onChange={handleSelectAll} checked={allSelected} className="custom-checkbox mr-4"/>
                    Nome
                </div>
                <div className="w-32 flex-shrink-0">Tamanho</div>
                <div className="w-48 flex-shrink-0">Última Modificação</div>
                <div className="w-24 flex-shrink-0 text-right">Ações</div>
            </div>
            <div className="flex-grow overflow-y-auto px-2 custom-scrollbar">
                {sortedItems.map(item => (
                    <div key={item.name} className={`flex items-center py-2 px-2 rounded-lg transition-colors cursor-pointer ${selectedItems.includes(item.name) ? 'bg-zinc-800/60' : 'hover:bg-zinc-800/40'}`} onClick={() => handleSelect(item.name)}>
                        <div className="flex-grow flex items-center">
                            <input type="checkbox" readOnly checked={selectedItems.includes(item.name)} className="custom-checkbox mr-4 pointer-events-none"/>
                            {item.type === 'folder' ? <Icon name="folder" className="w-5 h-5 text-sky-400 mr-3" /> : <Icon name="file" className="w-5 h-5 text-zinc-400 mr-3" />}
                            <span onClick={(e) => { e.stopPropagation(); if (item.type === 'folder') handleFolderClick(item.name); }} className={`text-left ${item.type === 'folder' ? 'text-white hover:underline' : 'text-zinc-300'}`}>{item.name}</span>
                        </div>
                        <div className="w-32 flex-shrink-0 text-zinc-400">{item.size}</div>
                        <div className="w-48 flex-shrink-0 text-zinc-400">{item.lastModified}</div>
                        <div className="w-24 flex-shrink-0 flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            <ActionButtonWithTooltip icon="download" label="Baixar" />
                            <ActionButtonWithTooltip icon="edit" label="Renomear" />
                        </div>
                    </div>
                ))}
            </div>
        </Panel>
    );
};
