import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '../../ui/Icon'; // Ajuste o caminho conforme sua estrutura
import { useServer } from '../context/ServerContext'; // Ajuste o caminho conforme sua estrutura
import { sendServerAction } from '../api'; // Ajuste o caminho conforme sua estrutura



export const ServerHeader = () => {
    const { server, nodeOffline } = useServer();

    const statusMap = {
        running: { label: 'Rodando', badgeClass: 'bg-teal-600/30 text-teal-300' },
        initializing: { label: 'Inicializando', badgeClass: 'bg-amber-600/30 text-amber-300' },
        stopped: { label: 'Parado', badgeClass: 'bg-rose-600/30 text-rose-300' },
    };

    const currentStatus = server ? statusMap[server.status] : null;

    const statusLabel = nodeOffline ? 'Node Offline' : currentStatus?.label || '...';
    const badgeClass = nodeOffline ? 'bg-amber-600/30 text-amber-300 animate-pulse' : currentStatus?.badgeClass || 'bg-zinc-600/30 text-zinc-300';

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex justify-between items-start mb-8"
        >
            <div>
                <h1 className="text-4xl font-bold text-white mb-1 flex items-center gap-3">
                    {server?.name || <span className="w-48 h-10 bg-zinc-800 rounded-md animate-pulse" />}
                    {nodeOffline && (
                        <span className="w-3 h-3 rounded-full bg-amber-400 relative flex" title="Node Offline">
                            <span className="w-3 h-3 rounded-full bg-amber-400 absolute animate-ping" />
                        </span>
                    )}
                </h1>
                <p className="text-zinc-400 font-mono flex items-center gap-2">
                    <Icon name="globe" className="w-4 h-4" />
                    {server?.ip || <span className="w-32 h-5 bg-zinc-800 rounded-md animate-pulse" />}
                </p>
                <div className="mt-3 inline-flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-md text-xs font-semibold uppercase tracking-wider ${badgeClass}`}>{statusLabel}</span>
                    {!nodeOffline && server?.uptime && server.status === 'running' && (
                        <span className="text-xs text-zinc-500 font-mono">uptime {server.uptime}</span>
                    )}
                </div>
            </div>

        </motion.div>
    );
};
