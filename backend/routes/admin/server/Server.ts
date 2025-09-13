import {NextRequest, NextResponse} from "next/server";
import getUser from "@/backend/routes/api/userHelper";
import {ServerApi} from "@/backend/libs/Server";
import {Users} from "@/backend/libs/User";
import {Cores} from "@/backend/libs/Cores";
import { applyCoreVariableRules } from '@/shared/coreVariableRules';

/**
 * Roteador principal para todas as ações de Servidores.
 * Apenas administradores podem acessar estas rotas.
 */
export async function interpretServers(request: NextRequest, params: { [key: string]: string }) {
    const currentUser = await getUser();
    if (!currentUser || !currentUser.admin) {
        return NextResponse.json({ error: 'Acesso negado. Requer permissão de administrador.' }, { status: 403 });
    }

    // Extrai a ação da URL, por exemplo: /api/admin/servers/create -> "create"
    const action = request.nextUrl.pathname.split('/').pop();

    switch (action) {
        case "create":
            return CreateServer(request, currentUser);

        case "delete":
            return DeleteServer(request, currentUser);

        case "edit":
            return EditServer(request);

        case "uuid":
            return GetServerByUuid(request);

        case "get-all":
        default:
            return GetAllServers();
    }
}

/**
 * Cria um novo servidor a partir dos dados da requisição.
 */
async function CreateServer(request: NextRequest, creator: any) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }

    try {
        const body = await request.json();
        // Validação expandida para incluir mais campos do ServerData
        const requiredFields = ['name', 'description', 'ram', 'cpu', 'disk', 'environment', 'nodeUuid', 'primaryAllocationId', 'coreId', 'dockerImage', 'owner'];
        for (const field of requiredFields) {
            if (body[field] === undefined) {
                return NextResponse.json({ error: `O campo obrigatório '${field}' não foi fornecido.` }, { status: 400 });
            }
        }
        // Validar regras das variáveis do Core
        const core = await Cores.getCore(body.coreId);
        if (!core) return NextResponse.json({ error: 'Core não encontrado para validação de variáveis.' }, { status: 400 });
        const ruleResult = applyCoreVariableRules(core.variables || [], body.environment, 'create');
        if (!ruleResult.ok) {
            return NextResponse.json({ error: ruleResult.error }, { status: 400 });
        }
        body.environment = ruleResult.env;

        // Campos opcionais com default
        if (body.databasesQuantity === undefined) body.databasesQuantity = 0;
        if (body.addicionalAllocationsNumbers === undefined) body.addicionalAllocationsNumbers = 0;

        const newServer = await ServerApi.createServer(creator, body);
        return NextResponse.json(newServer.toJSON(), { status: 201 });

    } catch (error: any) {
        console.error('API Error CreateServer:', error);
        return NextResponse.json({ error: error.message || 'Ocorreu um erro interno ao criar o servidor.' }, { status: 400 });
    }
}

async function DeleteServer(request: NextRequest, creator: any) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }

    try {
        const { uuid } = await request.json();
        if (!uuid) {
            return NextResponse.json({ error: "O UUID do servidor é obrigatório para a exclusão." }, { status: 400 });
        }

        await ServerApi.deleteServer(creator, uuid);
        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('API Error DeleteServer:', error);
        return NextResponse.json({ error: error.message || 'Ocorreu um erro interno ao deletar o servidor.' }, { status: 400 });
    }
}

/**
 * Edita um servidor existente.
 */
async function EditServer(request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { id, environment, coreId, ...updateData } = body;

        if (!id) {
            return NextResponse.json({ error: "O UUID do servidor é obrigatório para a edição." }, { status: 400 });
        }

        // Carregar servidor existente para obter coreId original se não foi alterado
        const existing = await ServerApi.getServer(id);
        if (!existing) return NextResponse.json({ error: 'Servidor não encontrado.' }, { status: 404 });
        const effectiveCoreId = coreId || existing.coreId;
        const core = await Cores.getCore(effectiveCoreId);
        if (!core) return NextResponse.json({ error: 'Core não encontrado para validação.' }, { status: 400 });

        if (environment) {
            const ruleResult = applyCoreVariableRules(core.variables || [], environment, 'edit');
            if (!ruleResult.ok) {
                return NextResponse.json({ error: ruleResult.error }, { status: 400 });
            }
            updateData.environment = ruleResult.env;
        }
        if (coreId) updateData.coreId = coreId; // permitir troca de core (opcional)

        const updatedServer = await ServerApi.updateServer(id, updateData);
        return NextResponse.json(updatedServer.toJSON());

    } catch (error: any) {
        console.error('API Error EditServer:', error);
        return NextResponse.json({ error: error.message || 'Ocorreu um erro interno ao editar o servidor.' }, { status: 400 });
    }
}

/**
 * Busca um único servidor pelo seu UUID.
 */
async function GetServerByUuid(request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }

    try {
        const { uuid } = await request.json();
        if (!uuid) {
            return NextResponse.json({ error: "O UUID do servidor é obrigatório." }, { status: 400 });
        }

        const server = await ServerApi.getServer(uuid);
        if (!server) {
            return NextResponse.json({ error: "Servidor não encontrado." }, { status: 404 });
        }

        const owner = (await Users.getUser(server.ownerId))?.toJSON();
        const serverJson = server.toJSON();
        // Defaults para compatibilidade com servidores antigos
        if (serverJson.databasesQuantity === undefined) serverJson.databasesQuantity = 0;
        if (serverJson.addicionalAllocationsNumbers === undefined) serverJson.addicionalAllocationsNumbers = 0;
        // @ts-ignore
        serverJson.owner = owner ? { uuid: owner.uuid, username: owner.username, email: owner.email, admin: owner.admin } : null;

        return NextResponse.json(serverJson);

    } catch (error: any) {
        console.error('API Error GetServerByUuid:', error);
        return NextResponse.json({ error: 'Erro ao buscar servidor.' }, { status: 500 });
    }
}


/**
 * Busca e retorna todos os servidores, enriquecendo-os com os dados do proprietário.
 */
async function GetAllServers() {
    try {
        const servers = await ServerApi.getAllServers();
        const serversWithOwners = await Promise.all(
            servers.map(async server => {
                const owner = (await Users.getUser(server.ownerId))?.toJSON();
                const serverCopy = server.toJSON();
                // Defaults para compatibilidade
                if (serverCopy.databasesQuantity === undefined) serverCopy.databasesQuantity = 0;
                if (serverCopy.addicionalAllocationsNumbers === undefined) serverCopy.addicionalAllocationsNumbers = 0;
                // @ts-ignore - Adiciona a propriedade 'owner' na cópia para o frontend
                serverCopy.owner = owner ? { uuid: owner.uuid, username: owner.username, email: owner.email, admin: owner.admin } : null;
                return serverCopy;
            })
        );

        return NextResponse.json(serversWithOwners);
    } catch (error) {
        console.error('API Error GetAllServers:', error);
        return NextResponse.json({ error: 'Erro ao buscar servidores.' }, { status: 500 });
    }
}
