'use client';

import React from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Icon } from '@/app/pages/clients/ui/Icon';
import { useUser } from "@/app/contexts/UserContext";

const adminNavLinks = [
    { href: '/admin/nodes', label: 'Nodes', icon: 'nodes' },
    { href: '/admin/servers', label: 'Servidores', icon: 'servers' },
    { href: '/admin/users', label: 'Usuários', icon: 'users' },
    { href: '/admin/cores', label: 'Cores', icon: 'globe' },
    { href: '/admin/database-hosts', label: 'DB Hosts', icon: 'database' },
    { href: '/admin/settings', label: 'Configurações', icon: 'settings' },
];

export const AdminSidebar = () => {
    // 1. Estado inicia como 'false' (minimizado).
    const [isExpanded, setIsExpanded] = React.useState(false);
    const pathname = usePathname();
    const { user, logout } = useUser();

    // 2. Efeito para carregar e salvar o estado no localStorage.
    React.useEffect(() => {
        const savedState = localStorage.getItem('adminSidebarExpanded');
        if (savedState !== null) {
            setIsExpanded(JSON.parse(savedState));
        }
    }, []);

    // Função para alternar o estado e salvar a preferência.
    const toggleSidebar = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('adminSidebarExpanded', JSON.stringify(newState));
    };

    return (
        // 3. Largura maximizada diminuída para w-56.
        <aside className={`sticky top-0 h-screen bg-zinc-900/20 backdrop-blur-lg flex flex-col transition-all duration-300 ${isExpanded ? 'w-56' : 'w-20'}`}>

            {/* 4. Botão de expandir/recolher no topo. */}
            <div className={`flex items-center h-16 px-4 ${isExpanded ? 'justify-end' : 'justify-center'}`}>
                <button onClick={toggleSidebar} className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700/60 hover:text-white transition-colors duration-200">
                    <Icon name={isExpanded ? 'chevronLeft' : 'chevronRight'} className="w-6 h-6" />
                </button>
            </div>

            {/* 5. Novo cabeçalho limpo com o nome do painel. */}
            <div className="flex justify-center items-center pb-4 mx-4 border-b border-zinc-800/50">
                <h1 className="font-bold text-2xl text-amber-400 whitespace-nowrap">
                    {isExpanded ? 'Admin' : 'A'}
                </h1>
            </div>

            <nav className="flex-grow px-4 pt-4 space-y-2">
                {adminNavLinks.map((link) => {
                    const isActive = pathname.startsWith(link.href);
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            title={!isExpanded ? link.label : ''}
                            className={`flex items-center py-3 rounded-lg transition-colors duration-200
                                ${isExpanded ? 'px-4' : 'justify-center'}
                                ${isActive
                                ? 'bg-zinc-800/50 text-white font-semibold'
                                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-white'
                            }`}
                        >
                            <Icon name={link.icon as any} className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-amber-400' : ''}`} />
                            <span className={`ml-4 transition-opacity duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="px-4 pb-2">
                <Link
                    href="/"
                    title={!isExpanded ? "Voltar ao Painel Principal" : ''}
                    className={`flex items-center py-3 rounded-lg transition-colors duration-200 text-zinc-400 hover:bg-zinc-800/40 hover:text-white ${isExpanded ? 'px-4' : 'justify-center'}`}
                >
                    <Icon name="arrowLeft" className="w-6 h-6 flex-shrink-0" />
                    <span className={`ml-4 transition-opacity duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>Voltar</span>
                </Link>
            </div>

            <div className="p-4 mt-auto border-t border-zinc-800/50">
                <div className={`flex items-center p-2 ${!isExpanded && 'justify-center'}`}>
                    <img src={`https://placehold.co/40x40/facc15/0a0a0a?text=${user?.username?.charAt(0).toUpperCase() || 'A'}`} alt="Avatar" className="rounded-full flex-shrink-0" />
                    <div className={`ml-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                        <p className="font-semibold text-white text-sm whitespace-nowrap">{user?.username || 'Admin'}</p>
                        <p className="text-zinc-400 text-xs whitespace-nowrap">{user?.email || ''}</p>
                    </div>
                </div>
                <button onClick={logout} title={!isExpanded ? "Logout" : ''} className={`w-full flex items-center mt-2 p-3 rounded-lg text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors duration-200 ${!isExpanded && 'justify-center'}`}>
                    <Icon name="logOut" className="w-6 h-6 flex-shrink-0" />
                    <span className={`ml-4 font-semibold transition-opacity duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>Logout</span>
                </button>
            </div>
        </aside>
    );
};