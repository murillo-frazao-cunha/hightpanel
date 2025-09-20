import {Script, ScriptContext} from "@/scripts/core/Script";
import {registerScript} from "@/scripts/core/registry";
import {Users} from "@/backend/libs/User";
import {Migration} from "@/backend/database/models/MigrationTable";

class CreateUserScript extends Script {

    name = "user:make";
    description = "Cria um novo usuário no sistema";
    usage = `npm run script ${this.name} [--] [--admin] [--name=<username>] [--email=<email>] [--password=<password>]`;

    isValidEmail(email: string): boolean {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email.toLowerCase());
    }


    async run(ctx: ScriptContext, args: string[], flags: Record<string, string | boolean>): Promise<void> {
        const envPath = ctx.cwd + '/.env';
        const Console = (await import('../../backend/console')).default;
        const env = this.loadEnv(envPath);
        const already = env['ENCRYPTATION_TOKEN'];
        if (!already) {
            Console.warn('Não foi encontrado o token de criptografia no .env');
            return;
        }
        const isMigrated = await Migration.isMigrated()
        if (!isMigrated) {
            Console.warn("Você precisa rodar as migrações antes de criar um usuário.");
            return;
        }

        // Flags: --admin, --name, --email, --password
        const isAdmin = typeof flags.admin === 'boolean' ? flags.admin : await Console.confirm("Este usuário será administrador do painel?");
        // Email: verifica unicidade logo após receber
        let email = typeof flags.email === 'string' ? flags.email.trim() : '';
        while (true) {
            if (!email) {
                email = (await Console.ask('Endereço de email')).trim();
            }
            if (!this.isValidEmail(email)) {
                Console.warn('O email informado é inválido.');
                email = '';
                continue;
            }
            const existingByEmail = await Users.findByEmail(email);
            if (existingByEmail) {
                Console.warn('Já existe um usuário com este e-mail. Informe outro.');
                email = '';
                continue;
            }
            break;
        }
        // Username: verifica unicidade logo após receber
        let username = typeof flags.name === 'string' ? flags.name.trim() : '';
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        while (true) {
            if (!username) {
                username = (await Console.ask('Nome de usuário (sem espaços ou caracteres especiais)')).trim();
            }
            if (!usernameRegex.test(username)) {
                Console.warn('O nome de usuário só pode conter letras, números e underscores (_).');
                username = '';
                continue;
            }
            const existingByName = await Users.getUserByName(username);
            if (existingByName) {
                Console.warn('Já existe um usuário com este nome de usuário. Informe outro.');
                username = '';
                continue;
            }
            break;
        }
        let password = typeof flags.password === 'string' ? flags.password.trim() : '';
        if (!password) {
            do {
                Console.warn("A senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.");
                password = (await Console.ask('Senha do usuário')).trim();
                if (password.length < 8) {
                    Console.warn('A senha deve ter no mínimo 8 caracteres.');
                    continue;
                }
                if (!/(?=.*[a-z])/.test(password)) {
                    Console.warn('A senha deve conter pelo menos uma letra minúscula.');
                    continue;
                }
                if (!/(?=.*[A-Z])/.test(password)) {
                    Console.warn('A senha deve conter pelo menos uma letra maiúscula.');
                    continue;
                }
                if (!/(?=.*\d)/.test(password)) {
                    Console.warn('A senha deve conter pelo menos um número.');
                    continue;
                }
                if (!/(?=.*[@$!%*?&_])/.test(password)) {
                    Console.warn('A senha deve conter pelo menos um caractere especial (@, $, !, %, *, ?, &, _).');
                    continue;
                }
                break;
            } while (true);
        } else {
            if (password.length < 8 ||
                !/(?=.*[a-z])/.test(password) ||
                !/(?=.*[A-Z])/.test(password) ||
                !/(?=.*\d)/.test(password) ||
                !/(?=.*[@$!%*?&_])/.test(password)) {
                Console.warn('A senha informada via flag não atende aos requisitos.');
                return;
            }
        }
        try {
            const data = {
                name: username,
                email: email,
                password: password,
                admin: isAdmin
            };
            await Users.createUser(data);
            Console.table(data);
            process.exit(0);
        } catch (error) {
            Console.error('Erro ao criar o usuário:', error);
            process.exit(0);
        }
    }

    help() {
        return [
            `${this.name} - ${this.description}`,
            `Usage: ${this.usage}`,
            'Flags: ',
            '  --admin              Define o usuário como administrador (padrão: pergunta interativa)',
            '  --name NAME          Nome de usuário (sem espaços ou caracteres especiais)',
            '  --email EMAIL        Endereço de email válido',
            '  --password PASSWORD  Senha com no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais',
        ]
    }
}
registerScript(new CreateUserScript());