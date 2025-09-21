'use client';

import React from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Icon } from '@/app/pages/clients/ui/Icon';
import { useUser  } from "@/app/contexts/UserContext";

// Nova estrutura de dados com categorias
const adminNavItems = [
    {
        category: "Gerenciamento",
        links: [
            { href: '/admin/users', label: 'Usuários', icon: 'users' },
            { href: '/admin/servers', label: 'Servidores', icon: 'servers' },
            { href: "/admin/api", label: "API Keys", icon: "key" },
        ],
    },
    {
        category: "Infraestrutura",
        links: [
            { href: '/admin/nodes', label: 'Nodes', icon: 'nodes' },
            { href: '/admin/cores', label: 'Cores', icon: 'cpu' },
            { href: '/admin/domains', label: 'Domínios', icon: 'globe' },
            { href: '/admin/database-hosts', label: 'DB Hosts', icon: 'database' },
        ],
    },
    {
        category: "Sistema",
        links: [
            { href: '/admin/settings', label: 'Configurações', icon: 'settings' },
        ],
    },
];

export const AdminSidebar = () => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const pathname = usePathname();
    const { user, logout } = useUser ();

    React.useEffect(() => {
        const savedState = localStorage.getItem('adminSidebarExpanded');
        if (savedState !== null) {
            setIsExpanded(JSON.parse(savedState));
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('adminSidebarExpanded', JSON.stringify(newState));
    };

    return (
        <aside
            className={`sticky top-0 h-screen bg-zinc-900/30 backdrop-blur-lg flex flex-col transition-all duration-300 shadow-lg shadow-black/50 ${
                isExpanded ? 'w-64' : 'w-20'
            }`}
            aria-label="Admin Sidebar Navigation"
        >
            {/* Cabeçalho com Título e Toggle */}
            <div className="flex-shrink-0 border-b border-zinc-800/60">
                <div
                    className={`flex items-center h-16 px-4 ${
                        isExpanded ? 'justify-center' : 'justify-center'
                    } relative`}
                >
                    {isExpanded && (
                        <h1
                            className="font-extrabold text-3xl text-purple-400 select-none absolute left-1/2 -translate-x-1/2"
                            aria-label="Admin Panel"
                        >
                            Admin
                        </h1>
                    )}
                    <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700/60 hover:text-white transition-colors duration-200 z-10"
                        aria-label={isExpanded ? 'Fechar sidebar' : 'Abrir sidebar'}
                        type="button"
                    >
                        <Icon
                            name={isExpanded ? 'chevronLeft' : 'chevronRight'}
                            className="w-6 h-6"
                        />
                    </button>
                </div>
            </div>

            {/* Navegação Principal com Scroll Independente */}
            <nav className="flex-grow px-2 py-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-zinc-800/50">
                {adminNavItems.map((item, index) => (
                    <div key={index}>
                        {isExpanded && (
                            <h3 className="px-3 pt-3 pb-1 text-xs font-semibold text-zinc-500 uppercase tracking-wider select-none">
                                {item.category}
                            </h3>
                        )}
                        {item.links.map((link) => {
                            const isActive = pathname.startsWith(link.href);
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    title={!isExpanded ? link.label : undefined}
                                    className={`flex items-center py-2 my-1 rounded-md transition-colors duration-200 ${
                                        isExpanded ? 'px-3' : 'justify-center'
                                    } ${
                                        isActive
                                            ? 'bg-zinc-800/70 text-white font-semibold shadow-md shadow-purple-600'
                                            : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-white'
                                    }`}
                                >
                                    <Icon
                                        name={link.icon as any}
                                        className={`w-5 h-5 flex-shrink-0 ${
                                            isActive ? 'text-purple-400' : ''
                                        }`}
                                    />
                                    <span
                                        className={`ml-3 text-sm transition-opacity duration-200 whitespace-nowrap ${
                                            !isExpanded ? 'opacity-0 hidden' : 'opacity-100'
                                        }`}
                                    >
                                        {link.label}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                ))}
            </nav>

            {/* Rodapé com Links e Perfil */}
            <div className="flex-shrink-0 p-3 border-t border-zinc-800/60 bg-zinc-900/50">
                <Link
                    href="/"
                    title={!isExpanded ? 'Voltar ao Painel' : undefined}
                    className={`flex items-center py-2 my-1 rounded-md transition-colors duration-200 text-zinc-400 hover:bg-zinc-800/40 hover:text-white ${
                        isExpanded ? 'px-3' : 'justify-center'
                    }`}
                >
                    <Icon name="arrowLeft" className="w-5 h-5 flex-shrink-0" />
                    <span
                        className={`ml-3 text-sm font-medium transition-opacity duration-200 whitespace-nowrap ${
                            !isExpanded && 'opacity-0 hidden'
                        }`}
                    >
                        Voltar
                    </span>
                </Link>

                <div
                    className={`flex items-center p-2 mt-3 rounded-md transition-colors duration-300 ${
                        isExpanded ? 'bg-zinc-800/40' : ''
                    }`}
                >
                    <img
                        src={`https://placehold.co/40x40/8b5cf6/0a0a0a?text=${
                            user?.username?.charAt(0).toUpperCase() || 'A'
                        }`}
                        alt="Avatar"
                        className="rounded-full flex-shrink-0 w-9 h-9"
                        loading="lazy"
                    />
                    <div
                        className={`ml-3 overflow-hidden transition-all duration-300 ${
                            isExpanded ? 'w-full opacity-100' : 'w-0 opacity-0'
                        }`}
                    >
                        <p className="font-semibold text-white text-sm whitespace-nowrap select-text">
                            {user?.username || 'Admin'}
                        </p>
                        <p className="text-zinc-400 text-xs whitespace-nowrap select-text">
                            {user?.email || ''}
                        </p>
                    </div>
                </div>

                <button
                    onClick={logout}
                    title={!isExpanded ? 'Logout' : undefined}
                    className={`w-full flex items-center mt-3 p-2 rounded-md text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors duration-200 ${
                        !isExpanded && 'justify-center'
                    }`}
                    type="button"
                >
                    <Icon name="logOut" className="w-5 h-5 flex-shrink-0" />
                    <span
                        className={`ml-3 text-sm font-semibold transition-opacity duration-200 ${
                            !isExpanded && 'opacity-0 hidden'
                        }`}
                    >
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    );
};