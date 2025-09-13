import type { Metadata } from 'next';

// Importamos os componentes e metadados como antes
import Home from "@/app/pages/clients/Home";

import ServerContainer from '@/app/pages/clients/server/ServerContainer';
import {LoginPage} from "@/app/pages/clients/account/LoginComponent";

import AdminContainer from "@/app/pages/admin/AdminContainer";
import NodesContainer from "@/app/pages/admin/nodes/NodeContainer";
import CoresContainer from "@/app/pages/admin/cores/CoresContainer";
import ServersContainer from "@/app/pages/admin/server/ServerContainer";
import UsersContainer from "@/app/pages/admin/users/UsersContainer";
import DatabaseHostsContainer from "@/app/pages/admin/database-hosts/DatabaseHostsContainer";

// ATUALIZADO: O enum agora é exportado para ser usado pelo nosso RouteGuard.
export enum PageLogin {
    NOTLOGGED = 'notlogged',
    LOGGED = 'logged',
    ALL = 'all',
    ADMIN = 'admin'
}

export interface RouteConfig {
    pattern: string;
    component: React.ComponentType<any>; // eslint-disable-line
    generateMetadata?: (params: any) => Promise<Metadata> | Metadata;  // eslint-disable-line
    requiresLogin: PageLogin; // Indica se a rota requer autenticação
}

export const routes: RouteConfig[] = [
    {
        // ATUALIZADO: A rota agora usa [[propertie]] para um segmento opcional.
        // Isso vai corresponder a /server/[id] e /server/[id]/[alguma-coisa]
        pattern: '/server/[id]/[[propertie]]',
        component: ServerContainer,
        generateMetadata: undefined,
        requiresLogin: PageLogin.LOGGED // Esta rota requer que o usuário esteja logado
    },
    {
        pattern: "/",
        component: Home,
        generateMetadata: undefined,
        requiresLogin: PageLogin.LOGGED
    },
    {
        pattern: '/login',
        component: LoginPage,
        generateMetadata: undefined,
        requiresLogin: PageLogin.NOTLOGGED
    }
];


export const adminRoutes: RouteConfig[] = [
    {
        pattern: '/admin',
        component: AdminContainer,
        generateMetadata: undefined,
        requiresLogin: PageLogin.ADMIN
    },
    {
        pattern: '/admin/nodes/[[action]]/[[id]]', // action pode ser 'create' ou 'edit', id é o uuid do node
        component: NodesContainer,
        generateMetadata: undefined,
        requiresLogin: PageLogin.ADMIN
    },
    {
        pattern: '/admin/cores/[[action]]/[[id]]', // action pode ser 'create' ou 'edit', id é o uuid do core
        component: CoresContainer,
        generateMetadata: undefined,
        requiresLogin: PageLogin.ADMIN
    },
    {
        pattern: '/admin/servers/[[action]]/[[id]]', // action pode ser 'create' ou 'edit', id é o uuid do server
        component: ServersContainer,
        generateMetadata: undefined,
        requiresLogin: PageLogin.ADMIN
    },
    {
        pattern: '/admin/users/[[action]]/[[id]]', // action pode ser 'create' ou 'edit', id é o uuid do user
        component: UsersContainer, // Substitua pelo componente correto de usuários quando disponível
        generateMetadata: undefined,
        requiresLogin: PageLogin.ADMIN
    },
    {
        pattern: '/admin/database-hosts/[[action]]/[[id]]',
        component: DatabaseHostsContainer,
        generateMetadata: undefined,
        requiresLogin: PageLogin.ADMIN
    }
]

// ATUALIZADO: Combinamos as rotas normais e de admin em um único array.
const allRoutes = [...routes, ...adminRoutes];

/**
 * Encontra a rota correspondente e extrai os parâmetros da URL.
 * @param pathname O caminho da URL (ex: "/server/123/settings" ou "/admin/").
 * @returns Um objeto com a rota e os parâmetros, ou null se não encontrar.
 */
export function findMatchingRoute(pathname: string) {
    // Agora a função itera sobre todas as rotas combinadas.
    for (const route of allRoutes) {
        // O componente pode ser undefined, então precisamos tratar isso.
        if (!route.pattern) continue;

        const regexPattern = route.pattern
            // Converte a sintaxe de catch-all opcional /[[...slug]]
            .replace(/\/\[\[\.\.\.(\w+)\]\]/g, '(\/(?<$1>.*))?')

            // NOVO: Converte a sintaxe de slug opcional /[[slug]] em regex
            .replace(/\/\[\[(\w+)\]\]/g, '(\/(?<$1>[^/]+))?')

            // Converte [slug] para um grupo de captura que não aceita barras.
            .replace(/\[(\w+)\]/g, '(?<$1>[^/]+)');

        // Compila a regex para corresponder ao caminho completo.
        const regex = new RegExp(`^${regexPattern}/?$`);
        const match = pathname.match(regex);

        if (match) {
            return {
                route,
                // Retorna os grupos nomeados da regex como parâmetros.
                params: match.groups || {}
            };
        }
    }
    return null;
}
