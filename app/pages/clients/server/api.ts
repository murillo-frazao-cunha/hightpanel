import axios from 'axios';

// Base Axios instance para rotas de cliente de servidores
const api = axios.create({
    baseURL: '/api/client/servers'
});

// Tipos básicos que o front precisa (pode ser expandido conforme necessidade real)
export interface ClientServerAllocation {
    id?: string;
    externalIp?: string;
    internalIp?: string;
    port?: number;
}

export interface ClientServerCore {
    id?: string;
    name?: string;
    startupCommand?: string;
}

export interface ServerDatabase {
    id: string;
    hostId: string;      // id do host escolhido automaticamente
    host?: string;       // endereço do host (adicionado no backend)
    port?: number;       // porta do host
    name: string;
    username: string;
    password?: string;   // senha (exposta apenas na criação)
    createdAt?: number;  // timestamp
    phpmyAdminLink?: string; // link opcional para acessar phpMyAdmin
}

export interface ClientServerData {
    id: string;
    name: string;
    description?: string;
    status: string;
    ram: number;
    cpu: number;
    disk: number;
    dockerImage?: string;
    environment?: Record<string, any>;
    primaryAllocation?: ClientServerAllocation;
    additionalAllocation?: ClientServerAllocation[];
    core?: ClientServerCore;
    // --- Novos campos de databases ---
    databasesQuantity?: number;
    databases?: ServerDatabase[];
}

export interface ServerStatusResponse {
    status: string; // ex: online, offline, starting
    cpu?: number;   // uso atual de cpu
    ram?: { used: number; total: number }; // memória em MiB
    disk?: { used: number; total: number }; // disco em MiB
    uptime?: number; // segundos
    players?: { online: number; max: number }; // caso seja um servidor de jogo
    lastUpdate?: number; // timestamp
    [key: string]: any;
}

export interface ServerUsage {
    cpu: number;
    memory: number; // bytes usados
    memoryLimit: number; // bytes limite
    memoryPercent?: number;
    state?: string; // estado bruto vindo do node
    startedAt?: number; // timestamp (ms)
    uptimeMs?: number; // duração em ms
}

// ---- Funções ----

export async function getClientServer(uuid: string): Promise<ClientServerData | null> {
    try {
        const { data } = await api.post('/uuid', { uuid });
        return data;
    } catch (error: any) {
        if (axios.isAxiosError(error) && error.response?.status === 404) return null;
        console.error('Erro ao buscar servidor (cliente):', error);
        throw new Error(error.response?.data?.error || 'Falha ao buscar servidor.');
    }
}

export async function getServerStatus(uuid: string): Promise<ServerStatusResponse> {
    try {
        const { data } = await api.post('/status', { uuid });

        return data;
    } catch (error: any) {
        console.error('Erro ao obter status do servidor:', error);
        throw new Error(error.response?.data?.error || 'Falha ao obter status do servidor.');
    }
}

export type ServerAction = 'start' | 'stop' | 'restart' | 'command' | 'kill';

interface SendActionOptions {
    uuid: string;
    action: ServerAction;
    command?: string; // obrigatório quando action === 'command'
}

export async function sendServerAction({ uuid, action, command }: SendActionOptions): Promise<{ success: boolean }> {
    try {
        const payload: any = { uuid, action };
        if (action === 'command') {
            if (!command) throw new Error('O comando é obrigatório para a ação command.');
            payload.command = command;
        }
        const { data } = await api.post('/action', payload);
        return { success: data?.success === true };
    } catch (error: any) {
        console.error('Erro ao enviar ação ao servidor:', error);
        throw new Error(error.response?.data?.error || 'Falha ao enviar ação ao servidor.');
    }
}

export async function getClientServers(others = false): Promise<ClientServerData[]> {
    try {
        const { data } = await api.post('/get-all', { others });
        return data;
    } catch (error: any) {
        console.error('Erro ao listar servidores (cliente):', error);
        throw new Error(error.response?.data?.error || 'Falha ao listar servidores.');
    }
}

export async function changeAllocation(uuid: string, allocationId: string | null): Promise<{ success: boolean }> {
    try {
        // api solicita action e uuid como parametro
        const action = allocationId ? 'remove' : 'add';
        const { data } = await api.post('/change-allocation', { uuid, action, allocationId });
        return { success: data?.success === true };
    } catch (error: any) {
        console.error('Erro ao alterar alocação do servidor:', error);
        throw new Error(error.response?.data?.error || 'Falha ao alterar alocação do servidor.');
    }
}

export async function editName(uuid: string, name: string, description: string): Promise<{ success: boolean }> {
    try {
        const { data } = await api.post('/edit-name', { uuid, name, description });
        return { success: data?.success === true };
    }
    catch (error: any) {
        console.error('Erro ao editar nome do servidor:', error);
        throw new Error(error.response?.data?.error || 'Falha ao editar nome do servidor.');
    }
}

export async function editStartup(uuid: string, dockerImage: string, environment: Record<string, string>): Promise<{ success: boolean }> {
    try {
        const { data } = await api.post('/edit-startup', { uuid, dockerImage, environment });
        return { success: data?.success === true };
    }
    catch (error: any) {
        console.error('Erro ao editar inicialização do servidor:', error);
        throw new Error(error.response?.data?.error || 'Falha ao editar inicialização do servidor.');
    }
}

export async function getServerUsage(uuid: string): Promise<ServerUsage> {
    try {
        const { data } = await api.post('/usage', { uuid });

        if (data?.usage) return data.usage as ServerUsage;
        throw new Error('Formato de resposta inesperado.');
    } catch (error: any) {
        console.error('Erro ao obter uso do servidor:', error);
        throw new Error(error.response?.data?.error || 'Falha ao obter uso do servidor.');
    }
}

// --- Databases ---
/**
 * Retorna apenas a lista de databases do servidor (atalho de /uuid).
 */
export async function getServerDatabases(uuid: string): Promise<ServerDatabase[]> {
    const server = await getClientServer(uuid);
    return server?.databases || [];
}

/**
 * Cria uma nova database para o servidor.
 * Backend escolhe automaticamente o primeiro host funcional.
 * @param uuid UUID do servidor
 * @param name Nome base desejado (será prefixado no backend)
 */
export async function createServerDatabase(uuid: string, name: string): Promise<{ success: boolean; database?: ServerDatabase; }> {
    try {
        const { data } = await api.post('/create-database', { uuid, name });
        return { success: data?.success === true, database: data?.database };
    } catch (error: any) {
        console.error('Erro ao criar database:', error);
        throw new Error(error.response?.data?.error || 'Falha ao criar database.');
    }
}

/**
 * Remove (drop) uma database existente vinculada ao servidor.
 * @param uuid UUID do servidor
 * @param name Nome completo da database (retornado em getServerDatabases)
 */
export async function deleteServerDatabase(uuid: string, name: string): Promise<{ success: boolean; }> {
    try {
        const { data } = await api.post('/delete-database', { uuid, name });
        return { success: data?.success === true };
    } catch (error: any) {
        console.error('Erro ao deletar database:', error);
        throw new Error(error.response?.data?.error || 'Falha ao deletar database.');
    }
}

// Polling helper para status (opcional)
export function createStatusPoller(uuid: string, intervalMs = 4000, onUpdate?: (s: ServerStatusResponse) => void) {
    let timer: any;
    let stopped = false;

    async function tick() {
        if (stopped) return;
        try {
            const status = await getServerStatus(uuid);
            onUpdate?.(status);
        } catch (e) {
            console.warn('Falha no polling de status:', e);
        } finally {
            if (!stopped) timer = setTimeout(tick, intervalMs);
        }
    }

    tick();

    return () => {
        stopped = true;
        if (timer) clearTimeout(timer);
    };
}
