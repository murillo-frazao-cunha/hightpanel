import {getTables} from "@/backend/database/tables/tables";

import {randomUUID} from "crypto";
import {Profile} from "@/backend/database/models/ProfileTable";
import bcrypt from "bcryptjs";

// Interface para os dados de criação de usuário
interface UserCreateData {
    name: string;
    email: string;
    admin: boolean; // Opcional, padrão é false
    password: string
}

// Interface para os dados que podem ser atualizados
interface UserUpdateData {
    username?: string;
    email?: string;
    admin?: boolean;
}

/**
 * Classe de lógica de negócios para gerenciar usuários (Profiles).
 * Encapsula as interações com o banco de dados para a entidade Profile.
 */
export class Users {

    /**
     * Busca todos os usuários cadastrados no sistema.
     * @returns Uma Promise com um array de todas as entidades de Profile.
     */
    public static async getAllUsers(): Promise<Profile[]> {
        const { profileTable } = await getTables();
        const users = await profileTable.getAll();
        return users;
    }

    /**
     * Busca um usuário específico pelo seu UUID.
     * @param uuid - O UUID do usuário.
     * @returns A instância da entidade Profile ou null se não for encontrada.
     */
    public static async getUser(uuid: string): Promise<Profile | null> {
        const { profileTable } = await getTables();
        const user = await profileTable.get(uuid);
        return user;
    }

    /**
     * Busca um usuário pelo email.
     * @param email - O email a ser pesquisado.
     * @returns Uma Promise com a entidade Profile ou null.
     */
    public static async findByEmail(email: string): Promise<Profile | null> {
        const { profileTable } = await getTables();
        // Assumindo que o campo 'email' está indexado no schema de Profile
        const users = await profileTable.findByParam('email', email);
        return users.length > 0 ? users[0] : null;
    }

    /**
     * Cria um novo usuário no banco de dados.
     * @param data - Os dados para o novo usuário (name, email).
     * @returns A instância do Profile recém-criada.
     */
    public static async createUser(data: UserCreateData): Promise<Profile> {
        const { profileTable } = await getTables();

        // 1. Garante que não existe usuário com o mesmo e-mail
        const existingUser = await this.findByEmail(data.email);
        if (existingUser) {
            throw new Error('Já existe um usuário com este e-mail.');
        }

        data.password = bcrypt.hashSync(data.password, 10)

        // 2. Cria e salva a nova entidade
        const newUser = await profileTable.insert(randomUUID(), {
            username: data.name, // Usa o nome como username inicial
            email: data.email,
            admin: data.admin, // Novos usuários nunca são admins por padrão
            password: data.password
        });

        return newUser;
    }

    /**
     * Atualiza os dados de um usuário específico.
     * @param uuid - O UUID do usuário a ser atualizado.
     * @param data - Um objeto com os campos a serem modificados.
     * @returns A instância do Profile atualizada.
     */
    public static async updateUser(uuid: string, data: UserUpdateData): Promise<Profile> {
        const userInstance = await this.getUser(uuid);
        if (!userInstance) {
            throw new Error('Usuário не encontrado.');
        }

        // Atualiza apenas os campos fornecidos
        if (data.username !== undefined) {
            userInstance.username = data.username;
        }
        if (data.email !== undefined) {
            userInstance.email = data.email;
        }
        if (data.admin !== undefined) {
            userInstance.admin = data.admin;
        }

        await userInstance.save();
        return userInstance;
    }
}

