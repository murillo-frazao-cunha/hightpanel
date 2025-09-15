// app/components/server/pages/SettingsPage.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Panel } from '../../ui/Panel';
import { Icon } from '../../ui/Icon';
import { useServer } from '../context/ServerContext';
import { editName } from '../api';
import {useUser} from "@/app/contexts/UserContext"; // Importando a função da API

// Helper para um painel genérico, para evitar repetição
const InfoPanel = ({ title, children, className = '' }: { title: string, children: React.ReactNode, className?: string }) => (
    <Panel className={`bg-zinc-900/50 p-5 border border-zinc-800 ${className}`}>
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
            className="w-full bg-zinc-800/60 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-500 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all read-only:bg-zinc-900/70 read-only:cursor-default disabled:opacity-50"
        />
    </div>
);

export const SettingsPage: React.FC = () => {
    const { server: ctxServer, isLoading: ctxLoading, refreshServer } = useServer();
    const {user} = useUser();

    // Congela server
    const serverRef = useRef(ctxServer);
    if(!serverRef.current && ctxServer) serverRef.current = ctxServer;
    const server = serverRef.current;
    const isLoading = ctxLoading && !server;

    // Estados para o formulário de edição
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Inicializa formulário apenas primeira vez que o server aparece
    useEffect(() => {
        if (server) {
            setName(server.name || '');
            setDescription(server.description || '');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [server?.id]);

    const handleSaveDetails = async () => {
        if (!server?.id || isSubmitting) return;
        setIsSubmitting(true);
        setSuccessMessage(null);
        setErrorMessage(null);
        try {
            await editName(server.id, name, description);
            setSuccessMessage('Detalhes do servidor salvos com sucesso!');
            await refreshServer();
            // Sincroniza manualmente com potencial novo nome/descrição do ctxServer
            if(serverRef.current && ctxServer){
                serverRef.current.name = name;
                serverRef.current.description = description;
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
        return <Panel className="p-6 text-center text-zinc-400">Carregando configurações...</Panel>;
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Mensagens de Feedback */}
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
                {/* Coluna SFTP */}
                <InfoPanel title="Detalhes do SFTP">
                    <div className="flex flex-col gap-4">
                        <FormInput label="ENDEREÇO SFTP" value={sftpAddress} readOnly />
                        <FormInput label="NOME DE USUÁRIO" value={sftpUsername} readOnly />

                        <div className="flex justify-between items-end mt-2">
                            <div className="border-l-4 border-sky-500 pl-4 py-1">
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

                {/* Coluna de Edição */}
                <InfoPanel title="Mudar Detalhes do Servidor">
                    <div className="flex flex-col gap-4 h-full">
                        <FormInput label="NOME DO SERVIDOR" value={name} onChange={e => setName(e.target.value)} disabled={isSubmitting} />
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-1.5">DESCRIÇÃO DO SERVIDOR</label>
                            <textarea
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                disabled={isSubmitting}
                                rows={4}
                                className="w-full bg-zinc-800/60 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-500 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all disabled:opacity-50 resize-none custom-scrollbar"
                            />
                        </div>

                        <div className="flex-grow flex items-end justify-end">
                            <button
                                onClick={handleSaveDetails}
                                disabled={isSubmitting}
                                className="mt-[-15px] px-5 py-2 rounded-lg bg-sky-600 text-white font-semibold hover:bg-sky-700 transition-colors duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSubmitting && <Icon name="loader" className="w-4 h-4 animate-spin" />}
                                {isSubmitting ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </InfoPanel>
            </div>
        </div>
    );
};

export default SettingsPage;