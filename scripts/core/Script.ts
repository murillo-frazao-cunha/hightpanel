import fs from "fs";
import Console from "@/backend/console";

export interface ScriptContext {
    cwd: string;
    env: NodeJS.ProcessEnv;
    stdout: (msg: string) => void;
    stderr: (msg: string) => void;
}

export abstract class Script {
    abstract name: string;            // ex: setup:db
    abstract description: string;     // breve descrição
    usage?: string;                   // linha de uso opcional

    // Executa o script. args = argumentos posicionais (sem flags), flags = --flag=value / --flag
    abstract run(ctx: ScriptContext, args: string[], flags: Record<string, string | boolean>): Promise<void> | void;

    // Pode sobrescrever para help específico
    help?(): string[];


    loadEnv(file: string): Record<string,string> {
        if (!fs.existsSync(file)) return {};
        const out: Record<string,string> = {};
        for (const line of fs.readFileSync(file,'utf8').split(/\r?\n/)) {
            if (!line || line.startsWith('#')) continue;
            const i = line.indexOf('=');
            if (i === -1) continue;
            out[line.slice(0,i).trim()] = line.slice(i+1).trim();
        }
        return out;
    }
    writeEnv(file: string, env: Record<string,string>, backup: boolean) {
        if (backup && fs.existsSync(file)) {
            fs.copyFileSync(file, file + '.bak');
            Console.warn('Backup criado:', file + '.bak');
        }
        const keys = Object.keys(env);
        if (!keys.includes('ENCRYPTATION_TOKEN')) keys.push('ENCRYPTATION_TOKEN');
        const ordered = ['ENCRYPTATION_TOKEN', ...keys.filter(k => k !== 'ENCRYPTATION_TOKEN').sort()];
        const lines: string[] = [];
        lines.push('# Atualizado em ' + new Date().toISOString());
        lines.push('');
        for (const k of ordered) lines.push(`${k}=${env[k] ?? ''}`);
        lines.push('');
        fs.writeFileSync(file, lines.join('\n'),'utf8');
    }
}

