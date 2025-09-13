'use client';

import React, { useState } from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import { useUser } from "@/app/contexts/UserContext"; // Importa o hook do nosso contexto

// Links de navegação centralizados em um array para fácil manutenção
const navLinks = [
    { href: '/', label: 'Início', icon: 'servers' },
    { href: '/server/1', label: 'Servidores', icon: 'servers' }, // Exemplo de link para servidor
    { href: '/settings', label: 'Configurações', icon: 'settings' },
];

export const Sidebar = () => {
    const [isExpanded, setIsSidebarExpanded] = useState(true);
    const pathname = usePathname();
    const { user, logout } = useUser(); // 1. Puxa os dados e a função de logout do contexto

    return (
        <aside className={`sticky top-0 h-screen bg-zinc-900/20 backdrop-blur-lg flex flex-col transition-all duration-300 ${isExpanded ? 'w-64' : 'w-20'}`}>
            <div className={`flex items-center h-24 px-4 ${isExpanded ? 'justify-between' : 'flex-col justify-center gap-2'}`}>
                <div className={`flex items-center min-w-0 ${!isExpanded && 'w-full justify-center'}`}>
                    <Icon name="dashboard" className="w-9 h-9 text-teal-400 flex-shrink-0" />
                    <span className={`ml-3 text-2xl font-bold text-white whitespace-nowrap transition-opacity duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>Painel</span>
                </div>
                <button onClick={() => setIsSidebarExpanded(!isExpanded)} className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700/60 hover:text-white transition-colors duration-200">
                    <Icon name={isExpanded ? 'chevronLeft' : 'chevronRight'} className="w-6 h-6" />
                </button>
            </div>

            <nav className="flex-grow p-4 space-y-2">
                {navLinks.map((link) => {
                    const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
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
                            <Icon name={link.icon as any} className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-teal-400' : ''}`} />
                            <span className={`ml-4 transition-opacity duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* --- LINK DE ADMIN CONDICIONAL --- */}
            {user?.admin && (
                <div className="px-4 pb-2">
                    <Link
                        href="/admin"
                        title="Painel do Administrador"
                        className={`flex items-center py-3 rounded-lg transition-colors duration-200
                            ${isExpanded ? 'px-4' : 'justify-center'}
                            ${pathname.startsWith('/admin')
                            ? 'bg-amber-500/20 text-amber-400 font-semibold'
                            : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-white'
                        }`}
                    >
                        <Icon name="shield" className="w-6 h-6 flex-shrink-0" />
                        <span className={`ml-4 transition-opacity duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>Admin</span>
                    </Link>
                </div>
            )}

            {/* --- PERFIL E LOGOUT (ATUALIZADO) --- */}
            <div className="p-4 mt-auto border-t border-zinc-800/50">
                <div className="flex items-center p-2">
                    {/* 2. Usa o nome de usuário para gerar a inicial do avatar */}
                    <img src={`https://placehold.co/40x40/14b8a6/0a0a0a?text=${user?.username?.charAt(0).toUpperCase() || 'U'}`} alt="Avatar" className="rounded-full flex-shrink-0" />
                    <div className={`ml-3 overflow-hidden transition-all duration-300 ${isExpanded ? 'opacity-100' : 'opacity-0'}`}>
                        {/* 3. Exibe o nome de usuário e email do contexto */}
                        <p className="font-semibold text-white text-sm whitespace-nowrap">{user?.username || 'Usuário'}</p>
                        <p className="text-zinc-400 text-xs whitespace-nowrap">{user?.email || ''}</p>
                    </div>
                </div>
                {/* 4. O botão de logout agora chama a função do contexto */}
                <button onClick={logout} className={`w-full flex items-center mt-2 p-3 rounded-lg text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors duration-200 ${!isExpanded && 'justify-center'}`}>
                    <Icon name="logOut" className="w-6 h-6 flex-shrink-0" />
                    <span className={`ml-4 font-semibold transition-opacity duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>Logout</span>
                </button>
            </div>
        </aside>
    );
};

