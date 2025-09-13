'use client';

import PageTransition from '@/app/pages/clients/PageTransition';
import { ReactNode } from 'react';

// Este componente Template envolve cada página e é recriado em cada navegação.
// É o lugar perfeito para colocar o nosso componente de transição.
export default function Template({ children }: { children: ReactNode }) {
    return (
        <PageTransition>
            {children}
        </PageTransition>
    );
}
