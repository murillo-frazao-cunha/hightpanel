import { NextRequest, NextResponse } from 'next/server';
import getUser from "@/backend/routes/api/userHelper";
import {Users} from "@/backend/libs/User";




/**
 * Roteador principal para todas as ações de Usuários.
 * Apenas administradores podem acessar estas rotas.
 */
export async function interpretUsers(request: NextRequest, params: { [key: string]: string }) {
    const currentUser = await getUser();
    if (!currentUser || !currentUser.admin) {
        return NextResponse.json({ error: 'Acesso negado. Requer permissão de administrador.' }, { status: 403 });
    }

    const { action } = params;

    switch (action) {
        case "create":
            return CreateUser(request);
        case "edit":
            return EditUser(request, currentUser.id); // Passa o ID do admin logado
        // O padrão (sem ação) ou "get-all" vai listar os usuários
        case "get-all":
        default:
            return GetAllUsers();
    }
}

/**
 * Busca e retorna todos os usuários.
 */
async function GetAllUsers() {
    try {
        const users = await Users.getAllUsers();
        // Converte as entidades para JSON antes de enviar
        return NextResponse.json(users.map((u: { toJSON: () => any; }) => u.toJSON()));
    } catch (error) {
        console.error('API Error GetAllUsers:', error);
        return NextResponse.json({ error: 'Erro ao buscar usuários.' }, { status: 500 });
    }
}

/**
 * Cria um novo usuário.
 */
async function CreateUser(request: NextRequest) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }

    try {
        const body = await request.json();
        console.log(body)
        const { username, email, admin, password } = body;

        if (!username || !email || (admin !== true && admin !== false) || !password) {
            return NextResponse.json({ error: 'Nome, e-mail, admin e senha são obrigatórios.' }, { status: 400 });
        }

        // Assumindo que Users.createUser foi implementado na sua classe de lógica
        const newUser = await Users.createUser({ name: username, email, admin, password });
        return NextResponse.json(newUser.toJSON(), { status: 201 }); // 201 Created

    } catch (error: any) {
        console.error('API Error CreateUser:', error);
        if (error.message.includes('Já existe um usuário com este e-mail.')) {
            return NextResponse.json({ error: error.message }, { status: 409 }); // 409 Conflict
        }
        return NextResponse.json({ error: 'Erro ao criar o usuário.' }, { status: 500 });
    }
}


/**
 * Edita um usuário existente.
 */
async function EditUser(request: NextRequest, adminId: string) {
    if (request.method !== "POST") {
        return NextResponse.json({ error: 'Método не permitido' }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { uuid, ...updateData } = body;

        if (!uuid) {
            return NextResponse.json({ error: 'O UUID do usuário é obrigatório.' }, { status: 400 });
        }

        // Medida de segurança: impede que um admin remova a própria permissão
        if (uuid === adminId && updateData.admin === false) {
            return NextResponse.json({ error: 'Você não pode remover sua própria permissão de administrador.' }, { status: 403 });
        }

        const updatedUser = await Users.updateUser(uuid, updateData);
        return NextResponse.json(updatedUser.toJSON());

    } catch (error: any) {
        console.error('API Error EditUser:', error);
        if (error.message === 'Usuário não encontrado.') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erro ao atualizar o usuário.' }, { status: 500 });
    }
}

