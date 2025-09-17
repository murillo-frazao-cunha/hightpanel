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
        initializing: { text: 'Inicializando', color: 'bg-amber-500' },
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
                            <Icon name={copied ? 'check' : 'copy'} className={`w-4 h-4 transition-all ${copied ? 'text-purple-400 scale-110' : ''}`} />
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
                return { id: server.id, name: server.name, ip: `${server.primaryAllocation?.externalIp}:${server.primaryAllocation?.port}`, status, cpu: { used: cpuUsed, total: server.cpu || 100 }, ram: { used: parseFloat(ramUsedGB.toFixed(2)), total: parseFloat(ramInGB.toFixed(2)), unit: 'GB' }, disk: { used: parseFloat((diskUsed * 0.2).toFixed(2)), total: parseFloat(diskInGB.toFixed(2)), unit: 'GB' }, error: false, group: server.group || null };
            } catch (e) {
                return { id: server.id, name: server.name, ip: `${server.primaryAllocation?.externalIp}:${server.primaryAllocation?.port}`, status: 'initializing', cpu: { used: 0, total: server.cpu || 100 }, ram: { used: 0, total: parseFloat(ramInGB.toFixed(2)), unit: 'GB' }, disk: { used: 0, total: parseFloat(diskInGB.toFixed(2)), unit: 'GB' }, error: true, group: server.group || null };
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
            <div className="p-1 flex space-x-1 bg-zinc-800/90 rounded-xl">
                {tabs.map(tab => (
                    <button
                        key={tab.label}
                        onClick={() => setShowPublic(tab.value)}
                        className={`relative rounded-lg px-4 py-1 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-purple-500 ${showPublic === tab.value ? '' : 'hover:text-white'}`}>
                        {showPublic === tab.value && (
                            <motion.div
                                layoutId="admin-view-switch-active-pill"
                                className="absolute inset-0 z-0 bg-purple-600"
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
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans_serif] flex">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
            <Background />
            <Sidebar />
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-4xl font-bold text-white">Seus Contêineres</h1>
                        <p className="text-zinc-400 mt-1">Gerencie, monitore e escale seus servidores.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {hasCategorizableServers && (
                            <button onClick={() => setCategorizationEnabled(!categorizationEnabled)} className={`p-2 rounded-lg transition-colors ${categorizationEnabled ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'}`} title="Alternar Categorias">
                                <Icon name="filter" className="w-5 h-5" />
                            </button>
                        )}
                        {user?.admin && <AdminViewSwitch showPublic={showPublic} setShowPublic={setShowPublic} />}
                    </div>
                </header>

                <AnimatePresence>
                    {categorizationEnabled && hasCategorizableServers && (
                        <motion.div layout initial={{ opacity: 0, height: 0, y: -20 }} animate={{ opacity: 1, height: 'auto', y: 0 }} exit={{ opacity: 0, height: 0, y: -20, marginBottom: 0 }} className="flex flex-wrap items-center gap-2 mb-6">
                            {categories.map(category => (
                                <button key={category} onClick={() => setSelectedCategory(category)} className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors ${selectedCategory === category ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' : 'bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700'}`}>
                                    {category}
                                </button>
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
                            <div className="text-center py-10 text-zinc-400">Carregando servidores...</div>
                        ) : filteredServers.length > 0 ? (
                            <motion.div layout className="flex flex-col gap-4">
                                <AnimatePresence initial={false}>
                                    {filteredServers.map((server) => (
                                        <motion.div key={server.id} layout="position" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, transition: { duration: 0.2 } }}>
                                            <ServerRow server={server} />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </motion.div>
                        ) : (
                            <div className="text-center py-10 bg-zinc-900/30 rounded-lg">
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