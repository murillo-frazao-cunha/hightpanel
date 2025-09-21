'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon } from './Icon';
import { useUser  } from '@/app/contexts/UserContext';

const navLinks = [
    { href: '/', label: 'Início', icon: 'home' },
    { href: '/account', label: 'Conta', icon: 'users' },
];

export const Sidebar = () => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const pathname = usePathname();
    const { user, logout } = useUser ();

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
        <aside
            className={`sticky top-0 h-screen bg-gradient-to-br from-zinc-950/90 to-zinc-950/85 backdrop-blur-md flex flex-col transition-all duration-300 shadow-lg shadow-black/80 ${
                isExpanded ? 'w-56' : 'w-20'
            }`}
            aria-label="Sidebar navigation"
        >
            {/* Toggle Button */}
            <div className={`flex items-center h-16 px-4 ${isExpanded ? 'justify-end' : 'justify-center'}`}>
                <button
                    onClick={toggleSidebar}
                    className="p-2 rounded-full text-zinc-400 hover:bg-zinc-700/80 hover:text-white transition-colors duration-200 shadow-md shadow-black/70"
                    aria-expanded={isExpanded}
                    aria-label={isExpanded ? 'Fechar sidebar' : 'Abrir sidebar'}
                    type="button"
                >
                    <Icon name={isExpanded ? 'chevronLeft' : 'chevronRight'} className="w-6 h-6" />
                </button>
            </div>

            {/* Logo / Title */}
            <div className="flex justify-center items-center pb-4 mx-4 border-b border-zinc-800/70">
                <h1
                    className="font-extrabold text-3xl text-white whitespace-nowrap select-none drop-shadow-md"
                    title={isExpanded ? 'Ender' : 'E'}
                >
                    {isExpanded ? 'Ender' : 'E'}
                </h1>
            </div>

            {/* Navigation Links */}
            <nav className="flex-grow p-4 space-y-3" role="navigation" aria-label="Main navigation">
                {navLinks.map((link) => {
                    const isActive =
                        pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            title={!isExpanded ? link.label : undefined}
                            className={`flex items-center py-3 rounded-md transition-colors duration-300 select-none shadow-sm ${
                                isExpanded ? 'px-4' : 'justify-center'
                            } ${
                                isActive
                                    ? 'bg-zinc-800/70 text-white font-semibold shadow-lg shadow-black/80'
                                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon
                                name={link.icon as any}
                                className={`w-6 h-6 flex-shrink-0 ${
                                    isActive ? 'text-white' : 'text-zinc-400'
                                }`}
                                aria-hidden="true"
                            />
                            <span
                                className={`ml-4 transition-opacity whitespace-nowrap duration-300 ${
                                    !isExpanded ? 'opacity-0 hidden' : ''
                                }`}
                            >
                                {link.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>

            {/* Admin Link */}
            {user?.admin && (
                <div className="px-4 pb-2">
                    <Link
                        href="/admin"
                        title={!isExpanded ? 'Painel do Administrador' : undefined}
                        className={`flex items-center py-3 rounded-md transition-colors duration-300 select-none shadow-sm ${
                            isExpanded ? 'px-4' : 'justify-center'
                        } ${
                            pathname.startsWith('/admin')
                                ? 'bg-rose-600/70 text-rose-400 font-semibold shadow-lg shadow-black/80'
                                : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-white'
                        }`}
                        aria-current={pathname.startsWith('/admin') ? 'page' : undefined}
                    >
                        <Icon name="shield" className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
                        <span
                            className={`ml-4 transition-opacity whitespace-nowrap duration-300 ${
                                !isExpanded ? 'opacity-0 hidden' : ''
                            }`}
                        >
                            Admin
                        </span>
                    </Link>
                </div>
            )}

            {/* User Info and Logout */}
            <div className="p-4 mt-auto border-t border-zinc-800/70  backdrop-blur-sm rounded-t-md">
                <div className={`flex items-center p-2 rounded-md ${!isExpanded ? 'justify-center' : ''}`}>
                    <img
                        src={`https://placehold.co/40x40/8200db/0a0a0a?text=${
                            user?.username?.charAt(0).toUpperCase() || 'U'
                        }`}
                        alt="Avatar"
                        className="rounded-full flex-shrink-0 shadow-md shadow-black/70"
                        width={40}
                        height={40}
                        loading="lazy"
                    />
                    <div
                        className={`ml-3 overflow-hidden transition-opacity duration-300 ${
                            !isExpanded ? 'opacity-0 hidden' : ''
                        }`}
                    >
                        <p className="font-semibold text-white text-sm whitespace-nowrap select-text drop-shadow-sm">
                            {user?.username || 'Usuário'}
                        </p>
                        <p className="text-zinc-400 text-xs whitespace-nowrap select-text">
                            {user?.email || ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    title={!isExpanded ? 'Logout' : undefined}
                    className={`w-full flex items-center mt-4 p-3 rounded-md text-zinc-400 hover:bg-rose-600/30 hover:text-rose-400 transition-colors duration-300 select-none shadow-sm ${
                        !isExpanded ? 'justify-center' : ''
                    }`}
                    aria-label="Logout"
                    type="button"
                >
                    <Icon name="logOut" className="w-6 h-6 flex-shrink-0" aria-hidden="true" />
                    <span
                        className={`ml-4 font-semibold transition-opacity whitespace-nowrap duration-300 ${
                            !isExpanded ? 'opacity-0 hidden' : ''
                        }`}
                    >
                        Logout
                    </span>
                </button>
            </div>
        </aside>
    );
};