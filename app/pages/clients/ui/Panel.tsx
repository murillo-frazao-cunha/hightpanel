// app/components/ui/Panel.tsx
import React from 'react';
import { twMerge } from 'tailwind-merge';

interface PanelProps {
    children: React.ReactNode;
    className?: string;
}

export const Panel = ({ children, className }: PanelProps) => (
    <div
        className={twMerge(
            'bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-[4px] transition-all duration-300',
            className
        )}
    >
        {children}
    </div>
);