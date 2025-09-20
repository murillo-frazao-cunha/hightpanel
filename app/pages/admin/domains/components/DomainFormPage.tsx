'use client';
import React, { useEffect, useState } from 'react';
import type { Domain } from '../types/DomainType';
import { Icon } from '@/app/pages/clients/ui/Icon';
import Link from 'next/link';

interface Props {
  domain?: Domain | null;
  onSave: (data: Domain) => Promise<void>;
  isSubmitting: boolean;
  error: string | null;
  clearError: () => void;
}

const DomainFormPage: React.FC<Props> = ({ domain, onSave, isSubmitting, error, clearError }) => {
  const isEditing = !!domain?.id;
  const [formData, setFormData] = useState<Domain>({
    id: domain?.id || '',
    domainName: domain?.domainName || '',
    zoneId: domain?.zoneId || '',
    ownerToken: '' // não carregamos o token existente por segurança
  });

  useEffect(() => {
    if (domain) {
      setFormData({
        id: domain.id,
        domainName: domain.domainName,
        zoneId: domain.zoneId,
        ownerToken: ''
      });
    }
  }, [domain]);

  const handleChange = (field: keyof Domain, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (isSubmitting) return;
    if (!formData.domainName || !formData.zoneId || (!isEditing && !formData.ownerToken)) {
      alert('Preencha os campos obrigatórios.');
      return;
    }
    await onSave(formData);
  };

  return (
    <>
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-white">{isEditing ? 'Editar Domínio' : 'Novo Domínio'}</h1>
        <p className="text-zinc-400 mt-1">{isEditing ? `Alterando \"${domain?.domainName}\"` : 'Configure domínio e credenciais para Cloudflare.'}</p>
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
            <h2 className="text-xl font-bold text-white">Domínio</h2>
            <p className="text-zinc-400 text-sm mt-1">Dados necessários para provisionamento DNS.</p>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Domain*</label>
              <input value={formData.domainName} onChange={e => handleChange('domainName', e.target.value)} placeholder="ex: exemplo.com" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-2">Zone ID*</label>
              <input value={formData.zoneId} onChange={e => handleChange('zoneId', e.target.value)} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-zinc-400 mb-2">Owner Token {isEditing && <span className="text-xs text-zinc-500">(deixe vazio para manter)</span>}</label>
              <input type="password" value={formData.ownerToken} onChange={e => handleChange('ownerToken', e.target.value)} placeholder={isEditing ? '• • • • • • • • • •' : ''} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-zinc-700/50 pt-6 flex justify-end gap-4">
        <Link href="/admin/domains" className="px-5 py-2.5 rounded-lg bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 transition-colors">Cancelar</Link>
        <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-purple-500/50 disabled:bg-purple-800 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2">
          {isSubmitting && <Icon name="loader" className="w-5 h-5 animate-spin" />}
          {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Domínio')}
        </button>
      </div>
    </>
  );
};

export default DomainFormPage;

