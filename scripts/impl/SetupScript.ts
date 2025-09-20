import {Script, ScriptContext} from "@/scripts/core/Script";
import {registerScript} from "@/scripts/core/registry";

class SetupDatabase extends Script {

    name = "env:setup";
    description = "Configura as informações básicas do painel";
    usage = `npm run script ${this.name}`;

    async run(ctx: ScriptContext, args: string[], flags: Record<string, string | boolean>): Promise<void> {
        const envPath = ctx.cwd + '/.env';
        const Console = (await import('../../backend/console')).default;
        const env = this.loadEnv(envPath);
        const already = env['ENCRYPTATION_TOKEN'];
        if (!already) {
            Console.warn('Não foi encontrado o token de criptografia no .env');
            return
        }

        // configurar NEXTAUTH_URL E NEXTAUTH_SECRET
        const nextauthUrlCurrent = env['NEXTAUTH_URL'] || '';
        // a pergunta n pode vir vazia
        let nextauthUrl = '';
        do {
            nextauthUrl = (await Console.ask('URL da aplicação', nextauthUrlCurrent)).trim();
            if (!nextauthUrl) Console.warn('A url da aplicação não pode ser vazia.');
        } while (!nextauthUrl);
        env['NEXTAUTH_URL'] = nextauthUrl;

        const currentToken = env['TOKEN'] || '';
        let token = '';
        do {
            token = (await Console.ask('Token para API e comunicação com nodes', currentToken)).trim();
            if (!token) {
                Console.warn('O token não pode ser vazio.');
                continue
            }
            if (token.length < 16) {
                Console.warn('O token deve ter ao menos 16 caracteres.');
                continue
            }
            // verificar se token é seguro e contem letras, números e caracteres especiais
            const hasLetter = /[a-zA-Z]/.test(token);
            const hasNumber = /[0-9]/.test(token);
            const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(token);
            if (!hasLetter || !hasNumber || !hasSpecial) {
                Console.warn('O token deve conter letras, números e caracteres especiais para ser seguro.');
                continue
            }

            break
        } while (true);
        env['TOKEN'] = token;
        // Salva usando writeEnv
        this.writeEnv(envPath, env, false);
        Console.success('Configurações salvas com sucesso.');
    }

    help() {
        return [
            `${this.name} - ${this.description}`,
            `Usage: ${this.usage}`,
            'Flags: []'
        ]
    }
}
registerScript(new SetupDatabase());