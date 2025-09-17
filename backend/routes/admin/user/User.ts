import { NextRequest, NextResponse } from 'next/server';
import getUser from "@/backend/routes/api/userHelper";
import {Users} from "@/backend/libs/User";

/**
 * Valida a força de uma senha.
 */
function validatePassword(password: string) {
    if (password.length < 8) {
        return 'A senha deve ter no mínimo 8 caracteres.';
    }
    if (!/(?=.*[a-z])/.test(password)) {
        return 'A senha deve conter pelo menos uma letra minúscula.';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
        return 'A senha deve conter pelo menos uma letra maiúscula.';
    }
    if (!/(?=.*\d)/.test(password)) {
        return 'A senha deve conter pelo menos um número.';
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
        return 'A senha deve conter pelo menos um caractere especial (@, $, !, %, *, ?, &).';
    }
    return null; // Senha válida
}


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
        case "delete":
            return DeleteUser(request, currentUser.id);
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
        // Remove dados sensíveis antes de enviar
        const safeUsers = users.map((u: { toJSON: () => any; }) => {
            const userJson = u.toJSON();
            delete userJson.passwordHash;
            return userJson;
        });
        return NextResponse.json(safeUsers);
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
        const { username, email, admin, password } = body;

        if (!username || !email || (admin !== true && admin !== false) || !password) {
            return NextResponse.json({ error: 'Nome, e-mail, admin e senha são obrigatórios.' }, { status: 400 });
        }

        const passwordError = validatePassword(password);
        if (passwordError) {
            return NextResponse.json({ error: passwordError }, { status: 400 });
        }

        const newUser = await Users.createUser({ name: username, email, admin, password });
        const safeUser = newUser.toJSON();
        delete safeUser.passwordHash;

        return NextResponse.json(safeUser, { status: 201 }); // 201 Created

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
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }

    try {
        const body = await request.json();
        const { uuid, name, email, admin, password } = body;

        if (!uuid) {
            return NextResponse.json({ error: 'O UUID do usuário é obrigatório.' }, { status: 400 });
        }

        // Constrói o objeto de atualização apenas com os campos permitidos
        const updateData: { [key: string]: any } = {};
        if (name !== undefined) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (admin !== undefined) updateData.admin = admin;
        if (password !== undefined) {
             const passwordError = validatePassword(password);
             if (passwordError) {
                 return NextResponse.json({ error: passwordError }, { status: 400 });
             }
            updateData.password = password;
        }


        // Medida de segurança: impede que um admin remova a própria permissão
        if (uuid === adminId && updateData.admin === false) {
            return NextResponse.json({ error: 'Você não pode remover sua própria permissão de administrador.' }, { status: 403 });
        }

        const updatedUser = await Users.updateUser(uuid, updateData);
        const safeUser = updatedUser.toJSON();
        delete safeUser.passwordHash;

        return NextResponse.json(safeUser);

    } catch (error: any) {
        console.error('API Error EditUser:', error);
        if (error.message === 'Usuário não encontrado.') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        return NextResponse.json({ error: 'Erro ao atualizar o usuário.' }, { status: 500 });
    }
}

/**
 * Remove um usuário existente.
 */
async function DeleteUser(request: NextRequest, adminId: string) {
    if (request.method !== "POST" && request.method !== "DELETE") {
        return NextResponse.json({ error: 'Método não permitido' }, { status: 405 });
    }
    try {
        const body = await request.json();
        const { uuid } = body;

        if (!uuid) {
            return NextResponse.json({ error: 'O UUID do usuário é obrigatório.' }, { status: 400 });
        }
        if (uuid === adminId) {
            return NextResponse.json({ error: 'Você não pode excluir seu próprio usuário.' }, { status: 403 });
        }
        try {
            await Users.deleteUser(uuid);
            return NextResponse.json({ success: true });
        } catch (err: any) {
            if (err.message.includes('servidores')) {
                return NextResponse.json({ error: err.message }, { status: 409 });
            }
            if (err.message.includes('não encontrado')) {
                return NextResponse.json({ error: err.message }, { status: 404 });
            }
            throw err;
        }
    } catch (error) {
        console.error('API Error DeleteUser:', error);
        return NextResponse.json({ error: 'Erro ao deletar o usuário.' }, { status: 500 });
    }
}
