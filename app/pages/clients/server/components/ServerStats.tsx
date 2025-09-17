// app/components/server/ui/ServerStats.tsx
import React from 'react';
import { Icon } from '../../ui/Icon';
import { Panel } from '../../ui/Panel';
import { useServer } from '../context/ServerContext'; // Importar o hook
import { motion } from 'framer-motion';

const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08, // Atraso entre cada card
        },
    },
};

const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

const InfoCard = ({ title, value, total, unit, icon, statusColor, isHighUsage = false }: any) => (
    <motion.div variants={cardVariants}>
        <Panel className="p-4">
            <div className="flex items-center gap-4">
                <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-lg bg-zinc-900/50">
                    {icon}
                </div>
                <div className="flex-grow">
                    <div className="flex justify-between items-center">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">{title}</h4>
                        {statusColor && <div className={`w-2.5 h-2.5 rounded-full ${statusColor} shadow-[0_0_10px_1px] ${statusColor.replace('bg-', 'shadow-')}`}></div>}
                    </div>
                    <div className="flex items-baseline">
                        <p className={`text-2xl font-bold transition-colors duration-300 ${isHighUsage ? 'text-rose-400' : 'text-white'}`}>{value}</p>
                        {total && <p className="text-zinc-400 font-normal ml-1.5">/ {total}{unit}</p>}
                        {!total && unit && <p className="text-zinc-400 font-normal ml-1.5">{unit}</p>}
                    </div>
                </div>
            </div>
        </Panel>
    </motion.div>
);

export const ServerStats = () => {
    const { server, nodeOffline } = useServer();

    if (nodeOffline) {
        return (
            <Panel className="p-6 flex flex-col items-center justify-center text-center bg-amber-950/40 border border-amber-800/40">
                <div className="w-14 h-14 rounded-full border-4 border-amber-400/30 border-t-amber-400 animate-spin mb-5" />
                <h3 className="text-amber-300 font-semibold text-lg tracking-wide">Node Offline</h3>
                <p className="text-amber-400/70 text-xs mt-2 max-w-[180px] leading-relaxed">
                    Sem comunicação em tempo real. Tentando reconectar automaticamente...
                </p>
            </Panel>
        );
    }

    if (!server) {
        return (
            Array.from({ length: 5 }).map((_, i) => (
                <Panel key={i} className="p-5 h-[88px] animate-pulse" children={undefined} />
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
        <motion.div
            variants={cardContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-4"
        >
            <InfoCard
                title="Status"
                value={server.status === 'running' ? server.uptime : currentStatus.text}
                icon={<Icon name="power" className="w-6 h-6"/>}
                statusColor={currentStatus.color}
            />
            <InfoCard title="Uso de CPU" value={`${cpuUsagePercent.toFixed(2)}`} unit="%" total={`${server.maxCpu}`} icon={<Icon name="cpu" className="w-6 h-6"/>} isHighUsage={isCpuHigh} />
            <InfoCard title="Uso de RAM" value={server.ram.used.toFixed(2)} total={server.ram.total.toFixed(2)} unit={` ${server.ram.unit}`} icon={<Icon name="ram" className="w-6 h-6"/>} isHighUsage={isRamHigh} />
            <InfoCard title="Uso de Disco" value={server.disk.used.toFixed(2)} total={server.disk.total.toFixed(2)} unit={` ${server.disk.unit}`} icon={<Icon name="disk" className="w-6 h-6"/>} />
            {server.status !== 'stopped' && (
                <motion.div variants={cardVariants} className="flex flex-col gap-4">
                    <InfoCard title="Network In" value={server.networkIn.toFixed(2)} unit=" KiB/s" icon={<Icon name="arrowDown" className="w-6 h-6" />} />
                    <InfoCard title="Network Out" value={server.networkOut.toFixed(2)} unit=" KiB/s" icon={<Icon name="arrowUp" className="w-6 h-6" />} />
                </motion.div>
            )}
        </motion.div>
    );
};
