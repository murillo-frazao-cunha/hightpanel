'use client';
import { Sidebar } from '../ui/Sidebar';
import { Background } from '../ui/Background';
import { ServerHeader } from './components/ServerHeader';
import { ServerStats } from './components/ServerStats';
import { ServerNavbar } from './components/ServerNavbar';
import { ConsolePage } from './pages/ConsolePage';
import { FileManagerPage } from './pages/filemanager/FileManagerPage';
import StartupPage from "@/app/pages/clients/server/pages/StartupPage";
import SettingsPage from "@/app/pages/clients/server/pages/SettingsPage";
import NetworkPage from "@/app/pages/clients/server/pages/NetworkPage";
import DatabasePage from "@/app/pages/clients/server/pages/DatabasePage";
import { ServerUsageCharts } from './components/ServerUsageCharts';

// --- Tipos -- -
interface ServerContainerProps {
    id: string;
    propertie?: string; // console, files, settings, etc.
}

// --- Componente Principal ---
export default function ServerContainer({ id, propertie }: ServerContainerProps) {
    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans-serif] flex">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
            <Background />
            <Sidebar />
            <ServerContent id={id} propertie={propertie} />
        </div>
    );
}

function ServerContent({ id, propertie }: { id: string; propertie?: string }) {
    const activePage = propertie || 'console';
    const renderActivePage = () => {
        switch (activePage) {
            case 'files': return <FileManagerPage />;
            case 'startup': return <StartupPage />;
            case "settings": return <SettingsPage />;
            case 'network': return <NetworkPage />;
            case 'database': return <DatabasePage />;
            case 'console':
            default:
                return <ConsolePage />;
        }
    };

    return (
        <main className="flex-1 p-6 lg:p-10 overflow-y-auto">
            <ServerHeader />
            <ServerNavbar serverId={id} activePage={activePage} />

            {/* Layout principal para conteúdo e estatísticas */}
            <div className="mt-4 flex flex-col lg:flex-row gap-8">
                <div className="w-full lg:w-3/4">
                    {renderActivePage()}
                </div>
                <div className="w-full lg:w-1/4 flex flex-col gap-4">
                    <ServerStats />
                </div>
            </div>

            {/* Renderização condicional dos gráficos em largura total */}
            {activePage === 'console' && (
                <div className="mt-8">
                    <ServerUsageCharts />
                </div>
            )}
        </main>
    );
}
