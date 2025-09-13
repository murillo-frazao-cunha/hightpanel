import { DataType, SchemaColumn, Table, RedisConnector } from "../RedisConnector";
import { RedisEntity } from "./RedisEntity";

// Interface para o construtor da entidade, necessário para a instanciação genérica.
type EntityConstructor<K, V extends object, T extends RedisEntity<K, V>> = new (
    id: K,
    data: V,
    table: RedisTable<K, T>
) => T;


/**
 * Classe base para gerenciar uma "tabela" no Redis.
 * Fornece métodos de alto nível como get, findByParam e create.
 */
export abstract class RedisTable<K, T extends RedisEntity<K, any>> implements Table<K, T> {
    abstract tableName: string;
    protected abstract entityConstructor: EntityConstructor<K, any, T>;

    private readonly connector: RedisConnector;

    constructor(connector: RedisConnector) {
        this.connector = connector;
    }

    abstract defineSchema(): SchemaColumn[];

    public getConnector(): RedisConnector {
        return this.connector;
    }

    /**
     * Busca uma entidade pelo seu ID.
     * @param id A chave da entidade.
     * @returns A instância da entidade ou null se não for encontrada.
     */
    public async get(id: K): Promise<T | null> {
        const data = await this.connector.executeFind(this, id);
        if (!data) {
            return null;
        }
        return new this.entityConstructor(id, data, this);
    }

    /**
     * Busca todas as entidades da tabela.
     * ATENÇÃO: Use com cautela em tabelas grandes, pois pode consumir muita memória.
     * @returns Um array com todas as entidades encontradas.
     */
    public async getAll(): Promise<T[]> {
        const results = await this.connector.executeGetAll(this);
        return Object.entries(results).map(([key, data]) => {
            return new this.entityConstructor(key as K, data, this);
        });
    }

    /**
     * Cria uma nova instância de entidade em memória.
     * Chame o método .save() no objeto retornado para persistir no banco.
     * @param id A chave para a nova entidade.
     * @param initialData Os dados iniciais.
     * @returns Uma nova instância da entidade.
     */
    public create(id: K, initialData: any): T {
        return new this.entityConstructor(id, initialData, this);
    }

    /**
     * Cria e salva uma nova entidade no banco de dados em um único passo.
     * É um atalho para `create(id, data)` seguido de `.save()`.
     * @param id A chave para a nova entidade.
     * @param initialData Os dados iniciais.
     * @returns A instância da entidade recém-criada e salva.
     */
    public async insert(id: K, initialData: any): Promise<T> {
        const newEntity = this.create(id, initialData);
        await newEntity.save();
        return newEntity;
    }

    /**
     * Busca entidades com base em um campo indexado.
     * @param param O nome do campo (deve ter `indexed: true` no schema).
     * @param value O valor a ser buscado.
     * @returns Um array de entidades encontradas.
     */
    public async findByParam(param: string, value: any): Promise<T[]> {
        const results = await this.connector.executeFindByParam(this, param, value);
        return Object.entries(results).map(([key, data]) => {
            return new this.entityConstructor(key as K, data, this);
        });
    }

    /**
     * Reconstrói os índices para esta tabela.
     */
    public async rebuildIndexes(): Promise<void> {
        await this.connector.rebuildIndexes(this);
    }
}

