import { DataType, SchemaColumn } from "../RedisConnector";
import { RedisEntity } from "../types/RedisEntity";
import { RedisTable } from "../types/RedisTable";
import {Nodes} from "@/backend/libs/Nodes";
import {getTables} from "@/backend/database/tables/tables";


export interface MigrationData {
    isMigrated: boolean
}


// 2. Crie a classe da Entidade, estendendo RedisEntity
// Aqui você pode adicionar métodos específicos, como `getOwner()` ou `isRunning()`
export class Migration extends RedisEntity<string, MigrationData> {
    declare isMigrated: boolean

    static async isMigrated(): Promise<boolean> {
        const tables = await getTables()
        const migrationTable = tables.migrationTable
        const existingMigrations = await migrationTable.get("panel")
        return existingMigrations ? existingMigrations.isMigrated : false
    }

}

// 3. Crie a classe da Tabela, estendendo RedisTable
export class MigrationTable extends RedisTable<string, Migration> {
    // Conecta a tabela à classe de entidade correspondente
    protected entityConstructor = Migration;

    // Prefixo para as chaves deste modelo no Redis (ex: hServers:uuid-do-servidor)
    tableName = 'hMigration';

    defineSchema(): SchemaColumn[] {
        return [
            { name: 'isMigrated', type: DataType.BOOLEAN, indexed: true }
        ];
    }
}
