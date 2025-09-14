import {NextRequest, NextResponse} from "next/server";
import getUser from "@/backend/routes/api/userHelper";
import {ServerApi} from "@/backend/libs/Server";
import {Users} from "@/backend/libs/User";
import {Profile} from "@/backend/database/models/ProfileTable";
import {getTables} from "@/backend/database/tables/tables";
import {Cores} from "@/backend/libs/Cores";
import {Nodes} from "@/backend/libs/Nodes";
import mysql from 'mysql2/promise';
import {DatabaseHostsApi} from "@/backend/libs/DatabaseHosts";
import { applyCoreVariableRules } from '@/shared/coreVariableRules';

/**
 * Roteador principal para todas as ações de Servidores.
 * Apenas administradores podem acessar estas rotas.
 */
export async function interpretServersClient(request: NextRequest, params: { [key: string]: string }) {
    const currentUser = await getUser();
    if(!currentUser) {
        return NextResponse.json({ error: 'Acesso negado. Requer autenticação.' }, { status: 401 });
    }
    // Extrai a ação da URL, por exemplo: /api/admin/servers/create -> "create"
    const { action } = params;

    switch (action) {
        case "edit-startup":
            return EditServerStartup(currentUser,request);
        case "edit-name":
            return EditName(currentUser,request);
        case "uuid":
            return GetServerByUuid(currentUser, request);
        case "action":
            return SendAction(currentUser, request);
        case "status":
            return getServerStatus(currentUser, request);
        case "usage":
            return getServerUsage(currentUser, request);
        case "change-allocation":
            return changeAllocation(currentUser, request);
        case "create-database":
            return createDatabase(currentUser, request);
        case "delete-database":
            return deleteDatabase(currentUser, request);
        case "get-all":
        default:
            return GetAllServers(currentUser, request);
    }
}

async function changeAllocation(currentUser: Profile, request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    const body = await request.json();
    try {
        const { action, uuid } = body;
        if (!uuid || !action) {
            return NextResponse.json({ error: 'UUID e ação são obrigatórios.' }, { status: 400 });
        }
        const server = await ServerApi.getServer(uuid);
        if (!server) {
            return NextResponse.json({ error: 'Servidor não encontrado.' }, { status: 404 });
        }
        if(server.ownerId !== currentUser.id && !currentUser.admin) {
            return NextResponse.json({ error: 'Acesso negado. Você não é o proprietário deste servidor.' }, { status: 403 });
        }
        if (action === 'add') {
            const allocationLimit = server.addicionalAllocationsNumbers
            if (allocationLimit && server.additionalAllocationIds && server.additionalAllocationIds.length >= allocationLimit) {
                return NextResponse.json({ error: `Limite de alocações adicionais atingido (${allocationLimit}).` }, { status: 400 });
            }
            const { allocationTable } = await getTables()
            // adicionar alocação aleatoria da node ao servidor
            const allocations = await allocationTable.findByParam("nodeId", server.nodeUuid);
            if (!allocations || allocations.length === 0) {
                return NextResponse.json({ error: 'Nenhuma alocação disponível na node.' }, { status: 400 });
            }
            // filtra alocações que já estão em uso
            const usedAllocations = [server.primaryAllocationId, ...(server.additionalAllocationIds || [])];
            const availableAllocations = allocations.filter(a => !usedAllocations.includes(a.id));
            if (availableAllocations.length === 0) {
                return NextResponse.json({ error: 'Nenhuma alocação disponível para adicionar.' }, { status: 400 });
            }
            // escolhe uma alocação aleatória
            const randomAllocation = availableAllocations[Math.floor(Math.random() * availableAllocations.length)];
            if (!server.additionalAllocationIds) {
                server.additionalAllocationIds = [];
            }
            server.additionalAllocationIds.push(randomAllocation.id);
        } else if (action === 'remove') {
            const { allocationId } = body;
            if (!allocationId) {
                return NextResponse.json({ error: 'O ID de alocação é obrigatório para remover.' }, { status: 400 });
            }
            if (!server.additionalAllocationIds || !server.additionalAllocationIds.includes(allocationId)) {
                return NextResponse.json({ error: 'A alocação não está associada ao servidor.' }, { status: 400 });
            }
            server.additionalAllocationIds = server.additionalAllocationIds.filter(id => id !== allocationId);
        } else {
            return NextResponse.json({ error: 'Ação inválida. Use "add" ou "remove".' }, { status: 400 });
        }
        await server.save();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error changeAllocation:', error);
        return NextResponse.json({ error: error.message || 'Ocorreu um erro interno ao modificar alocação.' }, { status: 400 });
    }
}

async function EditName(currentUser: Profile, request: NextRequest) {
    //copilot implementa
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    try {
        const { uuid, name, description } = await request.json();
        if (!uuid || !name) {
            return NextResponse.json({ error: "O UUID e o nome do servidor são obrigatórios." }, { status: 400 });
        }
        const server = await ServerApi.getServer(uuid);
        if (!server) {
            return NextResponse.json({ error: "Servidor não encontrado." }, { status: 404 });
        }
        if(server.ownerId !== currentUser.id && !currentUser.admin) {
            return NextResponse.json({ error: "Acesso negado. Você não é o proprietário deste servidor." }, { status: 403 });
        }
        server.name = name;
        if(description !== undefined && description !== null) server.description = description
        await server.save();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error EditName:', error);
    }
    return NextResponse.json({ error: 'Erro ao editar nome do servidor.' }, { status: 500 });
}

/**
 * Edita um servidor existente.
 */
async function EditServerStartup(currentUser: Profile, request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    try {
        const { uuid, environment, dockerImage } = await request.json();
        if (!uuid) {
            return NextResponse.json({ error: "O UUID do servidor é obrigatório." }, { status: 400 });
        }
        const server = await ServerApi.getServer(uuid);
        if (!server) {
            return NextResponse.json({ error: "Servidor não encontrado." }, { status: 404 });
        }
        if (server.ownerId !== currentUser.id && !currentUser.admin) {
            return NextResponse.json({ error: "Acesso negado. Você não é o proprietário deste servidor." }, { status: 403 });
        }
        // Se houver environment fornecido, validar contra o core
        if (environment) {
            const core = await Cores.getCore(server.coreId);
            if (!core) {
                return NextResponse.json({ error: 'Core associado não encontrado para validação.' }, { status: 400 });
            }
            const coreJson: any = core.toJSON();
            const variables = coreJson.variables || [];
            const ruleResult = applyCoreVariableRules(variables, environment, 'edit');
            if (!ruleResult.ok) {
                return NextResponse.json({ error: ruleResult.error }, { status: 400 });
            }
            server.environment = ruleResult.env || environment;
        }
        if(dockerImage) {
            server.dockerImage = dockerImage;
        }
        await server.save();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('API Error EditServerStartup:', error);
        return NextResponse.json({ error: error.message || 'Ocorreu um erro interno ao editar o servidor.' }, { status: 400 });
    }
}

/**
 * Busca um único servidor pelo seu UUID.
 */
async function GetServerByUuid(currentUser: Profile,request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }

    try {
        const { uuid } = await request.json();
        if (!uuid) {
            return NextResponse.json({ error: "O UUID do servidor é obrigatório." }, { status: 400 });
        }
        const tables = await getTables()
        const server = await ServerApi.getServer(uuid);
        if (!server) {
            return NextResponse.json({ error: "Servidor não encontrado." }, { status: 404 });
        }
        if(server.ownerId !== currentUser.id && !currentUser.admin) {
            return NextResponse.json({ error: "Acesso negado. Você não é o proprietário deste servidor." }, { status: 403 });
        }

        const owner = (await Users.getUser(server.ownerId))?.toJSON();
        const serverJson = server.toJSON();
        // normaliza status
        // @ts-ignore
        serverJson.status = normalizeStatus(serverJson.status);
        // @ts-ignore
        serverJson.owner = owner ? { uuid: owner.uuid, username: owner.username, email: owner.email, admin: owner.admin } : null;
        // @ts-ignore
        serverJson.primaryAllocation = (await tables.allocationTable.get(server.primaryAllocationId))?.toJSON() || "teste";
        // @ts-ignore
        serverJson.additionalAllocation = serverJson.additionalAllocationIds
            ? await Promise.all(
                serverJson.additionalAllocationIds.map(async (id: string) => {
                    return (await tables.allocationTable.get(id))?.toJSON();
                })
            )
            : [];
        // @ts-ignore
        serverJson.core = (await tables.coreTable.get(server.coreId))?.toJSON()
        const node = await server.getNode();
        if (node) {
            // @ts-ignore
            serverJson.nodeip = node.node.ip
            // @ts-ignore
            serverJson.nodePort = node.node.port
            // @ts-ignore
            serverJson.nodeSftp = node.node.sftp
        }
        // Enriquecer databases com dados do host
        if (Array.isArray(serverJson.databases)) {
            for (const db of serverJson.databases) {
                if (!db.host || !db.port || db.phpmyAdminLink === undefined) {
                    try {
                        const h = await DatabaseHostsApi.get(db.hostId);
                        if (h) {
                            db.host = h.host;
                            // @ts-ignore
                            db.port = h.port;
                            // @ts-ignore
                            db.phpmyAdminLink = h.phpmyAdminLink || '';
                        }
                    } catch {}
                }
            }
        }
        return NextResponse.json(serverJson);

    } catch (error: any) {
        console.error('API Error GetServerByUuid:', error);
        return NextResponse.json({ error: 'Erro ao buscar servidor.' }, { status: 500 });
    }
}


/**
 * Busca e retorna todos os servidores, enriquecendo-os com os dados do proprietário.
 */
async function GetAllServers(currentUser: Profile, request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    const body = await request.json();
    const others = body.others || false;

    try {
        let servers;
        const allServers = await ServerApi.getAllServers();
        if (currentUser.admin && others) {
            // Filtra servidores que não pertencem ao usuário atual
            servers = allServers.filter((server: { ownerId: string; }) => server.ownerId !== currentUser.id);
        } else {
            servers = allServers.filter((server: { ownerId: string; }) => server.ownerId === currentUser.id);
        }
        const tables = await getTables()
        const enrichedServers = await Promise.all(servers.map(async (server: { ownerId: string; toJSON: () => any; getNode: () => Promise<Nodes | null> }) => {
            const owner = (await Users.getUser(server.ownerId))?.toJSON();
            const serverJson = server.toJSON();
            // @ts-ignore
            serverJson.status = normalizeStatus(serverJson.status);
            // @ts-ignore
            serverJson.owner = owner ? {
                uuid: owner.id,
                username: owner.username,
                email: owner.email,
                admin: owner.admin
            } : null;

            // @ts-ignore
            serverJson.primaryAllocation = (await tables.allocationTable.get(server.primaryAllocationId))?.toJSON() || "teste";

            return serverJson;
        }));

        return NextResponse.json(enrichedServers);
    } catch (error: any) {
        console.error('API Error GetAllServers:', error);
        return NextResponse.json({ error: 'Erro ao buscar servidores.' }, { status: 500 });
    }
}

async function SendAction(currentUser: Profile, request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    const body = await request.json();
    const { uuid, action } = body;
    if (!uuid || !action) {
        return NextResponse.json({ error: 'UUID e ação são obrigatórios.' }, { status: 400 });
    }
    // Verifique se o servidor pertence ao usuário ou se o usuário é admin
    const server = await ServerApi.getServer(uuid);
    if (!server) {
        return NextResponse.json({ error: 'Servidor não encontrado.' }, { status: 404 });
    }
    if (server.ownerId !== currentUser.id && !currentUser.admin) {
        return NextResponse.json({ error: 'Acesso negado. Você não é o proprietário deste servidor.' }, { status: 403 });
    }

    // Aqui você implementaria a lógica para enviar a ação ao servidor, por exemplo, iniciar, parar, reiniciar, etc.
    const node = await server.getNode();
    if (!node) {
        return NextResponse.json({ error: 'Node associado ao servidor não encontrado.' }, { status: 404 });
    }
    if((await node.getStatus()).status === "offline") {
        return NextResponse.json({ error: 'O node associado ao servidor está offline.' }, { status: 503 });
    }
    const table = await getTables()
    const data: Record<string, any> = {}
    data["memory"] = server.ram
    data["cpu"] = server.cpu
    data["disk"] = server.disk
    data["environment"] = server.environment
    data["image"] = server.dockerImage
    data["primaryAllocation"] = (await table.allocationTable.get(server.primaryAllocationId))?.toJSON()
    data["additionalAllocation"] = server.additionalAllocationIds
        ? await Promise.all(
            server.additionalAllocationIds.map(async (id: string) => {
                return (await table.allocationTable.get(id))?.toJSON();
            })
        )
        : [];

    const core = await Cores.getCore(server.coreId)
    if(!core) {
        return NextResponse.json({ error: 'Core associado ao servidor não encontrado.' }, { status: 404 });
    }
    if(action === 'start' || action === "restart") {
        data["core"] = core.toJSON()
    } else if(action === 'stop') {
        data["command"] = core.stopCommand
    } else if(action === "command") {
        const { command } = body;
        if(!command) {
            return NextResponse.json({ error: 'O comando é obrigatório para a ação de comando.' }, { status: 400 });
        }
        data["command"] = command
    }

    await node.sendRequest("/api/v1/servers/action", "POST", {
        serverId: server.id,
        action: action,
        userUuid: currentUser.id,
        ...data
    })

    return NextResponse.json({ success: true });
}

async function getServerStatus(currentUser: Profile, request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    const body = await request.json();
    const { uuid } = body;
    if (!uuid) {
        return NextResponse.json({ error: 'UUID é obrigatório.' }, { status: 400 });
    }
    // Verifique se o servidor pertence ao usuário ou se o usuário é admin
    const server = await ServerApi.getServer(uuid);
    if (!server) {
        return NextResponse.json({ error: 'Servidor não encontrado.' }, { status: 404 });
    }
    if (server.ownerId !== currentUser.id && !currentUser.admin) {
        return NextResponse.json({ error: 'Acesso negado. Você não é o proprietário deste servidor.' }, { status: 403 });
    }

    const node = await server.getNode();
    if (!node) {
        return NextResponse.json({error: 'Node associado ao servidor não encontrado.'}, {status: 404});
    }
    if((await node.getStatus()).status === "offline") {
        return NextResponse.json({error: 'O node associado ao servidor está offline.'}, {status: 503});
    }
    const status = await node.sendRequest("/api/v1/server/status", "POST", {
        serverId: server.id
    })
    return NextResponse.json(status);

}

async function getServerUsage(currentUser: Profile, request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    const body = await request.json();
    const { uuid } = body;
    if (!uuid) {
        return NextResponse.json({ error: 'UUID é obrigatório.' }, { status: 400 });
    }

    const server = await ServerApi.getServer(uuid);
    if (!server) {
        return NextResponse.json({ error: 'Servidor não encontrado.' }, { status: 404 });
    }
    if (server.ownerId !== currentUser.id && !currentUser.admin) {
        return NextResponse.json({ error: 'Acesso negado. Você não é o proprietário deste servidor.' }, { status: 403 });
    }

    const node = await server.getNode();
    if (!node) {
        return NextResponse.json({ error: 'Node associado ao servidor não encontrado.' }, { status: 404 });
    }
    if ((await node.getStatus()).status === "offline") {
        return NextResponse.json({ error: 'O node associado ao servidor está offline.' }, { status: 503 });
    }

    try {
        const usageResponse = await node.sendRequest("/api/v1/servers/usage", "POST", {
            serverId: server.id,
            userUuid: currentUser.id
        });
        return NextResponse.json(usageResponse);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Falha ao obter uso do servidor.' }, { status: 500 });
    }
}

async function createDatabase(currentUser: Profile, request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const { uuid, name } = await request.json();
        if (!uuid || !name) {
            return NextResponse.json({ error: 'uuid e name são obrigatórios.' }, { status: 400 });
        }
        const server = await ServerApi.getServer(uuid);
        if (!server) return NextResponse.json({ error: 'Servidor não encontrado.' }, { status: 404 });
        if (server.ownerId !== currentUser.id && !currentUser.admin) {
            return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
        }
        // Limite
        if (server.databasesQuantity && server.databases.length >= server.databasesQuantity) {
            return NextResponse.json({ error: `Limite de databases atingido (${server.databasesQuantity}).` }, { status: 400 });
        }

        // Buscar hosts e escolher o primeiro que conectar
        const hosts = await DatabaseHostsApi.getAll();
        if (!hosts.length) return NextResponse.json({ error: 'Nenhum host de database configurado.' }, { status: 400 });

        let selectedHost: any = null;
        for (const h of hosts) {
            let testConn: mysql.Connection | null = null;
            try {
                testConn = await mysql.createConnection({
                    host: h.host,
                    port: h.port,
                    user: h.username,
                    password: h.password,
                    ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
                    connectTimeout: 4000
                });
                await testConn.query('SELECT 1');
                selectedHost = h; // sucesso
                break;
            } catch (e) {
                // tenta próximo
            } finally { try { await testConn?.end(); } catch {} }
        }
        if (!selectedHost) return NextResponse.json({ error: 'Nenhum host de database respondeu.' }, { status: 503 });

        // Normaliza nome base
        const shortId = server.id.split('-')[0];
        const safeBase = String(name).toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || 'db';
        const dbName = `s${shortId}_${safeBase}`.slice(0, 64);
        const userName = `u${shortId}_${safeBase}`.slice(0, 32);

        if (server.databases.find(d => d.name === dbName)) {
            return NextResponse.json({ error: 'Já existe uma database com esse nome neste servidor.' }, { status: 409 });
        }

        const password = generatePassword(20);

        // Cria DB e usuário no host selecionado
        let conn: mysql.Connection | null = null;
        try {
            conn = await mysql.createConnection({
                host: selectedHost.host,
                port: selectedHost.port,
                user: selectedHost.username,
                password: selectedHost.password,
                ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
                multipleStatements: true,
                connectTimeout: 8000
            });
            await conn.query(`CREATE DATABASE \`${dbName}\``);
            await conn.query(`CREATE USER IF NOT EXISTS '${userName}'@'%' IDENTIFIED BY ?`, [password]);
            await conn.query(`GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${userName}'@'%'`);
            await conn.query('FLUSH PRIVILEGES');
        } catch (e: any) {
            try { if (conn) await conn.query(`DROP DATABASE IF EXISTS \`${dbName}\``); } catch {}
            try { if (conn) await conn.query(`DROP USER IF EXISTS '${userName}'@'%'`); } catch {}
            return NextResponse.json({ error: 'Falha ao provisionar database: ' + (e.message || 'erro desconhecido') }, { status: 500 });
        } finally {
            try { await conn?.end(); } catch {}
        }

        const record = {
            id: dbName,
            hostId: selectedHost.id,
            host: selectedHost.host,
            port: selectedHost.port,
            phpmyAdminLink: selectedHost.phpmyAdminLink || '',
            name: dbName,
            username: userName,
            password: password,
            createdAt: Date.now()
        };
        server.databases = server.databases || [];
        server.databases.push(record as any);
        await server.save();

        const safe = { ...record };
        return NextResponse.json({ success: true, database: safe });
    } catch (e: any) {
        console.error('API Error createDatabase:', e);
        return NextResponse.json({ error: e.message || 'Erro interno ao criar database.' }, { status: 500 });
    }
}

async function deleteDatabase(currentUser: Profile, request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const { uuid, name } = await request.json();
        if (!uuid || !name) return NextResponse.json({ error: 'uuid e name são obrigatórios.' }, { status: 400 });
        const server = await ServerApi.getServer(uuid);
        if (!server) return NextResponse.json({ error: 'Servidor não encontrado.' }, { status: 404 });
        if (server.ownerId !== currentUser.id && !currentUser.admin) {
            return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
        }
        const dbEntry = server.databases?.find(d => d.name === name);
        if (!dbEntry) return NextResponse.json({ error: 'Database não encontrada neste servidor.' }, { status: 404 });

        const host = await DatabaseHostsApi.get(dbEntry.hostId);
        if (!host) return NextResponse.json({ error: 'Host associado não encontrado.' }, { status: 404 });

        let conn: mysql.Connection | null = null;
        try {
            conn = await mysql.createConnection({
                host: host.host,
                port: host.port,
                user: host.username,
                password: host.password,
                ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
                multipleStatements: true,
                connectTimeout: 8000
            });
            await conn.query(`DROP DATABASE IF EXISTS \`${dbEntry.name}\``);
            await conn.query(`DROP USER IF EXISTS '${dbEntry.username}'@'%'`);
            await conn.query('FLUSH PRIVILEGES');
        } catch (e: any) {
            return NextResponse.json({ error: 'Falha ao remover database: ' + (e.message || 'erro desconhecido') }, { status: 500 });
        } finally {
            try { await conn?.end(); } catch {}
        }

        server.databases = server.databases.filter(d => d.name !== name);
        await server.save();
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error('API Error deleteDatabase:', e);
        return NextResponse.json({ error: e.message || 'Erro interno ao deletar database.' }, { status: 500 });
    }
}

function generatePassword(len: number) {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*_-';
    let out = '';
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
}

function normalizeStatus(raw: string): 'running' | 'initializing' | 'stopped' {
    switch (raw) {
        case 'running':
            return 'running';
        case 'installing':
        case 'starting':
            return 'initializing';
        case 'stopped':
        case 'error':
        default:
            return 'stopped';
    }
}
