import { DataType, SchemaColumn } from "../RedisConnector";
import { RedisEntity } from "../types/RedisEntity";
import { RedisTable } from "../types/RedisTable";


// 1. Defina a interface para os dados do seu objeto
export interface NodeData {
    name: string;
    ip: string;
    port: number;
    sftp: number;
    ssl: boolean;
    status: 'online' | 'offline';
    location?: string; // nova propriedade opcional para localização/categoria
}


// 2. Crie a classe da Entidade, estendendo RedisEntity
// É aqui que você pode adicionar métodos específicos do modelo, como `isAdmin()`
export class Node extends RedisEntity<string, NodeData> {
    declare name: string;
    declare ip: string
    declare port: number;
    declare sftp: number
    declare ssl: boolean
    declare status: 'online' | 'offline';
    declare location?: string; // declarando no runtime/TS
}

// 3. Crie a classe da Tabela, estendendo RedisTable
export class NodeTable extends RedisTable<string, Node> {
    // Conecta a tabela à classe de entidade correspondente
    protected entityConstructor = Node;

    tableName = 'hNodes';

    defineSchema(): SchemaColumn[] {
        return [
            { name: 'name', type: DataType.STRING, indexed: true },
            { name: 'ip', type: DataType.STRING, indexed: false },
            { name: 'port', type: DataType.LONG, indexed: false },
            { name: 'sftp', type: DataType.LONG, indexed: false },
            { name: 'ssl', type: DataType.BOOLEAN, indexed: false },
            { name: 'status', type: DataType.STRING, indexed: false },
            { name: 'location', type: DataType.STRING, indexed: true }, // novo campo indexado para futuras buscas por localização
        ];
    }
}
