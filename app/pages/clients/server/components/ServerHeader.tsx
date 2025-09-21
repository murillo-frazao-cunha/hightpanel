import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '../../ui/Icon'; // Ajuste o caminho conforme sua estrutura
import { useServer } from '../context/ServerContext'; // Ajuste o caminho conforme sua estrutura

export const ServerHeader = () => {
    const { server, nodeOffline } = useServer();

    const statusMap = {
        running: { label: 'Rodando', badgeClass: 'bg-gradient-to-r from-teal-600/60 to-teal-500/40 text-teal-300 shadow-md shadow-teal-600/40' },
        initializing: { label: 'Inicializando', badgeClass: 'bg-gradient-to-r from-amber-600/60 to-amber-500/40 text-amber-300 shadow-md shadow-amber-600/40' },
        stopped: { label: 'Parado', badgeClass: 'bg-gradient-to-r from-rose-600/60 to-rose-500/40 text-rose-300 shadow-md shadow-rose-600/40' },
    };

    const currentStatus = server ? statusMap[server.status] : null;

    const statusLabel = nodeOffline ? 'Node Offline' : currentStatus?.label || '...';
    const badgeClass = nodeOffline
        ? 'bg-gradient-to-r from-amber-600/60 to-amber-500/40 text-amber-300 animate-pulse shadow-md shadow-amber-600/40'
        : currentStatus?.badgeClass || 'bg-zinc-700/40 text-zinc-300';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex justify-between items-start mb-8"
        >
            <div>
                <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-300 mb-1 flex items-center gap-3 min-w-[14rem] max-w-full truncate">
                    {server?.name || <span className="w-48 h-10 bg-zinc-800 rounded-lg animate-pulse" />}
                    {nodeOffline && (
                        <span
                            className="relative flex items-center justify-center w-4 h-4 rounded-full bg-amber-400"
                            title="Node Offline"
                            aria-label="Node Offline"
                        >
                            <span className="absolute w-4 h-4 rounded-full bg-amber-400 animate-ping" />
                        </span>
                    )}
                </h1>
                <p className="text-zinc-400 font-mono flex items-center gap-2 truncate max-w-[20rem]">
                    <Icon name="globe" className="w-5 h-5 flex-shrink-0" />
                    {server?.ip || <span className="w-32 h-5 bg-zinc-800 rounded-md animate-pulse" />}
                </p>
                <div className="mt-4 inline-flex items-center gap-3 flex-wrap">
                    <span
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider select-none ${badgeClass}`}
                    >
                        {statusLabel}
                    </span>
                    {!nodeOffline && server?.uptime && server.status === 'running' && (
                        <span className="text-xs text-zinc-500 font-mono select-none">uptime {server.uptime}</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
};