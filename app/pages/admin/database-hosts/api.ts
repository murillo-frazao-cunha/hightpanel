import axios from 'axios';
import type { DatabaseHost } from './types/DatabaseHostType';

const API_BASE_URL = '/api/admin/database-hosts';
const api = axios.create({ baseURL: API_BASE_URL });

export const getDatabaseHosts = async (): Promise<DatabaseHost[]> => {
  try {
    const { data } = await api.get<DatabaseHost[]>('');
    return data;
  } catch (error) {
    console.error('Erro em getDatabaseHosts:', error);
    return [];
  }
};

export const getDatabaseHostByUuid = async (uuid: string): Promise<DatabaseHost | null> => {
  try {
    const { data } = await api.post<DatabaseHost>('/uuid', { uuid });
    return data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    console.error('Erro em getDatabaseHostByUuid:', error);
    throw new Error('Falha ao buscar host.');
  }
};

export const saveDatabaseHost = async (hostData: DatabaseHost): Promise<DatabaseHost> => {
  const isEditing = !!hostData.id;
  const url = isEditing ? '/edit' : '/create';
  try {
    // backend espera uuid como 'uuid'
    // @ts-ignore
    hostData.uuid = hostData.id || '';
    // Se password vier vazio em edição, remove para não sobrescrever
    if (isEditing && (hostData as any).password === '') delete (hostData as any).password;
    const { data } = await api.post<DatabaseHost>(url, hostData);
    return data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const msg = error.response.data?.error || 'Erro ao salvar host.';
      throw new Error(msg);
    }
    throw error;
  }
};

export const deleteDatabaseHost = async (uuid: string): Promise<{ success: boolean }> => {
  try {
    await api.post('/delete', { uuid });
    return { success: true };
  } catch (error) {
    console.error('Erro em deleteDatabaseHost:', error);
    return { success: false };
  }
};

