// app/components/server/pages/SettingsPage.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Panel } from '../../ui/Panel';
import { Icon } from '../../ui/Icon';
import { useServer } from '../context/ServerContext';
import { editName } from '../api';
import { useUser } from "@/app/contexts/UserContext";
import { motion } from 'framer-motion';

// Helper para um painel genérico, para evitar repetição
const InfoPanel = ({ title, children, className = '' }: { title: string, children: React.ReactNode, className?: string }) => (
    <Panel className={`bg-zinc-900/50 p-5 ${className}`}>
        <h3 className="text-sm uppercase text-zinc-400 font-semibold tracking-wider mb-4">{title}</h3>
        {children}
    </Panel>
);

// Helper para um input de texto
const FormInput = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
        <input
            {...props}
            className="w-full bg-zinc-800/60 rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-500 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all read-only:bg-zinc-900/70 read-only:cursor-default disabled:opacity-50"
        />
    </div>
);

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export const SettingsPage: React.FC = () => {
    const { server: ctxServer, isLoading: ctxLoading, refreshServer } = useServer();
    const {user} = useUser();

    const serverRef = useRef(ctxServer);
    if(!serverRef.current && ctxServer) serverRef.current = ctxServer;
    const server = serverRef.current;
    const isLoading = ctxLoading && !server;

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [group, setGroup] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (server) {
            setName(server.name || '');
            setDescription(server.description || '');
            setGroup(server.group || '');
        }
    }, [server?.id]);

    const handleSaveDetails = async () => {
        if (!server?.id || isSubmitting) return;
        setIsSubmitting(true);
        setSuccessMessage(null);
        setErrorMessage(null);
        try {
            await editName(server.id, name, description, group);
            setSuccessMessage('Detalhes do servidor salvos com sucesso!');
            await refreshServer();
            if(serverRef.current && ctxServer){
                serverRef.current.name = name;
                serverRef.current.description = description;
                serverRef.current.group = group;
            }
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error: any) {
            setErrorMessage(error.message || 'Falha ao salvar os detalhes.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const sftpAddress = `sftp://${server?.nodeip}:${server?.nodeSftp}`;
    const sftpUsername = user?.username && server?.id ? user.username + '_' + server.id.split('-')[0] : '';

    const handleLaunchSftp = () => {
        window.open(sftpAddress);
    };

    if (isLoading || !server) {
        return <LoadingSpinner />;
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <div className="flex flex-col gap-6">
                {successMessage && (
                    <div className="bg-teal-500/10 border border-teal-500/30 text-teal-300 p-3 rounded-lg flex items-center text-sm">
                        <Icon name="check-circle" className="w-5 h-5 mr-2 flex-shrink-0" />
                        {successMessage}
                    </div>
                )}
                {errorMessage && (
                    <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-lg flex items-center text-sm">
                        <Icon name="alert-triangle" className="w-5 h-5 mr-2 flex-shrink-0" />
                        {errorMessage}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <InfoPanel title="Detalhes do SFTP">
                        <div className="flex flex-col gap-4">
                            <FormInput label="ENDEREÇO SFTP" value={sftpAddress} readOnly />
                            <FormInput label="NOME DE USUÁRIO" value={sftpUsername} readOnly />

                            <div className="flex justify-between items-end mt-2">
                                <div className="border-l-4 border-purple-500 pl-4 py-1">
                                    <p className="text-sm text-zinc-300">
                                        Sua senha do SFTP é a mesma que você usa para acessar este painel.
                                    </p>
                                </div>
                                <button onClick={handleLaunchSftp} className="px-4 py-2 rounded-lg bg-zinc-700 text-white font-semibold hover:bg-zinc-600 transition-colors text-sm whitespace-nowrap">
                                    Entrar no SFTP
                                </button>
                            </div>
                        </div>
                    </InfoPanel>

                    <InfoPanel title="Mudar Detalhes do Servidor">
                        <div className="flex flex-col gap-4 h-full">
                            <FormInput label="NOME DO SERVIDOR" value={name} onChange={e => setName(e.target.value)} disabled={isSubmitting} />
                            <FormInput label="AGRUPAMENTO" value={group} onChange={e => setGroup(e.target.value)} placeholder="Ex: Servidores de Minigames" disabled={isSubmitting} />
                            <div>
                                <label className="block text-xs font-medium text-zinc-400 mb-1.5">DESCRIÇÃO DO SERVIDOR</label>
                                <textarea
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    disabled={isSubmitting}
                                    rows={3}
                                    className="w-full bg-zinc-800/60 rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-500 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all disabled:opacity-50 resize-none custom-scrollbar"
                                />
                            </div>

                            <div className="flex-grow flex items-end justify-end pt-4">
                                <button
                                    onClick={handleSaveDetails}
                                    disabled={isSubmitting}
                                    className="px-5 py-2 rounded-lg bg-purple-700 text-white font-semibold hover:bg-purple-800 transition-colors duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {isSubmitting && <Icon name="loader" className="w-4 h-4 animate-spin" />}
                                    {isSubmitting ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </InfoPanel>
                </div>
            </div>
        </motion.div>
    );
};

export default SettingsPage;