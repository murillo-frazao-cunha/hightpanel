'use client';

import { Sidebar } from '../ui/Sidebar';
import { Background } from '../ui/Background';
import { ServerHeader } from './components/ServerHeader';
import { ServerStats } from './components/ServerStats';
import { ServerNavbar } from './components/ServerNavbar';
import { ConsolePage } from './pages/ConsolePage';
import { FileManagerPage } from './pages/filemanager/FileManagerPage';
import StartupPage from "@/app/pages/clients/server/pages/StartupPage";
import SettingsPage from "@/app/pages/clients/server/pages/SettingsPage";
import NetworkPage from "@/app/pages/clients/server/pages/NetworkPage";
import DatabasePage from "@/app/pages/clients/server/pages/DatabasePage";
import { ServerUsageCharts } from './components/ServerUsageCharts';
import React, { useMemo, useState } from 'react';
import { useServer } from "@/app/pages/clients/server/context/ServerContext";
import { sendServerAction } from "@/app/pages/clients/server/api";
import { AnimatePresence, motion } from "framer-motion";
import { Icon } from "@/app/pages/clients/ui/Icon";
import SubdomainPage from "@/app/pages/clients/server/pages/SubdomainPage";

// --- Tipos ---
export interface Server {
    uuid: string;
    id: string;
    name: string;
    description: string;
    status: 'running' | 'stopped' | 'installing' | 'error' | 'initializing';
    subdomain?: string;
    [key: string]: any;
}

interface ServerContainerProps {
    id: string;
    propertie?: string; // console, files, settings, etc.
}

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
        } finally {
            setLoading(null);
        }
    };

    const buttons: { label: string; icon: string; color: string; action: 'start' | 'restart' | 'stop' | 'kill' }[] = [
        { label: 'Ligar', icon: 'play', color: 'text-green-400 hover:bg-green-500/20 border-green-500/40 hover:border-green-500/90', action: 'start' },
        { label: 'Desligar', icon: 'power', color: 'text-rose-400 hover:bg-rose-500/20 border-rose-500/40 hover:border-rose-500/90', action: 'stop' },
        { label: 'Reiniciar', icon: 'refresh', color: 'text-purple-400 hover:bg-purple-500/20 border-purple-500/40 hover:border-purple-500/90', action: 'restart' },
        { label: 'Matar', icon: 'skull', color: 'text-amber-400 hover:bg-amber-500/20 border-amber-500/40 hover:border-amber-500/90', action: 'kill' }
    ];

    return (
        <div className="grid grid-cols-4 gap-4">
            {buttons.map(btn => {
                const isDisabled = disabledMap[btn.action] || !!loading;
                const isCurrent = loading === btn.action;
                return (
                    <motion.button
                        key={btn.label}
                        title={nodeOffline ? 'Node offline' : btn.label}
                        disabled={isDisabled}
                        onClick={() => handleClick(btn.action)}
                        className={`relative flex flex-col items-center justify-center gap-1.5 p-4 rounded-2xl bg-zinc-900/60 border border-zinc-700/40 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-md ${btn.color} backdrop-blur-sm`}
                        whileHover={{ scale: isDisabled ? 1 : 1.07 }}
                        whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                        aria-label={btn.label}
                    >
                        <AnimatePresence>
                            {isCurrent && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex items-center justify-center bg-zinc-900/70 rounded-2xl"
                                >
                                    <div className="h-6 w-6 border-4 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <div className={`transition-opacity ${isCurrent ? 'opacity-0' : 'opacity-100'}`}>
                            <Icon name={btn.icon} className="w-6 h-6 mx-auto" />
                        </div>
                    </motion.button>
                );
            })}
        </div>
    );
};

// --- Componente Principal ---
export default function ServerContainer({ id, propertie }: ServerContainerProps) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-200 font-['Inter',_sans_serif] flex">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
            `}</style>
            <Background />
            <Sidebar />
            <ServerContent id={id} propertie={propertie} />
        </div>
    );
}

function ServerContent({ id, propertie }: { id: string; propertie?: string }) {
    const { server, mutate } = useServer() as any;
    const activePage = propertie || 'console';

    const handleSubdomainCreated = (subdomain: string) => {
        if (mutate) {
            mutate(); // Re-fetch server data to get the latest subdomain
        } else {
            window.location.reload();
        }
    };

    const renderActivePage = () => {
        if (!server) {
            return (
                <div className="flex items-center justify-center h-64">
                    <div className="h-10 w-10 border-4 border-zinc-400 border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        switch (activePage) {
            case 'files': return <FileManagerPage />;
            case 'startup': return <StartupPage />;
            case "settings": return <SettingsPage />;
            case 'network': return <NetworkPage />;
            case 'database': return <DatabasePage />;
            case 'subdomain': return <SubdomainPage />;
            case 'console':
            default:
                return <ConsolePage />;
        }
    };

    return (
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
            <ServerHeader />
            <ServerNavbar serverId={id} activePage={activePage} />

            <div className="mt-6 flex flex-col lg:flex-row gap-10 lg:items-start">
                <div className="w-full lg:w-3/4 rounded-2xl bg-zinc-900/40 backdrop-blur-xl p-6 shadow-lg shadow-black/40 border border-zinc-700/40">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activePage}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                            {renderActivePage()}
                        </motion.div>
                    </AnimatePresence>
                </div>
                <aside className="w-full lg:w-1/4 flex flex-col gap-6">
                    <HeaderActionButtons />
                    <ServerStats  />
                </aside>
            </div>

            {activePage === 'console' && (
                <ServerUsageCharts />
            )}
        </main>
    );
}