'use client';
import React from 'react';
import { Sidebar } from '../ui/Sidebar';
import { Background } from '../ui/Background';
import { ServerHeader } from './components/ServerHeader';
import { ServerStats } from './components/ServerStats';
import { ServerNavbar } from './components/ServerNavbar';
import { ConsolePage } from './pages/ConsolePage';
import { FileManagerPage } from './pages/filemanager/FileManagerPage';
import { ServerProvider } from "@/app/pages/clients/server/context/ServerContext";
import { useServer } from './context/ServerContext';
import StartupPage from "@/app/pages/clients/server/pages/StartupPage";
import SettingsPage from "@/app/pages/clients/server/pages/SettingsPage";
import NetworkPage from "@/app/pages/clients/server/pages/NetworkPage";
import DatabasePage from "@/app/pages/clients/server/pages/DatabasePage";


// --- Tipos ---
interface ServerContainerProps {
    id: string;
    propertie?: string; // console, files, settings, etc.
}

// --- Componente Principal ---
export default function ServerContainer({ id, propertie }: ServerContainerProps) {
    return (
        <ServerProvider>
            <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans-serif] flex">
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
                <Background />
                <Sidebar />
                <ServerContent id={id} propertie={propertie} />
            </div>
        </ServerProvider>
    );
}

function ServerContent({ id, propertie }: { id: string; propertie?: string }) {
    const activePage = propertie || 'console';
    const renderActivePage = () => {
        switch (activePage) {
            case 'files': return <FileManagerPage />;
            case 'startup': return <StartupPage></StartupPage>
            case "settings": return <SettingsPage></SettingsPage>
            case 'network': return <NetworkPage></NetworkPage>
            case 'database': return <DatabasePage></DatabasePage>
            case 'console':
            default:
                return <ConsolePage />;
        }
    };
    return (
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
            <ServerHeader />
            <div className="flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-3/4">
                    <ServerNavbar serverId={id} activePage={activePage} />
                    {renderActivePage()}
                </div>
                <div className="w-full lg:w-1/4 flex flex-col gap-4">
                    <ServerStats />
                </div>
            </div>
        </main>
    );
}
