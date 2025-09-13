import { getTables } from "@/backend/database/tables/tables";
import { randomUUID } from "crypto";
import { Servers, ServerData as ServerModelData } from "@/backend/database/models/ServerModel";

import axios from 'axios';
import {Users} from "@/backend/libs/User";
import {Cores} from "@/backend/libs/Cores";
import {Nodes} from "@/backend/libs/Nodes";
import {Profile} from "@/backend/database/models/ProfileTable";

// Interface local para corresponder à definição do frontend
export interface ServerData {
    name: string;
    description: string;
    owner: Profile;
    status: 'running' | 'stopped' | 'installing' | 'error';
    ram: number;
    cpu: number;
    disk: number;
    coreId: string;
    coreName: string;
    nodeUuid: string;
    primaryAllocationId: string;
    additionalAllocationIds?: string[];
    dockerImage: string;
    environment: { [key: string]: any };
    // Novos campos de limites configuráveis
    databasesQuantity: number; // Quantidade máxima de databases que o user pode criar
    addicionalAllocationsNumbers: number; // Quantidade de alocações adicionais que o user pode criar por conta própria
}


// Tipos de entrada baseados na nova ServerData
// Mantemos additionalAllocationIds como responsabilidade interna na criação (inicial vazio)
type CreateServerData = Omit<ServerData, 'status' | 'additionalAllocationIds'>;
type UpdateServerData = Partial<Omit<ServerData, 'status' | 'coreId' | 'coreName' | 'nodeUuid'>>;


// Classe para encapsular a lógica de negócios dos Servidores
export class ServerApi {

    /**
     * Busca um Servidor pelo seu UUID.
     * @param uuid - O UUID do servidor a ser buscado.
     * @returns O objeto do Servidor ou null se não for encontrado.
     */
    static async getServer(uuid: string): Promise<Servers | null> {
        const { serverTable } = await getTables();
        return serverTable.get(uuid);
    }

    /**
     * Busca todos os Servidores.
     * @returns Um array com todos os servidores.
     */
    static async getAllServers(): Promise<Servers[]> {
        const { serverTable } = await getTables();
        return serverTable.getAll();
    }

    /**
     * Busca um Servidor pelo nome.
     * @param name - O nome do servidor a ser buscado.
     * @returns O primeiro servidor encontrado com o nome ou null.
     */
    static async findByName(name: string): Promise<Servers | null> {
        const { serverTable } = await getTables();
        const results = await serverTable.findByParam('name', name);
        return results[0] || null;
    }

    /**
     * Busca todos os servidores pertencentes a um usuário.
     * @param ownerId - O UUID do proprietário.
     * @returns Um array com os servidores do usuário.
     */
    static async findByOwner(ownerId: string): Promise<Servers[]> {
        const { serverTable } = await getTables();
        return serverTable.findByParam('ownerId', ownerId);
    }

    /**
     * Cria um novo Servidor.
     * @param creator - Quem cria o servidor
     * @param data - Os dados para a criação do servidor.
     * @returns O servidor recém-criado.
     */
    static async createServer(creator: Profile, data: CreateServerData): Promise<Servers> {
        const { serverTable, allocationTable } = await getTables();
        const { owner, nodeUuid, coreId, primaryAllocationId } = data;

        // 1. Validar Entidades Principais
        if (!await Users.getUser(owner.id)) throw new Error("Usuário (dono) não encontrado.");
        if (!await Cores.getCore(coreId)) throw new Error("Core não encontrado.");
        const node = await Nodes.getNode(nodeUuid);
        if (!node) throw new Error("Node não encontrado.");

        // 2. Validar e Verificar Disponibilidade da Alocação Principal
        const allocation = await allocationTable.get(primaryAllocationId);
        if (!allocation) throw new Error(`Alocação principal ${primaryAllocationId} não encontrada.`);
        if (allocation.nodeId !== nodeUuid) throw new Error(`Alocação ${primaryAllocationId} não pertence ao Node especificado.`);
        if (allocation.assignedTo) throw new Error(`Alocação ${primaryAllocationId} já está em uso pelo servidor ${allocation.assignedTo}.`);

        const uuid = randomUUID();

        // 3. Comunicação com o Daemon
        try {
            const response = await axios.post(node.getUrl() + "/api/v1/servers/create", {
                token: process.env.TOKEN,
                userUuid: creator.id,
                serverId: uuid
            });
            if(response.data.status !== 'success') {
                throw new Error("O daemon falhou em criar o servidor.");
            }
        } catch (error) {
            // @ts-ignore
            console.log(error.response?.data)
            console.error("Falha na comunicação com o daemon:", error);
            throw new Error("Não foi possível criar o servidor no node. Verifique se o daemon está online e acessível.");
        }

        // 4. Salvar o servidor no banco de dados
        const serverDataForDB: ServerModelData = {
            coreName: data.coreName, dockerImage: data.dockerImage, nodeUuid: data.nodeUuid, primaryAllocationId: data.primaryAllocationId,
            name: data.name,
            description: data.description,
            ownerId: owner.id,
            ram: data.ram,
            cpu: data.cpu,
            disk: data.disk,
            coreId: coreId,

            status: 'stopped',
            additionalAllocationIds: [], // Inicializa como array vazio na criação
            environment: data.environment || {},
            databasesQuantity: data.databasesQuantity ?? 0,
            databases: [],
            addicionalAllocationsNumbers: data.addicionalAllocationsNumbers ?? 0
        };
        const newServer = await serverTable.insert(uuid, serverDataForDB);

        // 5. Atualizar a alocação para marcá-la como "em uso"
        try {
            allocation.assignedTo = uuid;
            await allocation.save();
        } catch (error) {
            await newServer.delete();
            console.error("Falha ao atualizar alocação. Criação do servidor revertida.", error);
            throw new Error("Ocorreu um erro ao atribuir o IP ao servidor. A operação foi cancelada.");
        }

        return newServer;
    }

    static async deleteServer(creator: Profile,uuid: string): Promise<void> {
        const {serverTable, allocationTable} = await getTables();

        const server = await serverTable.get(uuid);
        if (!server) {
            throw new Error("Servidor não encontrado para exclusão.");
        }

        const node = await Nodes.getNode(server.nodeUuid);
        if (!node) {
            throw new Error("Node do servidor não encontrado.");
        }
        // Comunicação com o Daemon para deletar o servidor
        try {
            const response = await axios.post(node.getUrl() + "/api/v1/servers/delete", {
                token: process.env.TOKEN,
                serverId: uuid,
                userUuid: creator.id
            });
            if(response.data.status !== 'success') {
                throw new Error("O daemon falhou em deletar o servidor.");
            }

            // Após confirmação do daemon, remover o servidor do banco de dados
            await server.delete();

            // Liberar a alocação principal
            const primaryAlloc = await allocationTable.get(server.primaryAllocationId);
            if (primaryAlloc) {
                primaryAlloc.assignedTo = null;
                await primaryAlloc.save();
            }

            // Liberar alocações adicionais
            if (server.additionalAllocationIds && server.additionalAllocationIds.length > 0) {
                for (const allocId of server.additionalAllocationIds) {
                    const additionalAlloc = await allocationTable.get(allocId);
                    if (additionalAlloc) {
                        additionalAlloc.assignedTo = null;
                        await additionalAlloc.save();
                    }
                }
            }
        } catch (error) {
            console.error("Falha na comunicação com o daemon para exclusão:", error);
            throw new Error("Não foi possível comunicar com o daemon para excluir o servidor. Verifique se o daemon está online e acessível.");
        }
    }

    /**
     * Atualiza um servidor existente.
     * @param uuid - O UUID do servidor a ser atualizado.
     * @param data - Os dados a serem atualizados.
     * @returns O servidor atualizado.
     */
    static async updateServer(uuid: string, data: UpdateServerData): Promise<Servers> {
        const { serverTable, allocationTable } = await getTables();

        const server = await serverTable.get(uuid);
        if (!server) {
            throw new Error("Servidor não encontrado para atualização.");
        }


        if (data.owner?.id && data.owner?.id !== server.ownerId) {
            if (!await Users.getUser(data.owner?.id)) {
                throw new Error("Novo usuário (dono) não encontrado.");
            }
        }

        // Lógica de gerenciamento de alocações
        const oldAllocations = new Set([server.primaryAllocationId, ...(server.additionalAllocationIds || [])]);
        const newPrimaryAllocation = data.primaryAllocationId || server.primaryAllocationId;
        const newAdditionalAllocations = data.additionalAllocationIds || server.additionalAllocationIds || [];
        const newAllocations = new Set([newPrimaryAllocation, ...newAdditionalAllocations]);

        const allocationsToAdd = [...newAllocations].filter(id => !oldAllocations.has(id));
        const allocationsToRemove = [...oldAllocations].filter(id => !newAllocations.has(id));

        // Valida e atribui novas alocações
        for (const allocId of allocationsToAdd) {
            const allocation = await allocationTable.get(allocId);
            if (!allocation) throw new Error(`Alocação ${allocId} não encontrada.`);
            if (allocation.assignedTo) throw new Error(`Alocação ${allocId} já está em uso.`);

            allocation.assignedTo = uuid;
            await allocation.save();
        }

        // Libera alocações antigas
        for (const allocId of allocationsToRemove) {
            const allocation = await allocationTable.get(allocId);
            if (allocation) {
                allocation.assignedTo = null;
                await allocation.save();
            }
        }

        // Atualiza campos simples (incluindo quotas novas)
        // @ts-ignore
        Object.assign(server, data);
        await server.save();

        return server;
    }
}
