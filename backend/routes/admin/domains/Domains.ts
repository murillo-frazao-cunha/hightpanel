// Rota admin para Domínios (Cloudflare)
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import getUser from '@/backend/routes/api/userHelper';
import { getTables } from '@/backend/database/tables/tables';

// Roteador principal
export async function interpretDomains(request: NextRequest, params: { [key: string]: string }) {
    const user = await getUser();
    if (!user || !user.admin) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { action } = params;
    switch (action) {
        case 'create':
            return createDomain(request);
        case 'edit':
            return editDomain(request);
        case 'uuid':
            return getDomainByUuid(request);
        case 'delete':
            return deleteDomain(request);
        default:
            return listDomains();
    }
}

async function listDomains() {
    try {
        const { domainsTable } = await getTables();
        const all = await domainsTable.getAll();
        return NextResponse.json(all.map(d => d.toJSON()));
    } catch (e) {
        console.error('API Error listDomains:', e);
        return NextResponse.json({ error: 'Erro ao listar domínios' }, { status: 500 });
    }
}

async function getDomainByUuid(request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });
        const { domainsTable } = await getTables();
        const domain = await domainsTable.get(uuid);
        if (!domain) return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 });
        return NextResponse.json(domain.toJSON());
    } catch (e) {
        console.error('API Error getDomainByUuid:', e);
        return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
    }
}

async function createDomain(request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const body = await request.json();
        let { domainName, ownerToken, zoneId } = body || {};
        // validações básicas
        if (!domainName || !ownerToken || !zoneId) {
            return NextResponse.json({ error: 'Campos obrigatórios: domainName, ownerToken, zoneId' }, { status: 400 });
        }
        // normalização simples do domínio
        domainName = String(domainName).trim().toLowerCase();
        if (!/^[a-z0-9.-]+$/.test(domainName)) {
            return NextResponse.json({ error: 'domainName inválido' }, { status: 400 });
        }

        const { domainsTable } = await getTables();
        const existingByName = await domainsTable.findByParam('domainName', domainName);
        if (existingByName.length > 0) {
            return NextResponse.json({ error: 'Já existe um domínio com esse domainName' }, { status: 409 });
        }

        const created = await domainsTable.insert(randomUUID(), {
            domainName,
            ownerToken: String(ownerToken),
            zoneId: String(zoneId)
        });
        return NextResponse.json(created.toJSON(), { status: 201 });
    } catch (e: any) {
        console.error('API Error createDomain:', e);
        return NextResponse.json({ error: e?.message || 'Erro ao criar domínio' }, { status: 500 });
    }
}

async function editDomain(request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const body = await request.json();
        const { uuid } = body || {};
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });

        const { domainsTable } = await getTables();
        const domain = await domainsTable.get(uuid);
        if (!domain) return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 });

        // atualizar campos se enviados
        if (body.domainName !== undefined) {
            const normalized = String(body.domainName).trim().toLowerCase();
            if (!/^[a-z0-9.-]+$/.test(normalized)) {
                return NextResponse.json({ error: 'domainName inválido' }, { status: 400 });
            }
            const dup = await domainsTable.findByParam('domainName', normalized);
            if (dup.some(d => d.id !== uuid)) {
                return NextResponse.json({ error: 'Já existe outro domínio com esse domainName' }, { status: 409 });
            }
            domain.domainName = normalized;
        }
        if (body.ownerToken !== undefined) domain.ownerToken = String(body.ownerToken);
        if (body.zoneId !== undefined) domain.zoneId = String(body.zoneId);

        await domain.save();
        return NextResponse.json(domain.toJSON());
    } catch (e: any) {
        console.error('API Error editDomain:', e);
        return NextResponse.json({ error: e?.message || 'Erro ao editar domínio' }, { status: 500 });
    }
}

async function deleteDomain(request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });
        const { domainsTable } = await getTables();
        const domain = await domainsTable.get(uuid);
        if (!domain) return NextResponse.json({ error: 'Domínio não encontrado' }, { status: 404 });

        await domain.delete();
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('API Error deleteDomain:', e);
        return NextResponse.json({ error: 'Erro ao deletar domínio' }, { status: 500 });
    }
}


