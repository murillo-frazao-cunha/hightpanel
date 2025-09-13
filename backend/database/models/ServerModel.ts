import { DataType, SchemaColumn } from "../RedisConnector";
import { RedisEntity } from "../types/RedisEntity";
import { RedisTable } from "../types/RedisTable";
import {Nodes} from "@/backend/libs/Nodes";


export interface ServerData {
    name: string;
    description: string;
    ownerId: string; // Armazenamos o ID do usuário, não o objeto inteiro
    status: 'running' | 'stopped' | 'installing' | 'error';
    ram: number;
    cpu: number;
    disk: number;
    coreId: string;
    coreName: string;
    nodeUuid: string;
    primaryAllocationId: string;
    additionalAllocationIds?: string[]; // No Redis, isso provavelmente será uma string JSON
    dockerImage: string;
    environment: { [key: string]: any }; // No Redis, isso também será uma string JSON

    databasesQuantity: number;
    databases: { [key: string]: any }[]; // E isso também será uma string JSON

    // quantidade de alocações adicionais que o user mesmo pode criar
    addicionalAllocationsNumbers: number;
}


// 2. Crie a classe da Entidade, estendendo RedisEntity
// Aqui você pode adicionar métodos específicos, como `getOwner()` ou `isRunning()`
export class Servers extends RedisEntity<string, ServerData> {
    declare name: string;
    declare description: string;
    declare ownerId: string;
    declare status: 'running' | 'stopped' | 'installing' | 'error';
    declare ram: number;
    declare cpu: number;
    declare disk: number;
    declare databasesQuantity: number;
    declare databases: { [key: string]: any }[];

    declare coreId: string;
    declare coreName: string;
    declare nodeUuid: string;
    declare primaryAllocationId: string;
    declare additionalAllocationIds?: string[];
    declare dockerImage: string;
    declare environment: { [key: string]: any };

    // quantidade de alocações adicionais que o user mesmo pode criar
    declare addicionalAllocationsNumbers: number;


    async getNode() {
        return Nodes.getNode(this.nodeUuid)
    }

}

// 3. Crie a classe da Tabela, estendendo RedisTable
export class ServerTable extends RedisTable<string, Servers> {
    // Conecta a tabela à classe de entidade correspondente
    protected entityConstructor = Servers;

    // Prefixo para as chaves deste modelo no Redis (ex: hServers:uuid-do-servidor)
    tableName = 'hServers';

    defineSchema(): SchemaColumn[] {
        return [
            { name: 'name', type: DataType.STRING, indexed: true },
            { name: 'description', type: DataType.STRING, indexed: false },
            // Armazena o ID do proprietário. Indexado para buscas rápidas por usuário.
            { name: 'ownerId', type: DataType.STRING, indexed: true },
            // Status é bom para indexar, pois é comum filtrar por ele.
            { name: 'status', type: DataType.STRING, indexed: true },
            { name: 'ram', type: DataType.LONG, indexed: false },
            { name: 'cpu', type: DataType.LONG, indexed: false },
            { name: 'disk', type: DataType.LONG, indexed: false },
            { name: 'coreId', type: DataType.STRING, indexed: false },
            { name: 'coreName', type: DataType.STRING, indexed: false },
            // nodeUuid é uma "chave estrangeira", ideal para indexação.
            { name: 'nodeUuid', type: DataType.STRING, indexed: true },
            { name: 'primaryAllocationId', type: DataType.STRING, indexed: false },
            // Arrays e objetos são geralmente armazenados como strings JSON no Redis Hash.
            // A lógica de serialização/deserialização fica na sua aplicação.
            { name: 'additionalAllocationIds', type: DataType.STRING, indexed: false },
            { name: 'dockerImage', type: DataType.STRING, indexed: false },
            { name: 'environment', type: DataType.STRING, indexed: false },

            { name: 'databasesQuantity', type: DataType.LONG, indexed: false },
            { name: 'databases', type: DataType.STRING, indexed: false },

            { name: 'addicionalAllocationsNumbers', type: DataType.LONG, indexed: false },
        ];
    }
}