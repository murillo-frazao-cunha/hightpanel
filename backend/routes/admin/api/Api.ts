import { NextRequest, NextResponse } from 'next/server';
import getUser from "@/backend/routes/api/userHelper";
import { getTables } from "@/backend/database/tables/tables";
import crypto from 'crypto';

// Helper to generate a secure random token
function generateToken(length: number = 32): string {
    // "hp_" prefix to identify HightPanel tokens
    return 'hp_' + crypto.randomBytes(length).toString('hex');
}

/**
 * Roteador principal para todas as ações de API Keys.
 * Apenas administradores podem acessar estas rotas.
 */
export async function interpretApi(request: NextRequest, params: { [key: string]: string }) {
    const currentUser = await getUser();
    if (!currentUser || !currentUser.admin) {
        return NextResponse.json({ error: 'Acesso negado. Requer permissão de administrador.' }, { status: 403 });
    }

    const { action } = params;

    switch (action) {
        case "create":
            return CreateApiKey(request);
        case "delete":
            return DeleteApiKey(request);
        case "get-all":
        default:
            return GetAllApiKeys();
    }
}

/**
 * Busca e retorna todas as chaves de API.
 */
async function GetAllApiKeys() {
    try {
        const tables = await getTables();
        const keys = await tables.apiTable.getAll();
        return NextResponse.json(keys.map(k => k.toJSON()));
    } catch (error) {
        console.error('API Error GetAllApiKeys:', error);
        return NextResponse.json({ error: 'Erro ao buscar chaves de API.' }, { status: 500 });
    }
}

/**
 * Cria uma nova chave de API.
 */
async function CreateApiKey(request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'O nome da chave de API é obrigatório.' }, { status: 400 });
        }

        const tables = await getTables();
        const token = generateToken();

        const newKeyData = {
            name,
            description: description || '',
            createdAt: Date.now(),
            lastUsedAt: 0,
        };

        const newKey = await tables.apiTable.insert(token, newKeyData);

        // Retorna o objeto completo, incluindo o token, apenas na criação.
        return NextResponse.json({
            ...newKey.toJSON()
            , token
        }, { status: 201 });

    } catch (error: any) {
        console.error('API Error CreateApiKey:', error);
        return NextResponse.json({ error: 'Erro ao criar a chave de API.' }, { status: 500 });
    }
}

/**
 * Remove uma chave de API existente.
 */
async function DeleteApiKey(request: NextRequest) {
    if (request.method !== "POST" && request.method !== "DELETE") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { id } = body;

        if (!id) {
            return NextResponse.json({ error: 'O ID da chave é obrigatório.' }, { status: 400 });
        }

        const tables = await getTables();
        const existingKey = await tables.apiTable.get(id);

        if (!existingKey) {
            return NextResponse.json({ error: 'Chave de API não encontrada.' }, { status: 404 });
        }
        await existingKey.delete();

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('API Error DeleteApiKey:', error);
        return NextResponse.json({ error: 'Erro ao deletar a chave de API.' }, { status: 500 });
    }
}
