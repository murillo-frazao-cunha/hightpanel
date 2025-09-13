// app/components/server/pages/ConsolePage.tsx
'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Panel } from '../../ui/Panel';
import { useServer } from '../context/ServerContext';
import { AnsiUp } from 'ansi_up';

export const ConsolePage = () => {
    const { logs, sendCommand, isSendingCommand } = useServer();
    const [input, setInput] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const ansiUpRef = useRef<AnsiUp | null>(null);

    if(!ansiUpRef.current) {
        try {
            ansiUpRef.current = new AnsiUp();
            ansiUpRef.current.use_classes = false;
        } catch (e) {
            // fallback silencioso
            ansiUpRef.current = null;
        }
    }

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    const handleCommand = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && input) {
            sendCommand(input);
            setInput('');
        }
    };

    const cleanControl = (msg: string) => {
        if(!msg) return '';
        // Remove controles exceto ESC para preservar ANSI
        return msg.replace(/[\u0000-\u0008\u000B-\u001A\u001C-\u001F\u007F]/g, '');
    };

    const injectMissingEsc = (text: string) => {
        // Adiciona ESC em sequências SGR que não possuem ESC (ex: [0;33m, [1m, [m, [K)
        return text.replace(/(^|[^\x1b])((\[(?:[0-9]{1,3}(?:;[0-9]{1,3})*)?m)|\[K)/g, (full, pre, seq) => {
            return pre + '\x1b' + seq;
        });
    };

    const stripEraseLine = (text: string) => {
        // Remove sequências de apagar linha (ESC[K) que só poluem a visualização
        return text.replace(/\x1b\[K/g, '');
    };

    const mcColorToAnsi = (text: string) => {
        // Converte códigos § do Minecraft para ANSI SGR
        const map: Record<string,string> = {
            '0':'30','1':'34','2':'32','3':'36','4':'31','5':'35','6':'33','7':'37','8':'90','9':'94',
            'a':'92','b':'96','c':'91','d':'95','e':'93','f':'97',
            'l':'1','n':'4','o':'3','m':'9','r':'0' // estilos
        };
        return text.replace(/§([0-9a-fk-or])/gi, (_, codeRaw) => {
            const code = codeRaw.toLowerCase();
            if(code === 'k') return ''; // obfuscation ignorado
            const sgr = map[code];
            if(!sgr) return '';
            return `\x1b[${sgr}m`;
        });
    };

    const stripLeadingMinecraftPrompt = (text: string) => {
        // Para cada linha, remove somente o prefixo composto de '>' e '.' (ex: >...., >>>, >..) no início
        return text.split('\n').map(l => l.replace(/^\s*>[>.]*/, '')).join('\n');
    };

    const normalizeAnsi = (raw: string) => {
        let t = cleanControl(raw);
        t = injectMissingEsc(t);
        t = mcColorToAnsi(t);
        t = stripEraseLine(t);
        t = stripLeadingMinecraftPrompt(t); // substitui o antigo removePromptArtifacts
        return t;
    };

    return (
        <Panel className="h-[564px] flex flex-col font-mono text-sm p-4">
            <div ref={scrollRef} className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
                {logs.map((log: any, i: any) => {
                    const normalized = normalizeAnsi(log.msg || '');
                    const html = ansiUpRef.current ? ansiUpRef.current.ansi_to_html(normalized) : normalized.replace(/\x1b\[[0-9;]*m/g, '');
                    return (
                        <div key={i} className="whitespace-pre-wrap break-words leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
                    );
                })}
            </div>
            <div className="flex items-center pt-4 mt-2">
                <span className="text-teal-400 mr-2 font-semibold">{'>'}</span>
                <input
                    type="text"
                    value={input}
                    disabled={isSendingCommand}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleCommand}
                    className="w-full bg-transparent focus:outline-none text-zinc-200 placeholder:text-zinc-500 disabled:opacity-40"
                    placeholder={isSendingCommand ? 'Enviando comando...' : 'Digite um comando...'}
                />
            </div>
        </Panel>
    );
};
