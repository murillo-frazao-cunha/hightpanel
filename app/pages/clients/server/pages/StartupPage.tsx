'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Panel } from '../../ui/Panel';
import { Icon } from '../../ui/Icon';
import { useServer } from '../context/ServerContext';
import { editStartup } from '../api';
import { motion } from 'framer-motion';

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

const InfoPanel = ({
                       title,
                       children,
                       className = '',
                   }: {
    title: string;
    children: React.ReactNode;
    className?: string;
}) => (
    <Panel className={`bg-zinc-900/50 p-6 rounded-2xl shadow-md shadow-black/30 flex flex-col ${className}`}>
        <h3 className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-5 select-none">
            {title}
        </h3>
        {children}
    </Panel>
);

export const StartupPage: React.FC = () => {
    const { server: ctxServer, isLoading: ctxLoading } = useServer();
    const serverRef = useRef(ctxServer);
    if (!serverRef.current && ctxServer) serverRef.current = ctxServer;
    const server = serverRef.current;
    const isLoading = ctxLoading && !server;

    const [variables, setVariables] = useState<Record<string, string>>({});
    const [dockerImage, setDockerImage] = useState('');

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    useEffect(() => {
        if (server) {
            const initialVars: Record<string, string> = {};
            (server.core?.variables || []).forEach((v: any) => {
                initialVars[v.envVariable] = server.environment?.[v.envVariable] || '';
            });
            setVariables(initialVars);
            setDockerImage(server.dockerImage || '');
        }
    }, [server?.id]);

    const handleVariableChange = (envVar: string, value: string) => {
        setVariables((prev) => ({ ...prev, [envVar]: value }));
    };

    const interpolateStartupCommand = () => {
        if (!server?.core?.startupCommand) return '';
        let command = server.core.startupCommand;
        command = command.replace(/\{\{SERVER_MEMORY\}\}/g, String(server.ram.total || 1024));
        Object.entries(variables).forEach(([key, value]) => {
            command = command.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
        });
        return command;
    };

    const handleSaveChanges = async () => {
        if (!server?.id || isSubmitting) return;

        setIsSubmitting(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            await editStartup(server.id, dockerImage, variables);
            setSuccessMessage('Configurações de inicialização salvas com sucesso!');
            if (serverRef.current) {
                serverRef.current.dockerImage = dockerImage;
                serverRef.current.environment = { ...serverRef.current.environment, ...variables };
            }
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error: any) {
            setErrorMessage(error.message || 'Falha ao salvar as configurações.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !server) {
        return <LoadingSpinner />;
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col gap-8"
        >
            {successMessage && (
                <div className="bg-purple-600/20 border border-purple-500/40 text-purple-300 p-4 rounded-2xl flex items-center gap-3 text-sm select-none shadow-md shadow-purple-700/40">
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 flex flex-col gap-8">
                    <InfoPanel title="Startup Command">
                        <div className="bg-zinc-950/90 p-4 rounded-2xl text-zinc-300 font-mono text-sm select-all overflow-x-auto custom-scrollbar-thin">
                            <code>{interpolateStartupCommand()}</code>
                        </div>
                    </InfoPanel>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(server.core?.variables || []).map((v: any) => (
                            <InfoPanel key={v.envVariable} title={v.name}>
                                <input
                                    type="text"
                                    value={variables[v.envVariable] || ''}
                                    onChange={(e) => handleVariableChange(v.envVariable, e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full bg-zinc-800/60 rounded-2xl px-4 py-3 text-zinc-200 placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all disabled:opacity-50"
                                    aria-label={v.name}
                                />
                                {v.description && (
                                    <p className="text-xs text-zinc-500 mt-2 break-words select-text">
                                        {v.description}
                                    </p>
                                )}
                            </InfoPanel>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-1 flex flex-col gap-8">
                    <InfoPanel title="Docker Image">
                        <select
                            value={dockerImage}
                            onChange={(e) => setDockerImage(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full bg-zinc-800/60 rounded-2xl px-4 py-3 text-zinc-200 focus:ring-2 focus:ring-purple-600 focus:border-transparent outline-none transition-all disabled:opacity-50"
                            aria-label="Selecionar imagem Docker"
                        >
                            {(server.core?.dockerImages || []).map((img: any) => (
                                <option key={img.image} value={img.image}>
                                    {img.name}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-3 break-words select-text">
                            Esta é uma configuração avançada que permite selecionar a imagem Docker para rodar o servidor.
                        </p>
                    </InfoPanel>
                </div>
            </div>

            <div className="flex justify-end mt-4">
                <button
                    onClick={handleSaveChanges}
                    disabled={isSubmitting}
                    className="px-6 py-3 rounded-2xl bg-purple-700 text-white font-semibold hover:bg-purple-800 transition-colors duration-300 transform hover:scale-105 shadow-lg shadow-purple-600/50 disabled:bg-zinc-700 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-3 select-none"
                    aria-disabled={isSubmitting}
                >
                    {isSubmitting && <Icon name="loader" className="w-5 h-5 animate-spin" />}
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </motion.div>
    );
};

export default StartupPage;