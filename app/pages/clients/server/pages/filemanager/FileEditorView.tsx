'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { Icon } from '../../../ui/Icon';
import { fmRead, fmWrite } from '../../api';
import Editor from '@monaco-editor/react';
import { motion } from 'framer-motion';

const LoadingSpinner = () => (
    <div className="h-full flex items-center justify-center" role="status" aria-label="Loading">
        <svg
            className="animate-spin h-8 w-8 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
        >
            <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
            />
            <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
        </svg>
    </div>
);

// --- Helper Functions ---
const getLanguageFromPath = (path: string) => {
    const extension = path.split('.').pop()?.toLowerCase();
    switch (extension) {
        case 'js':
            return 'javascript';
        case 'ts':
            return 'typescript';
        case 'jsx':
            return 'jsx';
        case 'tsx':
            return 'tsx';
        case 'css':
            return 'css';
        case 'json':
            return 'json';
        case 'yml':
        case 'yaml':
            return 'yaml';
        case 'md':
            return 'markdown';
        case 'sh':
            return 'bash';
        default:
            return 'plaintext';
    }
};

const nonEditableExt = ['zip', 'rar', 'tar.gz', 'tgz', 'gz', '7z', 'xz', 'bz2', 'blob'];
function isNonEditable(path: string) {
    const lower = path.toLowerCase();
    return nonEditableExt.some((ext) => lower.endsWith('.' + ext));
}

export const FileEditorView = ({
                                   uuid,
                                   filePath,
                                   onBackAction,
                               }: {
    uuid: string;
    filePath: string;
    onBackAction: (path: string) => void;
}) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isBlocked = useMemo(() => isNonEditable(filePath), [filePath]);
    const language = useMemo(() => getLanguageFromPath(filePath), [filePath]);
    const parentPath = filePath.includes('/') ? filePath.substring(0, filePath.lastIndexOf('/')) : '';

    useEffect(() => {
        if (isBlocked) {
            setLoading(false);
            return;
        }
        const loadFile = async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fmRead(uuid, filePath);
                setContent(data.content);
            } catch (e: any) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        loadFile();
    }, [uuid, filePath, isBlocked]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
                event.preventDefault();
                if (!loading && !saving && !isBlocked) saveFile();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [loading, saving, isBlocked, content]);

    const saveFile = async () => {
        if (isBlocked) return;
        setSaving(true);
        setError(null);
        try {
            await fmWrite(uuid, filePath, content);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setSaving(false);
        }
    };

    const handleEditorChange = (value: string | undefined) => setContent(value || '');

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="h-full flex flex-col bg-zinc-900"
        >
            <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 text-xs flex-shrink-0 select-none">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onBackAction(parentPath)}
                        className="text-zinc-400 hover:text-white flex items-center gap-1"
                        type="button"
                        aria-label="Voltar para pasta"
                    >
                        <Icon name="arrow-left" className="w-3 h-3" /> Voltar
                    </button>
                    <span className="text-zinc-500 select-text">/</span>
                    <span className="text-zinc-300 font-mono break-all select-text" title={filePath}>
                        {filePath}
                    </span>
                    {error && <span className="text-rose-400 ml-4">{error}</span>}
                </div>
                <div className="flex gap-2">
                    {!isBlocked && (
                        <button
                            disabled={loading || saving}
                            onClick={saveFile}
                            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 rounded text-white text-xs disabled:opacity-50 flex items-center gap-1.5"
                            type="button"
                            aria-label="Salvar arquivo"
                        >
                            <Icon name="save" className="w-3 h-3" />
                            {saving ? 'Salvando...' : 'Salvar'}
                        </button>
                    )}
                </div>
            </div>
            <div className="flex-1 overflow-hidden">
                {loading ? (
                    <LoadingSpinner />
                ) : isBlocked ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-400 text-sm p-6 select-none" role="alert" aria-live="polite">
                        <Icon name="alert-circle" className="w-10 h-10 text-amber-400" />
                        <p className="text-center max-w-md leading-relaxed">
                            Este tipo de arquivo não pode ser editado diretamente. Baixe ou (se for um arquivo compactado) use a opção de desarquivar.
                        </p>
                        <button
                            onClick={() => onBackAction(parentPath)}
                            className="px-3 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-xs"
                            type="button"
                        >
                            Voltar
                        </button>
                    </div>
                ) : (
                    <Editor
                        height="100%"
                        language={language}
                        value={content}
                        onChange={handleEditorChange}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 13,
                            wordWrap: 'on',
                            automaticLayout: true,
                            scrollBeyondLastLine: false,
                        }}
                        aria-label={`Editor de arquivo para ${filePath}`}
                    />
                )}
            </div>
        </motion.div>
    );
};