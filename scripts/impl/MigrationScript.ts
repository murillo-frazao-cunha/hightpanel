import {Script} from "@/scripts/core/Script";
import {registerScript} from "@/scripts/core/registry";
import {Migration} from "@/backend/database/models/MigrationTable";
import Console from "@/backend/console";
import DefaultCores from "@/backend/cores/DefaultCores";
import {Cores} from "@/backend/libs/Cores";
import {getTables} from "@/backend/database/tables/tables";

class MigrationScript extends Script  {
    name = "migrate";
    description = "Roda as migrações de cores no banco de dados";
    usage = `npm run script ${this.name}`;

    async run(): Promise<void> {
        const envPath = process.cwd() + '/.env';
        const env = this.loadEnv(envPath);
        const already = env['ENCRYPTATION_TOKEN'];
        if (!already) {
            Console.warn('Não foi encontrado o token de criptografia no .env');
            return
        }
        const isMigrated = await Migration.isMigrated()
        if (isMigrated) {
            Console.warn("Você já rodou todas as migrações disponíveis.");
            const confirm = await Console.confirm("Tem certeza que deseja rodar as migrações novamente?")
            if (!confirm) {
                Console.info("Abortando...");
                return;
            }
        }

        const cores = DefaultCores
        try {
            for (const payload of cores) {
                let baseName: string = payload.core.name;
                let finalName = baseName;
                let counter = 1;
                while (await Cores.findByName(finalName)) {
                    finalName = `${baseName}-import${counter > 1 ? '-' + counter : ''}`;
                    counter++;
                }

                const dockerImages = Array.isArray(payload.core.dockerImages) ? payload.core.dockerImages : [];
                const variables = Array.isArray(payload.core.variables) ? payload.core.variables : [];

                await Cores.createCore({
                    name: finalName,
                    installScript: payload.core.installScript,
                    startupCommand: payload.core.startupCommand,
                    stopCommand: payload.core.stopCommand,
                    dockerImages,
                    variables,
                    startupParser: typeof payload.core.startupParser === 'string' ? payload.core.startupParser : JSON.stringify(payload.core.startupParser || {}),
                    configSystem: typeof payload.core.configSystem === 'string' ? payload.core.configSystem : JSON.stringify(payload.core.configSystem || {}),
                    description: payload.core.description || '',
                    creatorEmail: payload.core.creatorEmail,
                    createdAt: Date.now(),
                });

            }

            const tables = await getTables()
            await tables.migrationTable.insert("panel", {
               isMigrated: true
            })


            Console.success("Migrações concluídas com sucesso.");
            process.exit(0)
        } catch (e) {
            Console.error("Erro ao rodar as migrações:", e);
            process.exit(0)
            return;
        }

    }

    help() {
        return [
            `${this.name} - ${this.description}`,
            `Usage: ${this.usage}`,
            'Flags: []',
        ]
    }
}
registerScript(new MigrationScript())