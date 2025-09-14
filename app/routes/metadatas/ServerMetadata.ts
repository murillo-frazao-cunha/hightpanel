import type {Metadata} from "next";
import {getClientServer} from "../../pages/clients/server/api"
export default async function ServerMetadata(params: any): Promise<Metadata | undefined> {
    const { propertie } = params;
    if (propertie) {
        let title = 'Ender | ';
        switch (propertie) {
            case 'files':
                title += 'Gerenciador de Arquivos';
                break;
            case 'database':
                title += 'Bancos de Dados';
                break;
            case 'network':
                title += 'Rede';
                break;
            case 'startup':
                title += 'Inicialização';
                break;
            case 'settings':
                title += 'Configurações';
                break;
            case 'console':
                title += 'Console';
                break;
            default:
                title += 'Console';
        }
        return { title };
    } else {
        return { title: 'Ender | Console' };
    }

}