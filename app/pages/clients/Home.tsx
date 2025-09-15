'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Sidebar } from './ui/Sidebar';
import { Icon } from './ui/Icon';
import { Background } from './ui/Background';
import { useUser } from "@/app/contexts/UserContext";
import { getServerUsage } from './server/api';

// --- Tipos ---
type ServerStatus = 'running' | 'initializing' | 'stopped';

interface Server {
    id: string;
    name: string;
    ip: string;
    status: ServerStatus;
    cpu: { used: number; total: number };
    ram: { used: number; total: number; unit: 'MB' | 'GB' };
    disk: { used: number; total: number; unit: 'MB' | 'GB' };
    isFavorite?: boolean;
    error?: boolean; // Adicionado para lidar com erros de status
}

// --- Constantes de Cache ---
const CACHE_MY_SERVERS_KEY = 'cachedMyServers';
const CACHE_PUBLIC_SERVERS_KEY = 'cachedPublicServers';

// --- Componentes Reutilizáveis (Com Animações e Tratamento de Erro) ---

const StatDisplay = ({ used, total, unit, label, icon }: { used: number, total: number, unit: string, label: string, icon: string }) => {
    const percentage = total > 0 ? (used / total) * 100 : 0;
    const isHighUsage = percentage > 85;

    return (
        <div className="w-48">
            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Icon name={icon as any} className="w-4 h-4" />
                <span>{label}</span>
                <span className={`ml-auto font-mono text-xs ${isHighUsage ? 'text-rose-400' : 'text-zinc-300'}`}>
                    {used.toFixed(1)} {unit}
                </span>
            </div>
            <div className="w-full bg-zinc-700/50 rounded-full h-1 mt-2 overflow-hidden">
                <div
                    className={`h-1 rounded-full ${isHighUsage ? 'bg-rose-500' : 'bg-teal-500'} transition-[width] duration-500 ease-out`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const ServerRow = ({ server }: { server: Server }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        navigator.clipboard.writeText(server.ip);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const statusConfig = {
        running: { text: 'Rodando', color: 'bg-teal-500' },
        stopped: { text: 'Parado', color: 'bg-rose-500' },
        initializing: { text: 'Inicializando', color: 'bg-amber-500' }, // Usado para status de erro também
    };
    const currentStatus = statusConfig[server.status];

    return (
        <Link href={`/server/${server.id}`} className="block group">
            <div className="flex items-center bg-zinc-900/40 backdrop-blur-2xl rounded-lg p-4 shadow-lg shadow-black/20 transition-all duration-300 group-hover:bg-zinc-900/60 group-hover:ring-2 group-hover:ring-zinc-700/80 group-hover:scale-[1.01]">
                <div className={`w-1.5 h-16 rounded-full ${currentStatus.color}`}></div>

                <div className="ml-5 flex-grow">
                    <h3 className="text-lg font-bold text-white">{server.name}</h3>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-mono mt-1">
                        <Icon name="globe" className="w-4 h-4" />
                        <span>{server.ip}</span>
                        <button onClick={handleCopy} className="text-zinc-500 hover:text-white transition-colors" title="Copiar IP">
                            <Icon name={copied ? 'check' : 'copy'} className={`w-4 h-4 transition-all ${copied ? 'text-teal-400 scale-110' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="hidden lg:flex items-center justify-center gap-6 text-sm w-[39rem]">
                    {server.error ? (
                        <div className="flex items-center justify-center text-amber-400">
                            <Icon name="loader" className="w-5 h-5 animate-spin" />
                            <span className="ml-3 font-semibold text-sm">Erro de comunicação com a Node</span>
                        </div>
                    ) : (
                        <>
                            <StatDisplay used={server.cpu.used} total={server.cpu.total} unit="%" label="CPU" icon="cpu" />
                            <StatDisplay used={server.ram.used} total={server.ram.total} unit={server.ram.unit} label="RAM" icon="ram" />
                            <StatDisplay used={server.disk.used} total={server.disk.total} unit={server.disk.unit} label="Disco" icon="disk" />
                        </>
                    )}
                </div>

                <div className="ml-6 flex items-center transition-transform duration-300 group-hover:translate-x-1">
                    <Icon name="chevronRight" className="w-6 h-6 text-zinc-600" />
                </div>
            </div>
        </Link>
    );
};


// --- Componente Principal da Página ---
const Home = () => {
    const { user } = useUser();
    const [myServers, setMyServers] = useState<Server[]>([]);
    const [publicServers, setPublicServers] = useState<Server[]>([]);
    const [showPublic, setShowPublic] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const isInitialLoad = useRef(true);

    // Função para transformar os dados da API (com tratamento de erro)
    const processServerData = async (apiData: any[]): Promise<Server[]> => {
        if (!Array.isArray(apiData)) return [];
        return Promise.all(apiData.map(async server => {
            const ramInGB = (server.ram || 0) / 1024;
            const diskInGB = (server.disk || 0) / 1024;

            try {
                const usageData = await getServerUsage(server.id);
                let status: ServerStatus = 'stopped';
                let cpuUsed = 0;
                let ramUsedGB = 0;
                let diskUsed = 0

                if (usageData) {
                    const stateMap: Record<string, ServerStatus> = {
                        running: 'running', online: 'running', started: 'running',
                        starting: 'initializing', installing: 'initializing',
                        stopping: 'stopped', stopped: 'stopped', offline: 'stopped', error: 'stopped'
                    };
                    // @ts-ignore
                    status = stateMap[usageData.state] || 'stopped';
                    cpuUsed = typeof usageData.cpu === 'number' ? usageData.cpu : 0;
                    if (typeof usageData.memory === 'number') {
                        ramUsedGB = usageData.memory / 1024 / 1024 / 1024;
                    }
                    diskUsed = typeof usageData.disk === 'number' ? usageData.disk / 1024 / 1024 / 1024 : 0;
                }

                return {
                    id: server.id,
                    name: server.name,
                    ip: `${server.primaryAllocation?.externalIp}:${server.primaryAllocation?.port}`,
                    status,
                    cpu: { used: cpuUsed, total: server.cpu || 100 },
                    ram: { used: parseFloat(ramUsedGB.toFixed(2)), total: parseFloat(ramInGB.toFixed(2)), unit: 'GB' },
                    disk: { used: parseFloat((diskUsed * 0.2).toFixed(2)), total: parseFloat(diskInGB.toFixed(2)), unit: 'GB' },
                    error: false,
                };

            } catch (e) {
                // Se a chamada para getServerUsage falhar, retorna o servidor com estado de erro
                return {
                    id: server.id,
                    name: server.name,
                    ip: `${server.primaryAllocation?.externalIp}:${server.primaryAllocation?.port}`,
                    status: 'initializing', // Status amarelo para indicar atenção
                    cpu: { used: 0, total: server.cpu || 100 },
                    ram: { used: 0, total: parseFloat(ramInGB.toFixed(2)), unit: 'GB' },
                    disk: { used: 0, total: parseFloat(diskInGB.toFixed(2)), unit: 'GB' },
                    error: true,
                };
            }
        }));
    };

    // Efeito para carregar dados do cache na inicialização
    useEffect(() => {
        try {
            const cachedMy = localStorage.getItem(CACHE_MY_SERVERS_KEY);
            const cachedPublic = localStorage.getItem(CACHE_PUBLIC_SERVERS_KEY);
            if (cachedMy) setMyServers(JSON.parse(cachedMy));
            if (cachedPublic) setPublicServers(JSON.parse(cachedPublic));
        } catch (error) {
            console.error("Erro ao ler servidores do cache:", error);
        }
    }, []);

    // Efeito para carregar a preferência do admin (sem alterações)
    useEffect(() => {
        if (user?.admin) {
            const savedPreference = localStorage.getItem('adminServerView');
            if (savedPreference !== null) {
                setShowPublic(JSON.parse(savedPreference));
            }
        }
    }, [user]);

    // Função memoizada para buscar os servidores
    const fetchServers = useCallback(async () => {
        if (!user) {
            setIsLoading(false);
            return;
        }

        if (isInitialLoad.current) {
            setIsLoading(true);
        }

        const endpoint = '/api/client/servers/get-all';
        const payload = { others: showPublic };
        const cacheKey = showPublic ? CACHE_PUBLIC_SERVERS_KEY : CACHE_MY_SERVERS_KEY;

        try {
            const response = await axios.post(endpoint, payload);
            const processedData = await processServerData(response.data);

            const currentData = showPublic ? publicServers : myServers;
            if (JSON.stringify(processedData) !== JSON.stringify(currentData)) {
                if (showPublic) {
                    setPublicServers(processedData);
                } else {
                    setMyServers(processedData);
                }
                // Salva no cache apenas os servidores sem erro
                const dataToCache = processedData.filter(s => !s.error);
                localStorage.setItem(cacheKey, JSON.stringify(dataToCache));
            }
        } catch (error) {
            console.error(`Erro ao buscar servidores (${showPublic ? 'públicos' : 'meus'}):`, error);
        } finally {
            if (isInitialLoad.current) {
                setIsLoading(false);
                isInitialLoad.current = false;
            }
        }
    }, [showPublic, user, myServers, publicServers]);

    // Efeito para buscar os dados e iniciar o intervalo de atualização
    useEffect(() => {
        if (user) {
            fetchServers(); // Busca inicial
            const intervalId = setInterval(fetchServers, 5000);
            return () => clearInterval(intervalId);
        } else {
            setMyServers([]);
            setPublicServers([]);
            setIsLoading(false);
        }
    }, [user, fetchServers]);

    // Efeito para salvar a preferência do admin
    useEffect(() => {
        if (user?.admin) {
            localStorage.setItem('adminServerView', JSON.stringify(showPublic));
        }
    }, [showPublic, user]);

    const serversToShow = showPublic ? publicServers : myServers;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans_serif] flex">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .animate-fadeInDown { animation: fadeInDown 0.5s ease-out forwards; }
                .animate-fadeInUp { animation: fadeInUp 0.5s ease-out forwards; }
                .animate-spin { animation: spin 1s linear infinite; }

                .toggle-checkbox:checked { background-color: #14b8a6; }
                .toggle-checkbox:checked + .toggle-label { background-color: #14b8a6; }
                .toggle-checkbox:checked + .toggle-label .toggle-ball { transform: translateX(100%); }
             `}</style>
            <Background />
            <Sidebar />
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8 animate-fadeInDown">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Seus Contêineres</h1>
                        <p className="text-zinc-400 mt-1">Gerencie, monitore e escale seus servidores.</p>
                    </div>
                    {user?.admin && (
                        <div className="flex items-center gap-3">
                            <span className={`font-semibold text-sm transition-colors text-white`}>{showPublic ? 'Outros servidores' : 'Meus Servidores'}</span>
                            <label htmlFor="server-toggle" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="server-toggle" className="sr-only peer" checked={showPublic} onChange={() => setShowPublic(!showPublic)} />
                                <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-500/50 peer-checked:bg-teal-900 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:peer-checked:translate-x-full after:peer-checked:border-white"></div>
                            </label>
                        </div>
                    )}
                </header>

                {isLoading && serversToShow.length === 0 ? (
                    <div className="text-center py-10 text-zinc-400 animate-fadeInUp">Carregando servidores...</div>
                ) : serversToShow.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {serversToShow.map((server, index) => (
                            <div key={server.id} className="animate-fadeInUp" style={{ animationDelay: `${index * 80}ms`, animationFillMode: 'backwards' }}>
                                <ServerRow server={server} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-zinc-900/30 rounded-lg animate-fadeInUp">
                        <p className="text-zinc-400">Nenhum contêiner encontrado.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;