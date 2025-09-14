// app/components/server/ui/Header.tsx
import React, { useState, useMemo } from 'react';
import { Icon } from '../../ui/Icon';
import { sendServerAction } from '../api';
import { useServer } from '../context/ServerContext';

const HeaderActionButtons = () => {
    const { server, nodeOffline } = useServer();
    const [loading, setLoading] = useState<string | null>(null);

    const disabledMap = useMemo(() => {
        if (!server) return { start: true, restart: true, stop: true, kill: true } as any;
        const base = {
            start: server.status !== 'stopped',
            restart: server.status === 'stopped',
            stop: server.status === 'stopped',
            kill: !server || server.status === 'stopped'
        } as any;
        if (nodeOffline) return { start: true, restart: true, stop: true, kill: true };
        return base;
    }, [server, nodeOffline]);

    const buttons: { label: string; icon: string; color: string; action: 'start' | 'restart' | 'stop' | 'kill'; disabled: boolean }[] = [
        { label: 'Ligar', icon: 'play', color: 'text-green-400 hover:bg-green-500/20', action: 'start', disabled: disabledMap.start },
        { label: 'Reiniciar', icon: 'refresh', color: 'text-sky-400 hover:bg-sky-500/20', action: 'restart', disabled: disabledMap.restart },
        { label: 'Desligar', icon: 'power', color: 'text-amber-400 hover:bg-amber-500/20', action: 'stop', disabled: disabledMap.stop },
        { label: 'Matar', icon: 'skull', color: 'text-rose-400 hover:bg-rose-500/20', action: 'kill', disabled: disabledMap.kill }
    ];

    const handleClick = async (action: 'start' | 'restart' | 'stop' | 'kill') => {
        if (!server?.id || loading || nodeOffline) return;
        try {
            setLoading(action);
            await sendServerAction({ uuid: server.id, action });
        } catch (e) { console.error('Falha ao enviar ação:', e); }
        finally { setLoading(null); }
    };

    return (
        <div className="flex items-center gap-2">
            {buttons.map(btn => {
                const isCurrent = loading === btn.action;
                return (
                    <button
                        key={btn.label}
                        title={nodeOffline ? 'Node offline' : btn.label}
                        disabled={btn.disabled || !server?.id || !!loading || nodeOffline}
                        onClick={() => handleClick(btn.action)}
                        className={`relative flex items-center justify-center p-3 rounded-lg bg-zinc-800/50 transition-colors disabled:opacity-35 disabled:cursor-not-allowed ${btn.color}`}
                    >
                        {isCurrent && <span className="absolute inset-0 animate-pulse bg-zinc-900/30 rounded-lg" />}
                        <Icon name={btn.icon} className="w-5 h-5" />
                    </button>
                );
            })}
        </div>
    );
}

export const ServerHeader = () => {
    const { server, nodeOffline } = useServer();
    const statusLabel = nodeOffline
        ? 'Node Offline'
        : server?.status === 'running' ? 'Rodando' : server?.status === 'initializing' ? 'Inicializando' : server?.status === 'stopped' ? 'Parado' : '...';
    const badgeClass = nodeOffline
        ? 'bg-amber-600/30 text-amber-300 animate-pulse'
        : server?.status === 'running' ? 'bg-teal-600/30 text-teal-300' : server?.status === 'initializing' ? 'bg-amber-600/30 text-amber-300' : 'bg-rose-600/30 text-rose-300';
    return (
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-4xl font-bold text-white mb-1 flex items-center gap-3">
                    {server?.name || '...'}
                    {nodeOffline && <span className="flex items-center gap-1 text-amber-400 text-xs font-semibold uppercase tracking-wide">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                    </span>}
                </h1>
                <p className="text-zinc-400 font-mono flex items-center gap-2"><Icon name="globe" className="w-4 h-4" />{server?.ip || '...'}</p>
                <div className="mt-2 inline-flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${badgeClass}`}>{statusLabel}</span>
                    {!nodeOffline && server?.uptime && server.status === 'running' && <span className="text-xs text-zinc-500">tempo {server.uptime}</span>}
                </div>
            </div>
            <HeaderActionButtons />
        </div>
    );
};
