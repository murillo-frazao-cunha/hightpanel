import { findMatchingRoute } from '@/app/routes/routeConfig';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { RouteGuard } from '@/app/pages/RouteGuard'; // NOVO: Importa o guardião

interface Props {
    params: Promise<{
        route: string[];
    }>;
}

export default async function CatchAllRoute({ params }: Props) {
    // Espera a Promise dos parâmetros ser resolvida
    const resolvedParams = await params;
    const pathname = '/' + (resolvedParams.route?.join('/') || '');
    const match = findMatchingRoute(pathname);

    if (!match || !match.route.component) {
        notFound();
    }

    const { route, params: routeParams } = match;
    const Component = route.component;

    // ATUALIZADO: Em vez de renderizar o componente diretamente,
    // nós o envolvemos com o RouteGuard, passando a regra de login.
    return (
        <RouteGuard requiresLogin={route.requiresLogin}>
            <Component {...routeParams} />
        </RouteGuard>
    );
}

// A função de metadados não precisa de alterações, pois ela roda
// no servidor antes de qualquer verificação de cliente.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const resolvedParams = await params;
    const pathname = '/' + (resolvedParams.route?.join('/') || '');
    const match = findMatchingRoute(pathname);

    if (match?.route.generateMetadata) {
        // @ts-ignore
        return match.route.generateMetadata(match.params);
    }

    return {
        title: 'Página não encontrada'
    };
}

