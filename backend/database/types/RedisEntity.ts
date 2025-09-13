import { RedisTable } from "./RedisTable";

/**
 * Representa uma única entidade (linha/documento) no Redis.
 * Esta classe abstrata fornece a lógica para salvar e deletar a entidade.
 * As propriedades são acessadas diretamente através de um Proxy.
 */
export abstract class RedisEntity<K, V extends object> {
    protected readonly _id: K;
    protected _data: V;
    private readonly _table: RedisTable<K, any>;

    constructor(id: K, initialData: V, table: RedisTable<K, any>) {
        this._id = id;
        this._data = initialData;
        this._table = table;

        // Retorna um Proxy para interceptar gets e sets,
        // permitindo a sintaxe `profile.username = 'novo'`
        return new Proxy(this, {
            get(target, prop, receiver) {
                // CORREÇÃO: Verifica se a propriedade pertence à classe RedisEntity (métodos ou props internas como '_table')
                // antes de tentar buscar no objeto de dados '_data'.
                if (prop in target) {
                    return Reflect.get(target, prop, receiver);
                }

                // Caso contrário, busca a propriedade no objeto de dados interno
                return (target._data as any)[prop];
            },
            set(target, prop, value, receiver) {
                // Sempre define a propriedade no objeto de dados interno
                (target._data as any)[prop] = value;
                return true;
            },
        });
    }

    /**
     * O ID (chave) desta entidade no Redis.
     */
    public get id(): K {
        return this._id;
    }

    /**
     * Retorna o objeto de dados puro.
     */
    public get data(): V {
        return this._data;
    }

    /**
     * [NOVO] Método de serialização customizado para JSON.
     * Controla como o objeto é convertido ao usar `JSON.stringify()`.
     * @returns Um objeto plano contendo o ID e os dados da entidade.
     */
    public toJSON() {
        return {
            id: this._id,
            ...this._data,
        };
    }

    /**
     * Salva o estado atual do objeto no Redis.
     */
    public async save(): Promise<void> {
        await this._table.getConnector().executeSave(this._table, this._id, this._data);
    }

    /**
     * Deleta este objeto do Redis.
     */
    public async delete(): Promise<void> {
        // O `delete` do conector não precisa do _data, mas não causa mal passar.
        await this._table.getConnector().executeDelete(this._table, this._id);
    }
}

