import axios from 'axios';
import type { Core } from './types/CoreType';

const API_BASE_URL = '/api/admin/cores'; // Aponta para a nova rota de API dos Cores
const api = axios.create({ baseURL: API_BASE_URL });

/**
 * Busca todos os Cores.
 * @returns Uma Promise com o array de Cores.
 */
export const getCores = async (): Promise<Core[]> => {
    try {
        const { data } = await api.get<Core[]>('');
        return data;
    } catch (error) {
        console.error('Erro em getCores:', error);
        return [];
    }
};

/**
 * Busca um Core específico pelo seu UUID.
 * @param uuid - O UUID do Core a ser buscado.
 * @returns Uma Promise com o Core encontrado ou null.
 */
export const getCoreByUuid = async (uuid: string): Promise<Core | null> => {
    try {
        const { data } = await api.post<Core>('/uuid', { uuid });
        return data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            return null;
        }
        console.error(`Falha ao buscar o core ${uuid}`, error);
        throw new Error(`Falha ao buscar o core.`);
    }
};

/**
 * Salva um Core (cria um novo ou atualiza um existente).
 * @param coreData - Os dados do Core a serem salvos.
 * @returns Uma Promise com o Core salvo.
 * @throws Lança um erro com a mensagem da API em caso de falha.
 */
export const saveCore = async (coreData: Core): Promise<Core> => {
    // A presença de 'id' pode indicar edição, mas 'uuid' é a chave principal.
    // O backend determinará se é uma criação ou edição com base no UUID.
    const url = coreData.id ? '/edit' : '/create';

    try {

        // @ts-ignore
        coreData.uuid = coreData.id || ''
        const { data } = await api.post<Core>(url, coreData);
        return data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Ocorreu um erro desconhecido ao salvar o Core.';
            throw new Error(msg);
        }
        throw error;
    }
};

/**
 * Deleta um Core pelo seu UUID.
 * @param uuid - O UUID do Core a ser deletado.
 * @returns Uma Promise com o resultado da operação.
 */
export const deleteCore = async (uuid: string): Promise<{ success: boolean }> => {
    try {
        await api.post('/delete', { uuid });
        return { success: true };
    } catch (error) {
        console.error('Erro de rede ao tentar deletar o Core:', error);
        return { success: false };
    }
}

/** Exporta um core específico em formato JSON estruturado. */
export const exportCore = async (uuid: string): Promise<any> => {
    try {
        const { data } = await api.post('/export', { uuid });
        return data; // { version, exportedAt, core: {...} }
    } catch (error) {
        console.error('Erro ao exportar core:', error);
        throw new Error('Falha ao exportar core.');
    }
};

/** Importa um core a partir de um objeto JSON previamente exportado. */
export const importCore = async (coreJson: any): Promise<any> => {
    try {
        const payload = coreJson.core ? coreJson : { core: coreJson }; // aceita diretamente o objeto ou wrapper
        const { data } = await api.post('/import', payload);
        return data; // { imported: true, core: {...} }
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response) {
            const msg = error.response.data?.error || 'Erro ao importar core.';
            throw new Error(msg);
        }
        throw error;
    }
};
