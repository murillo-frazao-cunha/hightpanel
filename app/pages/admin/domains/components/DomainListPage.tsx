'use client';
import React from 'react';
import Link from 'next/link';
import type { Domain } from '../types/DomainType';
import { Icon } from '@/app/pages/clients/ui/Icon';

interface DomainListPageProps {
  domains: Domain[];
  onDelete: (uuid: string) => void;
}

const maskToken = (token?: string) => {
  if (!token) return '—';
  if (token.length <= 6) return '••••••';
  return token.slice(0, 3) + '••••' + token.slice(-3);
};

const DomainRow = ({ domain, onDelete }: { domain: Domain; onDelete: (uuid: string) => void }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (domain.id) onDelete(domain.id);
  };
  return (
    <Link href={`/admin/domains/edit/${domain.id}`} className="block group">
      <div className="flex items-center bg-zinc-900/40 backdrop-blur-2xl rounded-lg p-4 transition-all duration-300 hover:bg-zinc-900/60 hover:ring-2 hover:ring-zinc-700/80">
        <div className="bg-zinc-800/50 p-3 rounded-lg">
          <Icon name="globe" className="w-6 h-6 text-purple-400" />
        </div>
        <div className="ml-5 flex-grow min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{domain.domainName}</h3>
          <p className="text-zinc-400 text-sm mt-1 truncate">Zone ID: {domain.zoneId}</p>
          <p className="text-xs text-zinc-500 truncate">Token: {maskToken(domain.ownerToken)}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleDeleteClick} className="p-2 text-zinc-400 hover:text-rose-400 transition-colors" title="Deletar Domínio">
            <Icon name="trash" className="w-5 h-5" />
          </button>
          <Icon name="chevronRight" className="w-6 h-6 text-zinc-600 group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
};

const DomainListPage: React.FC<DomainListPageProps> = ({ domains, onDelete }) => {
  return (
    <>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Domínios</h1>
          <p className="text-zinc-400 mt-1">Gerencie domínios e credenciais para provisão DNS.</p>
        </div>
        <Link href="/admin/domains/create" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-purple-500/50">
          <Icon name="plus" className="w-5 h-5" />
          Novo Domínio
        </Link>
      </header>
      <div className="flex flex-col gap-4">
        {domains.length > 0 ? (
          domains.map(d => <DomainRow key={d.id} domain={d} onDelete={onDelete} />)
        ) : (
          <div className="text-center py-16 bg-zinc-900/40 rounded-lg border border-dashed border-zinc-700">
            <p className="text-zinc-400">Nenhum domínio cadastrado.</p>
            <p className="text-zinc-500 text-sm mt-2">Clique em "Novo Domínio" para adicionar.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default DomainListPage;

