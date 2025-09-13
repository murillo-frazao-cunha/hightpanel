'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/app/pages/clients/ui/Icon';
import type { User } from '../types/UserType';

interface UserFormPageProps {
    user?: User | null;
    onSave: (user: Omit<User, 'id'>) => Promise<void>;
    isSubmitting: boolean;
}

const UserFormPage: React.FC<UserFormPageProps> = ({ user, onSave, isSubmitting }) => {
    const [formData, setFormData] = useState<Partial<User>>({});
    const isEditing = !!user;

    useEffect(() => {
        if (isEditing) {
            setFormData({ ...user });
        } else {
            // Valores padrão para um novo usuário
            setFormData({
                username: '',
                email: '',
                admin: false,
            });
        }
    }, [user, isEditing]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleSave = async () => {
        if (isSubmitting) return;
        // Validação simples
        if (!formData.username || !formData.email) {
            alert('Nome de usuário e e-mail são obrigatórios.');
            return;
        }
        await onSave(formData as User);
    };

    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">{isEditing ? 'Editando Usuário' : 'Criar Novo Usuário'}</h1>
                    <p className="text-zinc-400 mt-1">{isEditing ? `Modificando "${formData.username}"` : 'Preencha os detalhes para o novo usuário.'}</p>
                </div>
            </header>

            <div className="space-y-8">
                {/* Painel de Informações do Usuário */}
                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50">
                        <h2 className="text-xl font-bold text-white">Informações do Usuário</h2>
                        <p className="text-zinc-400 text-sm mt-1">Dados de identificação e acesso.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="username" className="block text-sm font-medium text-zinc-400 mb-2">Nome de Usuário</label>
                            <input id="username" type="text" name="username" value={formData.username || ''} onChange={handleChange} placeholder="ex: fulano.silva" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-2">Endereço de E-mail</label>
                            <input id="email" type="email" name="email" value={formData.email || ''} onChange={handleChange} placeholder="ex: fulano@provedor.com" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none transition-all" />
                        </div>
                    </div>
                </div>

                {/* Painel de Permissões */}
                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-white">Permissão de Administrador</h3>
                            <p className="text-zinc-400 text-sm">Concede acesso total ao painel de administração.</p>
                        </div>
                        <label htmlFor="admin" className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" id="admin" name="admin" checked={formData.admin || false} onChange={handleChange} className="sr-only peer" />
                            <div className="w-11 h-6 bg-zinc-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-teal-500/50 peer-checked:bg-teal-600 after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all after:peer-checked:translate-x-full after:peer-checked:border-white"></div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Ações do Formulário */}
            <div className="mt-8 border-t border-zinc-700/50 pt-6 flex justify-end gap-4">
                <Link href="/admin/users" className="px-5 py-2.5 rounded-lg bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 transition-colors">Cancelar</Link>
                <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-teal-500/50 disabled:bg-teal-800 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2"
                >
                    {isSubmitting && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Usuário')}
                </button>
            </div>
        </>
    );
};

export default UserFormPage;
