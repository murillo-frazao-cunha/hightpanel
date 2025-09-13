import { DataType, SchemaColumn } from "../RedisConnector";
import { RedisEntity } from "../types/RedisEntity";
import { RedisTable } from "../types/RedisTable";

// 1. Interface para os dados da Alocação
export interface AllocationData {
    nodeId: string;
    ip: string;
    externalIp: string | null;
    port: number;
    assignedTo: string | null; // UUID do servidor ao qual está atribuída, ou null se não estiver atribuída
}

// 2. Classe da Entidade Allocation
export class Allocation extends RedisEntity<string, AllocationData> {
    declare nodeId: string;
    declare ip: string;
    declare externalIp: string | null;
    declare port: number;
    declare assignedTo: string | null; // UUID do servidor ao qual está atribuída, ou null se não estiver atribuída
}

// 3. Classe da Tabela de Alocações
export class AllocationTable extends RedisTable<string, Allocation> {
    protected entityConstructor = Allocation;
    tableName = 'hAllocations'; // Prefixo para as chaves no Redis

    defineSchema(): SchemaColumn[] {
        return [
            // Indexado para buscar rapidamente todas as alocações de um node
            { name: 'nodeId', type: DataType.STRING, indexed: true },
            { name: 'ip', type: DataType.STRING, indexed: false },
            { name: 'externalIp', type: DataType.STRING, indexed: false },
            // Indexado para evitar duplicatas de porta no mesmo IP
            { name: 'port', type: DataType.LONG, indexed: true },
            { name: 'assignedTo', type: DataType.STRING, indexed: true }, // Pode ser null
        ];
    }
}
