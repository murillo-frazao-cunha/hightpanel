import axios from 'axios';
import type { ApiType } from './types/ApiType';

const API_BASE_URL = '/api/admin/api';
const api = axios.create({ baseURL: API_BASE_URL });

/**
 * Busca todas as chaves de API.
 */
export const getApiKeys = async (): Promise<ApiType[]> => {
    try {
        // A ação padrão "get-all" é acionada com uma requisição GET para a raiz
        const { data } = await api.get<ApiType[]>('/get-all');
        return data;
    } catch (error) {
        console.error('Erro em getApiKeys:', error);
        throw new Error('Falha ao buscar as chaves de API.');
    }
};

/**
 * Cria uma nova chave de API.
 * @param name - O nome para a nova chave.
 * @param description - A descrição para a nova chave.
 * @returns A chave de API recém-criada, incluindo o token.
 */
export const createApiKey = async (name: string, description: string): Promise<ApiType> => {
    try {
        const { data } = await api.post<ApiType>('/create', { name, description });
        return data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Ocorreu um erro desconhecido ao criar a chave.';
            throw new Error(msg);
        }
        throw error;
    }
};

/**
 * Deleta uma chave de API pelo seu ID.
 * @param id - O ID da chave a ser deletada.
 */
export const deleteApiKey = async (id: string): Promise<{ success: boolean }> => {
    try {
        await api.post('/delete', { id });
        return { success: true };
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Falha ao deletar a chave de API.';
            throw new Error(msg);
        }
        throw error;
    }
};
