// index.ts
import express, {Request, Response} from 'express';
import next from 'next';
import dotenv from 'dotenv';
import Console, {Colors, Levels} from "@/backend/console";

// Carrega variáveis de ambiente do arquivo .env
dotenv.config({
    quiet: true
});

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);

// Cria a aplicação Next.js
const app = next({ dev, hostname, port });

// Obtém o handler de requisições do Next.js
const handle = app.getRequestHandler();

// Prepara a aplicação (compila páginas em dev, etc.)
app.prepare().then(() => {
    // Cria o servidor Express
    const server = express();


    // Rota curinga para que o Next.js lide com todas as outras requisições
    server.all(/.*/, (req: Request, res: Response) => {
        return handle(req, res);
    });

    // Inicia o servidor Express
    server.listen(port, (err?: any) => {
        if (err) throw err;
        const isDev = dev ? "Rodando em modo de desenvolvimento"  : "";
        Console.logWithout(Levels.INFO, `Painel inicializado com sucesso na porta ${Colors.Underscore}${Colors.FgCyan}${port}${Colors.Reset}.`, isDev)
    });
}).catch(err => {
    console.error('Error starting server:', err);
    process.exit(1);
});