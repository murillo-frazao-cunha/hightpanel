import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { Script, ScriptContext } from '../core/Script';
import { registerScript } from '../core/registry';
import Console from '../../backend/console';

class GenerateTokenScript extends Script {
  name = 'env:key:generate';
  description = 'Gera novo ENCRYPTATION_TOKEN';
  usage = `npm run script ${this.name} [--] [--backup]`;

  private generateFixed(): string {
    return crypto.randomBytes(16).toString('hex'); // 16 bytes => 32 hex chars
  }


  async run(ctx: ScriptContext, args: string[], flags: Record<string,string|boolean>): Promise<void> {
      const envPath = path.join(ctx.cwd,'.env');
      const env = this.loadEnv(envPath);
      const alreadyToken = env['ENCRYPTATION_TOKEN'];
      const alreadyNextAuth = env['NEXTAUTH_SECRET'];

      let shouldWrite = true;
      if (alreadyToken) {
          Console.warn('Já existe um token de criptografia no .env.',
              "Trocar este valor vai impedir a descriptografia de dados salvos com a chave antiga.",
              "Certifique-se de que você realmente deseja invalidar qualquer dado criptografado anterior.");
          const proceed = await Console.confirm('Deseja realmente substituir o ENCRYPTATION_TOKEN atual?', false);
          if (!proceed) {
              Console.info('Operação cancelada. Token preservado.');
              shouldWrite = false;
          }
      }
      if (!shouldWrite) return;

      const token = this.generateFixed();
      const nextAuthSecret = this.generateFixed();
      env['ENCRYPTATION_TOKEN'] = token;
      const doBackup = !!flags['backup'];
      this.writeEnv(envPath, env, doBackup);
      Console.success('Token de criptografia gerado com sucesso.');
      if (alreadyNextAuth && shouldWrite) {
          Console.warn('Já existe um token para validação de sessões no .env.',
              "Trocar este valor pode invalidar sessões de autenticação anteriores.",
              "Certifique-se de que você realmente deseja substituir o segredo do NextAuth.");
          const proceedNext = await Console.confirm('Deseja realmente substituir o NEXTAUTH_SECRET atual?', false);
          if (!proceedNext) {
              Console.info('Operação cancelada. NEXTAUTH_SECRET preservado.');
              shouldWrite = false;
          }
      }
      if(!shouldWrite) return

      env['NEXTAUTH_SECRET'] = nextAuthSecret;

      this.writeEnv(envPath, env, doBackup);
      Console.success('Token para validação de sessões gerado com sucesso.');
  }

  help() {
    return [
      `${this.name} - ${this.description}`,
      `Usage: ${this.usage}`,
      'Flags:',
      '  --backup  cria .env.bak antes de sobrescrever',
    ];
  }
}

registerScript(new GenerateTokenScript());
