'use client';

import React, {useEffect} from 'react';
import {useUser} from '@/app/contexts/UserContext';
import {useRouter} from 'next/navigation';
import {PageLogin} from '@/app/routes/routeConfig';

/**
 * Este componente "guardião" protege as rotas com base no status de login do usuário.
 */
export const RouteGuard = ({ children, requiresLogin }: { children: React.ReactNode, requiresLogin: PageLogin }) => {
    const { user, status } = useUser();
    const router = useRouter();

    useEffect(() => {
        // Ignora a verificação enquanto o status do usuário está sendo carregado
        if (status === 'loading') {
            return;
        }

        if(requiresLogin === PageLogin.ADMIN && user?.admin !== true) {
            console.log("a")
            router.replace('/');
        }

        // Se a rota requer login e o usuário não está logado, redireciona para /login
        if (requiresLogin === PageLogin.LOGGED && !user) {
            router.replace('/login');
            console.log("b")
        }
        console.log(requiresLogin)
        // Se a rota é para usuários não logados (ex: /login) e o usuário já está logado, redireciona para a home
        if (requiresLogin === PageLogin.NOTLOGGED && user) {
            router.replace('/');
            console.log("c")
        }
    }, [user, status, router, requiresLogin]);

    // Mostra um spinner de carregamento enquanto a sessão é verificada
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    // Se as condições de acesso forem atendidas, renderiza a página
    if (
        (requiresLogin === PageLogin.ADMIN && user?.admin) ||
        (requiresLogin === PageLogin.LOGGED && user) ||
        (requiresLogin === PageLogin.NOTLOGGED && !user) ||
        (requiresLogin === PageLogin.ALL)
    ) {
        return <>{children}</>;
    }

    // Retorna null para evitar que a página "pisque" na tela enquanto o redirecionamento acontece
    return null;
};
