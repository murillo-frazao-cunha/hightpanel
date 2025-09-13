// app/components/server/ui/Header.tsx
import React, { useState, useMemo } from 'react';
import { Icon } from '../../ui/Icon';
import { sendServerAction } from '../api';
import { useServer } from '../context/ServerContext';

const HeaderActionButtons = () => {
    const { server } = useServer();
    const [loading, setLoading] = useState<string | null>(null);

    const disabledMap = useMemo(() => {
        if (!server) return { start: true, restart: true, stop: true };
        return {
            start: server.status !== 'stopped',
            restart: server.status === 'stopped',
            stop: server.status === 'stopped'
        };
    }, [server]);

    const buttons: { label: string; icon: string; color: string; action: 'start' | 'restart' | 'stop' | 'kill'; disabled: boolean }[] = [
        { label: 'Ligar', icon: 'play', color: 'text-green-400 hover:bg-green-500/20', action: 'start', disabled: disabledMap.start },
        { label: 'Reiniciar', icon: 'refresh', color: 'text-sky-400 hover:bg-sky-500/20', action: 'restart', disabled: disabledMap.restart },
        { label: 'Desligar', icon: 'power', color: 'text-amber-400 hover:bg-amber-500/20', action: 'stop', disabled: disabledMap.stop },
        { label: 'Matar', icon: 'skull', color: 'text-rose-400 hover:bg-rose-500/20', action: 'kill', disabled: !server || server.status === 'stopped' }
    ];

    const handleClick = async (action: 'start' | 'restart' | 'stop' | 'kill') => {
        if (!server?.id || loading) return;
        try {
            setLoading(action);
            await sendServerAction({ uuid: server.id, action });
        } catch (e) {
            console.error('Falha ao enviar ação:', e);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex items-center gap-2">
            {buttons.map(btn => {
                const isCurrent = loading === btn.action;
                return (
                    <button
                        key={btn.label}
                        title={btn.label}
                        disabled={btn.disabled || !server?.id || !!loading}
                        onClick={() => handleClick(btn.action)}
                        className={`relative flex items-center justify-center p-3 rounded-lg bg-zinc-800/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${btn.color}`}
                    >
                        {isCurrent && (
                            <span className="absolute inset-0 animate-pulse bg-zinc-900/30 rounded-lg" />
                        )}
                        <Icon name={btn.icon} className="w-5 h-5" />
                    </button>
                );
            })}
        </div>
    );
}

export const ServerHeader = () => {
    const { server } = useServer();
    const statusLabel = server?.status === 'running' ? 'Rodando' : server?.status === 'initializing' ? 'Inicializando' : server?.status === 'stopped' ? 'Parado' : '...';
    return (
        <div className="flex justify-between items-start mb-8">
            <div>
                <h1 className="text-4xl font-bold text-white mb-1">{server?.name || '...'}</h1>
                <p className="text-zinc-400 font-mono flex items-center gap-2"><Icon name="globe" className="w-4 h-4" />{server?.ip || '...'}</p>
                <div className="mt-2 inline-flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase tracking-wide ${server?.status === 'running' ? 'bg-teal-600/30 text-teal-300' : server?.status === 'initializing' ? 'bg-amber-600/30 text-amber-300' : 'bg-rose-600/30 text-rose-300'}`}>{statusLabel}</span>
                    {server?.uptime && server.status === 'running' && <span className="text-xs text-zinc-500">tempo {server.uptime}</span>}
                </div>
            </div>
            <HeaderActionButtons />
        </div>
    );
};
