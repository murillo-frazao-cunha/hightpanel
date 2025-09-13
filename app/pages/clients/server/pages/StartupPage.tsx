// app/components/server/pages/StartupPage.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Panel } from '../../ui/Panel';
import { Icon } from '../../ui/Icon';
import { useServer } from '../context/ServerContext';
import { editStartup } from '../api';

// Helper para um painel genérico, para evitar repetição
const InfoPanel = ({ title, children, className = '' }: { title: string, children: React.ReactNode, className?: string }) => (
    <div className={`bg-zinc-900/50 p-4 rounded-lg border border-zinc-800 ${className}`}>
        <h3 className="text-xs uppercase text-zinc-400 font-semibold tracking-wider mb-3">{title}</h3>
        {children}
    </div>
);

export const StartupPage: React.FC = () => {
    const { server, isLoading } = useServer();
    const [variables, setVariables] = useState<Record<string, string>>({});
    const [dockerImage, setDockerImage] = useState('');

    // Estados para o formulário
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Efeito para inicializar o estado do formulário UMA VEZ quando os dados do servidor chegam.
    // A dependência agora é [server?.id], então ele só vai rodar de novo se o ID do servidor mudar
    // (ou seja, se o usuário navegar para a página de outro servidor), ignorando as atualizações de status.
    useEffect(() => {
        if (server) {
            const initialVars: Record<string, string> = {};
            (server.core?.variables || []).forEach((v: any) => {
                initialVars[v.envVariable] = server.environment?.[v.envVariable] || '';
            });
            console.log(server)
            setVariables(initialVars);
            setDockerImage(server.dockerImage || '');
        }
    }, [server?.id]); // <-- A MUDANÇA ESTÁ AQUI

    const handleVariableChange = (envVar: string, value: string) => {
        setVariables(prev => ({ ...prev, [envVar]: value }));
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
            setTimeout(() => setSuccessMessage(null), 5000);
        } catch (error: any) {
            setErrorMessage(error.message || 'Falha ao salvar as configurações.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !server) {
        return <Panel className="p-6 text-center text-zinc-400">Carregando configurações de inicialização...</Panel>;
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Principal (ocupa 2/3) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <InfoPanel title="Startup Command">
                        <div className="bg-zinc-950/70 p-3 rounded-md text-zinc-300 font-mono text-sm select-all overflow-x-auto custom-scrollbar-thin">
                            <code>{interpolateStartupCommand()}</code>
                        </div>
                    </InfoPanel>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {(server.core?.variables || []).map((v: any) => (
                            <InfoPanel key={v.envVariable} title={v.name}>
                                <input
                                    type="text"
                                    value={variables[v.envVariable] || ''}
                                    onChange={(e) => handleVariableChange(v.envVariable, e.target.value)}
                                    disabled={isSubmitting}
                                    className="w-full bg-zinc-800/60 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200 placeholder:text-zinc-500 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all disabled:opacity-50"
                                />
                                {v.description && <p className="text-xs text-zinc-500 mt-1.5 break-words">{v.description}</p>}
                            </InfoPanel>
                        ))}
                    </div>
                </div>

                {/* Coluna Lateral (ocupa 1/3) */}
                <div className="lg:col-span-1 flex flex-col gap-6">
                    <InfoPanel title="Docker Image">
                        <select
                            value={dockerImage}
                            onChange={(e) => setDockerImage(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full bg-zinc-800/60 border border-zinc-700/80 rounded-lg px-3 py-2 text-zinc-200 focus:ring-1 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all disabled:opacity-50"
                        >
                            {(server.core?.dockerImages || []).map((img: any) => (
                                <option key={img.image} value={img.image}>{img.name}</option>
                            ))}
                        </select>
                        <p className="text-xs text-zinc-500 mt-1.5 break-words">
                            Esta é uma configuração avançada que permite selecionar a imagem Docker para rodar o servidor.
                        </p>
                    </InfoPanel>
                </div>
            </div>

            {/* Ações do Formulário */}
            <div className="flex justify-end mt-2">
                <button
                    onClick={handleSaveChanges}
                    disabled={isSubmitting}
                    className="px-5 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all duration-300 transform hover:scale-105 shadow-[0_0_15px_-5px] shadow-teal-500/40 disabled:bg-zinc-700 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting && <Icon name="loader" className="w-4 h-4 animate-spin" />}
                    {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
    );
};

export default StartupPage;