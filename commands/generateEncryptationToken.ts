import fs from "fs";
import path from "path";

import crypto from 'crypto';

import dotenv from "dotenv";
dotenv.config()
/**
 * Gera um token aleatório de 32 caracteres (16 bytes em hexadecimal),
 * ideal para ser usado como chave de criptografia AES-256.
 * @returns O token gerado.
 */
export function generateEncryptionKey(): string {
    // 16 bytes resultam em 32 caracteres em representação hexadecimal
    return crypto.randomBytes(16).toString('hex');
}

function setEnvValue(key: string, value: string, envPath: string = ".env"): void {
    const fullPath = path.resolve(envPath);
    let env = "";

    // Se o arquivo existir, lê o conteúdo
    if (fs.existsSync(fullPath)) {
        env = fs.readFileSync(fullPath, "utf-8");
    }

    const regex = new RegExp(`^${key}=.*$`, "m");

    if (regex.test(env)) {
        // Substitui a variável existente
        env = env.replace(regex, `${key}=${value}`);
    } else {
        // Adiciona no final
        if (env.length && !env.endsWith("\n")) {
            env += "\n";
        }
        env += `${key}=${value}\n`;
    }

    // Salva de volta no arquivo
    fs.writeFileSync(fullPath, env, "utf-8");
}

function main() {
    if(process.env.ENCRYPTATION_TOKEN) {
        console.log("Você já possui um token de criptografia.")
        return
    }
    const encryptation = generateEncryptionKey()
    setEnvValue("ENCRYPTATION_TOKEN", encryptation)
    console.log("Token de criptografia setado com sucesso!")
}
main()