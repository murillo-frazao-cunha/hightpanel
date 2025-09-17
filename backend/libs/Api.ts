
import { getTables } from "@/backend/database/tables/tables";
import { ApiData, ApiModel } from "@/backend/database/models/ApiModel";
import crypto from 'crypto';

export class Apis {
    static async createApi(data: Omit<ApiData, 'createdAt' | 'lastUsedAt'>): Promise<ApiModel> {
        const tables = await getTables();
        const token = crypto.randomBytes(32).toString('hex');
        
        const apiData: Omit<ApiData, 'id'> = {
            ...data,
            createdAt: Date.now(),
            lastUsedAt: 0,
        };

        // @ts-ignore
        const newApi = await tables.apiTable.insert(data.token, apiData);
        return newApi;
    }

    static async getAllApis(): Promise<ApiModel[]> {
        const tables = await getTables();
        return tables.apiTable.getAll();
    }

    static async getApi(id: string): Promise<ApiModel | null> {
        const tables = await getTables();
        return tables.apiTable.get(id);
    }

    static async deleteApi(id: string): Promise<void> {
        const tables = await getTables();
        const api = await tables.apiTable.get(id);
        if (api) {
            await api.delete();
        }
    }
    
    static async findByName(name: string): Promise<ApiModel | null> {
        const tables = await getTables();
        const apis = await tables.apiTable.findByParam('name', name);
        return apis[0] || null;
    }
}
