// Rota admin para Hosts de Databases MySQL
import { NextRequest, NextResponse } from 'next/server';
import getUser from '@/backend/routes/api/userHelper';
import { DatabaseHostsApi } from '@/backend/libs/DatabaseHosts';

// Roteador principal
export async function interpretDatabaseHosts(request: NextRequest, params: { [key: string]: string }) {
    const user = await getUser();
    if (!user || !user.admin) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }
    const { action } = params;
    switch (action) {
        case 'create':
            return createHost(request);
        case 'edit':
            return editHost(request);
        case 'uuid':
            return getHostByUuid(request);
        case 'delete':
            return deleteHost(request);
        default:
            return listHosts();
    }
}

async function listHosts() {
    try {
        const all = await DatabaseHostsApi.getAll();
        return NextResponse.json(all.map(h => DatabaseHostsApi.sanitize(h)));
    } catch (e) {
        console.error('API Error listHosts:', e);
        return NextResponse.json({ error: 'Erro ao listar hosts' }, { status: 500 });
    }
}

async function getHostByUuid(request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });
        const host = await DatabaseHostsApi.get(uuid);
        if (!host) return NextResponse.json({ error: 'Host não encontrado' }, { status: 404 });
        return NextResponse.json(DatabaseHostsApi.sanitize(host));
    } catch (e) {
        console.error('API Error getHostByUuid:', e);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

async function createHost(request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const body = await request.json();
        const required = ['name', 'host', 'port', 'username', 'password'];
        for (const f of required) {
            if (body[f] === undefined || body[f] === null || body[f] === '') {
                return NextResponse.json({ error: `Campo obrigatório '${f}' ausente` }, { status: 400 });
            }
        }
        const existing = await DatabaseHostsApi.findByName(body.name);
        if (existing) return NextResponse.json({ error: 'Já existe um host com esse nome' }, { status: 409 });
        const created = await DatabaseHostsApi.create({
            name: body.name,
            host: body.host,
            port: Number(body.port),
            username: body.username,
            password: body.password,
            phpmyAdminLink: body.phpmyAdminLink || ''
        });
        return NextResponse.json(DatabaseHostsApi.sanitize(created), { status: 201 });
    } catch (e: any) {
        console.error('API Error createHost:', e);
        return NextResponse.json({ error: e.message || 'Erro ao criar host' }, { status: 500 });
    }
}

async function editHost(request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const body = await request.json();
        const { uuid, ...updates } = body;
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });
        if (updates.name) {
            const other = await DatabaseHostsApi.findByName(updates.name);
            if (other && other.id !== uuid) {
                return NextResponse.json({ error: 'Já existe outro host com esse nome' }, { status: 409 });
            }
        }
        const updated = await DatabaseHostsApi.update(uuid, updates);
        return NextResponse.json(DatabaseHostsApi.sanitize(updated));
    } catch (e: any) {
        console.error('API Error editHost:', e);
        return NextResponse.json({ error: e.message || 'Erro ao editar host' }, { status: 500 });
    }
}

async function deleteHost(request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });
        await DatabaseHostsApi.delete(uuid);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('API Error deleteHost:', e);
        return NextResponse.json({ error: 'Erro ao deletar host' }, { status: 500 });
    }
}

