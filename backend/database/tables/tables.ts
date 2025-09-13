import { RedisConnector } from "../RedisConnector";
import { ProfileTable } from "../models/ProfileTable";
// O caminho do import deve ser ajustado para corresponder à estrutura do seu projeto.
// Supondo que `lib` está na raiz do projeto.
import { getRedisInstance } from "../redis";
import {NodeTable} from "@/backend/database/models/NodeModel";
import {AllocationTable} from "@/backend/database/models/AllocationModel";
import {CoreTable} from "@/backend/database/models/CoreModel";
import {ServerTable} from "@/backend/database/models/ServerModel";
import {DatabaseHostTable} from "@/backend/database/models/DatabasesHosts";

// Interface para definir a estrutura do objeto de tabelas
export interface ITables {
    profileTable: ProfileTable;
    coreTable : CoreTable
    nodeTable: NodeTable
    allocationTable: AllocationTable
    serverTable: ServerTable
    databaseHostTable: DatabaseHostTable
    connector: RedisConnector;
}

// Usamos uma promise em cache para garantir que a inicialização ocorra apenas uma vez.
let tablesPromise: Promise<ITables> | null = null;

/**
 * Garante que a conexão com o Redis esteja ativa, inicializa todas as tabelas
 * e retorna um objeto contendo suas instâncias.
 * * Esta função segue o padrão Singleton, garantindo que as tabelas sejam
 * instanciadas apenas uma vez durante o ciclo de vida da aplicação.
 * * @returns {Promise<ITables>} Um objeto com todas as instâncias das tabelas prontas para uso.
 */
export const getTables = (): Promise<ITables> => {
    if (!tablesPromise) {
        tablesPromise = (async () => {
            // 1. Obtém a instância do conector de forma assíncrona.
            // A lógica de cache e conexão está toda dentro de getRedisInstance.
            const connector = await getRedisInstance();

            // 2. Inicializa e retorna o objeto com as tabelas.
            const tables: ITables = {
                profileTable: new ProfileTable(connector),
                nodeTable: new NodeTable(connector),
                serverTable: new ServerTable(connector),
                coreTable: new CoreTable(connector),
                allocationTable: new AllocationTable(connector),
                databaseHostTable: new DatabaseHostTable(connector),
                // outraTabela: new OutraTabela(connector),
                connector: connector, // Exporta o conector para uso direto se necessário (ex: disconnect)
            };
            return tables;
        })();
    }

    return tablesPromise;
};
