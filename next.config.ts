import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';

// A função exportada agora é tipada para garantir que ela receba
// os parâmetros corretos e retorne um objeto do tipo NextConfig.
const nextConfig = (
    phase: string,
    { defaultConfig }: { defaultConfig: NextConfig }
): NextConfig => {

    const nextConfig: NextConfig ={
        logging: false
    }

    // Se a fase for o build de produção...
    if (phase === PHASE_PRODUCTION_BUILD || phase === 'phase-production-server') {
        nextConfig.distDir = 'ebuilds'
    }

    // Para todas as outras fases (como 'next dev'), retorna a configuração padrão.
    // Isso fará com que o servidor de desenvolvimento use a pasta '.next'.
    return nextConfig
};

export default nextConfig;