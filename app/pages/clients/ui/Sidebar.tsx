'use client';

import React from 'react';
import Link from "next/link";
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import { useUser } from "@/app/contexts/UserContext";

const navLinks = [
    { href: '/', label: 'Início', icon: 'home' },
    { href: '/account', label: 'Conta', icon: 'users' },
];

export const Sidebar = () => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const pathname = usePathname();
    const { user, logout } = useUser();

    React.useEffect(() => {
        const savedState = localStorage.getItem('sidebarExpanded');
        if (savedState !== null) {
            setIsExpanded(JSON.parse(savedState));
        }
    }, []);

    const toggleSidebar = () => {
        const newState = !isExpanded;
        setIsExpanded(newState);
        localStorage.setItem('sidebarExpanded', JSON.stringify(newState));
    };

    return (
        <aside className={`sticky top-0 h-screen bg-zinc-900/30 backdrop-blur-xl flex flex-col transition-all duration-300 ${isExpanded ? 'w-56' : 'w-20'}`}>

            <div className={`flex items-center h-16 px-4 ${isExpanded ? 'justify-end' : 'justify-center'}`}>
                <button onClick={toggleSidebar} className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700/60 hover:text-white transition-colors duration-200">
                    <Icon name={isExpanded ? 'chevronLeft' : 'chevronRight'} className="w-6 h-6" />
                </button>
            </div>

            <div className="flex justify-center items-center pb-4 mx-4 border-b border-zinc-800/50">
                <h1 className="font-bold text-2xl text-white whitespace-nowrap">
                    {isExpanded ? 'Ender' : 'E'}
                </h1>
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
                                ? 'bg-zinc-800/60 text-white font-semibold'
                                : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-white'
                            }`}
                        >
                            <Icon name={link.icon as any} className={`w-6 h-6 flex-shrink-0 ${isActive ? 'text-purple-700' : ''}`} />
                            <span className={`ml-4 transition-opacity whitespace-nowrap duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {user?.admin && (
                <div className="px-4 pb-2">
                    <Link
                        href="/admin"
                        title={!isExpanded ? "Painel do Administrador" : ''}
                        className={`flex items-center py-3 rounded-lg transition-colors duration-200
                            ${isExpanded ? 'px-4' : 'justify-center'}
                            ${pathname.startsWith('/admin')
                            ? 'bg-amber-500/20 text-amber-400 font-semibold'
                            : 'text-zinc-400 hover:bg-zinc-800/40 hover:text-white'
                        }`}
                    >
                        <Icon name="shield" className="w-6 h-6 flex-shrink-0" />
                        <span className={`ml-4 transition-opacity whitespace-nowrap duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>Admin</span>
                    </Link>
                </div>
            )}

            <div className="p-4 mt-auto border-t border-zinc-800/50">
                <div className={`flex items-center p-2 ${!isExpanded && 'justify-center'}`}>
                    <img src={`https://placehold.co/40x40/8200db/0a0a0a?text=${user?.username?.charAt(0).toUpperCase() || 'U'}`} alt="Avatar" className="rounded-full flex-shrink-0" />
                    <div className={`ml-3 overflow-hidden transition-opacity duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>
                        <p className="font-semibold text-white text-sm whitespace-nowrap">{user?.username || 'Usuário'}</p>
                        <p className="text-zinc-400 text-xs whitespace-nowrap">{user?.email || ''}</p>
                    </div>
                </div>
                <button onClick={logout} title={!isExpanded ? "Logout" : ''} className={`w-full flex items-center mt-2 p-3 rounded-lg text-zinc-400 hover:bg-rose-500/20 hover:text-rose-400 transition-colors duration-200 ${!isExpanded && 'justify-center'}`}>
                    <Icon name="logOut" className="w-6 h-6 flex-shrink-0" />
                    <span className={`ml-4 font-semibold transition-opacity whitespace-nowrap duration-200 ${!isExpanded && 'opacity-0 hidden'}`}>Logout</span>
                </button>
            </div>
        </aside>
    );
};