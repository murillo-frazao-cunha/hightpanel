'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Sidebar } from './ui/Sidebar';
import { Icon } from './ui/Icon';
import { Background } from './ui/Background';
import { useUser } from "@/app/contexts/UserContext";
import { getServerUsage } from './server/api';
import { motion, AnimatePresence } from 'framer-motion';

// --- Tipos ---
type ServerStatus = 'running' | 'initializing' | 'stopped';

interface Server {
    id: string;
    name: string;
    description: string;
    ip: string;
    status: ServerStatus;
    cpu: { used: number; total: number };
    ram: { used: number; total: number; unit: 'MB' | 'GB' };
    disk: { used: number; total: number; unit: 'MB' | 'GB' };
    group?: string | null;
    error?: boolean;
}

// --- Componentes Reutilizáveis ---

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
            <div className="w-full bg-zinc-700/30 rounded-full h-1.5 mt-2 overflow-hidden backdrop-blur-sm">
                <div
                    className={`h-1.5 rounded-full ${isHighUsage ? 'bg-gradient-to-r from-rose-500 to-rose-600' : 'bg-gradient-to-r from-teal-500 to-cyan-500'} transition-[width] duration-700 ease-out`}
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
        running: { text: 'Rodando', color: 'bg-gradient-to-b from-teal-500 to-teal-600', icon: 'activity' },
        stopped: { text: 'Parado', color: 'bg-gradient-to-b from-rose-500 to-rose-600', icon: 'power' },
        initializing: { text: 'Inicializando', color: 'bg-gradient-to-b from-amber-500 to-amber-600', icon: 'loader' },
    };
    const currentStatus = statusConfig[server.status];

    return (
        <Link href={`/server/${server.id}`} className="block group">
            <div className="flex items-center bg-gradient-to-br from-zinc-900/50 to-zinc-800/30 backdrop-blur-xl rounded-2xl p-5 shadow-lg shadow-black/30 border border-zinc-700/30 transition-all duration-500 group-hover:from-zinc-800/60 group-hover:to-zinc-700/40 group-hover:scale-[1.01] group-hover:shadow-xl group-hover:shadow-purple-500/10 group-hover:border-zinc-600/50">
                <div className={`w-2 h-16 rounded-full ${currentStatus.color} shadow-md`}></div>

                <div className="ml-5 flex-grow min-w-0">
                    <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                            <h3 className="text-lg font-bold text-white truncate">{server.name}</h3>
                            {server.description && (
                                <p className="text-zinc-400 text-sm mt-1 line-clamp-2">{server.description}</p>
                            )}
                            <div className="flex items-center gap-2 text-zinc-400 text-sm font-mono mt-2">
                                <Icon name="globe" className="w-4 h-4 flex-shrink-0" />
                                <span className="truncate">{server.ip}</span>
                                <button onClick={handleCopy} className="text-zinc-500 hover:text-white transition-colors flex-shrink-0" title="Copiar IP">
                                    <Icon name={copied ? 'check' : 'copy'} className={`w-4 h-4 transition-all ${copied ? 'text-purple-400 scale-110' : ''}`} />
                                </button>
                            </div>
                        </div>

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
                    <Icon name="chevronRight" className="w-6 h-6 text-zinc-600 group-hover:text-zinc-300" />
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

    const [categorizationEnabled, setCategorizationEnabled] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('Todos');

    useEffect(() => {
        const savedCategorization = localStorage.getItem('categorizationEnabled');
        if (savedCategorization !== null) setCategorizationEnabled(JSON.parse(savedCategorization));

        const savedCategory = localStorage.getItem('selectedCategory');
        if (savedCategory) setSelectedCategory(savedCategory);

        if (user?.admin) {
            const savedAdminView = localStorage.getItem('adminServerView');
            if (savedAdminView !== null) setShowPublic(JSON.parse(savedAdminView));
        }
    }, [user]);

    useEffect(() => { localStorage.setItem('categorizationEnabled', JSON.stringify(categorizationEnabled)); }, [categorizationEnabled]);
    useEffect(() => { localStorage.setItem('selectedCategory', selectedCategory); }, [selectedCategory]);
    useEffect(() => { if (user?.admin) localStorage.setItem('adminServerView', JSON.stringify(showPublic)); }, [showPublic, user]);

    const processServerData = async (apiData: any[]): Promise<Server[]> => {
        if (!Array.isArray(apiData)) return [];
        return Promise.all(apiData.map(async server => {
            const ramInGB = (server.ram || 0) / 1024;
            const diskInGB = (server.disk || 0) / 1024;
            try {
                const usageData = await getServerUsage(server.id);
                let status: ServerStatus = 'stopped';
                let cpuUsed = 0, ramUsedGB = 0, diskUsed = 0;
                if (usageData) {
                    const stateMap: Record<string, ServerStatus> = { running: 'running', online: 'running', started: 'running', starting: 'initializing', installing: 'initializing', stopping: 'stopped', stopped: 'stopped', offline: 'stopped', error: 'stopped' };
                    status = stateMap[usageData.state as string] || 'stopped';
                    cpuUsed = typeof usageData.cpu === 'number' ? usageData.cpu : 0;
                    if (typeof usageData.memory === 'number') ramUsedGB = usageData.memory / 1024 / 1024 / 1024;
                    diskUsed = typeof usageData.disk === 'number' ? usageData.disk / 1024 / 1024 / 1024 : 0;
                }
                return { description:server.description, id: server.id, name: server.name, ip: `${server.primaryAllocation?.externalIp}:${server.primaryAllocation?.port}`, status, cpu: { used: cpuUsed, total: server.cpu || 100 }, ram: { used: parseFloat(ramUsedGB.toFixed(2)), total: parseFloat(ramInGB.toFixed(2)), unit: 'GB' }, disk: { used: parseFloat((diskUsed * 0.2).toFixed(2)), total: parseFloat(diskInGB.toFixed(2)), unit: 'GB' }, error: false, group: server.group || null };
            } catch (e) {
                return { description:server.description, id: server.id, name: server.name, ip: `${server.primaryAllocation?.externalIp}:${server.primaryAllocation?.port}`, status: 'initializing', cpu: { used: 0, total: server.cpu || 100 }, ram: { used: 0, total: parseFloat(ramInGB.toFixed(2)), unit: 'GB' }, disk: { used: 0, total: parseFloat(diskInGB.toFixed(2)), unit: 'GB' }, error: true, group: server.group || null };
            }
        }));
    };

    const fetchServers = useCallback(async () => {
        if (!user) { setIsLoading(false); return; }
        if (isInitialLoad.current) setIsLoading(true);

        const endpoint = '/api/client/servers/get-all';
        const payload = { others: showPublic };
        try {
            const response = await axios.post(endpoint, payload);
            const processedData = await processServerData(response.data);
            if (showPublic) setPublicServers(processedData);
            else setMyServers(processedData);
        } catch (error) { console.error(`Erro ao buscar servidores:`, error); }
        finally { if (isInitialLoad.current) { setIsLoading(false); isInitialLoad.current = false; } }
    }, [showPublic, user]);

    useEffect(() => {
        if (user) {
            fetchServers();
            const intervalId = setInterval(fetchServers, 5000);
            return () => clearInterval(intervalId);
        } else {
            setMyServers([]); setPublicServers([]); setIsLoading(false);
        }
    }, [user, fetchServers]);

    const serversToShow = showPublic ? publicServers : myServers;
    const hasCategorizableServers = useMemo(() => serversToShow.some(s => s.group), [serversToShow]);

    const categories = useMemo(() => {
        if (!hasCategorizableServers) return [];
        const groups = new Set<string>();
        serversToShow.forEach(server => server.group && groups.add(server.group));
        const allCategories = ['Todos', ...Array.from(groups).sort()];
        if (serversToShow.some(server => !server.group)) allCategories.push('Sem Categoria');
        return allCategories;
    }, [serversToShow, hasCategorizableServers]);

    const filteredServers = useMemo(() => {
        if (!categorizationEnabled || selectedCategory === 'Todos' || !categories.includes(selectedCategory)) {
            if (!categories.includes(selectedCategory)) setSelectedCategory('Todos');
            return serversToShow;
        }
        if (selectedCategory === 'Sem Categoria') return serversToShow.filter(server => !server.group);
        return serversToShow.filter(server => server.group === selectedCategory);
    }, [serversToShow, selectedCategory, categorizationEnabled, categories]);

    const AdminViewSwitch = ({ showPublic, setShowPublic }: { showPublic: boolean, setShowPublic: (show: boolean) => void }) => {
        const tabs = [{ label: 'Meus', value: false }, { label: 'Outros', value: true }];

        return (
            <div className="p-1 flex space-x-1 bg-zinc-800/70 backdrop-blur-sm rounded-xl border border-zinc-700/30">
                {tabs.map(tab => (
                    <button
                        key={tab.label}
                        onClick={() => setShowPublic(tab.value)}
                        className={`relative rounded-lg px-4 py-1.5 text-sm font-medium transition-all focus-visible:outline-2 focus-visible:outline-purple-500 ${showPublic === tab.value ? '' : 'hover:text-white'}`}>
                        {showPublic === tab.value && (
                            <motion.div
                                layoutId="admin-view-switch-active-pill"
                                className="absolute inset-0 z-0 bg-gradient-to-r from-purple-600 to-purple-700"
                                style={{ borderRadius: 8 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                        <span className={`relative z-10 ${showPublic === tab.value ? 'text-white' : 'text-zinc-300'}`}>{tab.label}</span>
                    </button>
                ))}
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 text-zinc-200 font-['Inter',_sans_serif] flex">
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
                .line-clamp-2 {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            `}</style>
            <Background />
            <Sidebar />
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white bg-gradient-to-r from-white to-zinc-300 bg-clip-text text-transparent">Seus Contêineres</h1>
                        <p className="text-zinc-400 mt-2 font-light">Gerencie, monitore e escale seus servidores com elegância.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {hasCategorizableServers && (
                            <button onClick={() => setCategorizationEnabled(!categorizationEnabled)} className={`p-2.5 rounded-xl transition-all ${categorizationEnabled ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/20' : 'bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700/80 border border-zinc-700/30'} hover:scale-105`} title="Alternar Categorias">
                                <Icon name="filter" className="w-5 h-5" />
                            </button>
                        )}
                        {user?.admin && <AdminViewSwitch showPublic={showPublic} setShowPublic={setShowPublic} />}
                    </div>
                </header>

                <AnimatePresence>
                    {categorizationEnabled && hasCategorizableServers && (
                        <motion.div layout initial={{ opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -20, marginBottom: 0 }} className="flex flex-wrap items-center gap-2 mb-8">
                            {categories.map(category => (
                                <motion.button
                                    key={category}
                                    onClick={() => setSelectedCategory(category)}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`px-4 py-2 text-sm font-semibold rounded-xl transition-all ${selectedCategory === category ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-md shadow-purple-500/30' : 'bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/60 border border-zinc-700/30 backdrop-blur-sm'}`}
                                >
                                    {category}
                                </motion.button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={showPublic ? 'public' : 'my'}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {isLoading && filteredServers.length === 0 ? (
                            <div className="text-center py-16 bg-zinc-900/20 rounded-2xl border border-zinc-800/30 backdrop-blur-sm">
                                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-full mb-4">
                                    <Icon name="loader" className="w-8 h-8 animate-spin text-purple-500" />
                                </div>
                                <p className="text-zinc-400 mt-2">Carregando servidores...</p>
                            </div>
                        ) : filteredServers.length > 0 ? (
                            <motion.div layout className="flex flex-col gap-5">
                                <AnimatePresence initial={false}>
                                    {filteredServers.map((server) => (
                                        <motion.div
                                            key={server.id}
                                            layout="position"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, transition: { duration: 0.2 } }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        >
                                            <ServerRow server={server} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <div className="text-center py-16 bg-zinc-900/30 rounded-2xl border border-zinc-800/30 backdrop-blur-sm">
                                <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-zinc-800 to-zinc-900 rounded-full mb-4">
                                    <Icon name="server" className="w-8 h-8 text-zinc-500" />
                                </div>
                                <p className="text-zinc-400">Nenhum contêiner encontrado para os filtros selecionados.</p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Home;
