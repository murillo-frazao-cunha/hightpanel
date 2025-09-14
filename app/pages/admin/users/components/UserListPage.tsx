'use client';
import React from 'react';
import Link from 'next/link';
import type { User } from '../types/UserType';
import { Icon } from "@/app/pages/clients/ui/Icon";

interface UserListPageProps {
    users: User[];
    onRequestDelete?: (user: User) => void;
    currentUserId?: string;
}

const UserRow = ({ user, onRequestDelete, isSelf }: { user: User; onRequestDelete?: (u: User) => void; isSelf: boolean; }) => {
    // Gera uma cor de fundo com base no UUID do usuário para o avatar
    const bgColor = `hsl(${user.id.charCodeAt(0) % 360}, 50%, 30%)`;

    return (
        <Link href={`/admin/users/edit/${user.id}`} className="block group">
            <div className="flex items-center bg-zinc-900/40 backdrop-blur-2xl rounded-lg p-4 transition-all duration-300 hover:bg-zinc-900/60 hover:ring-2 hover:ring-zinc-700/80">
                {/* Avatar Placeholder */}
                <div className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-xl" style={{ backgroundColor: bgColor }}>
                    {user.username.charAt(0).toUpperCase()}
                </div>

                {/* Informações Principais */}
                <div className="ml-5 flex-grow">
                    <h3 className="text-lg font-bold text-white">{user.username}</h3>
                    <p className="text-zinc-400 text-sm mt-1">{user.email}</p>
                </div>

                {/* Status de Admin */}
                {user.admin && (
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 mx-6" title="Administrador">
                        <Icon name="shield" className="w-4 h-4" />
                        Admin
                    </div>
                )}

                {/* Ações */}
                <div className="ml-auto flex items-center gap-3">
                    {!isSelf && (
                        <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRequestDelete && onRequestDelete(user); }}
                            title="Excluir usuário"
                            className="p-2 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition-colors"
                        >
                            <Icon name="trash" className="w-5 h-5" />
                        </button>
                    )}
                    <Icon name="chevronRight" className="w-6 h-6 text-zinc-600 group-hover:text-white transition-colors" />
                </div>
            </div>
        </Link>
    );
};

const UserListPage: React.FC<UserListPageProps> = ({ users, onRequestDelete, currentUserId }) => {
    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">Gerenciamento de Usuários</h1>
                    <p className="text-zinc-400 mt-1">Visualize e edite os usuários do painel.</p>
                </div>
                <Link href="/admin/users/create" className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-teal-500 text-white font-semibold hover:bg-teal-600 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-teal-500/50">
                    <Icon name="plus" className="w-5 h-5" />
                    Criar Novo Usuário
                </Link>
            </header>

            <div className="flex flex-col gap-4">
                {users.length > 0 ? (
                    users.map(user => (
                        <UserRow key={user.id} user={user} onRequestDelete={onRequestDelete} isSelf={user.id === currentUserId} />
                    ))
                ) : (
                    <div className="text-center py-16 bg-zinc-900/40 rounded-lg border border-dashed border-zinc-700">
                        <p className="text-zinc-400">Nenhum usuário encontrado.</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default UserListPage;
