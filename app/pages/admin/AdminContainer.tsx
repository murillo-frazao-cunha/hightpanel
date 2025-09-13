'use client';
import React, { useState, useEffect } from 'react';
import { Background } from '@/app/pages/clients/ui/Background';
import { AdminSidebar } from "@/app/pages/admin/ui/AdminSidebar";
import { Icon } from '@/app/pages/clients/ui/Icon'; // Usando o Icon do admin

interface VersionInfo {
    current: string;
    latest: string;
    updateAvailable: boolean;
}

// Função para comparar versões semânticas (simplificada)
const compareVersions = (current: string, latest: string) => {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;
        if (latestPart > currentPart) return true;
        if (latestPart < currentPart) return false;
    }
    return false;
};


export default function AdminContainer() {
    const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchVersionData = async () => {
            try {
                // 1. Busca a versão local do arquivo /public/version.json
                const localRes = await fetch('/api/version');
                if (!localRes.ok) throw new Error('Falha ao buscar a versão local.');
                const localData = await localRes.json();
                const current = localData.version;

                // 2. Busca a última versão do GitHub (troque 'pterodactyl/panel' pelo seu repositório)
                const githubRes = await fetch('https://api.github.com/repos/pterodactyl/panel/releases/latest');
                if (!githubRes.ok) throw new Error('Falha ao buscar a última versão no GitHub.');
                const githubData = await githubRes.json();
                const latest = githubData.tag_name.replace('v', ''); // Remove o 'v' do início da tag (ex: v1.11.3 -> 1.11.3)

                setVersionInfo({
                    current,
                    latest,
                    updateAvailable: compareVersions(current, latest)
                });

            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchVersionData();
    }, []);


    const StatusCard = ({ title, value, icon, children }: { title: string, value?: string, icon: string, children?: React.ReactNode }) => (
        <div className="bg-zinc-900/40 backdrop-blur-2xl rounded-lg p-6 border border-zinc-800/50">
            <div className="flex items-center gap-4">
                <div className="bg-zinc-800/50 p-3 rounded-lg">
                    <Icon name={icon} className="w-6 h-6 text-zinc-400" />
                </div>
                <div>
                    <h3 className="text-zinc-400 font-semibold">{title}</h3>
                    {value && <p className="text-2xl font-bold text-white">{value}</p>}
                    {children}
                </div>
            </div>
        </div>
    );


    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex justify-center items-center h-64">
                    <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                </div>
            );
        }

        if (error) {
            return <div className="text-center p-8 bg-rose-500/10 text-rose-400 rounded-lg">{error}</div>
        }

        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatusCard title="Sua Versão" value={versionInfo?.current} icon="tag" />
                <StatusCard title="Última Versão" value={versionInfo?.latest} icon="gitBranch" />
                <StatusCard title="Status" icon="checkCircle">
                    {versionInfo?.updateAvailable ? (
                        <div className="flex items-center gap-2">
                            <p className="text-2xl font-bold text-amber-400">Atualização Disponível</p>
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                            </span>
                        </div>
                    ) : (
                        <p className="text-2xl font-bold text-teal-400">Atualizado</p>
                    )}
                </StatusCard>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans-serif] flex">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
            <Background />
            <AdminSidebar />
            <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-white">Painel de Controle</h1>
                </header>
                {renderContent()}
            </main>
        </div>
    );
}
