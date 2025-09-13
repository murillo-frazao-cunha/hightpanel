import { getTables } from '@/backend/database/tables/tables';
import { Databases } from '@/backend/database/models/DatabasesHosts';
import { randomUUID } from 'crypto';
import mysql from 'mysql2/promise';

export interface DatabaseHostInput {
    name: string;
    host: string;
    port: number;
    username: string;
    password: string;
    phpmyAdminLink?: string;
}

export class DatabaseHostsApi {
    static async getAll(): Promise<Databases[]> {
        const { databaseHostTable } = await getTables();
        return databaseHostTable.getAll();
    }

    static async get(uuid: string): Promise<Databases | null> {
        const { databaseHostTable } = await getTables();
        return databaseHostTable.get(uuid);
    }

    static async findByName(name: string): Promise<Databases | null> {
        const { databaseHostTable } = await getTables();
        const res = await databaseHostTable.findByParam('name', name);
        return res[0] || null;
    }

    static async create(data: DatabaseHostInput): Promise<Databases> {
        await this.testConnection(data);
        const { databaseHostTable } = await getTables();
        const uuid = randomUUID();
        return databaseHostTable.insert(uuid, {
            name: data.name,
            host: data.host,
            port: data.port,
            username: data.username,
            password: data.password,
            phpmyAdminLink: data.phpmyAdminLink || ''
        });
    }

    static async update(uuid: string, data: Partial<DatabaseHostInput>): Promise<Databases> {
        const host = await this.get(uuid);
        if (!host) throw new Error('Host não encontrado');

        // Criar objeto de teste juntando dados novos e antigos para validar conexão
        const merged = {
            name: data.name ?? host.name,
            host: data.host ?? host.host,
            port: data.port ?? host.port,
            username: data.username ?? host.username,
            password: data.password ?? host.password,
            phpmyAdminLink: data.phpmyAdminLink ?? host.phpmyAdminLink
        };
        await this.testConnection(merged);

        Object.assign(host, merged);
        await host.save();
        return host;
    }

    static async delete(uuid: string): Promise<void> {
        const host = await this.get(uuid);
        if (!host) throw new Error('Host não encontrado');
        await host.delete();
    }

    private static async testConnection(data: { host: string; port: number; username: string; password: string; }) {
        let conn;
        try {
            conn = await mysql.createConnection({
                host: data.host,
                port: data.port,
                user: data.username,
                password: data.password,
                ssl: process.env.MYSQL_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
                connectTimeout: 5000
            });
            await conn.query('SELECT 1');
        } catch (e: any) {
            throw new Error('Falha ao conectar ao MySQL: ' + (e.message || 'Erro desconhecido'));
        } finally {
            try { await conn?.end(); } catch {}
        }
    }

    static sanitize(entity: Databases) {
        const json: any = entity.toJSON();
        delete json.password; // não expor senha
        return json;
    }
}

