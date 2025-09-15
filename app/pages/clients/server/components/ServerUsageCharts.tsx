'use client';

import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useServer } from '../context/ServerContext';
import { Panel } from '../../ui/Panel';
import { CloudDownload, CloudUpload } from 'lucide-react';

const MAX_DATA_POINTS = 30;

const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="p-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-md shadow-lg text-xs">
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color }} className="font-semibold">
                        {/* -> O valor aqui agora usará a formatação correta que passarmos */}
                        {`${p.name}: ${p.value.toFixed(2)} ${p.unit || ''}`}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// -> 1. Criei uma nova função que formata valores a partir de KILOBYTES (KB)
const formatKilobytes = (kilobytes: number, decimals = 2) => {
    if (kilobytes === 0) return '0 KB';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(kilobytes) / Math.log(k));

    // Garante que não tente acessar um índice inválido para valores muito pequenos
    if (i < 0) {
        return `${kilobytes.toFixed(dm)} KB`;
    }

    return parseFloat((kilobytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// A função formatBytes original não será mais usada para a rede
const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const UsageChart = ({ data, lines, yAxisProps = {} }: {
    data: any[],
    lines: { key: string, name: string, color: string, gradientId: string, unit?: string }[],
    yAxisProps?: any
}) => {
    if (!data || data.length === 0) {
        return (
            <div style={{ height: 240 }} className="flex items-center justify-center w-full">
                <p className="text-sm text-zinc-500">Aguardando dados...</p>
            </div>
        );
    }

    return (
        <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        {lines.map(line => (
                            <linearGradient key={line.gradientId} id={line.gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={line.color} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={line.color} stopOpacity={0}/>
                            </linearGradient>
                        ))}
                    </defs>
                    <XAxis dataKey="time" tick={false} axisLine={false} tickLine={false} />
                    <YAxis
                        tick={{ fill: '#a1a1aa', fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        {...yAxisProps}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.2)' }} />
                    {lines.map(line => (
                        <Area
                            key={line.key}
                            type="linear"
                            dataKey={line.key}
                            name={line.name}
                            stroke={line.color}
                            strokeWidth={2}
                            fillOpacity={1}
                            fill={`url(#${line.gradientId})`}
                            dot={false}
                            unit={line.unit} // A unidade correta será passada aqui
                        />
                    ))}
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export const ServerUsageCharts = () => {
    const { server } = useServer();
    const [usageHistory, setUsageHistory] = useState<any[]>([]);
    const totalRam = server?.ram?.total || 1200;

    useEffect(() => {
        if (server && server.status !== 'stopped') {
            const newEntry = {
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                cpu: server.cpu,
                ram: server.ram.used,
                // Os dados já vêm em KB, então apenas garantimos que são números
                networkIn: Number(server.networkIn) || 0,
                networkOut: Number(server.networkOut) || 0,
            };

            setUsageHistory(prev => [...prev, newEntry].slice(-MAX_DATA_POINTS));
        }
    }, [server]);

    if (!server || server.status === 'stopped') {
        return null;
    }

    // Não precisamos mais do `formattedHistory`, pois já tratamos no `useEffect`
    const formattedHistory = usageHistory;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
            {/* Gráfico de CPU (sem alterações) */}
            <Panel className="p-4">
                <>
                    <h3 className="text-base font-semibold text-zinc-200 mb-2">Uso de CPU</h3>
                    <UsageChart
                        data={formattedHistory}
                        yAxisProps={{ domain: [0, 100], tickFormatter: (value: number) => `${value.toFixed(0)}%` }}
                        lines={[{ key: 'cpu', name: 'CPU', color: '#22d3ee', gradientId: 'cpuGradient', unit: '%' }]}
                    />
                </>
            </Panel>

            {/* Gráfico de Memória (sem alterações) */}
            <Panel className="p-4">
                <>
                    <h3 className="text-base font-semibold text-zinc-200 mb-2">Uso de Ram</h3>
                    <UsageChart
                        data={formattedHistory}
                        yAxisProps={{ domain: [0, totalRam], tickFormatter: (value: number) => `${value}MiB` }}
                        lines={[{ key: 'ram', name: 'RAM', color: '#22d3ee', gradientId: 'ramGradient', unit: 'MiB' }]}
                    />
                </>
            </Panel>

            {/* Gráfico de Rede (com as correções) */}
            <Panel className=" p-4 relative">
                <>
                    <div className="flex justify-between items-center">
                        <h3 className="text-base font-semibold text-zinc-200 mb-2">Network</h3>
                        <div className="flex items-center gap-2 -mt-2">
                            <CloudUpload size={16} className="text-amber-400" />
                            <CloudDownload size={16} className="text-cyan-400" />
                        </div>
                    </div>
                    <UsageChart
                        data={formattedHistory}
                        yAxisProps={{
                            // -> 2. Usando a nova função para formatar o eixo Y corretamente
                            tickFormatter: (value: number) => formatKilobytes(value)
                        }}
                        lines={[
                            // -> 3. Corrigindo os nomes e a unidade para o tooltip
                            { key: 'networkIn', name: 'Network In', color: '#22d3ee', gradientId: 'netInGradient', unit: 'KB' },
                            { key: 'networkOut', name: 'Network Out', color: '#fbbf24', gradientId: 'netOutGradient', unit: 'KB' }
                        ]}
                    />
                </>
            </Panel>
        </div>
    );
};