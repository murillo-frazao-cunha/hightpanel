'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '../../ui/Icon';
import { useServer } from '../context/ServerContext';
import { editName } from '../api';
import { useUser   } from '@/app/contexts/UserContext';
import { motion } from 'framer-motion';

const InfoSection = ({
                         title,
                         children,
                         className = '',
                     }: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <div
        className={`p-6 rounded-2xl  flex flex-col ${className}`}
    >
        <h3 className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-5 select-none">
            {title}
        </h3>
        {children}
    </div>
);

const FormInput = ({
                       label,
                       ...props
                   }: {
    label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
        <label className="block text-xs font-medium text-zinc-400 mb-2 select-none">{label}</label>
        <input
            {...props}
            className="w-full bg-zinc-800/60 rounded-2xl px-4 py-3 text-zinc-200 placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all disabled:opacity-50 read-only:bg-zinc-900/70 read-only:cursor-default"
        />
    </div>
);

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center">
        <svg
            className="animate-spin h-10 w-10 text-purple-500"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-label="Loading"
            role="img"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    </div>
);

export const SettingsPage: React.FC = () => {
    const { server: ctxServer, isLoading: ctxLoading, refreshServer } = useServer();
    const { user } = useUser  ();

    const serverRef = useRef(ctxServer);
    if (!serverRef.current && ctxServer) serverRef.current = ctxServer;
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
            if (serverRef.current && ctxServer) {
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
    const sftpUsername =
        user?.username && server?.id ? user.username + '_' + server.id.split('-')[0] : '';

    const handleLaunchSftp = () => {
        window.open(sftpAddress);
    };

    if (isLoading || !server) {
        return <LoadingSpinner />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col gap-8"
        >
            {successMessage && (
                <div className="bg-teal-600/20 border border-teal-500/40 text-teal-300 p-4 rounded-2xl flex items-center gap-3 text-sm select-none shadow-md shadow-teal-700/40">
                    <Icon name="check-circle" className="w-5 h-5 flex-shrink-0" />
                    <span>{successMessage}</span>
                </div>
            )}
            {errorMessage && (
                <div className="bg-rose-600/20 border border-rose-500/40 text-rose-300 p-4 rounded-2xl flex items-center gap-3 text-sm select-none shadow-md shadow-rose-700/40">
                    <Icon name="alert-triangle" className="w-5 h-5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <InfoSection title="Detalhes do SFTP">
                    <div className="flex flex-col gap-5">
                        <FormInput label="ENDEREÇO SFTP" value={sftpAddress} readOnly />
                        <FormInput label="NOME DE USUÁRIO" value={sftpUsername} readOnly />

                        <div className="flex justify-between items-end mt-3">
                            <div className="border-l-4 border-purple-600 pl-5 py-2">
                                <p className="text-sm text-zinc-300 select-text">
                                    Sua senha do SFTP é a mesma que você usa para acessar este painel.
                                </p>
                            </div>
                            <button
                                onClick={handleLaunchSftp}
                                className="px-5 py-2 rounded-2xl bg-purple-700 text-white font-semibold hover:bg-purple-800 transition-colors text-sm whitespace-nowrap shadow-md shadow-purple-700/40"
                                type="button"
                            >
                                Entrar no SFTP
                            </button>
                        </div>
                    </div>
                </InfoSection>

                <InfoSection title="Mudar Detalhes do Servidor">
                    <div className="flex flex-col gap-6 h-full">
                        <FormInput
                            label="NOME DO SERVIDOR"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            disabled={isSubmitting}
                        />
                        <FormInput
                            label="AGRUPAMENTO"
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            placeholder="Ex: Servidores de Minigames"
                            disabled={isSubmitting}
                        />
                        <div>
                            <label className="block text-xs font-medium text-zinc-400 mb-2 select-none">
                                DESCRIÇÃO DO SERVIDOR
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                disabled={isSubmitting}
                                rows={4}
                                className="w-full bg-zinc-800/60 rounded-2xl px-4 py-3 text-zinc-200 placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all disabled:opacity-50 resize-none custom-scrollbar"
                            />
                        </div>

                        <div className="flex-grow flex items-end justify-end pt-6">
                            <button
                                onClick={handleSaveDetails}
                                disabled={isSubmitting}
                                className="px-6 py-3 rounded-2xl bg-purple-700 text-white font-semibold hover:bg-purple-800 transition-colors duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center gap-3 shadow-md shadow-purple-700/50"
                                type="button"
                            >
                                {isSubmitting && <Icon name="loader" className="w-5 h-5 animate-spin" />}
                                {isSubmitting ? 'Salvando...' : 'Salvar'}
                            </button>
                        </div>
                    </div>
                </InfoSection>
            </div>
        </motion.div>
    );
};

export default SettingsPage;