'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Icon } from '@/app/pages/clients/ui/Icon';
import type { Core, CoreImage, CoreVariable } from '../types/CoreType';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism-okaidia.css'; // Tema escuro para o editor
import dynamic from 'next/dynamic';

// Monaco apenas para o script de instalação
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

interface CoreFormPageProps {
    core?: Core | null;
    onSave: (core: Core) => Promise<void>;
    isSubmitting: boolean;
    error: string | null;
    clearError: () => void;
}

const CoreFormPage: React.FC<CoreFormPageProps> = ({ core, onSave, isSubmitting, error, clearError }) => {
    const [formData, setFormData] = useState<Partial<Core>>({});
    const isEditing = !!core;

    useEffect(() => {
        if (isEditing && core) {
            const newFormData = { ...core } as any;

            // FIX: Garante que os campos de JSON sejam sempre strings para o editor de código.
            // A biblioteca de highlight (prism.js) quebra se receber um objeto.
            if (newFormData.startupParser && typeof newFormData.startupParser !== 'string') {
                newFormData.startupParser = JSON.stringify(newFormData.startupParser, null, 2);
            }
            if (newFormData.configSystem && typeof newFormData.configSystem !== 'string') {
                newFormData.configSystem = JSON.stringify(newFormData.configSystem, null, 2);
            }
            if (!newFormData.description) newFormData.description = '';
            setFormData(newFormData);
        } else {
            // Valores padrão para um novo Core
            setFormData({
                name: '',
                description: '',
                installScript: '#!/bin/bash\n# Script de instalação aqui...\napt-get update\napt-get install -y openjdk-17-jre-headless',
                startupCommand: 'java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar server.jar',
                dockerImages: [{ name: 'Java 17', image: 'ghcr.io/pterodactyl/yolks:java_17' }],
                variables: [], // Inicia com array de variáveis vazio
                stopCommand: 'stop',
                startupParser: JSON.stringify({ "done": ")! For help, type " }, null, 2),
                configSystem: JSON.stringify({
                    "server.properties": {
                        "server-ip": "0.0.0.0",
                        "server-port": "{SERVER_PORT}"
                    }
                }, null, 2),
            });
        }
    }, [core, isEditing]);

    const handleCodeChange = (code: string, field: keyof Core) => {
        setFormData(prev => ({ ...prev, [field]: code }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (index: number, field: keyof CoreImage, value: string) => {
        const updatedImages = [...(formData.dockerImages || [])];
        updatedImages[index] = { ...updatedImages[index], [field]: value };
        setFormData(prev => ({ ...prev, dockerImages: updatedImages }));
    };

    const addImage = () => {
        const updatedImages = [...(formData.dockerImages || []), { name: '', image: '' }];
        setFormData(prev => ({ ...prev, dockerImages: updatedImages }));
    };

    const removeImage = (index: number) => {
        const updatedImages = [...(formData.dockerImages || [])];
        updatedImages.splice(index, 1);
        setFormData(prev => ({ ...prev, dockerImages: updatedImages }));
    };

    const handleVariableChange = (index: number, field: keyof CoreVariable, value: string) => {
        const updatedVariables = [...(formData.variables || [])];
        updatedVariables[index] = { ...updatedVariables[index], [field]: value };
        setFormData(prev => ({ ...prev, variables: updatedVariables }));
    };

    const addVariable = () => {
        const newVariable: CoreVariable = { name: '', description: '', envVariable: '', rules: 'required|string' };
        const updatedVariables = [...(formData.variables || []), newVariable];
        setFormData(prev => ({ ...prev, variables: updatedVariables }));
    };

    const removeVariable = (index: number) => {
        const updatedVariables = [...(formData.variables || [])];
        updatedVariables.splice(index, 1);
        setFormData(prev => ({ ...prev, variables: updatedVariables }));
    };


    const handleSave = async () => {
        if (isSubmitting) return;

        if (!formData.name) {
            alert('O nome do Core é obrigatório.');
            return;
        }

        try {
            JSON.parse(formData.startupParser || '{}');
            JSON.parse(formData.configSystem || '{}');
        } catch (e) {
            alert('Os campos de Parser e Configuração precisam ser um JSON válido.');
            return;
        }

        await onSave(formData as Core);
    };

    const editorStyle: React.CSSProperties = {
        fontFamily: '"Fira Code", "Fira Mono", monospace',
        fontSize: 14,
        outline: 'none',
        border: '1px solid #3f3f46',
        backgroundColor: '#272822',
        borderRadius: '0.5rem',
        minHeight: '200px',
    };

    return (
        <>
            <header className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-white">{isEditing ? 'Editando Core' : 'Criar Novo Core'}</h1>
                    <p className="text-zinc-400 mt-1">{isEditing ? `Modificando "${formData.name}"` : 'Preencha os detalhes para configurar um novo core.'}</p>
                </div>
            </header>

            {error && (
                <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 p-4 rounded-lg flex justify-between items-center mb-6 animate-pulse-slow">
                    <div className="flex items-center gap-3"><Icon name="alert-triangle" className="w-5 h-5 flex-shrink-0" /><p className="text-sm font-medium">{error}</p></div>
                    <button onClick={clearError} className="p-1 rounded-full hover:bg-rose-500/20 transition-colors"><Icon name="x" className="w-5 h-5" /></button>
                </div>
            )}

            <div className="space-y-8">
                {/* Painel de Informações Principais */}
                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50">
                        <h2 className="text-xl font-bold text-white">Informações Principais</h2>
                        <p className="text-zinc-400 text-sm mt-1">O nome, descrição e autor do core.</p>
                    </div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-2">Nome do Core</label>
                            <input id="name" type="text" name="name" value={formData.name || ''} onChange={handleChange} placeholder="ex: Minecraft (Paper)" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Descrição</label>
                            <textarea name="description" value={(formData as any).description || ''} onChange={(e)=>handleChange(e as any)} rows={3} placeholder="Breve descrição do core..." className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all resize-none" />
                        </div>
                        {isEditing && core?.creatorEmail && (
                            <div className="text-xs text-zinc-500">Criado por: <span className="text-zinc-300">{core.creatorEmail}</span></div>
                        )}
                    </div>
                </div>

                {/* Painel de Script de Instalação */}
                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50">
                        <h2 className="text-xl font-bold text-white">Script de Instalação</h2>
                        <p className="text-zinc-400 text-sm mt-1">Este script (Bash) será executado na primeira vez que o servidor for criado. (Editor Monaco)</p>
                    </div>
                    <div className="p-6">
                        <div className="rounded-lg overflow-hidden border border-zinc-700/60">
                            <MonacoEditor
                                height="320px"
                                language="bash"
                                theme="vs-dark"
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    scrollBeyondLastLine: false,
                                    wordWrap: 'on',
                                    automaticLayout: true,
                                    tabSize: 2,
                                }}
                                value={formData.installScript || ''}
                                onChange={(value) => setFormData(prev => ({ ...prev, installScript: value || '' }))}
                            />
                        </div>
                    </div>
                </div>

                {/* Painel de Comandos de Execução */}
                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50"><h2 className="text-xl font-bold text-white">Comandos de Execução</h2><p className="text-zinc-400 text-sm mt-1">Comandos para inicialização e desligamento do servidor.</p></div>
                    <div className="p-6 space-y-6">
                        <div>
                            <label htmlFor="startupCommand" className="block text-sm font-medium text-zinc-400 mb-2">Comando de Inicialização</label>
                            <input id="startupCommand" type="text" name="startupCommand" value={formData.startupCommand || ''} onChange={handleChange} className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                        </div>
                        <div>
                            <label htmlFor="stopCommand" className="block text-sm font-medium text-zinc-400 mb-2">Comando de Desligamento</label>
                            <input id="stopCommand" type="text" name="stopCommand" value={formData.stopCommand || ''} onChange={handleChange} placeholder="ex: stop" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm placeholder:text-zinc-500 focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                        </div>
                    </div>
                </div>


                {/* Painel de Imagens Docker */}
                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50"><h2 className="text-xl font-bold text-white">Imagens Docker</h2><p className="text-zinc-400 text-sm mt-1">Lista de imagens compatíveis com este core.</p></div>
                    <div className="p-6 space-y-4">
                        {formData.dockerImages?.map((img, index) => (
                            <div key={index} className="flex items-center gap-4">
                                <input type="text" value={img.name} onChange={(e) => handleImageChange(index, 'name', e.target.value)} placeholder="Nome (ex: Java 11)" className="w-1/3 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                                <input type="text" value={img.image} onChange={(e) => handleImageChange(index, 'image', e.target.value)} placeholder="Imagem (ex: ghcr.io/...)" className="flex-grow bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                                <button onClick={() => removeImage(index)} className="p-2 text-zinc-400 hover:text-rose-400 transition-colors"><Icon name="trash" className="w-5 h-5" /></button>
                            </div>
                        ))}
                        <button onClick={addImage} className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors font-semibold">
                            <Icon name="plusCircle" className="w-5 h-5" /> Adicionar Imagem
                        </button>
                    </div>
                </div>

                {/* Painel de Variáveis de Ambiente */}
                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50"><h2 className="text-xl font-bold text-white">Variáveis de Ambiente</h2><p className="text-zinc-400 text-sm mt-1">Configure variáveis que o usuário poderá preencher na criação do servidor.</p></div>
                    <div className="p-6 space-y-4">
                        {formData.variables?.map((variable, index) => (
                            <div key={index} className="bg-zinc-800/30 p-4 rounded-lg border border-zinc-700/50 space-y-4">
                                <div className="flex justify-end">
                                    <button onClick={() => removeVariable(index)} className="p-1.5 text-zinc-500 hover:text-rose-400 transition-colors"><Icon name="x" className="w-4 h-4" /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Nome da Variável</label>
                                        <input type="text" value={variable.name} onChange={e => handleVariableChange(index, 'name', e.target.value)} placeholder="Senha do Servidor" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-400 mb-2">Variável de Ambiente (ID)</label>
                                        <input type="text" value={variable.envVariable} onChange={e => handleVariableChange(index, 'envVariable', e.target.value)} placeholder="SERVER_PASSWORD" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder:text-zinc-500 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Descrição</label>
                                    <input type="text" value={variable.description} onChange={e => handleVariableChange(index, 'description', e.target.value)} placeholder="Define a senha para entrar no servidor." className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-white placeholder:text-zinc-500 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-400 mb-2">Regras de Validação</label>
                                    <input type="text" value={variable.rules} onChange={e => handleVariableChange(index, 'rules', e.target.value)} placeholder="required|string|min:4" className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-white font-mono text-sm placeholder:text-zinc-500 focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500 outline-none transition-all" />
                                </div>
                            </div>
                        ))}
                        <button onClick={addVariable} className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors font-semibold">
                            <Icon name="plusCircle" className="w-5 h-5" /> Adicionar Variável
                        </button>
                    </div>
                </div>

                {/* Painel de Configurações Avançadas */}
                <div className="bg-zinc-900/70 backdrop-blur-sm rounded-lg border border-zinc-700/50">
                    <div className="p-6 border-b border-zinc-700/50"><h2 className="text-xl font-bold text-white">Configurações Avançadas</h2><p className="text-zinc-400 text-sm mt-1">Parsers e sistema de configuração em formato JSON.</p></div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Parser de Inicialização (JSON)</label>
                            <div className="custom-scrollbar"><Editor value={formData.startupParser || ''} onValueChange={code => handleCodeChange(code, 'startupParser')} highlight={code => highlight(code, languages.json, 'json')} padding={10} style={editorStyle} /></div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-400 mb-2">Sistema de Configuração (JSON)</label>
                            <div className="custom-scrollbar"><Editor value={formData.configSystem || ''} onValueChange={code => handleCodeChange(code, 'configSystem')} highlight={code => highlight(code, languages.json, 'json')} padding={10} style={editorStyle} /></div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Ações do Formulário */}
            <div className="mt-8 border-t border-zinc-700/50 pt-6 flex justify-end gap-4">
                <Link href="/admin/cores" className="px-5 py-2.5 rounded-lg bg-zinc-800/50 text-zinc-300 hover:bg-zinc-700/50 transition-colors">Cancelar</Link>
                <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2.5 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_-5px] shadow-purple-500/50 disabled:bg-purple-800 disabled:scale-100 disabled:cursor-not-allowed flex items-center gap-2">
                    {isSubmitting && <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isSubmitting ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Core')}
                </button>
            </div>
        </>
    );
};

export default CoreFormPage;