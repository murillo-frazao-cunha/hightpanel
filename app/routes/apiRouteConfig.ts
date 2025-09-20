import { NextRequest, NextResponse } from 'next/server';
import {GetUser} from "@/backend/routes/user/User";
import {GetAllNodes, interpretNodes} from "@/backend/routes/admin/nodes/Node";
import {PageLogin} from "@/app/routes/routeConfig";
import {interpretCores} from "@/backend/routes/admin/cores/Core";
import {interpretUsers} from "@/backend/routes/admin/user/User";
import {interpretServers} from "@/backend/routes/admin/server/Server";
import {interpretNodeHelper} from "@/backend/routes/api/nodes/NodeHelper";
import {interpretServersClient} from "@/backend/routes/servers/ServersClient";
import {interpretDatabaseHosts} from "@/backend/routes/admin/database/DatabaseHosts";
import {interpretServersFileManager} from "@/backend/routes/servers/ServersFileManagerClient";
import {createFirstUser, interpreteIncludesUser} from "@/backend/routes/includes_user";
import { version } from "@/package.json"
import {interpretApi} from "@/backend/routes/admin/api/Api";
import {interpretDomains} from "@/backend/routes/admin/domains/Domains";
// --- TIPOS ---
// Define o formato de uma função que manipula uma rota da API.
type ApiHandler = (
    request: NextRequest,
    params: { [key: string]: string }
) => Promise<NextResponse> | NextResponse;

// Define a estrutura de cada rota da API.
// Em vez de 'component', temos os métodos HTTP (GET, POST, etc.).
export interface ApiRouteConfig {
    pattern: string;
    GET?: ApiHandler;
    POST?: ApiHandler;
    PUT?: ApiHandler;
    DELETE?: ApiHandler;
    // Adicione outros métodos se precisar (PATCH, HEAD, etc.)
}

export const apiRoutes: ApiRouteConfig[] = [
    {
        pattern: '/api/includes_user',
        GET: interpreteIncludesUser
    },
    {
        pattern: '/api/includes_user/create_first_user',
        POST: createFirstUser
    },

    {
        pattern: "/api/nodes/helper/[[action]]",
        GET: interpretNodeHelper,
        POST: interpretNodeHelper
    },
    {
        pattern: '/api/user',
        GET: GetUser
    },
    {
        pattern: '/api/client/servers/filemanager/[[action]]',
        POST: interpretServersFileManager,
        GET: interpretServersFileManager
    },
    {
        pattern: '/api/client/servers/[[action]]',
        POST: interpretServersClient,
        GET: interpretServersClient
    },
    {
        pattern: '/api/admin/nodes/[[action]]',
        GET: interpretNodes,
        POST: interpretNodes
    },
    {
        pattern: '/api/admin/api/[[action]]',
        GET: interpretApi,
        POST: interpretApi
    },
    {
        pattern: '/api/version',
        GET: async () => {
            return NextResponse.json({ version: version });
        }
    },
    {
        pattern: '/api/admin/cores/[[action]]',
        GET: interpretCores,
        POST: interpretCores
    },
    {
        pattern: '/api/admin/users/[[action]]',
        GET: interpretUsers,
        POST: interpretUsers
    },
    {
        pattern: '/api/admin/servers/[[action]]',
        GET: interpretServers,
        POST: interpretServers
    },
    {
        pattern: '/api/admin/database-hosts/[[action]]',
        GET: interpretDatabaseHosts,
        POST: interpretDatabaseHosts
    },
    {
        pattern: '/api/admin/domains/[[action]]',
        GET: interpretDomains,
        POST: interpretDomains
    }
];


// --- FUNÇÃO DE MATCHING (Lógica do Roteador) ---
// Esta função é quase idêntica à das páginas, mas para a API.
export function findMatchingApiRoute(pathname: string) {
    for (const route of apiRoutes) {
        const regexPattern = route.pattern
            .replace(/\/\[\[\.\.\.(\w+)\]\]/g, '(\/(?<$1>.*))?')
            .replace(/\/\[\[(\w+)\]\]/g, '(\/(?<$1>[^/]+))?')
            .replace(/\[(\w+)\]/g, '(?<$1>[^/]+)');

        const regex = new RegExp(`^${regexPattern}/?$`);
        const match = pathname.match(regex);

        if (match) {
            return {
                route,
                params: match.groups || {}
            };
        }
    }
    return null;
}
