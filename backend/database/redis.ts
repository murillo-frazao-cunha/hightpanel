// file: lib/redis.ts

import { RedisConnector, DatabaseConfig } from './RedisConnector'; // Supondo que a classe esteja neste caminho

// --- CONFIGURAÇÃO DA CONEXÃO 1: GLOBAL / PRINCIPAL ---
const dbConfig: DatabaseConfig = {
    // É uma prática de segurança FUNDAMENTAL usar variáveis de ambiente!
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || undefined,
};

// --- CONFIGURAÇÃO DA CONEXÃO 2: SISTEMA DE LINGUAGEM ---
const dbLangConfig: DatabaseConfig = {
    // Novas variáveis de ambiente para a conexão de linguagem
    host: process.env.REDIS_LANG_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_LANG_PORT || '6380', 10), // Usando uma porta diferente como padrão
    password: process.env.REDIS_LANG_PASSWORD || undefined,
};


// --- LÓGICA DE CONEXÃO MELHORADA (PARA AMBAS AS CONEXÕES) ---

// Estendemos a declaração global para suportar ambos os conectores em modo de desenvolvimento.
declare global {
    // eslint-disable-next-line no-var
    let redisConnector: {
        connector: RedisConnector;
        connectionPromise: Promise<void> | null;
    } | undefined;

    // eslint-disable-next-line no-var
    let redisLangConnector: {
        connector: RedisConnector;
        connectionPromise: Promise<void> | null;
    } | undefined;
}

// --- CONECTOR 1: GLOBAL / PRINCIPAL ---

function getCachedConnector() {
    if (process.env.NODE_ENV === 'production') {
        // Em produção, o módulo é inicializado uma vez.
        const connector = new RedisConnector(dbConfig);
        return { connector, connectionPromise: null };
    } else {
        // Em desenvolvimento, usamos o cache global para persistir entre recargas.
        // @ts-ignore
        if (!global.redisConnector) {
            // @ts-ignore
            global.redisConnector = {
                connector: new RedisConnector(dbConfig),
                connectionPromise: null
            };
        }
        // @ts-ignore
        return global.redisConnector;
    }
}

const cache = getCachedConnector();

/**
 * Garante que a conexão GLOBAL com o Redis esteja ativa e retorna a instância do conector.
 * @returns {Promise<RedisConnector>} A instância do conector GLOBAL pronta para uso.
 */
export const getRedisInstance = async (): Promise<RedisConnector> => {
    if (!cache.connectionPromise) {
        console.log("Iniciando conexão com o Redis GLOBAL...");
        cache.connectionPromise = cache.connector.connect().catch((err: any) => {
            cache.connectionPromise = null;
            throw err;
        });
    }
    await cache.connectionPromise;
    return cache.connector;
};

