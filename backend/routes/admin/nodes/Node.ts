// file: app/api/nodes/[...action]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import getUser from "@/backend/routes/api/userHelper";
import { Nodes, NodeStatus } from '@/backend/libs/Nodes';
import { getTables } from '@/backend/database/tables/tables';




/**
 * Roteador principal para todas as ações de Nodes.
 */
export async function interpretNodes(request: NextRequest, params: { [key: string]: string }) {
    const user = await getUser();
    if (!user) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    if (!user.admin) {
        return NextResponse.json({ error: 'Proibido' }, { status: 403 });
    }

    const { action } = params;

    switch (action) {
        case "create":
            return CreateNode(request);
        case "edit":
            return EditNode(request);
        case "uuid":
            return getByUUID(request);
        case "delete":
            return DeleteNode(request);
        case "status":
            return getStatus(request);
        case "get-allocations": return GetAllocations(request);
        case "add-allocations": return AddAllocations(request);
        case "delete-allocation": return DeleteAllocation(request);
        case "update-allocation": return UpdateAllocation(request); // nova rota
        default:
            return GetAllNodes();
    }
}

// --- Funções de Node (sem alterações) ---
export async function GetAllNodes() {
    try {
        const nodeInstances = await Nodes.getAllNodes();
        const nodesJson = nodeInstances.map((node: { toJSON: () => any; }) => node.toJSON());
        return NextResponse.json(nodesJson);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function getStatus(request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
        const nodeInstance = await Nodes.getNode(uuid);
        if (!nodeInstance) return NextResponse.json({ error: 'Node não encontrado' }, { status: 404 });
        const status = await nodeInstance.getStatus();
        return NextResponse.json(status);
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ status: NodeStatus.OFFLINE, error: error instanceof Error ? error.message : 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function getByUUID(request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
        const nodeInstance = await Nodes.getNode(uuid);
        if (!nodeInstance) return NextResponse.json({ error: 'Node não encontrado' }, { status: 404 });
        return NextResponse.json({
            ...nodeInstance.toJSON(),
            token: process.env.TOKEN
        });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function CreateNode(request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    try {
        const { name, ip, port, sftp, ssl, location } = await request.json();
        if (!name || !ip || !port || !sftp || ssl === undefined) {
            return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
        }
        const existingNode = await Nodes.findByName(name);
        if (existingNode) {
            return NextResponse.json({ error: 'Já existe uma node com esse nome' }, { status: 400 });
        }
        const newNode = await Nodes.createNode({ name, ip, port, sftp, ssl, location });
        return NextResponse.json(newNode.toJSON(), { status: 201 });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function EditNode(request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    try {
        const { uuid, name, ip, port, sftp, ssl, location } = await request.json();
        if (!uuid || !name || !ip || !port || !sftp || ssl === undefined) {
            return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
        }
        const nodeInstance = await Nodes.getNode(uuid);
        if (!nodeInstance) return NextResponse.json({ error: 'Node não encontrado' }, { status: 404 });
        const nodeWithName = await Nodes.findByName(name);
        if (nodeWithName && nodeWithName.node.id !== uuid) {
            return NextResponse.json({ error: 'Já existe uma node com esse nome' }, { status: 400 });
        }
        await nodeInstance.update({ name, ip, port, sftp, ssl, location });
        return NextResponse.json(nodeInstance.toJSON());
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

export async function DeleteNode(request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });
        const nodeInstance = await Nodes.getNode(uuid);
        if (!nodeInstance) return NextResponse.json({ error: 'Node não encontrado' }, { status: 404 });

        // verificar se tem serviodres
        const table = await getTables();
        const servers = await table.serverTable.findByParam('nodeUuid', uuid);
        if (servers.length > 0) {
            return NextResponse.json({ error: 'Não é possível deletar um node que possui servidores ativos.' }, { status: 400 });
        }

        await nodeInstance.delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}


// --- FUNÇÕES DE ALOCAÇÃO CORRIGIDAS ---

/**
 * Busca todas as alocações de um node.
 */
export async function GetAllocations(request: NextRequest) {
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'UUID do node ausente' }, { status: 400 });

        const { allocationTable } = await getTables();
        const allocations = await allocationTable.findByParam('nodeId', uuid);
        const result = allocations.map(a => {
            const json: any = a.toJSON();
            return { ...json, assignedToServerId: json.assignedTo ?? null };
        });
        return NextResponse.json(result);
    } catch (error) {
        return NextResponse.json({ error: 'Erro ao buscar alocações' }, { status: 500 });
    }
}

/**
 * Cria novas alocações para um node.
 */
export async function AddAllocations(request: NextRequest) {
    try {
        const { uuid, externalIp, ports, ip } = await request.json();
        if (!uuid || !ports || !ip) return NextResponse.json({ error: 'Parâmetros ausentes' }, { status: 400 });

        const nodeInstance = await Nodes.getNode(uuid);
        if (!nodeInstance) return NextResponse.json({ error: 'Node não encontrado' }, { status: 404 });

        const portRange = ports.split('-').map((p: string) => parseInt(p.trim(), 10));
        if (portRange.some(isNaN)) return NextResponse.json({ error: 'Portas inválidas' }, { status: 400 });

        const [startPort, endPort] = portRange.length > 1 ? portRange : [portRange[0], portRange[0]];
        if (startPort > endPort || endPort - startPort + 1 > 10) {
            return NextResponse.json({ error: 'Intervalo de portas inválido ou excede o limite de 10.' }, { status: 400 });
        }

        const { allocationTable } = await getTables();
        const createdAllocations: any[] = [];

        for (let port = startPort; port <= endPort; port++) {
            const existingAllocations = await allocationTable.findByParam('nodeId', uuid);
            const existingPort = existingAllocations.find(alloc => alloc.port === port);
            if (existingPort) {
                console.log(`Porta ${port} já alocada para este node. Pulando.`);
                continue;
            }
            const newAlloc = await allocationTable.insert(randomUUID(), {
                nodeId: uuid,
                ip: ip,
                externalIp: externalIp || null,
                port: port,
                assignedTo: null
            });
            const json: any = newAlloc.toJSON();
            createdAllocations.push({ ...json, assignedToServerId: json.assignedTo ?? null });
        }

        return NextResponse.json(createdAllocations, { status: 201 });
    } catch (error) {
        console.error('API Error AddAllocations:', error);
        return NextResponse.json({ error: 'Erro ao criar alocações' }, { status: 500 });
    }
}

/**
 * Deleta uma alocação específica.
 */
export async function DeleteAllocation(request: NextRequest) {
    try {
        const { uuid } = await request.json(); // UUID da alocação
        if (!uuid) return NextResponse.json({ error: 'UUID da alocação ausente' }, { status: 400 });

        const { allocationTable } = await getTables();

        // Para deletar, primeiro buscamos a entidade pelo seu ID
        const allocationToDelete = await allocationTable.get(uuid);

        if (!allocationToDelete) {
            return NextResponse.json({ error: 'Alocação não encontrada' }, { status: 404 });
        }

        // Então chamamos o método .delete() na instância da entidade
        await allocationToDelete.delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error DeleteAllocation:', error);
        return NextResponse.json({ error: 'Erro ao deletar alocação' }, { status: 500 });
    }
}

/**
 * Atualiza uma alocação existente.
 */
export async function UpdateAllocation(request: NextRequest) {
    try {
        if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
        const { uuid, externalIp } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'UUID da alocação ausente' }, { status: 400 });
        const { allocationTable } = await getTables();
        const allocation = await allocationTable.get(uuid);
        if (!allocation) return NextResponse.json({ error: 'Alocação não encontrada' }, { status: 404 });
        allocation.externalIp = (externalIp && externalIp.trim() !== '') ? externalIp : null;
        await allocation.save();
        const json: any = allocation.toJSON();
        return NextResponse.json({ ...json, assignedToServerId: json.assignedTo ?? null });
    } catch (error) {
        console.error('API Error UpdateAllocation:', error);
        return NextResponse.json({ error: 'Erro ao atualizar alocação' }, { status: 500 });
    }
}
