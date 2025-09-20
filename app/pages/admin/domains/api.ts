import axios from 'axios';
import type { Domain } from './types/DomainType';

const API_BASE_URL = '/api/admin/domains';
const api = axios.create({ baseURL: API_BASE_URL });

export const getDomains = async (): Promise<Domain[]> => {
  try {
    const { data } = await api.get<Domain[]>('');
    return data;
  } catch (error) {
    console.error('Erro em getDomains:', error);
    return [];
  }
};

export const getDomainByUuid = async (uuid: string): Promise<Domain | null> => {
  try {
    const { data } = await api.post<Domain>('/uuid', { uuid });
    return data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response?.status === 404) return null;
    console.error('Erro em getDomainByUuid:', error);
    throw new Error('Falha ao buscar domínio.');
  }
};

export const saveDomain = async (domainData: Domain): Promise<Domain> => {
  const isEditing = !!domainData.id;
  const url = isEditing ? '/edit' : '/create';
  try {
    // backend espera uuid como 'uuid'
    // @ts-ignore
    domainData.uuid = domainData.id || '';
    // se estiver editando e ownerToken vier vazio, remove para não sobrescrever
    if (isEditing && (domainData as any).ownerToken === '') delete (domainData as any).ownerToken;
    const { data } = await api.post<Domain>(url, domainData);
    return data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const msg = error.response.data?.error || 'Erro ao salvar domínio.';
      throw new Error(msg);
    }
    throw error;
  }
};

export const deleteDomain = async (uuid: string): Promise<{ success: boolean }> => {
  try {
    await api.post('/delete', { uuid });
    return { success: true };
  } catch (error) {
    console.error('Erro em deleteDomain:', error);
    return { success: false };
  }
};

