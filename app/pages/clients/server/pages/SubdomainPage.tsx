'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useServer } from '../context/ServerContext';
import { getAvailableDomains, createSubdomain, deleteSubdomain } from '../api';
import { Icon } from '../../ui/Icon';
import { motion } from 'framer-motion';
import { Panel } from '../../ui/Panel';
import { ConfirmModal } from '../../ui/ModalConfirm';
import { useToast } from '@/app/contexts/ToastContext';

interface DomainOption {
    value: string;
    label: string;
}
interface RecordRowProps {
    label: string;
    value: string | number;
    copy?: boolean;
}
const RecordRow: React.FC<RecordRowProps> = ({ label, value, copy }) => (
    <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col">
            <span className="text-[10px] font-semibold text-zinc-500 tracking-wider select-none">{label.toUpperCase()}</span>
            <span className="text-zinc-300 font-mono text-xs break-all select-text">{String(value)}</span>
        </div>
        {copy && (
            <button
                type="button"
                onClick={() => navigator.clipboard.writeText(String(value))}
                className="px-2 py-1 rounded-md bg-zinc-800 hover:bg-zinc-700 text-[10px] text-zinc-300 font-medium transition select-none"
                title="Copiar"
                aria-label={`Copiar valor de ${label}`}
            >
                Copiar
            </button>
        )}
    </div>
);

const SubdomainPage: React.FC = () => {
    const { server, refreshServer } = useServer();
    const { addToast } = useToast();

    const [domains, setDomains] = useState<DomainOption[]>([]);
    const [loadingDomains, setLoadingDomains] = useState(false);
    const [formLoading, setFormLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const [subPart, setSubPart] = useState('');
    const [selectedDomainId, setSelectedDomainId] = useState('');

    const hasSubdomain = !!server?.subdomain;

    // Load available domains
    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoadingDomains(true);
            try {
                const data = await getAvailableDomains();
                if (!cancelled) setDomains(data);
            } catch (e: any) {
                if (!cancelled) {
                    const msg = e.message || 'Falha ao carregar domínios.';
                    setError(msg);
                    addToast(msg, 'error');
                }
            } finally {
                if (!cancelled) setLoadingDomains(false);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [addToast]);

    const currentFull = useMemo(() => {
        const dom = domains.find((d) => d.value === selectedDomainId)?.label;
        if (!subPart || !dom) return '';
        return `${subPart}.${dom}`.toLowerCase();
    }, [subPart, selectedDomainId, domains]);

    const validateSub = (value: string) => /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(value);
    const canSubmit =
        !!server?.id && !hasSubdomain && !!selectedDomainId && validateSub(subPart) && !formLoading;

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit || !server) return;
        setFormLoading(true);
        setError(null);
        try {
            await createSubdomain(server.id, subPart, selectedDomainId);
            addToast('Subdomínio criado com sucesso!', 'success');
            await refreshServer?.();
        } catch (e: any) {
            const msg = e.message || 'Falha ao criar subdomínio.';
            setError(msg);
            addToast(msg, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!server?.id || !hasSubdomain || formLoading) return;
        setFormLoading(true);
        setError(null);
        try {
            await deleteSubdomain(server.id);
            addToast('Subdomínio removido.', 'success');
            setSubPart('');
            setSelectedDomainId('');
            await refreshServer?.();
        } catch (e: any) {
            const msg = e.message || 'Falha ao remover subdomínio.';
            setError(msg);
            addToast(msg, 'error');
        } finally {
            setFormLoading(false);
        }
    };

    // --- View Mode: Subdomain exists ---
    if (server && hasSubdomain) {
        const fqdn = server.subdomain;
        const ipContent =
            server.primaryAllocation?.externalIp ||
            server.primaryAllocation?.ip ||
            (server.ip?.split(':')[0]) ||
            '0.0.0.0';
        const port =
            server.primaryAllocation?.port ||
            (server.ip?.split(':')[1] ? parseInt(server.ip.split(':')[1]) : undefined) ||
            25565;
        const aRecord = {
            type: 'A',
            name: fqdn,
            content: ipContent,
            ttl: 120,
            proxied: false,
        };
        const srvRecord = {
            type: 'SRV',
            name: `_minecraft._tcp.${fqdn}`,
            data: {
                service: '_minecraft',
                proto: '_tcp',
                name: fqdn,
                priority: 1,
                weight: 1,
                port,
                target: fqdn,
            },
        };

        return (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col gap-6"
            >
                <ConfirmModal
                    isOpen={showDeleteModal}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleDelete}
                    title="Remover Subdomínio"
                    message={`Tem certeza que deseja remover o subdomínio "${fqdn}"? Os registros DNS serão excluídos.`}
                    confirmText="Remover"
                    confirmColor="rose"
                />

                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-lg font-semibold select-none">Subdomínio</h2>
                        <p className="text-sm text-zinc-400 select-none">Gerencie o subdomínio criado para este servidor.</p>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <button
                            onClick={() => {
                                if (fqdn != null) {
                                    navigator.clipboard.writeText(fqdn);
                                    addToast('Copiado: ' + fqdn, 'info');
                                }
                            }}
                            className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-200 text-sm font-medium hover:bg-zinc-700 transition select-none"
                            type="button"
                            aria-label="Copiar FQDN"
                        >
                            Copiar FQDN
                        </button>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            disabled={formLoading}
                            className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 transition disabled:opacity-50 flex items-center gap-2 select-none"
                            type="button"
                            aria-label="Remover subdomínio"
                        >
                            {formLoading && <Icon name="loader" className="w-4 h-4 animate-spin" />}
                            Remover
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Panel className="bg-zinc-900/60 p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Icon name="globe" className="w-5 h-5 text-purple-400" />
                            <h3 className="text-sm font-semibold text-zinc-200 select-none">Registro A</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <RecordRow label="Tipo" value={aRecord.type} />
                            <RecordRow label="Nome" value={aRecord.name || ''} copy />
                            <RecordRow label="Conteúdo" value={aRecord.content} copy />
                            <RecordRow label="TTL" value={aRecord.ttl} />
                            <RecordRow label="Proxied" value={aRecord.proxied ? 'Sim' : 'Não'} />
                        </div>
                    </Panel>

                    <Panel className="bg-zinc-900/60 p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2">
                            <Icon name="network" className="w-5 h-5 text-purple-400" />
                            <h3 className="text-sm font-semibold text-zinc-200 select-none">Registro SRV</h3>
                        </div>
                        <div className="space-y-2 text-sm">
                            <RecordRow label="Tipo" value="SRV" />
                            <RecordRow label="Nome" value={srvRecord.name} copy />
                            <RecordRow label="Service" value={srvRecord.data.service} />
                            <RecordRow label="Proto" value={srvRecord.data.proto} />
                            <RecordRow label="Target" value={srvRecord.data.target || ''} copy />
                            <RecordRow label="Port" value={srvRecord.data.port} />
                            <RecordRow label="Priority" value={srvRecord.data.priority} />
                            <RecordRow label="Weight" value={srvRecord.data.weight} />
                        </div>
                    </Panel>
                </div>
            </motion.div>
        );
    }

    // --- Creation Mode ---
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
        >
            <div className="space-y-3">
                <h2 className="text-lg font-semibold select-none">Subdomínio</h2>
                <p className="text-sm text-zinc-400 select-none">
                    Defina um subdomínio público para acessar seu servidor. Certifique-se que o domínio já está configurado pela administração.
                </p>
            </div>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-md text-sm flex items-center gap-2 select-none" role="alert">
                    <Icon name="alert-triangle" className="w-4 h-4" />
                    {error}
                </div>
            )}

            <form onSubmit={onSubmit} className="bg-zinc-900/50 rounded-lg p-5 flex flex-col gap-6" noValidate>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex flex-col gap-2 md:col-span-1">
                        <label htmlFor="subdomain-input" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 select-none">
                            Subdomínio
                        </label>
                        <input
                            id="subdomain-input"
                            type="text"
                            value={subPart}
                            onChange={(e) => setSubPart(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            placeholder="ex: play"
                            maxLength={63}
                            disabled={formLoading || hasSubdomain}
                            className="w-full bg-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-500 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none disabled:opacity-50"
                            aria-describedby="subdomain-help"
                            autoComplete="off"
                            spellCheck={false}
                        />
                        <p id="subdomain-help" className="text-[11px] text-zinc-500 select-none">
                            Permitido: letras minúsculas, números e hífen.
                        </p>
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-1">
                        <label htmlFor="domain-select" className="text-xs font-semibold uppercase tracking-wider text-zinc-400 select-none">
                            Domínio
                        </label>
                        <select
                            id="domain-select"
                            value={selectedDomainId}
                            onChange={(e) => setSelectedDomainId(e.target.value)}
                            disabled={loadingDomains || formLoading || hasSubdomain}
                            className="w-full bg-zinc-800/60 rounded-lg px-3 py-2 text-sm text-zinc-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 outline-none disabled:opacity-50"
                            aria-disabled={loadingDomains || formLoading || hasSubdomain}
                        >
                            <option value="">{loadingDomains ? 'Carregando...' : 'Selecione'}</option>
                            {domains.map((d) => (
                                <option key={d.value} value={d.value}>
                                    {d.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-[11px] text-zinc-500 select-none">Lista de domínios disponíveis.</p>
                    </div>

                    <div className="flex flex-col gap-2 md:col-span-1">
                        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 select-none">Pré-visualização</label>
                        <div className="w-full bg-zinc-800/40 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono select-all min-h-[40px] flex items-center">
                            {currentFull || '—'}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="px-5 py-2.5 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 transition-all duration-300 disabled:bg-zinc-700 disabled:cursor-not-allowed flex items-center gap-2 select-none"
                        aria-disabled={!canSubmit}
                    >
                        {formLoading && <Icon name="loader" className="w-4 h-4 animate-spin" />}
                        {formLoading ? 'Criando...' : 'Criar Subdomínio'}
                    </button>
                </div>
            </form>
        </motion.div>
    );
};

export default SubdomainPage;