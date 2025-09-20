// file: app/api/cores/[...action]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import getUser from "@/backend/routes/api/userHelper";
import { Cores } from '@/backend/libs/Cores';
import {getTables} from "@/backend/database/tables/tables";


/**
 * Roteador principal para todas as ações de Cores.
 */
export async function interpretCores(request: NextRequest, params: { [key: string]: string }) {
    const user = await getUser();
    if (!user || !user.admin) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    const { action } = params;

    switch (action) {
        case "create":
            return CreateCore(request);
        case "edit":
            return EditCore(request);
        case "uuid":
            return getByUUID(request);
        case "delete":
            return DeleteCore(request);
        case "export":
            return ExportCore(request);
        case "import":
            return ImportCore(request);
        default:
            return GetAllCores();
    }
}

/**
 * Busca todos os Cores.
 */
export async function GetAllCores() {
    try {
        const cores = await Cores.getAllCores();
        // O método toJSON na entidade Core já lida com a desserialização
        return NextResponse.json(cores.map(core => core.toJSON()));
    } catch (error) {
        console.error('API Error GetAllCores:', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

/**
 * Busca um Core pelo UUID.
 */
export async function getByUUID(request: NextRequest) {
    if (request.method !== "POST") return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });

        const core = await Cores.getCore(uuid);
        if (!core) return NextResponse.json({ error: 'Core não encontrado' }, { status: 404 });

        return NextResponse.json(core.toJSON());
    } catch (error) {
        console.error('API Error getByUUID (Core):', error);
        return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
    }
}

/**
 * Cria um novo Core.
 */
export async function CreateCore(request: NextRequest) {
    if (request.method !== "POST") return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        const body = await request.json();
        if (!body.name) {
            return NextResponse.json({ error: 'O nome do Core é obrigatório' }, { status: 400 });
        }

        const existing = await Cores.findByName(body.name);
        if (existing) {
            return NextResponse.json({ error: 'Já existe um Core com esse nome' }, { status: 409 });
        }

        const newCore = await Cores.createCore({
            name: body.name,
            installScript: body.installScript || '',
            startupCommand: body.startupCommand || '',
            stopCommand: body.stopCommand || 'stop',
            dockerImages: body.dockerImages || [],
            variables: body.variables || [],
            startupParser: body.startupParser || '{}',
            configSystem: body.configSystem || '{}',
            description: body.description || '',
            creatorEmail: user.email,
            createdAt: Date.now(),
        });
        return NextResponse.json(newCore.toJSON(), { status: 201 });
    } catch (error) {
        console.error('API Error CreateCore:', error);
        return NextResponse.json({ error: 'Erro ao criar o Core' }, { status: 500 });
    }
}

/**
 * Edita um Core existente.
 */
export async function EditCore(request: NextRequest) {
    if (request.method !== "POST") return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        const body = await request.json();
        const { uuid } = body;
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });

        const coreInstance = await Cores.getCore(uuid);
        if (!coreInstance) return NextResponse.json({ error: 'Core não encontrado' }, { status: 404 });

        if (body.name) {
            const otherCore = await Cores.findByName(body.name);
            if (otherCore && otherCore.id !== uuid) {
                return NextResponse.json({ error: 'Já existe outro Core com esse nome' }, { status: 409 });
            }
        }

        const dataToUpdate = {
            ...body,
            dockerImages: JSON.stringify(body.dockerImages || []),
            variables: JSON.stringify(body.variables || []),
        };
        delete dataToUpdate.uuid;
        delete (dataToUpdate as any).creatorEmail; // impedir alteração

        for (const key in dataToUpdate) {
            if (Object.prototype.hasOwnProperty.call(dataToUpdate, key)) {
                (coreInstance as any)[key] = (dataToUpdate as any)[key];
            }
        }
        await coreInstance.save();
        return NextResponse.json(coreInstance.toJSON());
    } catch (error) {
        console.error('API Error EditCore:', error);
        return NextResponse.json({ error: 'Erro ao editar o Core' }, { status: 500 });
    }
}

/**
 * Deleta um Core.
 */
export async function DeleteCore(request: NextRequest) {
    if (request.method !== "POST") return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });

        const coreInstance = await Cores.getCore(uuid);
        if (!coreInstance) return NextResponse.json({ error: 'Core não encontrado' }, { status: 404 });

        // verificar se existe servidor com ela
        const table = await getTables()
        const serversWithCore = await table.serverTable.findByParam('coreId', uuid);
        if(serversWithCore.length > 0) {
            return NextResponse.json({ error: 'Não é possível deletar este Core pois existem servidores utilizando ele.' }, { status: 400 });
        }
        await coreInstance.delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error DeleteCore:', error);
        return NextResponse.json({ error: 'Erro ao deletar o Core' }, { status: 500 });
    }
}

/**
 * Exporta um Core como JSON completo (inclui arrays desserializados).
 */
export async function ExportCore(request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const { uuid } = await request.json();
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });
        const core = await Cores.getCore(uuid);
        if (!core) return NextResponse.json({ error: 'Core não encontrado' }, { status: 404 });
        const data = core.toJSON();
        const { id: originalId, ...rest } = data;
        return NextResponse.json({
            version: 2,
            exportedAt: new Date().toISOString(),
            core: { originalId, ...rest }
        });
    } catch (e) {
        console.error('API Error ExportCore:', e);
        return NextResponse.json({ error: 'Erro ao exportar o Core' }, { status: 500 });
    }
}

/**
 * Importa um Core de um JSON exportado previamente.
 * Se já existir um core com o mesmo nome, adiciona um sufixo incremental.
 */
export async function ImportCore(request: NextRequest) {
    if (request.method !== 'POST') return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    try {
        const user = await getUser();
        if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
        const body = await request.json();
        const payload = body.core || body;
        delete payload.id; delete payload.uuid; delete payload.originalId;

        const required = ['name','installScript','startupCommand','stopCommand','dockerImages','variables','startupParser','configSystem'];
        for (const field of required) {
            if (payload[field] == null) {
                return NextResponse.json({ error: `Campo ausente no JSON: ${field}` }, { status: 400 });
            }
        }

        let baseName: string = payload.name;
        let finalName = baseName;
        let counter = 1;
        while (await Cores.findByName(finalName)) {
            finalName = `${baseName}-import${counter > 1 ? '-' + counter : ''}`;
            counter++;
        }

        const dockerImages = Array.isArray(payload.dockerImages) ? payload.dockerImages : [];
        const variables = Array.isArray(payload.variables) ? payload.variables : [];

        const newCore = await Cores.createCore({
            name: finalName,
            installScript: payload.installScript,
            startupCommand: payload.startupCommand,
            stopCommand: payload.stopCommand,
            dockerImages,
            variables,
            startupParser: typeof payload.startupParser === 'string' ? payload.startupParser : JSON.stringify(payload.startupParser || {}),
            configSystem: typeof payload.configSystem === 'string' ? payload.configSystem : JSON.stringify(payload.configSystem || {}),
            description: payload.description || '',
            creatorEmail: payload.creatorEmail,
            createdAt: Date.now(),
        });

        return NextResponse.json({ imported: true, core: newCore.toJSON() }, { status: 201 });
    } catch (e) {
        console.error('API Error ImportCore:', e);
        return NextResponse.json({ error: 'Erro ao importar o Core' }, { status: 500 });
    }
}
