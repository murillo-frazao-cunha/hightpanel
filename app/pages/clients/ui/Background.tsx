// app/components/server/ui/Background.tsx
import React from 'react';

export const Background = () => (
    <div className="absolute top-0 left-0 w-full h-full -z-10 overflow-hidden">
        <div className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] bg-teal-500/10 rounded-full filter blur-3xl opacity-50 animate-pulse-slow"></div>
        <div className="absolute bottom-[-20%] right-[5%] w-[500px] h-[500px] bg-sky-500/10 rounded-full filter blur-3xl opacity-50 animate-pulse-slow animation-delay-2000"></div>
    </div>
);
