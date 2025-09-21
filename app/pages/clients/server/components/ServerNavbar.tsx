// app/components/server/ui/ServerNavbar.tsx
import React from 'react';
import Link from 'next/link';
import { useUser  } from "@/app/contexts/UserContext";
import { motion } from "framer-motion";

export const ServerNavbar = ({ serverId, activePage }: { serverId: string; activePage: string }) => {
    const pages = [
        { id: 'console', name: 'Console' },
        { id: 'files', name: 'Arquivos' },
        { id: 'database', name: 'Databases' },
        { id: 'network', name: 'Rede' },
        { id: 'subdomain', name: 'Subdomínio' },
        { id: 'startup', name: 'Inicialização' },
        { id: 'settings', name: 'Configurações' },
    ];
    const { user } = useUser ();

    return (
        <div className="mb-8 flex justify-between items-center">
            <nav className="flex space-x-3 bg-zinc-900/40 backdrop-blur-xl rounded-2xl p-1 shadow-md shadow-black/30 border border-zinc-700/40">
                {pages.map(page => (
                    <Link
                        key={page.id}
                        href={`/server/${serverId}/${page.id}`}
                        className={`relative py-2 px-5 rounded-xl text-sm font-semibold transition-colors select-none
                            ${
                            activePage === page.id
                                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-lg shadow-purple-500/40'
                                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
                        }
                        `}
                        aria-current={activePage === page.id ? 'page' : undefined}
                    >
                        {page.name}
                        {activePage === page.id && (
                            <motion.span
                                layoutId="server-navbar-active-indicator"
                                className="absolute inset-0 rounded-xl bg-purple-700/30 pointer-events-none"
                                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                        )}
                    </Link>
                ))}
                {user?.admin && (
                    <Link
                        key="edit"
                        href={`/admin/servers/edit/${serverId}`}
                        className="ml-2 p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition-colors shadow-md shadow-black/20"
                        title="Editar servidor (Admin)"
                        aria-label="Editar servidor (Admin)"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-6 w-6"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                        >
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                            <path
                                fillRule="evenodd"
                                d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </Link>
                )}
            </nav>
        </div>
    );
};