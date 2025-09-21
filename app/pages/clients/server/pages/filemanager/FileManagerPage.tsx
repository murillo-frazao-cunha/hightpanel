'use client';
import React, { useEffect, useState, useRef, Fragment } from 'react';
import { Icon } from '../../../ui/Icon';
import { useServer } from "../../context/ServerContext";
import {
    fmList, fmWrite, fmRename, fmDownload, fmMassDelete, fmMassArchive, fmMkdir, fmMove, fmUpload, FMItem,
    fmUnarchive
} from '../../api';
import { FileEditorView } from './FileEditorView';
import { ConfirmModal } from '../../../ui/ModalConfirm';
import { InputModal } from '../../../ui/InputModal';
import { UploadModal, UploadItem } from './UploadModal';
import { FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-label="Loading" role="img">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);
// --- Helper Components ---
const ActionButtonWithTooltip = ({ icon, label, onClick, className = '', disabled = false }: any) => (
    <div className="relative group z-50">
        <button
            disabled={disabled}
            onClick={onClick}
            className={`p-2 rounded-md text-zinc-400 hover:bg-zinc-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
            aria-label={label}
            type="button"
        >
            <Icon name={icon} className="w-4 h-4" />
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-2 py-1 bg-black text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none select-none">
            {label}
        </div>
    </div>
);
// --- File List View ---
const FileManagerListView = ({ uuid, currentPath }: { uuid: string, currentPath: string }) => {
    const [items, setItems] = useState<FMItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [renaming, setRenaming] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [massBusy, setMassBusy] = useState(false);
    const [modal, setModal] = useState<'delete' | 'createFile' | 'createDir' | null>(null);
    const [deletePaths, setDeletePaths] = useState<string[]>([]);
    const [dragOverPath, setDragOverPath] = useState<string | null>(null);
    const [isDraggingFile, setIsDraggingFile] = useState(false);
    const [uploads, setUploads] = useState<UploadItem[]>([]);
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const uploadInputRef = useRef<HTMLInputElement>(null);
    const listContainerRef = useRef<HTMLDivElement>(null);

    const pathSegments = currentPath ? currentPath.split('/').filter(Boolean) : [];

    const refresh = async (targetPath = currentPath, silent = false) => {
        if (!silent) setLoading(true);
        else setIsRefreshing(true);
        setError(null);

        try {
            const res = await fmList(uuid, targetPath);
            setItems(res.items.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === 'folder' ? -1 : 1)));
            if (!silent) setSelected(new Set());
        } catch (e: any) { setError(e.message); }
        finally {
            if (silent) setIsRefreshing(false);
            else setLoading(false);
        }
    };

    useEffect(() => { refresh(currentPath); }, [uuid, currentPath]);

    const navigateToPath = (path: string) => { window.location.hash = `#path:${path}`; };
    const navigateToEdit = (path: string) => { window.location.hash = `#edit:${path}`; };
    const breadcrumbClick = (index: number) => {
        if (index < 0) { navigateToPath(''); return; }
        const newRel = pathSegments.slice(0, index + 1).join('/');
        navigateToPath(newRel);
    };

    const toggleSelect = (p: string) => { setSelected(prev => { const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n; }); };
    const allSelected = items.length > 0 && selected.size === items.length;
    const toggleSelectAll = () => { if (allSelected) setSelected(new Set()); else setSelected(new Set(items.map(i => i.path))); };

    const handleRename = async (item: FMItem) => {
        if (!newName.trim() || newName === item.name) { setRenaming(null); return; }
        try { await fmRename(uuid, item.path, newName.trim()); await refresh(undefined, true); }
        catch (e: any) { alert(e.message); } finally { setRenaming(null); }
    };

    const handleDownload = async (item: FMItem) => {
        if (item.type !== 'file') return;
        try {
            const data = await fmDownload(uuid, item.path);
            const blob = b64ToBlob(data.base64);
            const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = data.fileName; document.body.appendChild(a); a.click(); a.remove();
            setTimeout(() => URL.revokeObjectURL(a.href), 2000);
        } catch (e: any) { alert(e.message); }
    };

    const handleDelete = async (paths: string[]) => {
        if (paths.length === 0) return;
        setMassBusy(true);
        try { await fmMassDelete(uuid, paths); await refresh(); }
        catch (e: any) { alert(e.message); } finally { setMassBusy(false); }
    };

    const handleUnarchive = async (item: FMItem) => {
        if (item.type !== 'file' && !item.name.endsWith('.rar') && !item.name.endsWith(".zip") && !item.name.endsWith(".tar.gz")) return;
        setMassBusy(true);
        const path = item.path.split('/');
        path.pop();

        try { await fmUnarchive(uuid, item.path, path.join("/")); await refresh(); }
        catch (e: any) { alert(e.message); } finally { setMassBusy(false); }
    };

    const handleMassArchive = async () => {
        if (selected.size === 0) return;
        setMassBusy(true);
        try { await fmMassArchive(uuid, Array.from(selected)); await refresh(); }
        catch (e: any) { alert(e.message); } finally { setMassBusy(false); }
    };

    const handleCreate = async (name: string, type: "delete" | "createFile" | "createDir") => {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        try {
            if (type === 'createFile') await fmWrite(uuid, fullPath, '');
            else await fmMkdir(uuid, fullPath);
            await refresh();
        } catch (e: any) { alert(e.message); }
    };

    const handleMove = async (sourcePath: string, destPath: string) => {
        try { await fmMove(uuid, sourcePath, destPath); await refresh(undefined, true); }
        catch (e: any) { alert(e.message); }
    };

    const handleFileUploads = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const newUploads = Array.from(files).map(file => ({ id: `${file.name}-${Date.now()}`, name: file.name, progress: 0, status: 'uploading' as 'uploading' }));
        setUploads(prev => [...prev, ...newUploads]);
        newUploads.forEach((upload, index) => {
            const file = files[index];
            const reader = new FileReader();
            reader.onprogress = (event) => { if (event.lengthComputable) { const progress = Math.round((event.loaded / event.total) * 100); setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, progress } : u)); } };
            reader.onload = async (e) => {
                const base64 = (e.target?.result as string)?.split(',')[1];
                if (base64) {
                    try { const destPath = currentPath ? `${currentPath}/${file.name}` : file.name; await fmUpload(uuid, destPath, { contentBase64: base64 }); setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'completed', progress: 100 } : u)); }
                    catch (err) { setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error' } : u)); }
                }
            };
            reader.onerror = () => { setUploads(prev => prev.map(u => u.id === upload.id ? { ...u, status: 'error' } : u)); };
            reader.readAsDataURL(file);
        });
        if (uploadInputRef.current) uploadInputRef.current.value = "";
    };

    const onDragStartItem = (e: MouseEvent | TouchEvent | PointerEvent, item: FMItem) => { // @ts-ignore
        e.dataTransfer.setData('sourcePath', item.path); };
    const onDragOverItem = (e: React.DragEvent<HTMLDivElement>, item: FMItem) => { e.preventDefault(); if (item.type === 'folder') setDragOverPath(item.path); };
    const onDropItem = (e: React.DragEvent<HTMLDivElement>, destItem: FMItem) => {
        e.preventDefault();
        setDragOverPath(null);
        if (destItem.type !== 'folder') return;
        const sourcePath = e.dataTransfer.getData('sourcePath');
        const sourceName = sourcePath.split('/').pop();
        if (sourcePath && sourceName) { const destPath = `${destItem.path}/${sourceName}`; handleMove(sourcePath, destPath); }
    };
    const onDragEnterPage = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); if (e.dataTransfer.types.includes('Files')) { setIsDraggingFile(true); } };
    const onDragLeavePage = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingFile(false); };
    const onDropPage = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDraggingFile(false); if (e.dataTransfer.files) { handleFileUploads(e.dataTransfer.files); } };

    if (loading) {
        return <LoadingSpinner />;
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col text-sm relative"
            onDragEnter={onDragEnterPage}
        >
            <input
                type="file"
                ref={uploadInputRef}
                onChange={(e) => handleFileUploads(e.target.files)}
                className="hidden"
                multiple
            />

            {isDraggingFile && (
                <div
                    className="absolute inset-0 bg-purple-500/20 backdrop-blur-sm z-30 flex items-center justify-center border-2 border-dashed border-purple-400 rounded-lg pointer-events-none"
                    onDragLeave={onDragLeavePage}
                    onDrop={onDropPage}
                >
                    <div className="text-center select-none">
                        <Icon name="upload-cloud" className="w-16 h-16 text-purple-300 mx-auto" />
                        <p className="mt-4 text-xl font-bold text-white">Solte os arquivos para fazer o upload</p>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center p-4 gap-4 border-b border-zinc-800/50 flex-shrink-0">
                <div className="flex items-center text-zinc-400 flex-wrap gap-1 text-base select-none">
                    <button onClick={() => navigateToPath('')} className="hover:text-white" type="button">
                        /home/enderd
                    </button>
                    {pathSegments.map((seg, idx) => (
                        <Fragment key={idx + seg}>
                            <span className="text-zinc-500 select-none">/</span>
                            <button onClick={() => breadcrumbClick(idx)} className="hover:text-white" type="button">
                                {seg}
                            </button>
                        </Fragment>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    {selected.size > 0 ? (
                        <div className="flex items-center gap-2 p-1 bg-zinc-950/50 rounded-lg select-none">
                            <span className="text-zinc-400 text-xs px-2">{selected.size} selecionado(s)</span>
                            <ActionButtonWithTooltip
                                disabled={massBusy}
                                icon="archive"
                                label="Arquivar"
                                onClick={handleMassArchive}
                                className="hover:text-purple-400"
                            />
                            <ActionButtonWithTooltip
                                disabled={massBusy}
                                icon="trash"
                                label="Apagar"
                                onClick={() => {
                                    setDeletePaths(Array.from(selected));
                                    setModal('delete');
                                }}
                                className="hover:text-rose-400"
                            />
                        </div>
                    ) : (
                        <>
                            <button
                                onClick={() => setModal('createDir')}
                                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-zinc-200"
                                type="button"
                            >
                                Criar Pasta
                            </button>
                            <button
                                onClick={() => uploadInputRef.current?.click()}
                                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded text-xs text-zinc-200"
                                type="button"
                            >
                                Upload
                            </button>
                            <button
                                onClick={() => setModal('createFile')}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded text-xs text-white"
                                type="button"
                            >
                                Novo Arquivo
                            </button>
                            <button
                                onClick={() => refresh(currentPath, true)}
                                disabled={isRefreshing}
                                className="p-2 rounded-md hover:bg-zinc-700 disabled:opacity-50"
                                type="button"
                                aria-label="Atualizar lista"
                            >
                                <Icon
                                    name="refresh"
                                    className={`w-4 h-4 text-zinc-300 ${isRefreshing ? 'animate-spin' : ''}`}
                                />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div
                className="flex items-center px-4 py-2 text-xs uppercase tracking-wider text-zinc-500 font-bold flex-shrink-0 select-none"
                role="checkbox"
                aria-checked={allSelected}
                tabIndex={0}
                onClick={toggleSelectAll}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleSelectAll();
                    }
                }}
            >
                <div className="flex-grow flex items-center gap-4 ml-[6px]">
                    <div
                        className={`w-5 h-5 border-2 rounded-[4px] flex items-center justify-center transition-all duration-200 ${
                            allSelected ? 'border-purple-400' : 'border-zinc-600'
                        }`}
                    >
                        {allSelected && <FiCheck className="w-4 h-4 text-purple-400" />}
                    </div>
                </div>
            </div>

            <motion.div
                layout
                ref={listContainerRef}
                className="flex-grow overflow-y-auto px-2 custom-scrollbar relative"
                role="list"
                aria-label="Lista de arquivos e pastas"
            >
                <AnimatePresence>
                    {error && !loading && (
                        <div className="text-rose-400 text-xs p-2" role="alert">
                            {error}
                        </div>
                    )}
                    {!loading &&
                        items.map((item) => {
                            const isSelected = selected.has(item.path);
                            const isRenaming = renaming === item.path;
                            const isDragOver = dragOverPath === item.path;
                            return (
                                <motion.div
                                    key={item.path}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -20 }}
                                    onClick={() =>
                                        item.type === 'folder'
                                            ? navigateToPath(item.path)
                                            : navigateToEdit(item.path)
                                    }
                                    draggable
                                    onDragStart={(e) => onDragStartItem(e, item)}
                                    onDragOver={(e) => onDragOverItem(e, item)}
                                    onDragLeave={() => setDragOverPath(null)}
                                    onDrop={(e) => onDropItem(e, item)}
                                    className={`flex items-center justify-center px-1 rounded-[4px] mt-[5px] cursor-pointer transition-colors bg-zinc-900/70 ${
                                        isSelected ? 'bg-zinc-700/60' : 'hover:bg-zinc-800/60'
                                    } ${isDragOver ? 'bg-purple-500/20 ring-1 ring-purple-500' : ''}`}
                                    role="listitem"
                                    aria-selected={isSelected}
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (item.type === 'folder') navigateToPath(item.path);
                                            else navigateToEdit(item.path);
                                        }
                                    }}
                                >
                                    <div
                                        className="px-2.5 flex items-center justify-center cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelect(item.path);
                                        }}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            className="absolute w-0 h-0 opacity-0 pointer-events-none"
                                            readOnly
                                            tabIndex={-1}
                                        />
                                        <div
                                            className={`w-5 h-5 border-2 rounded-[4px] flex items-center justify-center transition-all duration-200 ${
                                                isSelected ? 'border-purple-400' : 'border-zinc-600'
                                            }`}
                                        >
                                            {isSelected && <FiCheck className="w-4 h-4 text-purple-400" />}
                                        </div>
                                    </div>
                                    <div className="flex-grow flex items-center gap-3 pointer-events-none pl-1 select-text">
                                        {item.type === 'folder' ? (
                                            <Icon name="folder" className="w-5 h-5 text-purple-400" />
                                        ) : (
                                            <Icon name="file" className="w-5 h-5 text-zinc-400" />
                                        )}
                                        {isRenaming ? (
                                            <input
                                                autoFocus
                                                value={newName}
                                                onBlur={() => setRenaming(null)}
                                                onChange={(e) => setNewName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleRename(item);
                                                    if (e.key === 'Escape') setRenaming(null);
                                                }}
                                                className="bg-zinc-900 rounded px-2 py-0.5 text-sm outline-none pointer-events-auto"
                                                onClick={(e) => e.stopPropagation()}
                                                aria-label={`Renomear ${item.name}`}
                                            />
                                        ) : (
                                            <span className="text-zinc-200 truncate" title={item.name}>
                                            {item.name}
                                        </span>
                                        )}
                                    </div>
                                    <div className="w-24 flex-shrink-0 text-right text-zinc-400 text-xs pointer-events-none select-text">
                                        {item.type === 'file' && formatSize(item.size)}
                                    </div>
                                    <div className="w-48 flex-shrink-0 text-right text-zinc-400 text-xs pointer-events-none select-text">
                                        {formatDateAgo(item.lastModified)}
                                    </div>
                                    <div
                                        className="w-40 flex-shrink-0 flex items-center justify-end gap-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        {item.type === 'file' && (
                                            <ActionButtonWithTooltip
                                                icon="download"
                                                label="Baixar"
                                                onClick={() => handleDownload(item)}
                                            />
                                        )}
                                        {item.type === 'file' &&
                                            (item.name.endsWith('.zip') ||
                                                item.name.endsWith('.rar') ||
                                                item.name.endsWith('.tar.gz')) && (
                                                <ActionButtonWithTooltip
                                                    icon="archive"
                                                    label="Desarquivar"
                                                    onClick={() => {
                                                        handleUnarchive(item);
                                                    }}
                                                />
                                            )}
                                        <ActionButtonWithTooltip
                                            icon="edit"
                                            label="Renomear"
                                            onClick={() => {
                                                setRenaming(item.path);
                                                setNewName(item.name);
                                            }}
                                        />
                                        <ActionButtonWithTooltip
                                            icon="trash"
                                            label="Apagar"
                                            onClick={() => {
                                                setDeletePaths([item.path]);
                                                setModal('delete');
                                            }}
                                            className="hover:text-rose-400"
                                        />
                                    </div>
                                </motion.div>
                            );
                        })}
                </AnimatePresence>
            </motion.div>

            {uploads.length > 0 && (
                <div className="fixed bottom-6 right-6 z-40">
                    <button
                        onClick={() => setIsUploadModalOpen(true)}
                        className="bg-purple-600 text-white px-5 py-3 rounded-lg shadow-lg flex items-center gap-3 cursor-pointer hover:bg-purple-500 transition-colors transform hover:scale-105"
                        type="button"
                    >
                        <Icon name="loader" className="w-5 h-5 animate-spin" />
                        <span className="text-sm font-medium">Enviando {uploads.length} arquivo(s)...</span>
                    </button>
                </div>
            )}
            <UploadModal
                isOpen={isUploadModalOpen}
                uploads={uploads}
                onClose={() => setIsUploadModalOpen(false)}
            />
            <ConfirmModal
                isOpen={modal === 'delete'}
                onClose={() => setModal(null)}
                onConfirm={() => handleDelete(deletePaths)}
                title="Confirmar Exclusão"
                message={`Você tem certeza que deseja apagar ${deletePaths.length} item(ns)? Esta ação não pode ser desfeita.`}
                confirmText="Sim, Apagar"
                confirmColor="rose"
            />
            <InputModal
                isOpen={modal === 'createFile' || modal === 'createDir'}
                onClose={() => setModal(null)}
                onConfirm={(name) => handleCreate(name, modal!)}
                title={modal === 'createFile' ? 'Criar Novo Arquivo' : 'Criar Nova Pasta'}
                message={
                    modal === 'createFile'
                        ? 'Digite o nome para o novo arquivo (ex: config.yml).'
                        : 'Digite o nome para a nova pasta.'
                }
                placeholder={modal === 'createFile' ? 'arquivo.txt' : 'minha-pasta'}
            />
        </motion.div>
    );
};

// --- Main Component (Router) ---
interface ViewState { mode: 'list' | 'edit'; path: string; }

export const FileManagerPage = () => {
    const { server, nodeOffline, isLoading } = useServer();
    const uuid = server?.id;
    const [view, setView] = useState<ViewState>({ mode: 'list', path: '' });

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.slice(1);
            if (hash.startsWith('edit:')) setView({ mode: 'edit', path: hash.substring(5) });
            else if (hash.startsWith('path:')) setView({ mode: 'list', path: hash.substring(5) });
            else setView({ mode: 'list', path: '' });
        };
        window.addEventListener('hashchange', handleHashChange);
        handleHashChange();
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    const handleBackFromEditor = (path: string) => { window.location.hash = `#path:${path}`; };

    if (isLoading && !uuid) {
        return <LoadingSpinner />;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className={`relative w-full text-zinc-200 flex flex-col ${view.mode === 'edit' ? 'h-screen' : ''}`}>
            {nodeOffline && (
                <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-zinc-950/85 backdrop-blur-sm">
                    <div className="w-28 h-28 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
                    <h2 className="mt-6 text-amber-300 font-semibold text-xl tracking-wide">Node Offline</h2>
                    <p className="mt-2 text-amber-400/70 text-sm max-w-xs text-center leading-relaxed">
                        O gerenciador de arquivos está temporariamente indisponível.
                        Tentando reconectar automaticamente...
                    </p>
                </div>
            )}
            <div className={nodeOffline ? 'pointer-events-none select-none opacity-40' : view.mode === 'edit' ? 'w-full h-screen' : ''} >
                {view.mode === 'list' && <FileManagerListView uuid={uuid!} currentPath={view.path} />}
                {view.mode === 'edit' && <FileEditorView uuid={uuid!} filePath={view.path} onBackAction={handleBackFromEditor} />}
            </div>
        </motion.div>
    );
};

// --- Helper Functions ---
function b64ToBlob(base64: string) { const bin = atob(base64); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr]); }
function formatSize(size: number | null) { if (size == null) return '-'; if (size < 1024) return size + ' B'; if (size < 1024 * 1024) return (size / 1024).toFixed(1) + ' KB'; if (size < 1024 * 1024 * 1024) return (size / 1024 / 1024).toFixed(1) + ' MB'; return (size / 1024 / 1024 / 1024).toFixed(1) + ' GB'; }
function formatDateAgo(ts: number) {
    const now = new Date();
    const modifiedDate = new Date(ts);
    const diffSeconds = Math.floor((now.getTime() - modifiedDate.getTime()) / 1000);
    if (diffSeconds < 60) return "agora mesmo";
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `há ${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `há ${diffHours} h`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `há ${diffDays} d`;
    return modifiedDate.toLocaleDateString();
}
