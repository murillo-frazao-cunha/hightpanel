import { RedisConnector, DatabaseConfig } from './RedisConnector';

// --- CONFIGURAÇÃO DA CONEXÃO 1: GLOBAL / PRINCIPAL ---
const dbConfig: DatabaseConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB, 10) : 0,
};

// --- CONECTOR ÚNICO ---
let connector: RedisConnector | undefined



/**
 * Garante que a conexão GLOBAL com o Redis esteja ativa e retorna a instância do conector.
 * @param silent Se deve suprimir logs (opcional, padrão true)
 * @returns {Promise<RedisConnector>} A instância do conector GLOBAL pronta para uso.
 */
export const getRedisInstance = async (isOnRegistered: boolean = false): Promise<RedisConnector> => {
    if (!connector) {
        connector = new RedisConnector(dbConfig, process.env.ENCRYPTATION_TOKEN);
        connector.isOnStart = isOnRegistered
        await connector.connect();
    }
    return connector;
};
