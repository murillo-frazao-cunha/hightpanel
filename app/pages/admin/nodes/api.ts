import axios from 'axios';
import type { Node, Allocation } from './types/NodeType'; // Mantive Allocation para consistência futura

const API_BASE_URL = '/api/admin/nodes'; // Ajustado para corresponder à estrutura de rotas
const api = axios.create({ baseURL: API_BASE_URL });

// --- Funções da API com Axios ---

/**
 * Busca todos os nodes.
 * @returns Uma Promise com o array de nodes.
 */
export const getNodes = async (): Promise<Node[]> => {
    try {
        const { data } = await api.get<Node[]>('');
        return data;
    } catch (error) {
        console.error('Erro em getNodes:', error);
        return []; // Retorna array vazio em caso de erro para não quebrar a UI
    }
};

/**
 * Busca um node específico pelo seu UUID.
 * @param uuid - O UUID do node a ser buscado.
 * @returns Uma Promise com o node encontrado ou null.
 */
export const getNodeByUuid = async (uuid: string): Promise<Node | null> => {
    try {
        const { data } = await api.post<Node>('/uuid', { uuid });
        return data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return null;
        console.error('Falha ao buscar o node', uuid, error);
        throw new Error(`Falha ao buscar o node.`);
    }
};

enum NodeStatus {
    ONLINE = 'online',
    OFFLINE = 'offline'
}

export async function getStatus(uuid: string): Promise<{ status: NodeStatus, error?: string }> {
    try {
        const { data } = await api.post<{ status: NodeStatus, error?: string }>('/status', { uuid });
        return data;
    } catch (error) {
        console.warn('Não foi possível obter status, assumindo OFFLINE. Erro:', error);
        return {
            status: NodeStatus.OFFLINE,
            error: (error as Error).message
        };
    }
}

/**
 * Salva um node (cria um novo ou atualiza um existente).
 * @param nodeData - Os dados do node a serem salvos.
 * @returns Uma Promise com o node salvo.
 * @throws Lança um erro com a mensagem da API em caso de falha.
 */
export const saveNode = async (nodeData: Omit<Node, 'id' | 'status' | 'allocations'> & Partial<Pick<Node, 'id' | 'status'>>): Promise<Node> => {
    // A propriedade 'uuid' agora é a referência principal, não 'id'
    const isEditing = !!nodeData.id
    console.log(nodeData)
    const url = isEditing ? '/edit' : '/create';

    try {
        const { data } = await api.post<Node>(url, nodeData);
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
 * Deleta um node pelo seu UUID.
 * @param uuid - O UUID do node a ser deletado.
 * @returns Uma Promise com o resultado da operação.
 */
export const deleteNode = async (uuid: string): Promise<{ success: boolean }> => {
    try {
        await api.post('/delete', { uuid });
        return { success: true };
    } catch (error) {
        console.error('Erro de rede ao tentar deletar o node:', error);
        return { success: false };
    }
};

// --- Funções de Alocação com Axios ---

/**
 * Busca todas as alocações de um node específico.
 */
export const getAllocations = async (nodeUuid: string): Promise<Allocation[]> => {
    try {
        const { data } = await api.post<Allocation[]>('/get-allocations', { uuid: nodeUuid });
        return data;
    } catch (error) {
        console.error('Falha ao buscar alocações:', error);
        throw new Error('Falha ao buscar alocações.');
    }
};

/**
 * Cria uma ou mais alocações para um node.
 */
export const addAllocations = async (nodeUuid: string, externalIp: string, ports: string, ip: string): Promise<Allocation[]> => {
    try {
        const { data } = await api.post<Allocation[]>('/add-allocations', { uuid: nodeUuid, externalIp, ports, ip });
        return data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Ocorreu um erro ao adicionar alocações.';
            throw new Error(msg);
        }
        throw error;
    }
};

/**
 * Deleta uma alocação específica.
 */
export const deleteAllocation = async (allocationUuid: string): Promise<{ success: true }> => {
    try {
        await api.post('/delete-allocation', { uuid: allocationUuid });
        return { success: true };
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Falha ao deletar alocação.';
            throw new Error(msg);
        }
        throw error;
    }
};

// Mock temporário para evitar que a UI quebre enquanto a API não está 100%
const mockNodes: Node[] = [];

