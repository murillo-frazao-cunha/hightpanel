import { DataType, SchemaColumn } from "../RedisConnector";
import { RedisEntity } from "../types/RedisEntity";
import { RedisTable } from "../types/RedisTable";


// 1. Defina a interface para os dados do seu objeto
export interface ProfileData {
    username: string;
    email: string;
    passwordHash: string;
    createdAt: number;
    lastLogin: number;
    admin: boolean;
}

// 2. Crie a classe da Entidade, estendendo RedisEntity
// É aqui que você pode adicionar métodos específicos do modelo, como `isAdmin()`
export class Profile extends RedisEntity<string, ProfileData> {
    // Acessores e métodos são declarados como se as propriedades de ProfileData existissem aqui.
    // O Proxy no RedisEntity fará a mágica de redirecionar para `this._data`.
    declare username: string;
    declare email: string;
    declare passwordHash: string;
    declare createdAt: number;
    declare lastLogin: number;
    declare admin: boolean;

    // Oculta passwordHash ao serializar
    toJSON() {
        const { passwordHash, ...rest } = this.data as any;
        return { id: this.id, ...rest };
    }
}

// 3. Crie a classe da Tabela, estendendo RedisTable
export class ProfileTable extends RedisTable<string, Profile> {
    // Conecta a tabela à classe de entidade correspondente
    protected entityConstructor = Profile;

    tableName = 'hProfile';

    defineSchema(): SchemaColumn[] {
        return [
            { name: 'username', type: DataType.STRING, indexed: true },
            { name: 'email', type: DataType.STRING, indexed: true },
            { name: 'passwordHash', type: DataType.STRING, indexed: false },
            { name: 'createdAt', type: DataType.LONG, indexed: false },
            { name: 'lastLogin', type: DataType.LONG, indexed: false },
            { name: 'admin', type: DataType.BOOLEAN, indexed: true },
        ];
    }
}
