import axios from 'axios';
import type { Server } from './types/ServerType';
import type { User } from '@/app/pages/admin/users/types/UserType';
import { getUsers } from "@/app/pages/admin/users/api";

// Instância do Axios para a API de Servidores
const api = axios.create({
    baseURL: '/api/admin/servers',
});

// --- Funções de API para Servidores ---

/**
 * Busca todos os servidores via API.
 */
export const getServers = async (): Promise<Server[]> => {
    try {
        const { data } = await api.get('/get-all');
        return data;
    } catch (error) {
        console.error('Falha ao buscar servidores:', error);
        throw new Error('Não foi possível carregar os servidores do sistema.');
    }
};

/**
 * Busca um servidor específico pelo seu ID via API.
 */
export const getServerByUuid = async (id: string): Promise<Server | null> => {
    try {
        const { data } = await api.post<Server>('/uuid', { uuid: id });
        return data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        console.error(`Falha ao buscar o servidor ${id}`, error);
        throw new Error(`Falha ao carregar os dados do servidor.`);
    }
};

/**
 * Salva um servidor (cria ou atualiza) via API.
 */
export const saveServer = async (serverData: Partial<Server>): Promise<Server> => {
    try {
        const url = serverData.id ? '/edit' : '/create';
        const { data } = await api.post<Server>(url, serverData);
        return data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Ocorreu um erro desconhecido ao salvar o servidor.';
            throw new Error(msg);
        }
        throw error;
    }
};

/**
 * Deleta um servidor pelo seu ID via API.
 */
export const deleteServer = async (id: string): Promise<{ success: true }> => {
    try {
        await api.post('/delete', { uuid: id });
        return { success: true };
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Falha ao deletar o servidor.';
            throw new Error(msg);
        }
        throw error;
    }
};

/**
 * Busca usuários com base em uma query (email ou nome de usuário).
 * (Mantido conforme solicitado)
 */
export const searchUsers = async (query: string): Promise<User[]> => {
    if (query.length < 2) return [];
    const allUsers = await getUsers();
    const lowerCaseQuery = query.toLowerCase();

    return allUsers.filter(u =>
        u.email.toLowerCase().includes(lowerCaseQuery) ||
        u.username.toLowerCase().includes(lowerCaseQuery)
    );
};

