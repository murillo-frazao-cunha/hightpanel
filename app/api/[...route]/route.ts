import { NextRequest, NextResponse } from 'next/server';
import { apiRoutes, findMatchingApiRoute } from '../../routes/apiRouteConfig';

// Esta função genérica vai lidar com qualquer método HTTP.
async function handleRequest(request: NextRequest, { params }: { params: { route: string[] } }) {
    // CORREÇÃO: Em vez de usar `params.route`, obtemos o pathname diretamente da URL da requisição.
    // Isso evita o erro "params should be awaited".
    const { pathname } = new URL(request.url);
    const method = request.method as keyof typeof apiRoutes[0]; // GET, POST, etc.

    const match = findMatchingApiRoute(pathname);

    if (!match) {
        return NextResponse.json({ message: `A rota ${pathname} não foi encontrada.` }, { status: 404 });
    }

    // Verifica se a rota encontrada tem um handler para o método da requisição (ex: POST).
    const handler = match.route[method];

    if (handler && typeof handler === 'function') {
        // Se encontrou um handler, executa ele!
        return handler(request, match.params);
    }

    // Se a rota existe, mas não para este método.
    return NextResponse.json({ message: `Método ${method} não permitido para a rota ${pathname}.` }, { status: 405 });
}

// Exportamos a mesma função para todos os métodos HTTP que queremos suportar.
export { handleRequest as GET };
export { handleRequest as POST };
export { handleRequest as PUT };
export { handleRequest as DELETE };
export { handleRequest as PATCH };
