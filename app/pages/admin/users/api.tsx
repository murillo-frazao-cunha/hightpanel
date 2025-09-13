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

        // @ts-ignore
        userData.uuid = userData.id
        const { data } = await api.post<User>(url, userData);
        return data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Ocorreu um erro desconhecido.';
            throw new Error(msg);
        }
        throw error;
    }
};
