"use client";
import React, { useState } from 'react';
import { Icon } from '@/app/pages/clients/ui/Icon';
import type { Allocation } from '../types/NodeType';
import { updateAllocation } from '../api';
import Link from 'next/link';
import { useToast } from '@/app/contexts/ToastContext';

interface AllocationRowProps {
  alloc: Allocation;
  onDelete: (uuid: string) => void;
  onUpdated: (alloc: Allocation) => void;
}

const AllocationRow: React.FC<AllocationRowProps> = ({ alloc, onDelete, onUpdated }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [externalIpDraft, setExternalIpDraft] = useState(alloc.externalIp || '');
  const [saving, setSaving] = useState(false);
  const { addToast } = useToast();

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await updateAllocation(alloc.id, externalIpDraft.trim() === '' ? null : externalIpDraft.trim());
      onUpdated(updated);
      addToast('Alocação atualizada.', 'success');
      setIsEditing(false);
    } catch (e: any) {
      addToast(e.message || 'Falha ao atualizar.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setExternalIpDraft(alloc.externalIp || '');
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-zinc-800/50 p-3 rounded-md text-sm border border-zinc-700/50">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
        <div className="font-mono text-zinc-300 flex items-center gap-1">
          <Icon name="globe" className="w-4 h-4 text-teal-400" />
          <span>{alloc.ip}</span>
        </div>
        <div className="font-mono text-amber-400">:{alloc.port}</div>
        <div className="flex items-center gap-2">
          {isEditing ? (
            <input
              value={externalIpDraft}
              onChange={e => setExternalIpDraft(e.target.value)}
              placeholder="IP/Domínio externo"
              className="w-full bg-zinc-900/60 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          ) : (
            <span className="text-xs text-zinc-300 truncate max-w-[160px]" title={alloc.externalIp || '—'}>
              {alloc.externalIp || '—'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {alloc.assignedToServerId ? (
            <Link href={`/admin/servers/edit/${alloc.assignedToServerId}`} className="text-teal-400 text-xs hover:underline flex items-center gap-1" title="Ver servidor">
              <Icon name="server" className="w-4 h-4" /> {alloc.assignedToServerId.slice(0,8)}
            </Link>
          ) : (
            <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-700/40 text-zinc-400">Livre</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        {isEditing ? (
          <>
            <button onClick={handleSave} disabled={saving} className="px-2 py-1 rounded bg-teal-600 text-white text-xs flex items-center gap-1 disabled:opacity-50">
              {saving ? <Icon name="refresh" className="w-4 h-4 animate-spin" /> : <Icon name="check" className="w-4 h-4" />}
              Salvar
            </button>
            <button onClick={handleCancel} disabled={saving} className="px-2 py-1 rounded bg-zinc-700 text-zinc-300 text-xs flex items-center gap-1">
              <Icon name="x" className="w-4 h-4" />
              Cancelar
            </button>
          </>
        ) : (
          <button onClick={() => setIsEditing(true)} className="p-2 text-zinc-400 hover:text-teal-400" title="Editar IP externo">
            <Icon name="edit" className="w-4 h-4" />
          </button>
        )}
        <button onClick={() => onDelete(alloc.id)} className="p-2 text-zinc-500 hover:text-rose-400" title="Deletar alocação">
            <Icon name="trash" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default AllocationRow;

