import {Script, ScriptContext} from "@/scripts/core/Script";
import {registerScript} from "@/scripts/core/registry";
import {RedisConnector} from "@/backend/database/RedisConnector";

class SetupDatabaseScript extends Script {

    name = "env:setup:db";
    description = "Configura variáveis de ambiente para conexão com o Redis";
    usage = `npm run script ${this.name} [--] [--host HOST] [--port PORT] [--password PASSWORD] [--db DB]`;

    async run(ctx: ScriptContext, args: string[], flags: Record<string, string | boolean>): Promise<void> {
        const envPath = ctx.cwd + '/.env';
        const Console = (await import('../../backend/console')).default;
        const env = this.loadEnv(envPath);
        const already = env['ENCRYPTATION_TOKEN'];
        if (!already) {
            Console.warn('Não foi encontrado o token de criptografia no .env');
            return
        }



        // Only Redis fields, with required property
        const fields = [
            { key: 'host', label: 'Redis Host', envKey: 'REDIS_HOST', required: true },
            { key: 'port', label: 'Redis Port', envKey: 'REDIS_PORT', required: true },
            { key: 'password', label: 'Redis Password', envKey: 'REDIS_PASSWORD', required: false },
            { key: 'db', label: 'Redis DB', envKey: 'REDIS_DB', required: true },
        ];

        const values: Record<string, string> = {};
        for (const field of fields) {
            let currentValue = typeof flags[field.key] === 'string' ? String(flags[field.key]) : '';
            if (!currentValue) currentValue = env[field.envKey] || '';
            let value = '';
            if (field.required) {
                // Sempre pergunta, mostra valor atual como default, só aceita não vazio
                do {
                    value = (await Console.ask(field.label, currentValue)).trim();
                    if (!value) Console.warn(`${field.label} é obrigatório. Não pode ser vazio.`);
                } while (!value);
            } else {
                // Opcional: aceita vazio
                value = (await Console.ask(field.label, currentValue)).trim();
            }
            values[field.key] = value;
        }

        // Atualiza env com os novos valores
        fields.forEach(f => {
            env[f.envKey] = values[f.key];
        });

        const lines = ['Resumo da configuração Redis:'];
        fields.forEach(f => {
            lines.push(`  ${f.label}: ${values[f.key]}`);
        });
        Console.info(...lines);
        const confirm = await Console.confirm('Confirmar e salvar?', false);
        if (!confirm) {
            Console.warn('Operação cancelada. Nenhuma alteração foi feita.');
            return;
        }

        // Salva usando writeEnv
        this.writeEnv(envPath, env, false);
        Console.info("Informações de database atualizadas. Testando conexão...");

        let connector: RedisConnector | null = null;
        // Testa conexão com Redis
        try {
            connector = new RedisConnector({
                host: values['host'],
                port: parseInt(values['port'], 10),
                password: values['password'] || undefined,
                db: parseInt(values['db'] || '0', 10),
            }, env['ENCRYPTATION_TOKEN']);
            await connector.connect()

            Console.success('Informações de database salvas.');
            process.exit(0)
        } catch (err) {
            Console.error('Falha ao conectar ao Redis com as informações fornecidas:', err);
            process.exit(0)
            return;
        }

    }

    help() {
        return [
            `${this.name} - ${this.description}`,
            `Usage: ${this.usage}`,
            'Flags:',
            '  --host HOST          Define o host do Redis',
            '  --port PORT          Define a porta do Redis',
            '  --password PASSWORD  Define a senha do Redis (opcional)',
            '  --db DB              Define o número do banco de dados Redis (padrão 0)',
        ]
    }
}
registerScript(new SetupDatabaseScript());