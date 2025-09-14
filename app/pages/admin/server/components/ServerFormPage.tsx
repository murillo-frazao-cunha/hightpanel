'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useDebounce } from '@/app/hooks/useDebounce';
import { Icon } from '@/app/pages/clients/ui/Icon';

// Importando APIs de seus respectivos módulos
import { getCores } from "@/app/pages/admin/cores/api";
import { getNodes, getStatus as getNodeStatus, getAllocations as getNodeAllocations } from "@/app/pages/admin/nodes/api";
import { searchUsers } from '../api';

// Importando tipos
import type { Server } from '../types/ServerType';
import type { User } from '@/app/pages/admin/users/types/UserType';
import type { Core } from '@/app/pages/admin/cores/types/CoreType';
import type { Node, Allocation } from '@/app/pages/admin/nodes/types/NodeType';

interface ServerFormPageProps {
    server?: Server | null;
    onSave: (server: any) => Promise<void>;
    isSubmitting: boolean;
    error: string | null;
    clearError: () => void;
}

// Componente CustomSelect (sem alterações)
const CustomSelect = ({ options, value, onChange, placeholder, disabled = false }: {
    options: { value: string; label: string; disabled?: boolean }[];
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
    disabled?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const selectedOption = options.find(option => option.value === value);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as HTMLElement)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (selectedValue: string) => {
        onChange(selectedValue);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white text-left flex justify-between items-center focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span className={selectedOption ? 'text-white' : 'text-zinc-500'}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <Icon name="chevronDown" className={`w-5 h-5 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            {isOpen && !disabled && (
                <ul className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-auto custom-scrollbar">
                    {options.map((option, index) => {
                        const optDisabled = option.disabled;
                        return (
                            <li
                                key={`${option.value}-${index}`}
                                onClick={() => { if (!optDisabled) handleSelect(option.value); }}
                                className={`px-4 py-2 text-white ${optDisabled ? 'opacity-40 cursor-not-allowed line-through' : 'hover:bg-teal-500/20 cursor-pointer'}`}
                                aria-disabled={optDisabled}
                            >
                                {option.label}
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
};


const ServerFormPage: React.FC<ServerFormPageProps> = ({ server, onSave, isSubmitting, error, clearError }) => {
    const [formData, setFormData] = useState<Partial<Server>>({});
    const [cores, setCores] = useState<Core[]>([]);
    const [nodes, setNodes] = useState<Node[]>([]);
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [ownerQuery, setOwnerQuery] = useState('');
    const [ownerResults, setOwnerResults] = useState<User[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
    const [selectedCore, setSelectedCore] = useState<Core | null>(null);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [isLoadingAllocations, setIsLoadingAllocations] = useState(false);
    const [newAllocationToAdd, setNewAllocationToAdd] = useState('');

    const debouncedQuery = useDebounce(ownerQuery, 300);
    const isEditing = !!server;

    const fetchAllocationsForNode = async (nodeUuid: string) => {
        if (!nodeUuid) {
            setAllocations([]);
            return;
        }
        setIsLoadingAllocations(true);
        try {
            const fetchedAllocations = await getNodeAllocations(nodeUuid);
            setAllocations(fetchedAllocations);
        } catch (err) {
            console.error("Failed to fetch allocations", err);
            setAllocations([]);
        } finally {
            setIsLoadingAllocations(false);
        }
    };

    const extractDefaultFromRules = (rules?: string): string | undefined => {
        if (!rules) return undefined;
        const token = rules.split('|').map(r => r.trim()).find(r => r.startsWith('default:'));
        if (!token) return undefined;
        return token.substring('default:'.length);
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            setIsLoadingInitialData(true);
            try {
                const [_cores, _nodes] = await Promise.all([getCores(), getNodes()]);
                setCores(_cores);
                const nodesWithStatus = await Promise.all(_nodes.map(async (node) => {
                    const statusResult = await getNodeStatus(node.uuid);
                    return { ...node, status: statusResult.status };
                }));
                setNodes(nodesWithStatus);

                if (isEditing && server) {
                    // Base environment (server existente)
                    const baseEnv = { ...(server.environment || {}) };
                    const coreRef = _cores.find(c => c.id === server.coreId) || null;
                    if (coreRef) {
                        // Completa defaults onde estiver vazio/indefinido
                        coreRef.variables.forEach(v => {
                            const defVal = extractDefaultFromRules(v.rules);
                            const currentVal = (baseEnv as any)[v.envVariable];
                            if ((currentVal === undefined || currentVal === null || currentVal === '') && defVal !== undefined) {
                                (baseEnv as any)[v.envVariable] = defVal;
                            }
                        });
                    }
                    setFormData({
                        ...server,
                        environment: baseEnv,
                        additionalAllocationIds: server.additionalAllocationIds || [],
                        databasesQuantity: server.databasesQuantity ?? 0,
                        addicionalAllocationsNumbers: server.addicionalAllocationsNumbers ?? 0,
                    });
                    setSelectedOwner(server.owner);
                    setOwnerQuery(server.owner.email);
                    setSelectedCore(coreRef);
                    if (server.nodeUuid) {
                        await fetchAllocationsForNode(server.nodeUuid);
                    }
                } else {
                    setFormData({
                        name: '',
                        description: '',
                        ram: 1024,
                        cpu: 100,
                        disk: 5120,
                        environment: {},
                        additionalAllocationIds: [],
                        databasesQuantity: 0,
                        addicionalAllocationsNumbers: 0
                    });
                }
            } catch (err) {
                console.error("Failed to fetch initial data", err);
            } finally {
                setIsLoadingInitialData(false);
            }
        };
        fetchInitialData();
    }, [server, isEditing]);

    useEffect(() => {
        if (debouncedQuery.length < 2) { setOwnerResults([]); return; }
        setIsSearchingUsers(true);
        searchUsers(debouncedQuery).then(results => {
            setIsSearchingUsers(false);
            setOwnerResults(results);
        });
    }, [debouncedQuery]);

    const handleNodeChange = (nodeUuid: string) => {
        setFormData(prev => ({ ...prev, nodeUuid, primaryAllocationId: undefined, additionalAllocationIds: [] }));
        fetchAllocationsForNode(nodeUuid);
    };

    const handleCoreChange = (coreId: string) => {
        const core = cores.find(c => c.id === coreId);
        setSelectedCore(core || null);
        const initialEnv = core ? core.variables.reduce((acc, v) => {
            const defVal = extractDefaultFromRules(v.rules);
            acc[v.envVariable] = defVal !== undefined ? defVal : '';
            return acc;
        }, {} as Record<string,string>) : {};
        setFormData(prev => ({ ...prev, coreId, dockerImage: core?.dockerImages[0]?.image || '', environment: initialEnv }));
    };

    const handleChange = (name: string, value: any) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEnvVarChange = (envVariable: string, value: string) => {
        setFormData(prev => ({ ...prev, environment: { ...prev.environment, [envVariable]: value } }));
    };

    const handleOwnerSelect = (user: User) => {
        setSelectedOwner(user);
        setOwnerQuery(user.email);
        setOwnerResults([]);
    };

    // --- LÓGICA PARA ALOCAÇÕES ADICIONAIS ---
    const handleAddAllocation = () => {
        if (!newAllocationToAdd || formData.additionalAllocationIds?.includes(newAllocationToAdd)) return;
        setFormData(prev => ({
            ...prev,
            additionalAllocationIds: [...(prev.additionalAllocationIds || []), newAllocationToAdd]
        }));
        setNewAllocationToAdd('');
    };

    const handleRemoveAllocation = (idToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            additionalAllocationIds: (prev.additionalAllocationIds || []).filter(id => id !== idToRemove)
        }));
    };

    const availableAllocations = useMemo(() => {
        return allocations.filter(alloc => {
            const isPrimary = alloc.id === formData.primaryAllocationId;
            const isAlreadyAdded = formData.additionalAllocationIds?.includes(alloc.id);
            return !isPrimary && !isAlreadyAdded;
        });
    }, [allocations, formData.primaryAllocationId, formData.additionalAllocationIds]);


    const handleSave = async () => {
        if (isSubmitting) return;
        await onSave({ ...formData, owner: selectedOwner });
    };

    if (isLoadingInitialData) return <div className="flex justify-center items-center h-full"><svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24/24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>;

    return (
        <>
            <header className="mb-8"><h1 className="text-4xl font-bold text-white">{isEditing ? `Editando Servidor` : 'Criar Novo Servidor'}</h1><p className="text-zinc-400 mt-1">{isEditing ? `Modificando "${formData.name}"` : 'Preencha os detalhes para configurar um novo servidor.'}</p></header>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-lg flex justify-between items-center mb-6 animate-pulse-slow">
                    <div className="flex items-center gap-3"><Icon name="alert-triangle" className="w-5 h-5 flex-shrink-0" /><p className="text-sm font-medium">{error}</p></div>
                    <button onClick={clearError} className="p-1 rounded-full hover:bg-rose-500/20 transition-colors"><Icon name="x" className="w-5 h-5" /></button>
                </div>
            )}

            <div className="space-y-8">
                {/* Painel de Informações Principais */}
                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50">
                        <h2 className="text-xl font-bold text-white">Informações Principais</h2>
                        <p className="text-zinc-400 text-sm mt-1">Detalhes de identificação e propriedade do servidor.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">Nome do Servidor</label>
                            <input id="name" name="name" value={formData.name || ''} onChange={(e) => handleChange(e.target.name, e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"/>
                        </div>
                        <div className="relative">
                            <label htmlFor="owner" className="block text-sm font-medium text-zinc-400 mb-2">Dono do Servidor</label>
                            <input id="owner" value={ownerQuery} onChange={(e) => setOwnerQuery(e.target.value)} placeholder="Pesquise por email ou nome..." className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"/>
                            {isSearchingUsers && <Icon name="refresh" className="w-5 h-5 animate-spin absolute right-3 top-10 text-zinc-400" />}
                            {ownerResults.length > 0 && (
                                <ul className="absolute z-10 w-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                                    {ownerResults.map(user => <li key={user.id} onClick={() => handleOwnerSelect(user)} className="px-4 py-2 text-white hover:bg-teal-500/20 cursor-pointer">{user.username} ({user.email})</li>)}
                                </ul>
                            )}
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-zinc-400 mb-2">Descrição</label>
                            <textarea id="description" name="description" value={formData.description || ''} onChange={(e) => handleChange(e.target.name, e.target.value)} rows={3} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all custom-scrollbar"></textarea>
                        </div>
                    </div>
                </div>

                {/* Painel de Recursos */}
                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50"><h2 className="text-xl font-bold text-white">Recursos</h2><p className="text-zinc-400 text-sm mt-1">Defina os limites de recursos e quotas deste servidor.</p></div>
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-5 gap-6">
                        <div>
                            <label htmlFor="cpu" className="block text-sm font-medium text-zinc-400 mb-2">Limite de CPU (%)</label>
                            <input id="cpu" type="number" name="cpu" value={formData.cpu ?? ''} onChange={(e) => handleChange(e.target.name, e.target.valueAsNumber)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label htmlFor="ram" className="block text-sm font-medium text-zinc-400 mb-2">Memória RAM (MB)</label>
                            <input id="ram" type="number" name="ram" value={formData.ram ?? ''} onChange={(e) => handleChange(e.target.name, e.target.valueAsNumber)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label htmlFor="disk" className="block text-sm font-medium text-zinc-400 mb-2">Espaço em Disco (MB)</label>
                            <input id="disk" type="number" name="disk" value={formData.disk ?? ''} onChange={(e) => handleChange(e.target.name, e.target.valueAsNumber)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label htmlFor="databasesQuantity" className="block text-sm font-medium text-zinc-400 mb-2">Qtd. Máx. Databases</label>
                            <input id="databasesQuantity" type="number" name="databasesQuantity" value={formData.databasesQuantity ?? 0} onChange={(e) => handleChange(e.target.name, e.target.valueAsNumber)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label htmlFor="addicionalAllocationsNumbers" className="block text-sm font-medium text-zinc-400 mb-2">Qtd. Máx. Alocações Extras</label>
                            <input id="addicionalAllocationsNumbers" type="number" name="addicionalAllocationsNumbers" value={formData.addicionalAllocationsNumbers ?? 0} onChange={(e) => handleChange(e.target.name, e.target.valueAsNumber)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                        </div>
                    </div>
                </div>

                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50">
                        <h2 className="text-xl font-bold text-white">Node & Alocação</h2>
                        <p className="text-zinc-400 text-sm mt-1">Escolha onde o servidor será hospedado e suas portas.</p>
                    </div>
                    <div className="p-6 grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Node</label>
                            <CustomSelect
                                placeholder="Selecione um Node..."
                                options={nodes.map(node => ({ value: node.uuid, label: `${node.name} (${node.status})`, disabled: node.status && node.status.toLowerCase() !== 'online' }))}
                                value={formData.nodeUuid || ''}
                                onChange={handleNodeChange}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Alocação Principal</label>
                            <CustomSelect
                                placeholder="Selecione uma Alocação..."
                                options={allocations
                                    .filter(alloc => !formData.additionalAllocationIds?.includes(alloc.id))
                                    .map(alloc => ({ value: alloc.id, label: `${alloc.ip}:${alloc.port}` }))
                                }
                                value={formData.primaryAllocationId || ''}
                                onChange={(value) => handleChange('primaryAllocationId', value)}
                                disabled={isLoadingAllocations || allocations.length === 0}
                            />
                        </div>
                    </div>
                    {isEditing && (
                        <div className="p-6 border-t border-zinc-700/50 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-400 mb-2">Alocações Adicionais</label>
                                <div className="flex gap-2">
                                    <div className="flex-grow">
                                        <CustomSelect
                                            placeholder="Adicionar outra alocação..."
                                            options={availableAllocations.map(alloc => ({ value: alloc.id, label: `${alloc.ip}:${alloc.port}` }))}
                                            value={newAllocationToAdd}
                                            onChange={setNewAllocationToAdd}
                                            disabled={availableAllocations.length === 0}
                                        />
                                    </div>
                                    <button onClick={handleAddAllocation} disabled={!newAllocationToAdd} className="px-4 py-2.5 rounded-lg bg-teal-500/80 text-white font-semibold hover:bg-teal-600 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed">
                                        Adicionar
                                    </button>
                                </div>
                            </div>
                            {(formData.additionalAllocationIds && formData.additionalAllocationIds.length > 0) && (
                                <div className="space-y-2 pt-2">
                                    {formData.additionalAllocationIds.map(allocId => {
                                        const alloc = allocations.find(a => a.id === allocId);
                                        return (
                                            <div key={allocId} className="flex items-center justify-between bg-zinc-800/50 p-2 rounded-md text-sm">
                                                <span className="text-zinc-300">{alloc ? `${alloc.ip}:${alloc.port}` : 'ID: ' + allocId}</span>
                                                <button onClick={() => handleRemoveAllocation(allocId)} className="p-1 text-zinc-400 hover:text-rose-400 transition-colors">
                                                    <Icon name="x" className="w-4 h-4" />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50">
                        <h2 className="text-xl font-bold text-white">Configuração</h2>
                        <p className="text-zinc-400 text-sm mt-1">Selecione o Core que definirá o comportamento deste servidor.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Core do Servidor</label>
                            <CustomSelect
                                placeholder="Selecione um Core..."
                                options={cores.map(core => ({ value: core.id, label: core.name }))}
                                value={formData.coreId || ''}
                                onChange={handleCoreChange}
                                disabled={isEditing}
                            />
                        </div>
                        {selectedCore && (
                            <>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Imagem Docker</label>
                                    <CustomSelect
                                        placeholder="Selecione uma Imagem..."
                                        options={selectedCore.dockerImages.map(img => ({ value: img.image, label: img.name }))}
                                        value={formData.dockerImage || ''}
                                        onChange={(value) => handleChange('dockerImage', value)}
                                    />
                                </div>
                                {selectedCore.variables.map(variable => (
                                    <div key={variable.envVariable} className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/50">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-400 mb-1">{variable.name}</label>
                                            <p className="text-xs text-zinc-500 mb-2">{variable.description}</p>
                                            <input value={formData.environment?.[variable.envVariable] || ''} onChange={(e) => handleEnvVarChange(variable.envVariable, e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all"/>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div className="mt-8 border-t border-zinc-700/50 pt-6 flex justify-end gap-4">
                <Link href="/admin/servers" className="px-5 py-2.5 rounded-lg bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 transition-colors">Cancelar</Link>
                <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-teal-500/50 disabled:bg-teal-800 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSubmitting && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Servidor')}
                </button>
            </div>
        </>
    );
};

export default ServerFormPage;
