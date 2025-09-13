// app/components/server/ui/Panel.tsx
import React from 'react';

export const Panel = ({ children, className }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-zinc-900/40 backdrop-blur-2xl rounded-2xl ${className}`}>
        {children}
    </div>
);
