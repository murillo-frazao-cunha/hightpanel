// app/components/server/pages/ConsolePage.tsx
'use client';
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Panel } from '../../ui/Panel';
import { useServer } from '../context/ServerContext';
import { AnsiUp } from 'ansi_up';
import { motion } from 'framer-motion';

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center">
        <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

export const ConsolePage = () => {
    const { logs, sendCommand, isSendingCommand, nodeOffline, server, isLoading } = useServer();
    const [input, setInput] = useState('');
    const [logsHere, setLogsHere] = useState<any>([])
    const scrollRef = useRef<HTMLDivElement>(null);
    const ansiUpRef = useRef<AnsiUp | null>(null);

    if (!ansiUpRef.current) {
        try {
            ansiUpRef.current = new AnsiUp();
            ansiUpRef.current.use_classes = false;
        } catch (e) {
            ansiUpRef.current = null;
        }
    }

    useLayoutEffect(() => {
        if (!scrollRef.current) return;
        const scrollEl = scrollRef.current;
        const distanceFromBottom = scrollEl.scrollHeight - scrollEl.clientHeight - scrollEl.scrollTop;
        const isScrolledToBottom = distanceFromBottom <= 2.5;
        setLogsHere(logs);
        if (isScrolledToBottom) {
            requestAnimationFrame(() => {
                if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                }
            });
        }
    }, [logs]);

    const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && input) {
            sendCommand(input);
            setInput('');
        }
    };

    const normalizeAnsi = (raw: string) => {
        let t = raw.replace(/[\u0000-\u0008\u000B-\u001A\u001C-\u001F\u007F]/g, '');
        t = t.replace(/(^|[^])((\[(?:[0-9]{1,3}(?:;[0-9]{1,3})*)?m)|\[K)/g, (full, pre, seq) => pre + '\x1b' + seq);
        const map: Record<string, string> = { '0': '30', '1': '34', '2': '32', '3': '36', '4': '31', '5': '35', '6': '33', '7': '37', '8': '90', '9': '94', 'a': '92', 'b': '96', 'c': '91', 'd': '95', 'e': '93', 'f': '97', 'l': '1', 'n': '4', 'o': '3', 'm': '9', 'r': '0' };
        t = t.replace(/§([0-9a-fk-or])/gi, (_, codeRaw) => { const code = codeRaw.toLowerCase(); if (code === 'k') return ''; const sgr = map[code]; if (!sgr) return ''; return `\x1b[${sgr}m`; });
        t = t.replace(/\x1b\[K/g, '');
        t = t.split('\n').map(l => l.replace(/^\s*>[>.]*/, '')).join('\n');
        return t;
    };

    if (isLoading && !server) {
        return <LoadingSpinner />;
    }

    const consoleHeightClass = server?.status === 'stopped' ? 'h-[455px]' : 'h-[655px]';

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} className="h-full">
            <Panel className={`${consoleHeightClass} flex flex-col font-mono text-sm p-4 relative`}>
                {nodeOffline && (
                    <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-zinc-950/80 backdrop-blur-sm">
                        <div className="w-24 h-24 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin"></div>
                        <p className="mt-6 text-amber-300 font-semibold text-lg tracking-wide">Node offline</p>
                        <p className="mt-1 text-amber-500 text-xs uppercase">aguardando reconexão...</p>
                    </div>
                )}
                <div ref={scrollRef} className="flex-grow overflow-y-auto pr-2 custom-scrollbar opacity-100">
                    {logsHere.map((log: any, i: any) => {
                        const normalized = normalizeAnsi(log.msg || '');
                        const html = ansiUpRef.current ? ansiUpRef.current.ansi_to_html(normalized) : normalized.replace(/\x1b\[[0-9;]*m/g, '');
                        return (
                            <div key={i} className="whitespace-pre-wrap break-words leading-relaxed text-[12px]" dangerouslySetInnerHTML={{ __html: html }} />
                        );
                    })}
                </div>
                <div className="flex items-center pt-4 mt-2">
                    <span className="text-purple-400 mr-2 font-semibold">{' > '}</span>
                    <input
                        type="text"
                        value={input}
                        disabled={isSendingCommand || nodeOffline}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleCommand}
                        className="w-full bg-transparent focus:outline-none text-zinc-200 placeholder:text-zinc-500 disabled:opacity-40"
                        placeholder={nodeOffline ? 'Node offline - aguardando...' : (isSendingCommand ? 'Enviando comando...' : 'Digite um comando...')}
                    />
                </div>
            </Panel>
        </motion.div>
    );
};
