// app/components/server/ui/ServerNavbar.tsx
import React from 'react';
import Link from 'next/link';
import {useUser} from "@/app/contexts/UserContext";

export const ServerNavbar = ({ serverId, activePage }: { serverId: string, activePage: string }) => {
    const pages = [
        { id: 'console', name: 'Console' },
        { id: 'files', name: 'Arquivos' },
        { id: 'database', name: 'Databases' },
        { id: 'network', name: 'Rede' },
        { id: 'startup',name: 'Inicialização' },
        { id: 'settings', name: 'Configurações' },
    ];
    const {user} = useUser()
    return (
        <div className="mb-6 flex justify-between">
            <nav className="flex space-x-2 bg-zinc-900/30 backdrop-blur-lg p-1 rounded-xl w-fit">
                {pages.map(page => (
                    <Link
                        key={page.id}
                        href={`/server/${serverId}/${page.id}`}
                        className={`py-2 px-4 rounded-lg transition-colors text-sm font-semibold ${activePage === page.id ? 'bg-purple-700 text-white' : 'text-zinc-400 hover:text-white'}`}
                    >
                        {page.name}
                    </Link>
                ))}
                { /* Espaço para caso o usuario for admin, ter um link pra ir até a página editar, mas é um icone de ir até tlgd, n algo escrito */}
                {user?.admin && (
                    <Link
                        key="edit"
                        href={`/admin/servers/edit/${serverId}`}
                        className={`py-2 px-4 rounded-lg transition-colors text-sm font-semibold ${'text-zinc-400 hover:text-white'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 inline-block" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
                        </svg>
                    </Link>
                )}
            </nav>
        </div>
    );
};