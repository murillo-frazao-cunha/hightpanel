import React from 'react';
import { Icon } from '../../ui/Icon';
import { Panel } from '../../ui/Panel';
import { useServer } from '../context/ServerContext';
import { motion } from 'framer-motion';

const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.08,
        },
    },
};

const cardVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
};

/**
 * Converts MiB values to GiB if the value is greater than 1000 MiB.
 * Returns the value and unit accordingly.
 */
const formatMiBtoGiB = (value: number) => {
    if (value > 1000) {
        return { value: value / 1024, unit: 'GiB' };
    }
    return { value, unit: 'MiB' };
};

const InfoCard = ({
                      title,
                      value,
                      total,
                      unit,
                      icon,
                      statusColor,
                      isHighUsage = false,
                  }: {
    title: string;
    value: string | number;
    total?: string | number;
    unit?: string;
    icon: React.ReactNode;
    statusColor?: string;
    isHighUsage?: boolean;
}) => (
    <motion.div variants={cardVariants}>
        <Panel className="p-5 rounded-2xl bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/40 shadow-lg shadow-black/40">
            <div className="flex items-center gap-5">
                <div className="flex-shrink-0 flex items-center justify-center h-14 w-14 rounded-xl bg-zinc-900/60 shadow-md">
                    {icon}
                </div>
                <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-center mb-1">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-400 select-none truncate max-w-[120px]">
                            {title}
                        </h4>
                        {statusColor && (
                            <div
                                className={`w-3 h-3 rounded-full ${statusColor} shadow-[0_0_10px_2px] ${statusColor.replace(
                                    'bg-',
                                    'shadow-'
                                )}`}
                            />
                        )}
                    </div>
                    <div className="flex items-baseline min-w-0">
                        <p
                            className={`text-2xl font-extrabold transition-colors duration-300 truncate ${
                                isHighUsage ? 'text-rose-400' : 'text-white'
                            }`}
                            title={typeof value === 'number' ? value.toString() : value}
                        >
                            {value}
                        </p>
                        {total !== undefined && total !== null ? (
                            <p
                                className="text-zinc-400 font-normal ml-2 truncate max-w-[90px]"
                                title={typeof total === 'number' ? total.toString() : total}
                            >
                                / {total}
                                {unit}
                            </p>
                        ) : unit ? (
                            <p className="text-zinc-400 font-normal ml-2 truncate max-w-[90px]" title={unit}>
                                {unit}
                            </p>
                        ) : null}
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
            <Panel className="p-8 flex flex-col items-center justify-center text-center bg-amber-950/40 border border-amber-800/40 rounded-2xl shadow-md shadow-amber-900/40 backdrop-blur-sm">
                <div className="w-16 h-16 rounded-full border-4 border-amber-400/40 border-t-amber-400 animate-spin mb-6" />
                <h3 className="text-amber-300 font-semibold text-xl tracking-wide select-none">Node Offline</h3>
                <p className="text-amber-400/80 text-sm mt-3 max-w-[220px] leading-relaxed select-none">
                    Sem comunicação em tempo real. Tentando reconectar automaticamente...
                </p>
            </Panel>
        );
    }

    if (!server) {
        return (
            <div className="flex flex-col gap-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Panel
                        key={i}
                        className="p-6 h-[96px] rounded-2xl animate-pulse bg-zinc-900/40 backdrop-blur-xl border border-zinc-700/40 shadow-lg shadow-black/40"
                        children={undefined}                    />
                ))}
            </div>
        );
    }

    const statusConfig: Record<string, { text: string; color: string }> = {
        running: { text: 'Rodando', color: 'bg-teal-400' },
        initializing: { text: 'Inicializando', color: 'bg-amber-400' },
        stopped: { text: 'Parado', color: 'bg-rose-500' },
        installing: { text: 'Instalando', color: 'bg-amber-400' },
        error: { text: 'Erro', color: 'bg-rose-600' },
    };

    const currentStatus = statusConfig[server.status] || statusConfig.stopped;

    // Defensive checks for usage values
    const cpuUsagePercent = typeof server.cpu === 'number' ? server.cpu : 0;

    // RAM formatting (values are in MiB)
    const ramUsedRaw = server.ram.used;
    const ramTotalRaw = server.ram.total;
    const ramUsagePercent = (ramUsedRaw / ramTotalRaw) * 100;
    console.log(ramUsedRaw, ramTotalRaw)
    const ramUsedFormatted = formatMiBtoGiB(ramUsedRaw);
    const ramTotalFormatted = formatMiBtoGiB(ramTotalRaw);

    // Disk formatting (values are in MiB)
    const diskUsedRaw = server.disk?.used ?? 0;
    const diskTotalRaw = server.disk?.total ?? 1;

    const diskUsedFormatted = formatMiBtoGiB(diskUsedRaw);
    const diskTotalFormatted = formatMiBtoGiB(diskTotalRaw);

    const isCpuHigh = cpuUsagePercent > 90;
    const isRamHigh = ramUsagePercent > 85;

    return (
        <motion.div
            variants={cardContainerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-5"
        >
            <InfoCard
                title="Status"
                value={server.status === 'running' ? server.uptime || currentStatus.text : currentStatus.text}
                icon={<Icon name="power" className="w-7 h-7" />}
                statusColor={currentStatus.color}
            />
            <InfoCard
                title="Uso de CPU"
                value={`${cpuUsagePercent.toFixed(1)}`}
                unit="%"
                total={server.maxCpu ?? 100}
                icon={<Icon name="cpu" className="w-7 h-7" />}
                isHighUsage={isCpuHigh}
            />
            <InfoCard
                title="Uso de RAM"
                value={ramUsedFormatted.value.toFixed(2)}
                total={ramTotalFormatted.value.toFixed(2)}
                unit={` ${ramTotalFormatted.unit}`}
                icon={<Icon name="ram" className="w-7 h-7" />}
                isHighUsage={isRamHigh}
            />
            <InfoCard
                title="Uso de Disco"
                value={diskUsedFormatted.value.toFixed(2)}
                total={diskTotalFormatted.value.toFixed(2)}
                unit={` ${diskTotalFormatted.unit}`}
                icon={<Icon name="disk" className="w-7 h-7" />}
            />
            {server.status !== 'stopped' && (
                <motion.div variants={cardVariants} className="flex flex-col gap-5">
                    <InfoCard
                        title="Network In"
                        value={server.networkIn?.toFixed(2) ?? '0.00'}
                        unit=" KiB/s"
                        icon={<Icon name="arrowDown" className="w-7 h-7" />}
                    />
                    <InfoCard
                        title="Network Out"
                        value={server.networkOut?.toFixed(2) ?? '0.00'}
                        unit=" KiB/s"
                        icon={<Icon name="arrowUp" className="w-7 h-7" />}
                    />
                </motion.div>
            )}
        </motion.div>
    );
};