'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// Animação mais sutil: apenas um fade-in/out, sem movimento vertical.
const variants = {
    hidden: { opacity: 0 },
    enter: { opacity: 1 },
    exit: { opacity: 0 },
};

/**
 * NOTA IMPORTANTE PARA CORRIGIR O "FLASH":
 * Este componente está correto, mas para que a animação funcione sem que o conteúdo
 * da nova página pisque na tela, ele deve ser usado dentro de um arquivo `app/template.tsx`,
 * e não no `app/layout.tsx`.
 *
 * O `template.tsx` recria o componente a cada mudança de rota, o que funciona
 * perfeitamente com o <AnimatePresence> para evitar o flash de conteúdo.
 */
const PageTransition = ({ children }: { children: ReactNode }) => {
    const pathname = usePathname();

    return (
        <AnimatePresence
            mode="wait"
            onExitComplete={() => window.scrollTo(0, 0)}
        >
            <motion.div
                key={pathname}
                variants={variants}
                initial="hidden"
                animate="enter"
                exit="exit"
                // Transição mais rápida e usando a suavização padrão do Framer, que é mais natural.
                transition={{ duration: 0.25 }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
};

export default PageTransition;

