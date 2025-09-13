// app/components/server/ui/ServerStats.tsx
import React from 'react';
import { Icon } from '../../ui/Icon';
import { Panel } from '../../ui/Panel';
import { useServer } from '../context/ServerContext'; // Importar o hook

const InfoCard = ({ title, value, total, unit, icon, statusColor, isHighUsage = false }: any) => (
    // ... (código do InfoCard inalterado) ...
    <Panel className="p-5">
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 text-zinc-400">
                {icon}
                <h4 className="font-semibold">{title}</h4>
            </div>
            {statusColor && <div className={`w-3 h-3 rounded-full ${statusColor} shadow-[0_0_12px_2px] ${statusColor.replace('bg-', 'shadow-')}`}></div>}
        </div>
        <div className="flex items-baseline">
            <p className={`text-3xl font-semibold transition-colors duration-300 ${isHighUsage ? 'text-rose-400' : 'text-white'}`}>{value}</p>
            {total && <p className="text-zinc-400 font-normal ml-1"> / {total}{unit}</p>}
        </div>
    </Panel>
);

// Componente não recebe mais a prop 'server'
export const ServerStats = () => {
    // Pega os dados diretamente do contexto
    const { server } = useServer();

    // Lida com o caso em que os dados ainda não carregaram
    if (!server) {
        return (
            // Renderiza placeholders ou "skeletons" enquanto os dados carregam
            Array.from({ length: 5 }).map((_, i) => (
                // eslint-disable-next-line react/no-children-prop
                <Panel key={i} className="p-5 h-[98px] animate-pulse" children={undefined} />
            ))
        );
    }

    const statusConfig: Record<string, { text: string; color: string }> = {
        running: { text: 'Rodando', color: 'bg-teal-400' },
        initializing: { text: 'Inicializando', color: 'bg-amber-400' },
        stopped: { text: 'Parado', color: 'bg-rose-500' }
    };

    const currentStatus = statusConfig[server.status] || statusConfig.stopped;
    const cpuUsagePercent = server.cpu;
    const ramUsagePercent = (server.ram.used / server.ram.total) * 100;
    const isCpuHigh = cpuUsagePercent > 90;
    const isRamHigh = ramUsagePercent > 85;

    return (
        <>
            <InfoCard title="Status" value={currentStatus.text} icon={<Icon name="power" className="w-5 h-5"/>} statusColor={currentStatus.color} />
            {server.status !== 'stopped' && (
                <InfoCard title="Uptime" value={server.uptime} icon={<Icon name="servers" className="w-5 h-5"/>} />
            )}
            <InfoCard title="Uso de CPU" value={`${cpuUsagePercent.toFixed(2)}`} unit="%" total={`${server.maxCpu}`} icon={<Icon name="cpu" className="w-5 h-5"/>} isHighUsage={isCpuHigh} />
            <InfoCard title="Uso de RAM" value={server.ram.used.toFixed(2)} total={server.ram.total.toFixed(2)} unit={` ${server.ram.unit}`} icon={<Icon name="ram" className="w-5 h-5"/>} isHighUsage={isRamHigh} />
            <InfoCard title="Uso de Disco" value={server.disk.used.toFixed(2)} total={server.disk.total.toFixed(2)} unit={` ${server.disk.unit}`} icon={<Icon name="disk" className="w-5 h-5"/>} />
        </>
    );
};
