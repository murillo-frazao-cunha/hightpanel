// file: app/api/cores/[...action]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import getUser from "@/backend/routes/api/userHelper";
import { Cores } from '@/backend/libs/Cores';


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
        const body = await request.json();
        if (!body.name) {
            return NextResponse.json({ error: 'O nome do Core é obrigatório' }, { status: 400 });
        }

        const existing = await Cores.findByName(body.name);
        if (existing) {
            return NextResponse.json({ error: 'Já existe um Core com esse nome' }, { status: 409 });
        }

        const newCore = await Cores.createCore(body);
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
        const body = await request.json();
        const { uuid } = body;
        if (!uuid) return NextResponse.json({ error: 'UUID ausente' }, { status: 400 });

        const coreInstance = await Cores.getCore(uuid);
        if (!coreInstance) return NextResponse.json({ error: 'Core não encontrado' }, { status: 404 });

        // Verifica se o novo nome já está em uso por outro Core
        if (body.name) {
            const otherCore = await Cores.findByName(body.name);
            if (otherCore && otherCore.id !== uuid) {
                return NextResponse.json({ error: 'Já existe outro Core com esse nome' }, { status: 409 });
            }
        }

        // Serializa os campos que são arrays de objetos para JSON antes de salvar
        const dataToUpdate = {
            ...body,
            dockerImages: JSON.stringify(body.dockerImages || []),
            variables: JSON.stringify(body.variables || []),
        };

        // Remove o UUID para não tentar sobrescrever a chave primária como um campo
        delete dataToUpdate.uuid;

        // Atualiza os campos da instância um por um
        for (const key in dataToUpdate) {
            if (Object.prototype.hasOwnProperty.call(dataToUpdate, key)) {
                (coreInstance as any)[key] = (dataToUpdate as any)[key];
            }
        }

        // Salva as alterações na instância do Core
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

        // Adicionar lógica para verificar se o Core está em uso por algum servidor antes de deletar
        // Ex: const servers = await serverTable.findByParam('coreUuid', uuid);
        // if (servers.length > 0) return NextResponse.json({ error: 'Este Core está em uso e não pode ser deletado.' }, { status: 409 });

        await coreInstance.delete();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('API Error DeleteCore:', error);
        return NextResponse.json({ error: 'Erro ao deletar o Core' }, { status: 500 });
    }
}

