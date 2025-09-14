import { getTables } from "@/backend/database/tables/tables";

import { randomUUID } from "crypto";
import {Core, CoreData} from "@/backend/database/models/CoreModel";

// Classe para encapsular a lógica de negócios dos Cores
export class Cores {

    /**
     * Busca um Core pelo seu UUID.
     */
    static async getCore(uuid: string): Promise<Core | null> {
        const { coreTable } = await getTables();
        return coreTable.get(uuid);
    }

    /**
     * Busca todos os Cores.
     */
    static async getAllCores(): Promise<Core[]> {
        const { coreTable } = await getTables();
        return coreTable.getAll();
    }

    /**
     * Busca um Core pelo nome.
     */
    static async findByName(name: string): Promise<Core | null> {
        const { coreTable } = await getTables();
        const results = await coreTable.findByParam('name', name);
        return results[0] || null;
    }

    /**
     * Cria um novo Core no banco de dados.
     */
    static async createCore(data: Omit<CoreData, 'dockerImages' | 'variables'> & { dockerImages: any[], variables: any[] }): Promise<Core> {
        const { coreTable } = await getTables();
        const uuid = randomUUID();

        const coreDataForDB: CoreData = {
            ...data,
            description: data.description || '',
            creatorEmail: data.creatorEmail || 'unknown',
            dockerImages: JSON.stringify(data.dockerImages || []),
            variables: JSON.stringify(data.variables || []),
        } as CoreData;

        return coreTable.insert(uuid, coreDataForDB);
    }
}
