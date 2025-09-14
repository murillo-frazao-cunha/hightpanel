import axios from 'axios';
import type { User } from './types/UserType';

const API_BASE_URL = '/api/admin/users';
const api = axios.create({ baseURL: API_BASE_URL });

/**
 * Busca todos os usuários.
 */
export const getUsers = async (): Promise<User[]> => {
    try {
        const { data } = await api.get<User[]>('/get-all');
        return data;
    } catch (error) {
        console.error('Erro em getUsers:', error);
        return [];
    }
};

/**
 * Salva um usuário (cria um novo ou atualiza um existente).
 * @param userData - Os dados do usuário. O backend diferencia 'create' de 'edit' pela presença do UUID.
 */
export const saveUser = async (userData: Partial<User>): Promise<User> => {
    const isEditing = !!userData.id;
    const url = isEditing ? '/edit' : '/create';
    try {
        const payload: any = { ...userData };
        if (isEditing) {
            payload.uuid = userData.id;
            delete payload.id;
            if (!payload.password) {
                delete payload.password; // não alterar senha
            }
        } else {
            if (!payload.password || payload.password.trim() === '') {
                throw new Error('Senha é obrigatória para criar usuário.');
            }
        }
        const { data } = await api.post<User>(url, payload);
        return data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Ocorreu um erro desconhecido.';
            throw new Error(msg);
        }
        throw error;
    }
};

/**
 * Exclui um usuário pelo UUID.
 * @param uuid - O UUID do usuário a ser excluído.
 */
export const deleteUser = async (uuid: string): Promise<void> => {
    try {
        await api.post('/delete', { uuid });
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Erro ao excluir usuário.';
            throw new Error(msg);
        }
        throw error;
    }
};
