'use client';

import React, { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

// --- Tipos ---
// Tipo de usuário baseado na resposta da sua API /api/user
interface CustomUser {
    id: string;
    username: string;
    email: string;
    createdAt: number;
    lastLogin: number;
    admin: boolean;
}

interface UserContextType {
    user: CustomUser | null;
    status: 'loading' | 'authenticated' | 'unauthenticated';
    logout: () => void;
}

// 1. Criação do Contexto
const UserContext = React.createContext<UserContextType | undefined>(undefined);

// 2. Criação do Provedor (Provider)
export const UserProvider = ({ children }: { children: React.ReactNode }) => {
    const { data: session, status } = useSession();
    const [user, setUser] = useState<CustomUser | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const response = await fetch('/api/user');
                if (!response.ok) {
                    throw new Error('Falha ao buscar dados do usuário');
                }
                const userData: CustomUser = await response.json();
                setUser(userData);
            } catch (error) {
                console.error("Erro no UserContext:", error);
                signOut({ callbackUrl: '/login' });
            }
        };

        if (status === 'authenticated') {
            fetchUser();
        }

        if (status === 'unauthenticated') {
            setUser(null);
        }
    }, [status]);

    const logout = () => {
        signOut({ callbackUrl: '/login' });
    };

    const value = { user, status, logout };

    // Mostra um loading geral enquanto a sessão ou os dados do usuário estão sendo carregados
    if (status === 'loading' || (status === 'authenticated' && !user)) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    return (
        <UserContext.Provider value={value}>
            {children}
        </UserContext.Provider>
    );
};

// 3. Hook customizado para facilitar o uso
export const useUser = () => {
    const context = React.useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser deve ser usado dentro de um UserProvider');
    }
    return context;
};
