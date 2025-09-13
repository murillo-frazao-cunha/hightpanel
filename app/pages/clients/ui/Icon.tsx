import React from 'react';

// SVG Icons Component
export const Icon = ({ name, className }: { name: string, className?: string }) => {
    const baseIcons: { [key: string]: React.ReactNode } = {
        // Icons Adicionados
        alertTriangle: <><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></>,
        archive: <><line x1="21" y1="15" x2="3" y2="15" /><polyline points="21 8 21 15 3 15 3 8" /><polyline points="10 12 12 14 14 12" /><line x1="12" y1="14" x2="12" y2="3" /></>,
        arrowLeft: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
        check: <polyline points="20 6 9 17 4 12" />,
        checkCircle: <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></>,
        chevronLeft: <path d="m15 18-6-6 6-6" />,
        chevronRight: <path d="m9 18 6-6-6-6" />,
        // Novo: chevronDown
        chevronDown: <path d="m6 9 6 6 6-6" />,
        copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></>,
        cpu: <><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>,
        dashboard: <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />,
        disk: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 5v14a9 3 0 0 1-18 0V5"/><path d="M3 5a9 3 0 0 1 18 0"/></>,
        download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></>,
        edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></>,
        eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z"/><circle cx="12" cy="12" r="3"/></>,
        file: <><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /></>,
        folder: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />,
        gitBranch: <><line x1="6" y1="3" x2="6" y2="15"></line><circle cx="18" cy="6" r="3"></circle><circle cx="6" cy="18" r="3"></circle><path d="M18 9a9 9 0 0 1-9 9"></path></>,
        globe: <><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
        logOut: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
        nodes: <path d="M12 20h.01M4 12h.01M20 12h.01M8 16h.01M16 16h.01M4 4h.01M20 4h.01M8 8h.01M16 8h.01M12 12h.01" />,
        play: <polygon points="5 3 19 12 5 21 5 3" />,
        plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
        plusCircle: <><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></>,
        power: <><path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" /></>,
        ram: <><path d="M18 19a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v14Z"/><path d="M4 6h16"/><path d="M8 11h8"/><path d="M8 15h8"/></>,
        refresh: <><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></>,
        servers: <path d="M12 20h.01M4 12h.01M20 12h.01M8 16h.01M16 16h.01M4 4h.01M20 4h.01M8 8h.01M16 8h.01M12 12h.01" />,
        settings: <><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 010 2l-.15.08a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l-.22-.38a2 2 0 00-.73-2.73l-.15-.08a2 2 0 010-2l.15-.08a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></>,
        shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
        skull: <>
            <path d="M12 2c4.5 0 8 3.3 8 7.5 0 2.4-1 4.6-2.8 6.05v3.45a1 1 0 0 1-1 1h-1.2V18h-2v2h-2v-2h-2v2H7.8a1 1 0 0 1-1-1v-3.45C5 14.1 4 11.9 4 9.5 4 5.3 7.5 2 12 2Z" />
            <circle cx="9" cy="10" r="1.4" />
            <circle cx="15" cy="10" r="1.4" />
            <path d="M12 12.5l1 2h-2l1-2Z" />
            <line x1="10" y1="16" x2="10" y2="18" />
            <line x1="12" y1="16" x2="12" y2="18" />
            <line x1="14" y1="16" x2="14" y2="18" />
        </>,
        tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></>,
        trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
        users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
        x: <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
        // Novo: loader (spinner estático, animação via className animate-spin)
        loader: <><circle cx="12" cy="12" r="10" strokeOpacity="0.25" /><path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="0.85" /></>,
        // Novo: network (ícone de rede simples)
        network: <><circle cx="12" cy="5" r="3" /><circle cx="5" cy="19" r="3" /><circle cx="19" cy="19" r="3" /><line x1="12" y1="8" x2="5" y2="16" /><line x1="12" y1="8" x2="19" y2="16" /></>,
        // Novo: database (ícone de banco de dados)
        database: <><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5"/><path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6"/></>,
    };

    // Aliases em dash-case para compatibilidade com usos existentes
    const aliases: { [key: string]: string } = {
        'check-circle': 'checkCircle',
        'alert-triangle': 'alertTriangle',
        'chevron-down': 'chevronDown'
    };

    const resolvedName = aliases[name] || name;
    const icons = baseIcons;

    return <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 28 28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>{icons[resolvedName]}</svg>;
};
