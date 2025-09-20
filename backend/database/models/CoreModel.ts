import { DataType, SchemaColumn } from "../RedisConnector";
import { RedisEntity } from "../types/RedisEntity";
import { RedisTable } from "../types/RedisTable";

// Tipos para os objetos aninhados que serão armazenados como JSON
export interface CoreImage {
    name: string;
    image: string;
}

export interface CoreVariable {
    name: string;
    description: string;
    envVariable: string;
    rules: string;
}

// 1. Defina a interface para os dados do Core
export interface CoreData {
    name: string;
    installScript: string;
    startupCommand: string;
    stopCommand: string;
    // Armazenaremos arrays de objetos como strings JSON no Redis
    dockerImages: string;
    startupParser: string;
    configSystem: string;
    variables: string;
    description: string; // novo
    creatorEmail: string; // novo

    createdAt: number
}

// 2. Crie a classe da Entidade Core
export class Core extends RedisEntity<string, CoreData> {
    declare name: string;
    declare installScript: string;
    declare startupCommand: string;
    declare stopCommand: string;

    declare createdAt: number;

    // Getters para desserializar os campos JSON
    get dockerImages(): CoreImage[] {
        try {
            return JSON.parse(this.data.dockerImages || '[]');
        } catch {
            return [];
        }
    }

    get variables(): CoreVariable[] {
        try {
            return JSON.parse(this.data.variables || '[]');
        } catch {
            return [];
        }
    }

    // Métodos para retornar os campos JSON como strings brutas, se necessário
    get startupParser(): string { return this.data.startupParser; }
    get configSystem(): string { return this.data.configSystem; }
}

// 3. Crie a classe da Tabela de Cores
export class CoreTable extends RedisTable<string, Core> {
    protected entityConstructor = Core;
    tableName = 'hCores';

    defineSchema(): SchemaColumn[] {
        return [
            { name: 'name', type: DataType.STRING, indexed: true },
            { name: 'installScript', type: DataType.STRING, indexed: false },
            { name: 'startupCommand', type: DataType.STRING, indexed: false },
            { name: 'stopCommand', type: DataType.STRING, indexed: false },
            { name: 'dockerImages', type: DataType.STRING, indexed: false },
            { name: 'startupParser', type: DataType.STRING, indexed: false },
            { name: 'configSystem', type: DataType.STRING, indexed: false },
            { name: 'variables', type: DataType.STRING, indexed: false },
            { name: 'description', type: DataType.STRING, indexed: false },
            { name: 'creatorEmail', type: DataType.STRING, indexed: true },

            { name: 'createdAt', type: DataType.LONG, indexed: false },
        ];
    }
}
