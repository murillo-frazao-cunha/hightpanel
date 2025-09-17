import { DataType, SchemaColumn } from "../RedisConnector";
import { RedisEntity } from "../types/RedisEntity";
import { RedisTable } from "../types/RedisTable";


// 1. Defina a interface para os dados do seu objeto
export interface ApiData {
    name: string;
    description: string;
    createdAt: number;
    lastUsedAt: number;
}

// 2. Crie a classe da Entidade, estendendo RedisEntity
// É aqui que você pode adicionar métodos específicos do modelo, como `isAdmin()`
export class ApiModel extends RedisEntity<string, ApiData> {
   declare name: string;
    declare description: string
    declare createdAt: number
    declare lastUsedAt: number;

    // Oculta passwordHash ao serializar
    toJSON() {
        const { passwordHash, ...rest } = this.data as any;
        return { id: this.id, ...rest };
    }
}

// 3. Crie a classe da Tabela, estendendo RedisTable
export class ApiTable extends RedisTable<string, ApiModel> {
    // Conecta a tabela à classe de entidade correspondente
    protected entityConstructor = ApiModel;

    tableName = 'hApi';

    defineSchema(): SchemaColumn[] {
        return [
            { name: 'name', type: DataType.STRING, indexed: false },
            { name: 'description', type: DataType.STRING, indexed: false },
            { name: 'token', type: DataType.STRING, indexed: true },
            { name: 'createdAt', type: DataType.LONG, indexed: false },
            { name: 'lastUsedAt', type: DataType.LONG, indexed: false },
        ];
    }
}
