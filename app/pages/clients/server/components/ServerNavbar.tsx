// app/components/server/ui/ServerNavbar.tsx
import React, {useMemo, useState} from 'react';
import Link from 'next/link';
import {useUser} from "@/app/contexts/UserContext";
import {useServer} from "@/app/pages/clients/server/context/ServerContext";
import {sendServerAction} from "@/app/pages/clients/server/api";
import {AnimatePresence, motion} from "framer-motion";
import {Icon} from "@/app/pages/clients/ui/Icon";
const HeaderActionButtons = () => {
    const { server, nodeOffline } = useServer();
    const [loading, setLoading] = useState<string | null>(null);

    const disabledMap = useMemo(() => {
        if (!server || nodeOffline) return { start: true, restart: true, stop: true, kill: true };
        return {
            start: server.status !== 'stopped',
            stop: server.status === 'stopped',
            restart: server.status === 'stopped',
            kill: server.status === 'stopped'
        };
    }, [server, nodeOffline]);

    const handleClick = async (action: 'start' | 'restart' | 'stop' | 'kill') => {
        if (!server?.id || loading || nodeOffline) return;
        try {
            setLoading(action);
            await sendServerAction({ uuid: server.id, action });
        } catch (e) {
            console.error('Falha ao enviar ação:', e);
            // Adicionar um feedback visual de erro para o usuário seria uma boa prática
        } finally {
            setLoading(null);
        }
    };

    const buttons: { label: string; icon: string; color: string; action: 'start' | 'restart' | 'stop' | 'kill' }[] = [
        { label: 'Ligar', icon: 'play', color: 'text-green-400 hover:bg-green-500/10 border-green-500/30 hover:border-green-500/80', action: 'start' },
        { label: 'Desligar', icon: 'power', color: 'text-amber-400 hover:bg-amber-500/10 border-amber-500/30 hover:border-amber-500/80', action: 'stop' },
        { label: 'Reiniciar', icon: 'refresh', color: 'text-sky-400 hover:bg-sky-500/10 border-sky-500/30 hover:border-sky-500/80', action: 'restart' },
        { label: 'Matar', icon: 'skull', color: 'text-rose-400 hover:bg-rose-500/10 border-rose-500/30 hover:border-rose-500/80', action: 'kill' }
    ];

    return (
        <div className="flex items-center gap-2">
            {buttons.map(btn => {
                const isDisabled = disabledMap[btn.action] || !!loading;
                const isCurrent = loading === btn.action;
                return (
                    <motion.button
                        key={btn.label}
                        title={nodeOffline ? 'Node offline' : btn.label}
                        disabled={isDisabled}
                        onClick={() => handleClick(btn.action)}
                        className={`relative flex items-center justify-center p-3 rounded-xl bg-zinc-900/50 border transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${btn.color}`}
                        whileHover={{ scale: isDisabled ? 1 : 1.05, y: isDisabled ? 0 : -2 }}
                        whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                    >
                        <AnimatePresence>
                            {isCurrent && (
                                <motion.span
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center"
                                >
                                    <span className="h-4 w-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                </motion.span>
                            )}
                        </AnimatePresence>
                        <Icon name={btn.icon} className={`w-5 h-5 transition-opacity ${isCurrent ? 'opacity-0' : 'opacity-100'}`} />
                    </motion.button>
                );
            })}
        </div>
    );
}
export const ServerNavbar = ({ serverId, activePage }: { serverId: string, activePage: string }) => {
    const pages = [
        { id: 'console', name: 'Console' },
        { id: 'files', name: 'Arquivos' },
        { id: 'database', name: 'Databases' },
        { id: 'network', name: 'Rede' },
        { id: 'startup',name: 'Inicialização' },
        { id: 'settings', name: 'Configurações' },
    ];
    const {user} = useUser()
    return (
        <div className="mb-6 flex justify-between">
            <nav className="flex space-x-2 bg-zinc-900/30 backdrop-blur-lg p-1 rounded-xl w-fit">
                {pages.map(page => (
                    <Link
                        key={page.id}
                        href={`/server/${serverId}/${page.id}`}
                        className={`py-2 px-4 rounded-lg transition-colors text-sm font-semibold ${activePage === page.id ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        {page.name}
                    </Link>
                ))}
                { /* Espaço para caso o usuario for admin, ter um link pra ir até a página editar, mas é um icone de ir até tlgd, n algo escrito */}
                {user?.admin && (
                    <Link
                        key="edit"
                        href={`/admin/servers/edit/${serverId}`}
                        className={`py-2 px-4 rounded-lg transition-colors text-sm font-semibold ${'text-zinc-400 hover:text-white'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                    </Link>
                )}
            </nav>
            <HeaderActionButtons></HeaderActionButtons>
        </div>
    );
};
