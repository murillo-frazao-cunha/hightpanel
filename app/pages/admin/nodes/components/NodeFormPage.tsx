'use client';
import React, { useState, useEffect } from 'react';
import { Icon } from '@/app/pages/clients/ui/Icon';
import type { Node, Allocation } from '../types/NodeType';
import Link from 'next/link';
import { addAllocations, getAllocations, deleteAllocation, deleteNode } from '../api'; // api helpers
import { useToast } from '@/app/contexts/ToastContext';
import AllocationRow from './AllocationRow';
import { useRouter } from 'next/navigation';
import { ConfirmModal } from '@/app/pages/clients/ui/ModalConfirm';

interface NodeFormPageProps {
    node?: Node | null;
    onSave: (node: Omit<Node, 'id' | 'status' | 'allocations'> & Partial<Pick<Node, 'id' | 'status'>>) => Promise<void>;
    isSubmitting: boolean;
    error: string | null;
    clearError: () => void;
}

const NodeFormPage: React.FC<NodeFormPageProps> = ({ node, onSave, isSubmitting, error, clearError }) => {
    const [formData, setFormData] = useState<Partial<Omit<Node, 'allocations'>>>({});
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState<'settings' | 'allocations'>('settings');
    const isEditing = !!node;
    const { addToast } = useToast();
    const router = useRouter();

    // State for Allocations
    const [allocations, setAllocations] = useState<Allocation[]>([]);
    const [isLoadingAllocations, setIsLoadingAllocations] = useState(true);
    const [newAllocation, setNewAllocation] = useState({ externalIp: '', ports: '', ip: '' });
    const [isSubmittingAllocations, setIsSubmittingAllocations] = useState(false);

    // State for Delete Modal
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    useEffect(() => {
        if (isEditing && node) {
            setFormData({ ...node });
            // Fetch allocations when in edit mode
            setIsLoadingAllocations(true);
            getAllocations(node.uuid).then(data => {
                setAllocations(data.sort((a,b) => a.port - b.port));
            }).finally(() => {
                setIsLoadingAllocations(false);
            });
        } else {
            setFormData({
                uuid: crypto.randomUUID(),
                name: '',
                ip: '',
                port: 8080,
                sftp: 2022,
                ssl: false,
                location: '' // inicializa location
            });
        }
    }, [node, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value);
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSave = async () => {
        if (isSubmitting) return;
        await onSave(formData as Node);
    };

    const handleAddAllocations = async () => {
        if (!node) return;
        setIsSubmittingAllocations(true);

        const portRange = newAllocation.ports.split('-').map(p => parseInt(p.trim(), 10));
        if (portRange.some(isNaN) || newAllocation.ports.trim() === '') {
            addToast('Portas inválidas. Use um número ou um intervalo (ex: 25565-25575).', 'error');
            setIsSubmittingAllocations(false);
            return;
        }

        const [startPort, endPort] = portRange.length > 1 ? portRange : [portRange[0], portRange[0]];

        if (startPort > endPort) {
            addToast('A porta inicial não pode ser maior que a porta final.', 'error');
            setIsSubmittingAllocations(false);
            return;
        }

        if (endPort - startPort + 1 > 10) {
            addToast('Você só pode adicionar no máximo 10 portas de uma vez.', 'error');
            setIsSubmittingAllocations(false);
            return;
        }

        try {
            const createdAllocations = await addAllocations(node.uuid, newAllocation.externalIp || newAllocation.ip, newAllocation.ports, newAllocation.ip);
            setAllocations(prev => [...prev, ...createdAllocations].sort((a,b) => a.port - b.port));
            setNewAllocation({ externalIp: '', ports: '', ip: '' }); // Reset form
            addToast(`${createdAllocations.length} alocação(ões) criada(s) com sucesso!`, 'success');
        } catch (err: any) {
            addToast(err.message || 'Falha ao adicionar alocações.', 'error');
        } finally {
            setIsSubmittingAllocations(false);
        }
    };

    const handleDeleteAllocation = async (allocationUuid: string) => {
        try {
            await deleteAllocation(allocationUuid);
            setAllocations(prev => prev.filter(alloc => alloc.id !== allocationUuid));
            addToast('Alocação deletada com sucesso!', 'success');
        } catch (err: any) {
            addToast(err.message || 'Falha ao deletar alocação.', 'error');
        }
    };

    const handleRequestDelete = () => setIsDeleteModalOpen(true);

    const handleConfirmDelete = async () => {
        if (!node) return;
        try {
            await deleteNode(node.uuid);
            addToast('Node deletado com sucesso!', 'success');
            router.push('/admin/nodes');
        } catch (e:any) {
            addToast(e.message || 'Falha ao deletar node.', 'error');
        } finally {
            setIsDeleteModalOpen(false);
        }
    };

    // @ts-ignore
    const panelToken = node?.token
    console.log(panelToken)
    const remoteOrigin = typeof window !== 'undefined' ? window.location.origin : 'URL_DO_PAINEL';
    const generateCommand = () => {
        return `npm run configure -- --remote=${remoteOrigin} --uuid=${formData.uuid || ''} --token=${panelToken || ''}`;
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(generateCommand());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">{isEditing ? 'Editando Node' : 'Criar Novo Node'}</h1>
                    <p className="text-zinc-400 mt-1">{isEditing ? `Modificando "${formData.name}"` : 'Preencha os detalhes para configurar um novo node.'}</p>
                </div>
                {isEditing && (
                    <div className="flex gap-3">
                        <button onClick={handleRequestDelete} className="px-4 py-2.5 rounded-lg bg-rose-600/90 text-white text-sm font-semibold hover:bg-rose-600 transition-colors flex items-center gap-2">
                            <Icon name="trash" className="w-4 h-4" />
                            Deletar Node
                        </button>
                    </div>
                )}
            </header>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-lg flex justify-between items-center mb-6 animate-pulse-slow">
                    <div className="flex items-center gap-3">
                        <Icon name="alert-triangle" className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                    <button onClick={clearError} className="p-1 rounded-full hover:bg-rose-500/20 transition-colors">
                        <Icon name="x" className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="flex border-b border-zinc-700/50 mb-8">
                <button onClick={() => setActiveTab('settings')} className={`px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'settings' ? 'text-white border-b-2 border-teal-500' : 'text-zinc-400 hover:text-white'}`}>
                    Configurações
                </button>
                {isEditing && (
                    <button onClick={() => setActiveTab('allocations')} className={`px-4 py-3 text-sm font-semibold transition-colors ${activeTab === 'allocations' ? 'text-white border-b-2 border-teal-500' : 'text-zinc-400 hover:text-white'}`}>
                        Alocações de IP
                    </button>
                )}
            </div>

            {activeTab === 'settings' && (
                <div className="space-y-8 animate-[fadeIn_0.3s_ease-in-out]">
                    <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                        <div className="p-6 border-b border-zinc-700/50">
                            <h2 className="text-xl font-bold text-white">Informações Principais</h2>
                            <p className="text-zinc-400 text-sm mt-1">Detalhes básicos para identificar o node.</p>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">Nome do Node</label>
                                <input id="name" type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="ex: Node-SP-01" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                                <p className="text-xs text-zinc-500 mt-1.5">Um nome amigável para o seu node. Ex: Node-SP-01</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label htmlFor="ip" className="block text-sm font-medium text-zinc-400 mb-2">Endereço IP</label>
                                    <input id="ip" type="text" name="ip" value={formData.ip || ''} onChange={handleChange} placeholder="ex: 192.168.1.1" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                                    <p className="text-xs text-zinc-500 mt-1.5">O endereço IPv4 público do seu node.</p>
                                </div>
                                <div>
                                    <label htmlFor="location" className="block text-sm font-medium text-zinc-400 mb-2">Localização / Categoria</label>
                                    <input id="location" type="text" name="location" value={formData.location || ''} onChange={handleChange} placeholder="ex: São Paulo / BR-SP" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                                    <p className="text-xs text-zinc-500 mt-1.5">Usado para agrupar nodes por região ou propósito.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                        <div className="p-6 border-b border-zinc-700/50">
                            <h2 className="text-xl font-bold text-white">Configurações de Rede</h2>
                            <p className="text-zinc-400 text-sm mt-1">Defina as portas de comunicação para o painel e SFTP.</p>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="port" className="block text-sm font-medium text-zinc-400 mb-2">Porta</label>
                                <input id="port" type="number" name="port" value={formData.port || ''} onChange={handleChange} placeholder="ex: 8080" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                            </div>
                            <div>
                                <label htmlFor="sftp" className="block text-sm font-medium text-zinc-400 mb-2">Porta SFTP</label>
                                <input id="sftp" type="number" name="sftp" value={formData.sftp || ''} onChange={handleChange} placeholder="ex: 2022" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                        <div className="p-6 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold text-white">Segurança SSL</h3>
                                <p className="text-zinc-400 text-sm">Ativar criptografia para a comunicação com o painel.</p>
                            </div>
                            <label htmlFor="ssl" className="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" id="ssl" name="ssl" checked={formData.ssl || false} onChange={handleChange} className="sr-only peer" />
                                <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-500/50 peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:peer-checked:translate-x-full after:peer-checked:border-white"></div>
                            </label>
                        </div>
                    </div>

                    {isEditing && (
                        <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                            <div className="p-6 border-b border-zinc-700/50">
                                <h2 className="text-xl font-bold text-white">Comando de Configuração</h2>
                                <p className="text-zinc-400 text-sm mt-1">Execute este comando no servidor para configurar o daemon.</p>
                            </div>
                            <div className="p-6">
                                <div className="relative bg-black/50 rounded-lg">
                                    <pre className="p-4 text-xs text-teal-300 whitespace-pre-wrap overflow-auto custom-scrollbar h-full max-h-40">{generateCommand()}</pre>
                                    <button onClick={copyToClipboard} className="absolute top-2 right-2 p-2 bg-zinc-800/70 rounded-md hover:bg-zinc-700/70 transition-colors" title="Copiar Comando">
                                        {copied ? <Icon name="check" className="w-5 h-5 text-green-400" /> : <Icon name="copy" className="w-5 h-5 text-zinc-300" />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'allocations' && isEditing && (
                <div className="space-y-8 animate-[fadeIn_0.3s_ease-in-out]">
                    <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                        <div className="p-6 border-b border-zinc-700/50">
                            <h2 className="text-xl font-bold text-white">Adicionar Novas Alocações</h2>
                            <p className="text-zinc-400 text-sm mt-1">Crie novas portas para este node. Você pode usar um intervalo (ex: 25565-25575) para criar até 10 portas de uma vez.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">IP de Alocação</label>
                                    <input type="text" value={newAllocation.ip} onChange={e => setNewAllocation(p => ({...p, ip: e.target.value}))} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">IP Externo (Opcional)</label>
                                    <input type="text" value={newAllocation.externalIp} onChange={e => setNewAllocation(p => ({...p, externalIp: e.target.value}))} placeholder="node1.ender.me" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Porta(s)</label>
                                    <input type="text" value={newAllocation.ports} onChange={e => setNewAllocation(p => ({...p, ports: e.target.value}))} placeholder="25565 ou 25565-25575" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <button onClick={handleAddAllocations} disabled={isSubmittingAllocations} className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all disabled:bg-teal-800 disabled:cursor-not-allowed">
                                    {isSubmittingAllocations ? <Icon name="refresh" className="w-5 h-5 animate-spin" /> : <Icon name="plus" className="w-5 h-5" />}
                                    {isSubmittingAllocations ? 'Adicionando...' : 'Adicionar'}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                        <div className="p-6 border-b border-zinc-700/50"><h2 className="text-xl font-bold text-white">Alocações Existentes</h2></div>
                        <div className="p-6">
                            {isLoadingAllocations ? <p className="text-zinc-400">Carregando alocações...</p> :
                                allocations.length > 0 ? (
                                    <div className="space-y-2">
                                        {allocations.map(alloc => (
                                            <AllocationRow key={alloc.id} alloc={alloc} onDelete={handleDeleteAllocation} onUpdated={(updated) => setAllocations(prev => prev.map(a => a.id === updated.id ? updated : a))} />
                                        ))}
                                    </div>
                                ) : <p className="text-zinc-500">Nenhuma alocação encontrada para este node.</p>
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Ações do Formulário */}
            <div className="mt-8 border-t border-zinc-700/50 pt-6 flex justify-end gap-4">
                <Link href="/admin/nodes" className="px-5 py-2.5 rounded-lg bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 transition-colors">Cancelar</Link>
                <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-teal-500/50 disabled:bg-teal-800 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSubmitting && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Node')}
                </button>
            </div>

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Confirmar Exclusão"
                message="Tem certeza que deseja deletar este node? Esta ação não pode ser desfeita."
                icon="trash"
                confirmText="Sim, Deletar"
                confirmColor="rose"
            />
        </>
    );
};

export default NodeFormPage;
