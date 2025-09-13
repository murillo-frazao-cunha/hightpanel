'use client';
import React, { useEffect, useState } from 'react';
import type { DatabaseHost } from '../types/DatabaseHostType';
import { Icon } from '@/app/pages/clients/ui/Icon';
import Link from 'next/link';

interface Props {
  host?: DatabaseHost | null;
  onSave: (data: DatabaseHost) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
}

const DatabaseHostFormPage: React.FC<Props> = ({ host, onSave, isSubmitting, error, clearError }) => {
  const isEditing = !!host?.id;
  const [formData, setFormData] = useState<DatabaseHost>({
    id: host?.id,
    name: host?.name || '',
    host: host?.host || '',
    port: host?.port || 3306,
    username: host?.username || '',
    password: '', // não carregamos a senha existente
    phpmyAdminLink: host?.phpmyAdminLink || ''
  });

  useEffect(() => {
    if (host) {
      setFormData({
        id: host.id,
        name: host.name,
        host: host.host,
        port: host.port,
        username: host.username,
        password: '',
        phpmyAdminLink: host.phpmyAdminLink || ''
      });
    }
  }, [host]);

  const handleChange = (field: keyof DatabaseHost, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    if (!formData.name || !formData.host || !formData.username || !formData.port) {
      alert('Preencha todos os campos obrigatórios.');
      return;
    }
    await onSave(formData);
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white">{isEditing ? 'Editar Host de Database' : 'Novo Host de Database'}</h1>
        <p className="text-zinc-400 mt-1">{isEditing ? `Alterando "${host?.name}"` : 'Configure os dados de conexão MySQL.'}</p>
      </header>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-lg flex justify-between items-center mb-6 animate-pulse-slow">
          <div className="flex items-center gap-3"><Icon name="alert-triangle" className="w-5 h-5 flex-shrink-0" /><p className="text-sm font-medium">{error}</p></div>
          <button onClick={clearError} className="p-1 rounded-full hover:bg-rose-500/20 transition-colors"><Icon name="x" className="w-5 h-5" /></button>
        </div>
      )}

      <div className="space-y-8">
        <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
          <div className="p-6 border-b border-zinc-700/50">
            <h2 className="text-xl font-bold text-white">Conexão</h2>
            <p className="text-zinc-400 text-sm mt-1">Credenciais para acessar o servidor MySQL.</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Nome*</label>
              <input value={formData.name} onChange={e => handleChange('name', e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Host*</label>
              <input value={formData.host} onChange={e => handleChange('host', e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Porta*</label>
              <input type="number" value={formData.port} onChange={e => handleChange('port', e.target.valueAsNumber)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Usuário*</label>
              <input value={formData.username} onChange={e => handleChange('username', e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Senha {isEditing && <span className="text-xs text-zinc-500">(deixe vazio para manter)</span>}</label>
              <input type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Link phpMyAdmin (opcional)</label>
              <input value={formData.phpmyAdminLink} onChange={e => handleChange('phpmyAdminLink', e.target.value)} placeholder="https://panel.exemplo.com/phpmyadmin" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-zinc-700/50 pt-6 flex justify-end gap-4">
        <Link href="/admin/database-hosts" className="px-5 py-2.5 rounded-lg bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 transition-colors">Cancelar</Link>
        <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-teal-500/50 disabled:bg-teal-800 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2">
          {isSubmitting && <Icon name="loader" className="w-5 h-5 animate-spin" />}
          {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Host')}
        </button>
      </div>
    </>
  );
};

export default DatabaseHostFormPage;

