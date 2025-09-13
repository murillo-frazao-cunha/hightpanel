'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios'; // Importado para fazer as chamadas HTTP
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
    cpu: { used: number; total: number }; // Em %
    ram: { used: number; total: number; unit: 'MB' | 'GB' };
    disk: { used: number; total: number; unit: 'MB' | 'GB' };
    isFavorite?: boolean;
}

// --- Componentes Reutilizáveis (Sem alterações) ---

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
            <div className="w-full bg-zinc-700/50 rounded-full h-1 mt-2">
                <div
                    className={`h-1 rounded-full ${isHighUsage ? 'bg-rose-500' : 'bg-teal-500'}`}
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
        initializing: { text: 'Inicializando', color: 'bg-amber-500' },
    };
    const currentStatus = statusConfig[server.status];

    return (
        <Link href={`/server/${server.id}`} className="block">
            <div className="flex items-center bg-zinc-900/40 backdrop-blur-2xl rounded-lg p-4 transition-all duration-300 hover:bg-zinc-900/60 hover:ring-2 hover:ring-zinc-700/80">
                <div className={`w-1.5 h-16 rounded-full ${currentStatus.color}`}></div>

                <div className="ml-5 flex-grow">
                    <h3 className="text-lg font-bold text-white">{server.name}</h3>
                    <div className="flex items-center gap-2 text-zinc-400 text-sm font-mono mt-1">
                        <Icon name="globe" className="w-4 h-4" />
                        <span>{server.ip}</span>
                        <button onClick={handleCopy} className="text-zinc-500 hover:text-white" title="Copiar IP">
                            <Icon name={copied ? 'check' : 'copy'} className={`w-4 h-4 ${copied ? 'text-teal-400' : ''}`} />
                        </button>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-6 text-sm">
                    <StatDisplay used={server.cpu.used} total={server.cpu.total} unit="%" label="CPU" icon="cpu" />
                    <StatDisplay used={server.ram.used} total={server.ram.total} unit={server.ram.unit} label="RAM" icon="ram" />
                    <StatDisplay used={server.disk.used} total={server.disk.total} unit={server.disk.unit} label="Disco" icon="disk" />
                </div>

                <div className="ml-6 flex items-center">
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

    // Função para transformar os dados da API no formato do frontend e adicionar mocks
    const processServerData = async (apiData: any[]): Promise<Server[]> => {
        if (!apiData) return [];
        return Promise.all(apiData.map(async server => {
            const ramInGB = (server.ram || 0) / 1024; // server.ram já vem em MiB segundo admin? convertendo para GiB approx
            const diskInGB = (server.disk || 0) / 1024;
            let usageData: any = null;
            try {
                usageData = await getServerUsage(server.id);
            } catch (e) {
                // Falha em obter usage não deve quebrar a listagem
            }
            let status: ServerStatus = 'stopped';
            let cpuUsed = 0;
            let ramUsedGB = 0;
            if (usageData) {
                const stateMap: Record<string, ServerStatus> = {
                    running: 'running',
                    online: 'running',
                    started: 'running',
                    starting: 'initializing',
                    installing: 'initializing',
                    stopping: 'stopped',
                    stopped: 'stopped',
                    offline: 'stopped',
                    error: 'stopped'
                };
                status = stateMap[usageData.state] || 'stopped';
                cpuUsed = typeof usageData.cpu === 'number' ? usageData.cpu : 0;
                // usageData.memory está em bytes -> converter para GB
                if (typeof usageData.memory === 'number') {
                    ramUsedGB = usageData.memory / 1024 / 1024 / 1024;
                }
            }
            return {
                id: server.id,
                name: server.name,
                ip: `${server.primaryAllocation?.externalIp}:${server.primaryAllocation?.port}`,
                status,
                cpu: {
                    used: cpuUsed,
                    total: server.cpu || 100
                },
                ram: {
                    used: parseFloat(ramUsedGB.toFixed(2)),
                    total: parseFloat(ramInGB.toFixed(2)),
                    unit: 'GB'
                },
                disk: {
                    used: parseFloat((diskInGB * 0.2).toFixed(2)), // placeholder 20% disco
                    total: parseFloat(diskInGB.toFixed(2)),
                    unit: 'GB'
                }
            };
        }));
    };

    // Efeito para buscar os dados da API quando o componente montar ou o toggle mudar
    useEffect(() => {
        const fetchServers = async () => {
            // Se não houver usuário, não faz nada
            if (!user) {
                setMyServers([]);
                setPublicServers([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            const endpoint = '/api/client/servers/get-all';
            const payload = { others: showPublic };

            try {
                const response = await axios.post(endpoint, payload);
                const processedData = await processServerData(response.data);

                if (showPublic) {
                    setPublicServers(processedData);
                } else {
                    setMyServers(processedData);
                }
            } catch (error) {
                console.error(`Erro ao buscar servidores (${showPublic ? 'públicos' : 'meus'}):`, error);
                if (showPublic) setPublicServers([]);
                else setMyServers([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchServers();
    }, [showPublic, user]); // A busca é refeita se o estado 'showPublic' ou 'user' mudar

    const serversToShow = showPublic ? publicServers : myServers;

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans_serif] flex">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                .toggle-checkbox:checked { background-color: #14b8a6; }
                .toggle-checkbox:checked + .toggle-label { background-color: #14b8a6; }
                .toggle-checkbox:checked + .toggle-label .toggle-ball { transform: translateX(100%); }
             `}</style>
            <Background />
            <Sidebar />
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Seus Contêineres</h1>
                        <p className="text-zinc-400 mt-1">Gerencie, monitore e escale seus servidores.</p>
                    </div>
                    {user?.admin && (
                        <div className="flex items-center gap-3">
                            <span className={`font-semibold text-sm transition-colors ${!showPublic ? 'text-white' : 'text-zinc-400'}`}>Meus Servidores</span>
                            <label htmlFor="server-toggle" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="server-toggle" className="sr-only peer" checked={showPublic} onChange={() => setShowPublic(!showPublic)} />
                                <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-500/50 peer-checked:bg-teal-900 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:peer-checked:translate-x-full after:peer-checked:border-white"></div>
                            </label>
                            <span className={`font-semibold text-sm transition-colors ${showPublic ? 'text-white' : 'text-zinc-400'}`}>Públicos</span>
                        </div>
                    )}
                </header>

                {isLoading ? (
                    <div className="text-center py-10 text-zinc-400">Carregando servidores...</div>
                ) : serversToShow.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {serversToShow.map(server => (
                            <ServerRow key={server.id} server={server} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-zinc-900/30 rounded-lg">
                        <p className="text-zinc-400">Nenhum contêiner encontrado.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Home;
