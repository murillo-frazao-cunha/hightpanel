import { DataType, SchemaColumn } from "../RedisConnector";
import { RedisEntity } from "../types/RedisEntity";
import { RedisTable } from "../types/RedisTable";
import {Nodes} from "@/backend/libs/Nodes";


export interface DatabaseData {
    name: string
    host: string
    port: number
    username: string
    password: string
    phpmyAdminLink?: string
}


// 2. Crie a classe da Entidade, estendendo RedisEntity
// Aqui você pode adicionar métodos específicos, como `getOwner()` ou `isRunning()`
export class Databases extends RedisEntity<string, DatabaseData> {

    declare name : string
    declare host : string
    declare port : number
    declare username : string
    declare password : string
    declare phpmyAdminLink ?: string
}

// 3. Crie a classe da Tabela, estendendo RedisTable
export class DatabaseHostTable extends RedisTable<string, Databases> {
    // Conecta a tabela à classe de entidade correspondente
    protected entityConstructor = Databases;

    // Prefixo para as chaves deste modelo no Redis (ex: hServers:uuid-do-servidor)
    tableName = 'hDatabaseHosts';

    defineSchema(): SchemaColumn[] {
        return [
            { name: 'name', type: DataType.STRING, indexed: true },
            { name: 'host', type: DataType.STRING, indexed: true },
            { name: 'port', type: DataType.LONG, indexed: false },
            { name: 'username', type: DataType.STRING, indexed: false },
            { name: 'password', type: DataType.STRING, indexed: false },
            {name: 'phpmyAdminLink', type: DataType.STRING, indexed: false }
        ];
    }
}