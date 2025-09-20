// Importa os tipos base de outros módulos para compor o tipo Server
import type { User } from '@/app/pages/admin/users/types/UserType';

/**
 * Define a estrutura completa de um objeto de Servidor.
 */
export interface Server {
    id: string;
    name: string;
    description: string;
    owner: User;
    status: 'running' | 'stopped' | 'installing' | 'error';
    ram: number;
    cpu: number;
    disk: number;
    coreId: string;
    coreName: string;
    nodeUuid: string;
    primaryAllocationId: string; // Renomeado de allocationId
    additionalAllocationIds?: string[]; // Novo campo para alocações extras
    dockerImage: string;
    environment: { [key: string]: any };
    subdomain?: string;

    databasesQuantity: number;
    databases: { [key: string]: any }[]; // E isso também será uma string JSON

    // quantidade de alocações adicionais que o user mesmo pode criar
    addicionalAllocationsNumbers: number;
}
