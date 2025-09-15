// Define a estrutura para uma única alocação de IP/Porta
export interface Allocation {
    id: string;
    ip: string;
    externalIp: string | null;
    port: number;
    nodeId: string;
    assignedToServerId?: string | null; // novo campo
    // Futuramente: assignedToServerId: string | null;
}

// Atualiza a interface do Node para incluir as alocações e localização
export interface Node {
    uuid: string;
    id: number;
    name: string;
    ip: string;
    port: number;
    sftp: number;
    ssl: boolean;
    status: 'online' | 'offline';
    location?: string | null; // nova propriedade
    allocations?: Allocation[]; // Lista de alocações (opcional)
}
