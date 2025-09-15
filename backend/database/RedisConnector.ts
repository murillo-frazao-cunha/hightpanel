import Redis, { Redis as RedisClient } from 'ioredis';
import { Buffer } from 'buffer';
import crypto from 'crypto';

// --- INTERFACES E TIPOS (mantidos do seu código original) ---

export interface DatabaseConfig {
    host: string;
    port: number;
    password?: string;
    db?: number;
}

export enum DataType {
    STRING,
    TEXTUNIQUE,
    INT,
    LONG,
    DOUBLE,
    BOOLEAN,
    BLOB,
}

export interface SchemaColumn {
    name: string;
    type: DataType;
    indexed?: boolean;
}

export interface Table<K, V> {
    tableName: string;
    defineSchema(): SchemaColumn[];
}

// --- CLASSE DO CONECTOR REDIS ---
// Esta classe foi modificada para incluir criptografia.

export class RedisConnector {
    private readonly config: DatabaseConfig;
    private client!: RedisClient;
    private readonly encryptionKey: string | undefined;
    private readonly iv_separator = ':'; // Separador para IV e dados criptografados

    constructor(dbConfig: DatabaseConfig, encryptionKey?: string) {
        this.config = dbConfig;
        this.encryptionKey = encryptionKey;

        // Valida a chave de criptografia se ela for fornecida
        if (this.encryptionKey) {
            if (this.encryptionKey.length !== 32) {
                throw new Error("A chave de criptografia deve ter 32 caracteres (256 bits). Por favor, verifique sua variável de ambiente ENCRYPTION_KEY.");
            }
        }

        if (this.config.password === '') {
            delete this.config.password;
        }
    }

    public async connect(): Promise<void> {
        this.client = new Redis(this.config);
        this.client.on('error', (err) => console.error(`[Redis Client Error]`, err));
        await this.client.connect().catch(() => {});
        console.log(`Conectado ao Redis em ${this.config.host}:${this.config.port}`);
    }

    public async disconnect(): Promise<void> {
        await this.client.quit();
        console.log("Desconectado do Redis.");
    }

    // --- Métodos de Criptografia e Descriptografia ---
    private encrypt(text: string): string {
        if (!this.encryptionKey) return text; // Retorna o texto original se não houver chave

        try {
            const iv = crypto.randomBytes(16); // IV aleatório para cada criptografia
            const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
            let encrypted = cipher.update(text);
            encrypted = Buffer.concat([encrypted, cipher.final()]);
            // Concatena o IV e os dados criptografados para poder descriptografar depois
            return iv.toString('hex') + this.iv_separator + encrypted.toString('hex');
        } catch (e) {
            console.error('Falha na criptografia:', e);
            return text; // Falha segura: retorna o texto original
        }
    }

    private decrypt(encryptedText: string): string {
        if (!this.encryptionKey) return encryptedText; // Retorna o texto original se não houver chave

        try {
            const textParts = encryptedText.split(this.iv_separator);
            // Verifica se a string está no formato esperado (IV:Criptografado)
            if (textParts.length !== 2) return encryptedText;

            const iv = Buffer.from(textParts[0], 'hex');
            const encryptedData = Buffer.from(textParts[1], 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(this.encryptionKey), iv);
            let decrypted = decipher.update(encryptedData);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (e) {
            console.error('Falha na descriptografia:', e);
            return encryptedText; // Falha segura: retorna o texto original criptografado
        }
    }

    // --- Funções Auxiliares (privadas) ---
    private getRedisKey<K>(table: Table<K, any>, key: K): string {
        return `${table.tableName}:${String(key)}`;
    }

    private getIndexKey(tableName: string, param: string, value: any): string {
        const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
        // Não criptografamos as chaves de índice para que a busca funcione
        return `idx:${tableName}:${param}:${stringValue}`;
    }

    private parseStringData(stringData: Record<string, string>): Record<string, any> {
        const result: Record<string, any> = {};
        for (const [field, value] of Object.entries(stringData)) {
            // Descriptografa antes de tentar fazer o parse
            const decryptedValue = this.decrypt(value);
            try {
                // Tenta fazer o parse de JSON, se falhar, usa o valor como string
                result[field] = JSON.parse(decryptedValue);
            } catch {
                result[field] = decryptedValue;
            }
        }
        return result;
    }

    // --- CRUD e Funções de Busca ---

    public async executeSave<K, V>(table: Table<K, V>, key: K, data: Record<string, any>): Promise<void> {
        const redisKey = this.getRedisKey(table, key);
        const indexedColumns = table.defineSchema().filter(col => col.indexed);

        const oldData = await this.executeFind(table, key);
        const pipeline = this.client.multi();

        for (const column of indexedColumns) {
            const fieldName = column.name;
            const oldValue = oldData?.[fieldName];
            const newValue = data[fieldName];

            if (oldValue !== newValue) {
                if (oldValue !== null && oldValue !== undefined) {
                    const oldIndexKey = this.getIndexKey(table.tableName, fieldName, oldValue);
                    pipeline.srem(oldIndexKey, String(key));
                }
                if (newValue !== null && newValue !== undefined) {
                    const newIndexKey = this.getIndexKey(table.tableName, fieldName, newValue);
                    pipeline.sadd(newIndexKey, String(key));
                }
            }
        }

        const stringData: Record<string, string> = {};
        for (const [field, value] of Object.entries(data)) {
            if (value === null || value === undefined) continue;
            if (value instanceof Buffer) {
                // Criptografa o Buffer convertido para Base64
                stringData[field] = this.encrypt(value.toString('base64'));
            } else {
                // Criptografa o valor
                stringData[field] = this.encrypt(typeof value === 'object' ? JSON.stringify(value) : String(value));
            }
        }

        pipeline.del(redisKey);
        if (Object.keys(stringData).length > 0) {
            pipeline.hset(redisKey, stringData);
        }

        await pipeline.exec();
    }

    public async executeFind<K, V>(table: Table<K, V>, key: K): Promise<Record<string, any> | null> {
        const redisKey = this.getRedisKey(table, key);
        const stringData = await this.client.hgetall(redisKey);

        if (!stringData || Object.keys(stringData).length === 0) {
            return null;
        }
        return this.parseStringData(stringData);
    }

    public async executeDelete<K, V>(table: Table<K, V>, key: K): Promise<void> {
        const redisKey = this.getRedisKey(table, key);
        const indexedColumns = table.defineSchema().filter(col => col.indexed);

        const dataToDelete = await this.executeFind(table, key);
        const pipeline = this.client.multi();

        if (dataToDelete) {
            for (const column of indexedColumns) {
                const fieldName = column.name;
                const value = dataToDelete[fieldName];
                if (value !== null && value !== undefined) {
                    const indexKey = this.getIndexKey(table.tableName, fieldName, value);
                    pipeline.srem(indexKey, String(key));
                }
            }
        }

        pipeline.del(redisKey);
        await pipeline.exec();
    }

    /**
     * Busca todos os objetos de uma "tabela" usando SCAN para não bloquear o servidor.
     * Os valores são descriptografados após a leitura.
     */
    public async executeGetAll<K, V>(table: Table<K, V>): Promise<Record<string, Record<string, any>>> {
        const allResults: Record<string, Record<string, any>> = {};
        const keyPrefix = `${table.tableName}:`;
        let cursor = '0';

        do {
            const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', `${keyPrefix}*`, 'COUNT', 10000);
            cursor = nextCursor;

            if (keys.length > 0) {
                const pipeline = this.client.pipeline();
                keys.forEach(key => pipeline.hgetall(key));
                const results = await pipeline.exec();

                if (results) {
                    results.forEach(([error, stringData], index) => {
                        if (!error && stringData && Object.keys(stringData).length > 0) {
                            const redisKey = keys[index];
                            const entityKey = redisKey.substring(keyPrefix.length);
                            allResults[entityKey] = this.parseStringData(stringData as Record<string, string>);
                        }
                    });
                }
            }
        } while (cursor !== '0');

        return allResults;
    }

    public async executeFindByParam<K, V>(table: Table<K, V>, param: string, value: any): Promise<Record<string, Record<string, any>>> {
        const column = table.defineSchema().find(c => c.name === param);
        if (!column?.indexed) {
            throw new Error(`O parâmetro "${param}" não é um índice na tabela "${table.tableName}".`);
        }

        // A busca é feita na chave de índice (não criptografada)
        const indexKey = this.getIndexKey(table.tableName, param, value);
        const keys = await this.client.smembers(indexKey);

        if (keys.length === 0) return {};

        const pipeline = this.client.pipeline();
        keys.forEach(k => pipeline.hgetall(this.getRedisKey(table, k as K)));

        const results = await pipeline.exec();
        const foundObjects: Record<string, Record<string, any>> = {};

        if (!results) return {};

        results.forEach(([error, stringData], index) => {
            if (error || !stringData || Object.keys(stringData).length === 0) return;
            const entityKey = keys[index];
            foundObjects[entityKey] = this.parseStringData(stringData as Record<string, string>);
        });

        return foundObjects;
    }

    public async rebuildIndexes<K, V>(table: Table<K, V>): Promise<void> {
        const indexedColumns = table.defineSchema().filter(col => col.indexed);
        if (indexedColumns.length === 0) return;

        console.log(`Iniciando reconstrução de índices para a tabela "${table.tableName}"...`);
        const keyPrefix = `${table.tableName}:`;
        let cursor = '0';
        let itemsScanned = 0;

        do {
            const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', `${keyPrefix}*`, 'COUNT', 100);
            cursor = nextCursor;

            if (keys.length > 0) {
                const results = await Promise.all(keys.map(key => this.client.hgetall(key).then(data => ({ key, data }))));

                const indexPipeline = this.client.pipeline();
                for (const { key, data } of results) {
                    if (!data) continue;

                    const entityKey = key.substring(keyPrefix.length);
                    // Os dados são descriptografados para pegar o valor original para o índice
                    const parsedData = this.parseStringData(data);

                    for (const column of indexedColumns) {
                        const value = parsedData[column.name];
                        if (value !== null && value !== undefined) {
                            const indexKey = this.getIndexKey(table.tableName, column.name, value);
                            indexPipeline.sadd(indexKey, entityKey);
                        }
                    }
                }
                await indexPipeline.exec();
                itemsScanned += keys.length;
            }
        } while (cursor !== '0');

        console.log(`Reconstrução de índices para "${table.tableName}" concluída. ${itemsScanned} itens processados.`);
    }
}
