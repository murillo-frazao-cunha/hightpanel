'use client';
import React from 'react';
import Link from 'next/link';
import type { DatabaseHost } from '../types/DatabaseHostType';
import { Icon } from '@/app/pages/clients/ui/Icon';

interface DatabaseHostListPageProps {
  hosts: DatabaseHost[];
  onDelete: (uuid: string) => void;
}

const HostRow = ({ host, onDelete }: { host: DatabaseHost; onDelete: (uuid: string) => void }) => {
  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (host.id) onDelete(host.id);
  };
  return (
    <Link href={`/admin/database-hosts/edit/${host.id}`} className="block group">
      <div className="flex items-center bg-zinc-900/40 backdrop-blur-2xl rounded-lg p-4 transition-all duration-300 hover:bg-zinc-900/60 hover:ring-2 hover:ring-zinc-700/80">
        <div className="bg-zinc-800/50 p-3 rounded-lg">
          <Icon name="database" className="w-6 h-6 text-teal-400" />
        </div>
        <div className="ml-5 flex-grow min-w-0">
          <h3 className="text-lg font-bold text-white truncate">{host.name}</h3>
          <p className="text-zinc-400 text-sm mt-1 truncate">{host.host}:{host.port} • {host.username}</p>
          {host.phpmyAdminLink && <p className="text-xs text-zinc-500 truncate">phpMyAdmin: {host.phpmyAdminLink}</p>}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={handleDeleteClick} className="p-2 text-zinc-400 hover:text-rose-400 transition-colors" title="Deletar Host">
            <Icon name="trash" className="w-5 h-5" />
          </button>
          <Icon name="chevronRight" className="w-6 h-6 text-zinc-600 group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
};

const DatabaseHostListPage: React.FC<DatabaseHostListPageProps> = ({ hosts, onDelete }) => {
  return (
    <>
      <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-white">Hosts de Databases</h1>
          <p className="text-zinc-400 mt-1">Gerencie conexões MySQL utilizadas para provisionar databases.</p>
        </div>
        <Link href="/admin/database-hosts/create" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-teal-500/50">
          <Icon name="plus" className="w-5 h-5" />
          Novo Host
        </Link>
      </header>
      <div className="flex flex-col gap-4">
        {hosts.length > 0 ? (
          hosts.map(h => <HostRow key={h.id} host={h} onDelete={onDelete} />)
        ) : (
          <div className="text-center py-16 bg-zinc-900/40 rounded-lg border border-dashed border-zinc-700">
            <p className="text-zinc-400">Nenhum host cadastrado.</p>
            <p className="text-zinc-500 text-sm mt-2">Clique em "Novo Host" para adicionar.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default DatabaseHostListPage;

