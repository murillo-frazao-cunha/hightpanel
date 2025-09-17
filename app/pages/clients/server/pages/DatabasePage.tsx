// app/components/server/pages/DatabasesPage.tsx
'use client';
import React, { useState, Fragment, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Panel } from '../../ui/Panel';
import { Icon } from '../../ui/Icon';
import { ConfirmModal } from '../../ui/ModalConfirm';
import { useServer } from '../context/ServerContext';
import { createServerDatabase, deleteServerDatabase, ServerDatabase } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

// --- Helper Components ---

const CreateDatabaseModal = ({ isOpen, onClose, onSubmit, isSubmitting }: any) => {
    const [dbName, setDbName] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit(dbName);
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
                            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-zinc-900 text-left align-middle shadow-xl transition-all">
                                <form onSubmit={handleSubmit}>
                                    <div className="p-6">
                                        <Dialog.Title as="h3" className="text-lg font-bold text-white">Criar Novo Banco de Dados</Dialog.Title>
                                        <p className="text-sm text-zinc-400 mt-1">O nome final será prefixado (ex: sXXXX_nome, usuário: uXXXX_nome).</p>
                                        <div className="mt-4">
                                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Nome do Banco de Dados</label>
                                            <input
                                                type="text"
                                                value={dbName}
                                                onChange={(e) => setDbName(e.target.value)}
                                                disabled={isSubmitting}
                                                placeholder="ex: `meu_site` ou `dados_players`"
                                                className="w-full bg-zinc-800/60 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                    </div>
                                    <div className="bg-zinc-950/50 px-6 py-3 flex justify-end gap-3">
                                        <button type="button" onClick={onClose} disabled={isSubmitting} className="px-4 py-2 rounded-lg text-sm font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors">Cancelar</button>
                                        <button type="submit" disabled={isSubmitting || !dbName} className="px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:bg-zinc-700 flex items-center gap-2">
                                            {isSubmitting && <Icon name="loader" className="w-4 h-4 animate-spin" />}
                                            Criar Banco de Dados
                                        </button>
                                    </div>
                                </form>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};

const ViewDatabaseModal = ({ db, onClose }: { db: ServerDatabase | null, onClose: () => void }) => {
    const [copied, setCopied] = useState('');

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopied(field);
        setTimeout(() => setCopied(''), 2000);
    };

    if(!db) return null;

    const fields = [
        { label: 'Endpoint', value: db.host ? `${db.host}${db.port ? ':'+db.port : ''}` : db.hostId },
        { label: 'Database Name', value: db.name },
        { label: 'Username', value: db.username },
        { label: 'Password', value: db.password || 'Senha não disponível' },
        ...(db.phpmyAdminLink ? [{ label: 'phpMyAdmin', value: db.phpmyAdminLink }] : [])
    ];

    return (
        <Transition appear show={!!db} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-zinc-900 text-left align-middle shadow-xl transition-all">
                                <div className="p-6">
                                    <Dialog.Title as="h3" className="text-lg font-bold text-white">Detalhes do Banco de Dados</Dialog.Title>
                                    <p className="text-sm text-zinc-400 mt-1">Use estas informações para se conectar ao seu banco de dados.</p>
                                    <div className="space-y-3 mt-4">
                                        {fields.map(field => (
                                            <div key={field.label}>
                                                <label className="block text-xs font-medium text-zinc-400">{field.label}</label>
                                                <div className="flex items-center gap-2">
                                                    <input type="text" readOnly value={field.value} className="w-full bg-zinc-950/80 border border-zinc-700 rounded-md px-3 py-1.5 text-zinc-300 font-mono text-sm" />
                                                    <button onClick={() => copyToClipboard(field.value, field.label)} className="p-2 rounded-md hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors">
                                                        <Icon name={copied === field.label ? 'check' : 'copy'} className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-zinc-950/50 px-6 py-3 flex justify-between gap-3 flex-col sm:flex-row sm:items-center">
                                    {db.phpmyAdminLink && (
                                        <a href={db.phpmyAdminLink} target="_blank" rel="noreferrer" className="px-5 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors flex items-center gap-2">
                                            <Icon name="globe" className="w-4 h-4" /> Abrir phpMyAdmin
                                        </a>
                                    )}
                                    <button onClick={onClose} className="px-5 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition-colors">Fechar</button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
};


// --- Main Component ---

export const DatabasesPage: React.FC = () => {
    const { server: ctxServer, isLoading: ctxLoading, refreshServer } = useServer();

    const serverRef = useRef(ctxServer);
    if (!serverRef.current && ctxServer) {
        serverRef.current = ctxServer;
    }
    const server = serverRef.current;
    const isLoading = ctxLoading && !server;

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [viewingDb, setViewingDb] = useState<any | null>(null);
    const [dbToDelete, setDbToDelete] = useState<any | null>(null);

    const handleCreateDatabase = async (name: string) => {
        if (!server?.id) return;
        setIsSubmitting(true);
        setErrorMessage(null);
        try {
            const result = await createServerDatabase(server.id, name);
            if (result.success) {
                if (!server.databases) server.databases = [] as any;
                if (result.database) {
                    if (!server.databases.find((d: any) => d.name === result.database?.name)) {
                        // @ts-ignore
                        server.databases.push(result.database);
                    }
                } else {
                    await refreshServer();
                }
                setIsCreateModalOpen(false);
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'Falha ao criar banco de dados.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteDatabase = async () => {
        if (!server?.id || !dbToDelete) return;
        setIsSubmitting(true);
        setErrorMessage(null);
        try {
            const targetName = dbToDelete.name;
            await deleteServerDatabase(server.id, targetName);
            if (server.databases) {
                server.databases = server.databases.filter((d: any) => d.name !== targetName);
            }
        } catch (error: any) {
            setErrorMessage(error.message || 'Falha ao apagar o banco de dados.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !server) {
        return <LoadingSpinner />;
    }

    const databases = server.databases || [];
    const dbLimit = server.databasesQuantity || 0;
    const canCreateDb = databases.length < dbLimit;

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <CreateDatabaseModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateDatabase} isSubmitting={isSubmitting} />
            <ViewDatabaseModal db={viewingDb} onClose={() => setViewingDb(null)} />
            <ConfirmModal
                isOpen={!!dbToDelete}
                onClose={() => setDbToDelete(null)}
                onConfirm={handleDeleteDatabase}
                title="Excluir Banco de Dados"
                message={`Tem certeza que deseja apagar o banco de dados "${dbToDelete?.name}"? Esta ação é irreversível e todos os dados serão perdidos.`}
            />

            <div className="flex flex-col gap-6">
                {errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg flex items-center text-sm">
                        <Icon name="alert-triangle" className="w-5 h-5 mr-2 flex-shrink-0" />
                        {errorMessage}
                    </div>
                )}

                <Panel className="bg-zinc-900/50 p-4 flex justify-between items-center">
                    <p className="text-sm text-zinc-300">
                        Você está usando <span className="font-bold text-white">{databases.length}</span> de <span className="font-bold text-white">{dbLimit}</span> bancos de dados disponíveis.
                    </p>
                    <button onClick={() => setIsCreateModalOpen(true)} disabled={!canCreateDb || isSubmitting} className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center gap-2">
                        <Icon name="plus" className="w-4 h-4" />
                        Novo Banco de Dados
                    </button>
                </Panel>

                <motion.div layout className="space-y-3">
                    <AnimatePresence>
                        {databases.length > 0 ? databases.map(db => (
                            <motion.div key={db.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
                                <Panel className="bg-zinc-900/60 p-4 flex items-center gap-4 text-sm">
                                    <Icon name="database" className="w-6 h-6 text-zinc-400" />
                                    <div className="flex-grow grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-zinc-500">DATABASE NAME</p>
                                            <p className="text-zinc-200 font-mono">{db.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">USERNAME</p>
                                            <p className="text-zinc-200 font-mono">{db.username}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500">ENDPOINT</p>
                                            <p className="text-zinc-200 font-mono">{db.host ? `${db.host}${db.port ? ':'+db.port : ''}` : db.hostId}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 ml-2">
                                        {db.phpmyAdminLink && (
                                            <a href={db.phpmyAdminLink} target="_blank" rel="noreferrer" className="p-2 rounded-full text-zinc-400 hover:bg-purple-500/20 hover:text-purple-400 transition-colors" title="Abrir phpMyAdmin">
                                                <Icon name="globe" className="w-4 h-4" />
                                            </a>
                                        )}
                                        <button onClick={() => setViewingDb(db)} disabled={isSubmitting} className="p-2 rounded-full text-zinc-400 hover:bg-purple-500/20 hover:text-purple-400 transition-colors" title="Ver Detalhes">
                                            <Icon name="eye" className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => setDbToDelete(db)} disabled={isSubmitting} className="p-2 rounded-full text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors" title="Deletar">
                                            <Icon name="trash" className="w-4 h-4" />
                                        </button>
                                    </div>
                                </Panel>
                            </motion.div>
                        )) : (
                            <div className="text-center py-10 border-2 border-dashed border-zinc-800 rounded-lg">
                                <Icon name="database" className="w-10 h-10 mx-auto text-zinc-600" />
                                <p className="mt-2 text-zinc-500">Nenhum banco de dados foi criado ainda.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default DatabasesPage;
