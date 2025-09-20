'use server'



export async function register() {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const Console = await import('./backend/console');
        const ENCRYPTATION_TOKEN = process.env.ENCRYPTATION_TOKEN;
        const {Migration} = await import("./backend/database/models/MigrationTable");

        if (!ENCRYPTATION_TOKEN || ENCRYPTATION_TOKEN.length < 32) {
            Console.default.error("Antes de iniciar o painel, você precisa configura-lo.");
            process.exit(1);
        }
        // iniciar redis
        try {
            const { getRedisInstance } = await import('./backend/database/redis');
            await getRedisInstance(true);
            const migrated = await Migration.isMigrated();
            if (!migrated) {
                Console.default.warn("O painel ainda não foi migrado. Por favor, complete a migração antes de continuar.");
                process.exit(0)
                return
            }
        } catch (e) {
            Console.default.error("Não foi possível conectar ao Redis.");
            process.exit(1);
        }



    }
}

