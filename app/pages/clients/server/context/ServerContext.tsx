'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import axios from 'axios';
import { sendServerAction, ServerAction } from '../api';
import {useUser} from "@/app/contexts/UserContext";
import { useRouter } from 'next/navigation';

// --- Tipos ---
// --- Tipos ---
type ServerStatus = 'running' | 'initializing' | 'stopped';

interface ServerData {
    id: string;
    name: string;
    ip: string;
    status: ServerStatus;
    cpu: number; // uso atual em %
    maxCpu: number; // limite
    ram: { used: number; total: number; unit: string; };
    disk: { used: number; total: number; unit: string; };
    networkIn: number
    networkOut: number
    uptime: string;
    startedAt?: number;
    environment: any
    dockerImage: string
    nodeip: string
    nodePort: number
    nodeSftp: number
    description: string
    core: {
        dockerImages: any[];
        variables: any[];
        startupCommand: string
    }

    databasesQuantity: number;
    databases: { [key: string]: any }[]; // E isso também será uma string JSON

    // quantidade de alocações adicionais que o user mesmo pode criar
    addicionalAllocationsNumbers: number;

    primaryAllocation: {
        id: string
        nodeId: string;
        ip: string;
        externalIp: string | null;
        port: number;
        assignedTo: string | null;
    }
    additionalAllocation: [{
        id: string
        nodeId: string;
        ip: string;
        externalIp: string | null;
        port: number;
        assignedTo: string | null;
    }]


    group?: string; // opcional, pode ser usado para categorizar servidores
    subdomain?: string; // opcional, subdomínio associado ao servidor
}

interface LogEntry {
    time: string;
    type: 'INFO' | 'WARN' | 'AUTH' | 'CMD' | 'ERROR';
    msg: string;
}

interface ServerContextType {
    server: ServerData | null;
    logs: LogEntry[];
    sendCommand: (command: string) => Promise<void> | void;
    isLoading: boolean;
    isSendingCommand: boolean;
    refreshServer: () => Promise<ServerData | null>; // novo
    nodeOffline: boolean; // indica se a node está inacessível (falha no usage)
}

// --- Log Inicial ---
const initialLogs: LogEntry[] = [];

// --- Contexto ---
const ServerContext = createContext<ServerContextType | undefined>(undefined);

// Define o tipo usado no cache em memória (estava faltando)
interface EphemeralUsageCache {
    status: ServerStatus;
    cpu: number;
    ramUsed: number;
    ramTotal: number;
    uptime: string;
    startedAt?: number;
    networkIn: number
    networkOut: number;
}

// Cache global em memória que persiste até fechar/recarregar a aba
// Usa uma propriedade em globalThis para não reinicializar entre montagens do provider.
const __GLOBAL_USAGE_CACHE_KEY__ = '__SERVER_USAGE_CACHE__';
const globalAny = globalThis as any;
if (!globalAny[__GLOBAL_USAGE_CACHE_KEY__]) {
    globalAny[__GLOBAL_USAGE_CACHE_KEY__] = {} as Record<string, EphemeralUsageCache>;
}
const usageSessionStore: Record<string, EphemeralUsageCache> = globalAny[__GLOBAL_USAGE_CACHE_KEY__];

// Garante limpeza somente quando a aba for fechada / recarregada
if (typeof window !== 'undefined' && !(window as any).__USAGE_CACHE_LISTENER__) {
    window.addEventListener('beforeunload', () => {
        try { Object.keys(usageSessionStore).forEach(k => delete usageSessionStore[k]); } catch {}
    });
    (window as any).__USAGE_CACHE_LISTENER__ = true;
}

// --- Provider ---
export const ServerProvider = ({ children }: { children: ReactNode }) => {
    const [uuid, setUuid] = useState<string | null>(null);
    const [server, setServer] = useState<ServerData | null>(null);
    const [logs, setLogs] = useState<LogEntry[]>(initialLogs);
    const [isLoading, setIsLoading] = useState(true);
    const [isSendingCommand, setIsSendingCommand] = useState(false);
    const [nodeOffline, setNodeOffline] = useState(false); // novo estado
    const ws = useRef<WebSocket | null>(null);
    const usageWs = useRef<WebSocket | null>(null);
    const {user} = useUser();
    const router = useRouter();
    const prevOfflineRef = useRef(false);
    const reloadedOnReconnectRef = useRef(false);

    // Força recarregamento via router quando reconectar
    useEffect(() => {
        if (nodeOffline) {
            // Marcamos que ficou offline
            prevOfflineRef.current = true;
            reloadedOnReconnectRef.current = false;
            return;
        }
        // Se voltou (antes estava offline) e ainda não recarregou
        if (!nodeOffline && prevOfflineRef.current && !reloadedOnReconnectRef.current) {
            reloadedOnReconnectRef.current = true;
            try {
                const url = window.location.href
                console.log("RECARREGANDO....")
                window.location.href = url
            } catch {}
        }
    }, [nodeOffline, router]);

    // Função reutilizável para formatar uptime (extraída para uso no refresh)
    const formatUptime = useCallback((ms?: number): string => {
        if (!ms || ms <= 0) return '0s';
        const s = Math.floor(ms / 1000);
        const d = Math.floor(s / 86400);
        const h = Math.floor((s % 86400) / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        const parts: string[] = [];
        if (d) parts.push(`${d}d`);
        if (h) parts.push(`${h}h`);
        if (m) parts.push(`${m}m`);
        if (sec && parts.length < 2) parts.push(`${sec}s`);
        return parts.join(' ') || '0s';
    }, []);

    // Efeito para extrair o UUID da URL ao montar o componente
    useEffect(() => {
        const path = window.location.pathname;
        const match = path.match(/\/server\/([a-fA-F0-9-]+)/);
        if (match && match[1]) {
            setUuid(match[1]);
        } else {
            console.error("UUID não encontrado na URL.");
            setIsLoading(false);
            setLogs([{ time: new Date().toLocaleTimeString(), type: 'ERROR', msg: `UUID do servidor não encontrado na URL.` }]);
        }
    }, []);

    // Efeito para buscar os dados iniciais do servidor
    useEffect(() => {
        if (!uuid) return;
        let cancelled = false;

        // Cache em memória entre montagens
        const cached = uuid ? usageSessionStore[uuid] : undefined;

        const fetchBaseData = async () => {
            setIsLoading(true);
            try {
                const response = await axios.post('/api/client/servers/uuid', { uuid });
                if (cancelled) return;
                const data = response.data;
                setServer(prev => {
                    const base = prev && prev.id === data.id ? prev : {
                        subdomain: data.subdomain,
                        dockerImage: data.dockerImage,
                        id: data.id,
                        environment: data.environment,
                        core: data.core,
                        name: data.name,
                        ip: `${data.primaryAllocation?.externalIp || 'N/A'}:${data.primaryAllocation?.port || 'N/A'}`,
                        status: 'stopped',
                        cpu: 0,
                        maxCpu: data.cpu || 100,
                        ram: { used: 0, total: data.ram || 0, unit: 'MiB' },
                        disk: { used: 0, total: data.disk || 0, unit: 'MiB' },
                        uptime: '0s'
                    } as ServerData;

                    let merged: ServerData = {
                        ...base,
                        environment: data.environment,
                        dockerImage: data.dockerImage,
                        core: data.core,
                        name: data.name,
                        ip: `${data.primaryAllocation?.externalIp || 'N/A'}:${data.primaryAllocation?.port || 'N/A'}`,
                        maxCpu: data.cpu || base.maxCpu,
                        ram: { ...base.ram, total: data.ram || base.ram.total },
                        disk: { ...base.disk, total: data.disk || base.disk.total },
                        networkIn: data.networkIn || 0,
                        networkOut: data.networkOut || 0,
                        nodeip: data.nodeip || 'N/A',
                        nodePort: data.nodePort || 0,
                        nodeSftp: data.nodeSftp || 0,
                        description: data.description || '',
                        databasesQuantity: data.databasesQuantity || 0,
                        databases: Array.isArray(data.databases) ? data.databases : [],
                        addicionalAllocationsNumbers: data.addicionalAllocationsNumbers || 0,
                        subdomain: data.subdomain,
                        additionalAllocation: data.additionalAllocation,
                        primaryAllocation: data.primaryAllocation,
                        group: data.group
                    };

                    if (cached && !prev) {
                        merged = {
                            ...merged,
                            subdomain: data.subdomain,
                            status: cached.status,
                            cpu: cached.cpu,
                            ram: { ...merged.ram, used: cached.ramUsed, total: cached.ramTotal },
                            uptime: cached.uptime,
                            startedAt: cached.startedAt
                        };
                    }
                    return merged;
                });
            } catch (e) {
                if (!server) {
                    setServer(null);
                    setLogs([{ time: new Date().toLocaleTimeString(), type: 'ERROR', msg: 'Não foi possível obter os dados do servidor.' }]);
                }
            } finally { setIsLoading(false); }
        };

        fetchBaseData();

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [uuid]);

    // Efeito para o WebSocket de USAGE
    useEffect(() => {
        if (!server?.id || !user?.id || !server.nodeip || !server.nodePort) return;

        // @ts-ignore
        if (usageWs.current && [WebSocket.OPEN, WebSocket.CONNECTING].includes(usageWs.current.readyState)) {
            return;
        }

        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${proto}//${server.nodeip}:${server.nodePort}/api/v1/servers/usages?serverId=${server.id}&userUuid=${user.id}`;

        const socket = new WebSocket(wsUrl);
        usageWs.current = socket;

        socket.onopen = () => {
            console.log('[WS][usages] Conexão estabelecida.');
            setNodeOffline(false);
        };

        socket.onmessage = (event) => {
            console.log("recebido")
            try {
                const data = JSON.parse(event.data);
                if (data.type === 'usage' && data.usage) {
                    const { usage } = data;
                    setNodeOffline(false);

                    setServer(prev => {
                        if (!prev) return prev;

                        const memUsedMiB = usage.memory / 1024 / 1024;
                        const memLimitMiB = usage.memoryLimit > 0 ? usage.memoryLimit / 1024 / 1024 : prev.ram.total;
                        const diskUsedMib = usage.disk / 1024 / 1024;
                        const networkInKib = usage.networkIn / 1024;
                        const networkOutKib = usage.networkOut / 1024;

                        const stateRaw = (usage.state || '').toLowerCase();
                        const stateMap: Record<string, ServerStatus> = {
                            running: 'running', online: 'running', started: 'running', start: 'running',
                            starting: 'initializing', initializing: 'initializing', install: 'initializing', installing: 'initializing', creating: 'initializing', pending: 'initializing',
                            stopping: 'stopped', stopped: 'stopped', offline: 'stopped', error: 'stopped'
                        };
                        const mappedStatus: ServerStatus = stateMap[stateRaw] || prev.status;

                        const uptimeSource = (typeof usage.uptimeMs === 'number' && usage.uptimeMs > 0)
                            ? usage.uptimeMs
                            : (typeof usage.startedAt === 'number' ? Date.now() - usage.startedAt : 0);

                        const next = {
                            ...prev,
                            status: mappedStatus,
                            cpu: usage.cpu,
                            networkIn: networkInKib,
                            networkOut: networkOutKib,
                            ram: { ...prev.ram, used: memUsedMiB, total: memLimitMiB },
                            disk: { ...prev.disk, used: diskUsedMib },
                            uptime: formatUptime(uptimeSource),
                            startedAt: usage.startedAt,
                        };

                        usageSessionStore[prev.id] = {
                            status: next.status,
                            cpu: next.cpu,
                            networkIn: next.networkIn,
                            networkOut: next.networkOut,
                            ramUsed: next.ram.used,
                            ramTotal: next.ram.total,
                            uptime: next.uptime,
                            startedAt: next.startedAt
                        };

                        return next;
                    });
                } else if (data.type === 'error') {
                    console.error(`[WS][usages] Erro recebido: ${data.message}`);
                }
            } catch (e) {
                console.error('[WS][usages] Falha ao processar mensagem', e);
            }
        };

        socket.onclose = () => {
            console.log('[WS][usages] Conexão perdida.');
            setNodeOffline(true);
        };

        socket.onerror = (err) => {
            console.error('[WS][usages] Erro na conexão.', err);
            setNodeOffline(true);
        };

        return () => {
            if (usageWs.current === socket) {
                try { socket.close(); } catch {}
            }
        };
    }, [server?.id, server?.nodeip, server?.nodePort, user?.id, formatUptime]);

    // Função de refresh reutilizando a mesma lógica do fetchBaseData (sem reiniciar polling se já iniciado)
    const refreshServer = useCallback(async () => {
        if (!uuid) return null;
        setIsLoading(true);
        try {
            const response = await axios.post('/api/client/servers/uuid', { uuid });
            const data = response.data;
            const prev = server;
            const merged: ServerData = {
                dockerImage: data.dockerImage,
                id: data.id,
                environment: data.environment,
                core: data.core,
                name: data.name,
                ip: `${data.primaryAllocation?.externalIp || 'N/A'}:${data.primaryAllocation?.port || 'N/A'}`,
                status: prev?.status || 'stopped',
                cpu: prev?.cpu || 0,
                networkIn: prev?.networkIn || 0,
                networkOut: prev?.networkOut || 0,
                maxCpu: data.cpu || prev?.maxCpu || 100,
                ram: {
                    used: prev?.ram.used || 0,
                    total: data.ram || prev?.ram.total || 0,
                    unit: prev?.ram.unit || 'MiB'
                },
                disk: {
                    used: prev?.disk.used || 0,
                    total: data.disk || prev?.disk.total || 0,
                    unit: prev?.disk.unit || 'MiB'
                },
                uptime: prev?.uptime || '0s',
                startedAt: prev?.startedAt,
                nodeip: data.nodeip || prev?.nodeip || 'N/A',
                nodePort: data.nodePort || prev?.nodePort || 0,
                nodeSftp: data.nodeSftp || prev?.nodeSftp || 0,
                description: data.description || prev?.description || '',
                databasesQuantity: data.databasesQuantity || prev?.databasesQuantity || 0,
                databases: Array.isArray(data.databases) ? data.databases : (prev?.databases || []),
                addicionalAllocationsNumbers: data.addicionalAllocationsNumbers || prev?.addicionalAllocationsNumbers || 0,
                additionalAllocation: data.additionalAllocation,
                primaryAllocation: data.primaryAllocation,
                subdomain: data.subdomain, // <-- adicionado para refletir mudanças do subdomínio
                group: prev?.group
            } as any;
            setServer(merged);
            return merged;
        } catch (e) {
            setLogs(l => [...l, { time: new Date().toLocaleTimeString(), type: 'ERROR', msg: 'Falha ao atualizar dados do servidor.' }]);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, [uuid, server, setLogs]);

    const addLog = useCallback((newLog: Omit<LogEntry, 'time'>) => {
        setLogs(prevLogs => [...prevLogs.slice(-200), { ...newLog, time: new Date().toLocaleTimeString() }]);
    }, []);

    // --- LÓGICA DO WEBSOCKET PARA O CONSOLE ---
    const initializedRef = useRef(false);
    const lastLineRef = useRef<string | null>(null);

    useEffect(() => {
        if (!server?.id) return;

        // Se já existe socket aberto ou conectando para este server, não recria
        // @ts-ignore
        if (ws.current && [WebSocket.OPEN, WebSocket.CONNECTING].includes(ws.current.readyState)) {
            return;
        }

        initializedRef.current = false;
        lastLineRef.current = null;

        const userUuid = user?.id;
        const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${proto}//${server.nodeip}:${server.nodePort}/api/v1/servers/console?serverId=${server.id}&userUuid=${userUuid}`;

        const socket = new WebSocket(wsUrl);
        ws.current = socket;

        socket.onopen = () => addLog({ type: 'INFO', msg: '\x1b[38;2;148;2;247m[Ender Panel] \x1B[0mConexão com a node estabelecida.' });

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'init':
                        if (!initializedRef.current && Array.isArray(data.lines)) {
                            const initialBuffer = data.lines.map((line: string) => ({
                                time: new Date().toLocaleTimeString(),
                                type: line.includes('WARN') ? 'WARN' : line.includes('ERROR') ? 'ERROR' : 'INFO',
                                msg: line
                            }));
                            setLogs(initialBuffer);
                            if (initialBuffer.length) {
                                lastLineRef.current = initialBuffer[initialBuffer.length - 1].msg;
                            }
                            initializedRef.current = true;
                        }
                        break;
                    case 'line': {
                        const lineMsg = data.line || '';
                        // Evita adicionar duplicado imediato (mesma linha consecutiva)
                        if (lastLineRef.current === lineMsg) return;
                        lastLineRef.current = lineMsg;
                        addLog({ type: 'INFO', msg: lineMsg });
                        break; }
                    case 'error':
                        addLog({ type: 'ERROR', msg: `Erro do servidor de console: ${data.error}` });
                        break;
                }
            } catch (e) {
                addLog({ type: 'ERROR', msg: 'Mensagem inválida recebida do console.' });
            }
        };

        socket.onclose = () => addLog({ type: 'WARN', msg: 'Conexão com o console perdida. Tentando reconectar...' });
        socket.onerror = () => addLog({ type: 'ERROR', msg: 'Erro na conexão com o WebSocket do console.' });

        return () => {
            if (ws.current === socket) {
                try { socket.close(); } catch {}
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [server?.id]);

    // Função para enviar um comando via WEBSOCKET (exclusivo para o console)
    const sendCommand = useCallback(async (command: string) => {
        if (!command.trim() || isSendingCommand) return;

        if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
            addLog({ type: 'ERROR', msg: 'Não foi possível enviar o comando. Console não está conectado.' });
            return;
        }

        ws.current.send(JSON.stringify({ type: 'command', command }));

    }, [addLog, isSendingCommand]);

    return (
        <ServerContext.Provider value={{ server, logs, sendCommand, isLoading, isSendingCommand, refreshServer, nodeOffline }}>
            {children}
        </ServerContext.Provider>
    );
};

export const useServer = () => {
    const context = useContext(ServerContext);
    if (context === undefined) {
        throw new Error('useServer must be used within a ServerProvider');
    }
    return context;
};

// A função de action para power, etc continua a mesma, usando a API antiga
export function actionServer(action: ServerAction, uuid: string, command?: string) {
    return sendServerAction({ uuid, action, command });
}