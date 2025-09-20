import { DataType, SchemaColumn } from "../RedisConnector";
import { RedisEntity } from "../types/RedisEntity";
import { RedisTable } from "../types/RedisTable";
import {Nodes} from "@/backend/libs/Nodes";
import {Servers} from "@/backend/database/models/ServerModel";
import {Allocation} from "@/backend/database/models/AllocationModel";
import {getTables} from "@/backend/database/tables/tables";

// 1. Interface para os dados do domínio
export interface DomainData {
    domainName: string; // Ex: seusite.com
    ownerToken: string;
    zoneId: string;     // Zone ID da Cloudflare para este domínio
}

// 2. Classe da Entidade que representa um domínio
export class Domains extends RedisEntity<string, DomainData> {
    declare domainName: string;
    declare ownerToken: string;
    declare zoneId: string;


    async createDefaultDnsRecords(server: Servers, subdomain: string) {
        try {
            const node = await server.getNode();
            if (!node) throw new Error('Nó associado ao servidor não encontrado.');
            const ip = await node.resolveIp();
            if (!ip) throw new Error('Não foi possível resolver o IP do nó.');

            const tables = await getTables();
            const allocation = await tables.allocationTable.get(server.primaryAllocationId);
            if (!allocation) throw new Error('Alocação primária não encontrada.');
            const port = allocation.port;

            const subPart = subdomain.toLowerCase();
            const fqdn = `${subPart}.${this.domainName}`; // FQDN correto

            // Registro A para o subdomínio
            const aRecord = {
                type: 'A',
                name: fqdn,
                content: ip,
                ttl: 120,
                proxied: false,
            };

            // Registro SRV para Minecraft (exemplo). Cloudflare: top-level name deve ser o FQDN do serviço completo
            // Service host final será o próprio fqdn.
            const srvRecord = {
                type: 'SRV',
                name: `_minecraft._tcp.${fqdn}`,
                data: {
                    service: '_minecraft',
                    proto: '_tcp',
                    name: fqdn, // host alvo do serviço (FQDN)
                    priority: 1,
                    weight: 1,
                    port: port,
                    target: fqdn,
                },
            };

            await this.createDnsRecord(aRecord);
            await this.createDnsRecord(srvRecord);
        } catch (error) {
            console.error('Erro ao criar registros DNS padrão:', error);
            throw error;
        }
    }

    async removeDefaultDnsRecords(server: Servers, subdomain: string) {
        try {
            const subPart = subdomain.toLowerCase();
            const fqdn = `${subPart}.${this.domainName}`;
            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.ownerToken}`,
            } as const;

            // Helpers
            const deleteRecordIds = async (ids: string[], label: string) => {
                for (const id of ids) {
                    try {
                        const delResp = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records/${id}`, { method: 'DELETE', headers });
                        const delJson = await delResp.json();
                        if (!delJson.success) console.warn(`Falha ao remover ${label} ${id}:`, delJson.errors || delJson);
                        else console.log(`Removido ${label}: ${id}`);
                    } catch (e) {
                        console.error(`Erro ao remover ${label} ${id}:`, e);
                    }
                }
            };

            // Remover A (formato novo correto)
            const listAUrlFqdn = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?type=A&name=${encodeURIComponent(fqdn)}`;
            const aRespFqdn = await fetch(listAUrlFqdn, { method: 'GET', headers });
            const aJsonFqdn = await aRespFqdn.json();
            if (aJsonFqdn.success && Array.isArray(aJsonFqdn.result)) {
                await deleteRecordIds(aJsonFqdn.result.map((r: any) => r.id), 'A(FQDN)');
            }
            // Fallback (formato antigo sem domínio) - só se nada encontrado no formato correto
            if (!aJsonFqdn.success || (Array.isArray(aJsonFqdn.result) && aJsonFqdn.result.length === 0)) {
                const legacyAUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?type=A&name=${encodeURIComponent(subPart)}`;
                const legacyAResp = await fetch(legacyAUrl, { method: 'GET', headers });
                const legacyAJson = await legacyAResp.json();
                if (legacyAJson.success && Array.isArray(legacyAJson.result)) {
                    // Filtro por coincidência exata do nome antigo (sem domínio)
                    const legacyMatches = legacyAJson.result.filter((r: any) => r.name?.toLowerCase() === subPart);
                    await deleteRecordIds(legacyMatches.map((r: any) => r.id), 'A(LEGACY)');
                }
            }

            // Remover SRV (formato novo)
            const srvNameFqdn = `_minecraft._tcp.${fqdn}`;
            const listSrvUrlFqdn = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?type=SRV&name=${encodeURIComponent(srvNameFqdn)}`;
            const srvRespFqdn = await fetch(listSrvUrlFqdn, { method: 'GET', headers });
            const srvJsonFqdn = await srvRespFqdn.json();
            if (srvJsonFqdn.success && Array.isArray(srvJsonFqdn.result)) {
                await deleteRecordIds(srvJsonFqdn.result.map((r: any) => r.id), 'SRV(FQDN)');
            }
            // Fallback SRV antigo (_minecraft._tcp.subpart)
            if (!srvJsonFqdn.success || (Array.isArray(srvJsonFqdn.result) && srvJsonFqdn.result.length === 0)) {
                const legacySrvName = `_minecraft._tcp.${subPart}`;
                const legacySrvUrl = `https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records?type=SRV&name=${encodeURIComponent(legacySrvName)}`;
                const legacySrvResp = await fetch(legacySrvUrl, { method: 'GET', headers });
                const legacySrvJson = await legacySrvResp.json();
                if (legacySrvJson.success && Array.isArray(legacySrvJson.result)) {
                    const legacyMatches = legacySrvJson.result.filter((r: any) => r.name?.toLowerCase() === legacySrvName);
                    await deleteRecordIds(legacyMatches.map((r: any) => r.id), 'SRV(LEGACY)');
                }
            }
        } catch (error) {
            console.error('Erro ao remover registros DNS padrão:', error);
        }
    }

     private async createDnsRecord(record: any) {
        try {
            const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${this.zoneId}/dns_records`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.ownerToken}`,
                },
                body: JSON.stringify(record),
            });

            const data = await response.json();

            if (data.success) {
                console.log(`Registro DNS (${record.type}) criado com sucesso:`, data.result);
            } else {
                console.error(`Erro ao criar o registro DNS (${record.type}):`, data.errors);
            }
        } catch (error) {
            console.error(`Erro na requisição para criar o registro DNS (${record.type}):`, error);
        }
    }
}

// 3. Classe da Tabela para gerenciar os domínios no Redis
export class DomainTable extends RedisTable<string, Domains> {
    protected entityConstructor = Domains;

    // Prefixo para as chaves deste modelo no Redis (ex: hDomains:uuid-do-dominio)
    tableName = 'hDomains';

    defineSchema(): SchemaColumn[] {
        return [
            { name: 'domainName', type: DataType.STRING, indexed: true },
            { name: 'ownerToken', type: DataType.STRING, indexed: false },
            { name: 'zoneId', type: DataType.STRING, indexed: false },
        ];
    }
}
