import { NextRequest, NextResponse } from 'next/server';
import getUser from '@/backend/routes/api/userHelper';
import { ServerApi } from '@/backend/libs/Server';

// Ações permitidas pelo file manager
const FILE_MANAGER_ACTIONS = new Set(['list','read','write','rename','download','mass','mkdir','move','upload', 'unarchive']);

/**
 * Roteador para funcionalidades de File Manager (cliente) -> repassa para a node.
 * Endpoint base: /api/client/servers/filemanager/[acao]
 * O body deve conter pelo menos { uuid } (uuid público do servidor).
 */
export async function interpretServersFileManager(request: NextRequest, params: { [key: string]: string }) {
    const currentUser = await getUser();
    if (!currentUser) {
        return NextResponse.json({ error: 'Acesso negado. Requer autenticação.' }, { status: 401 });
    }

    if (request.method !== 'POST') {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }

    const { action } = params; // ação filemanager
    if (!action || !FILE_MANAGER_ACTIONS.has(action)) {
        return NextResponse.json({ error: 'Ação filemanager inválida.' }, { status: 400 });
    }

    let body: any = {};
    try {
        body = await request.json();
    } catch {}

    const { uuid } = body || {};
    if (!uuid) {
        return NextResponse.json({ error: 'uuid do servidor é obrigatório.' }, { status: 400 });
    }

    // Localiza servidor
    const server = await ServerApi.getServer(uuid);
    if (!server) {
        return NextResponse.json({ error: 'Servidor não encontrado.' }, { status: 404 });
    }

    // Permissão: dono ou admin
    if (server.ownerId !== currentUser.id && !currentUser.admin) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
    }

    // Node associada
    const node = await server.getNode();
    if (!node) {
        return NextResponse.json({ error: 'Node associado ao servidor não encontrado.' }, { status: 404 });
    }

    // Checa status opcionalmente (para operações que realmente precisam de node online). Para leitura/escrita/rename/list também é necessário
    try {
        const nodeStatus = await node.getStatus();
        if (nodeStatus.status === 'offline') {
            return NextResponse.json({ error: 'Node offline.' }, { status: 503 });
        }
    } catch (e: any) {
        return NextResponse.json({ error: 'Falha ao checar status da node.' }, { status: 503 });
    }

    // Monta payload a ser enviado à node
    const payload: Record<string, any> = {
        serverId: server.id,
        userUuid: currentUser.id
    };

    // Copia campos relevantes (path, content, newName, paths, action interno para mass, archiveName)
    const allowedPassthrough = ['path','content','newName','paths','archiveName','contentBase64','from','to'];
    for (const k of allowedPassthrough) {
        if (body[k] !== undefined) payload[k] = body[k];
    }

    // Para a ação "mass" precisamos também do body.action (delete|archive), evitando conflito com a ação principal
    if (action === 'mass') {
        if (!body.action || !['delete','archive'].includes(body.action)) {
            return NextResponse.json({ error: 'action interno inválido (delete|archive) para mass.' }, { status: 400 });
        }
        payload.action = body.action; // body.action aqui é a sub-ação para mass (delete/archive)
        if (payload.action === 'archive' && body.archiveName && typeof body.archiveName === 'string') {
            payload.archiveName = body.archiveName;
        }
    }

    // write precisa content
    if (action === 'write' && typeof payload.content !== 'string') {
        return NextResponse.json({ error: 'content é obrigatório para write.' }, { status: 400 });
    }

    if (action === 'rename') {
        if (typeof payload.path !== 'string' || typeof payload.newName !== 'string') {
            return NextResponse.json({ error: 'path e newName são obrigatórios para rename.' }, { status: 400 });
        }
    }

    if (action === 'read') {
        if (typeof payload.path !== 'string') {
            return NextResponse.json({ error: 'path é obrigatório para read.' }, { status: 400 });
        }
    }

    if (action === 'download') {
        if (typeof payload.path !== 'string') {
            return NextResponse.json({ error: 'path é obrigatório para download.' }, { status: 400 });
        }
    }

    if (action === 'mass') {
        if (!Array.isArray(payload.paths) || payload.paths.length === 0) {
            return NextResponse.json({ error: 'paths é obrigatório (array) para mass.' }, { status: 400 });
        }
    }

    if (action === 'mkdir') {
        if (typeof body.path !== 'string' || !body.path.trim()) {
            return NextResponse.json({ error: 'path é obrigatório para mkdir.' }, { status: 400 });
        }
    }

    if (action === 'move') {
        if (typeof body.from !== 'string' || typeof body.to !== 'string') {
            return NextResponse.json({ error: 'from e to são obrigatórios para move.' }, { status: 400 });
        }
        payload.from = body.from;
        payload.to = body.to;
    }

    if (action === 'upload') {
        if (typeof body.path !== 'string') {
            return NextResponse.json({ error: 'path é obrigatório para upload.' }, { status: 400 });
        }
        if (typeof body.contentBase64 !== 'string' && typeof body.content !== 'string') {
            return NextResponse.json({ error: 'contentBase64 ou content é obrigatório para upload.' }, { status: 400 });
        }
    }

    if(action === 'unarchive'){
        // path, destination necessarios
        if (typeof body.path !== 'string' || !body.path.trim()) {
            return NextResponse.json({ error: 'path é obrigatório para unarchive.' }, { status: 400 });
        }
        if (typeof body.destination !== 'string') {
            return NextResponse.json({ error: 'destination é obrigatório para unarchive.' }, { status: 400 });
        }
        payload.destination = body.destination;
        payload.path = body.path;

    }

    try {
        const nodeResp = await node.sendRequest(`/api/v1/servers/filemanager/${action}`, 'POST', payload);
        return NextResponse.json(nodeResp);
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Falha ao comunicar com a node.' }, { status: 500 });
    }
}
