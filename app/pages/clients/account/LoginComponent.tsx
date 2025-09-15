'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { signIn, useSession } from 'next-auth/react'; // 1. Importa as funções do NextAuth
import { useRouter } from 'next/navigation';

import { Icon } from '../ui/Icon'; // Ajuste o caminho se necessário
import { Background } from '../ui/Background'; // Ajuste o caminho se necessário

export const LoginPage = () => {
    // 2. Hooks do NextAuth e Next.js
    const { data: session, status } = useSession();
    const router = useRouter();

    // Estados do formulário
    // MUDANÇA: 'email' agora é 'identifier' para aceitar email ou username
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Estados para controle de UI (loading e erro)
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Novo: estado para verificar se já existe usuário
    const [includesUser, setIncludesUser] = useState<boolean | null>(null);
    const [checkingIncludes, setCheckingIncludes] = useState<boolean>(true);

    // Novo: estados para criar primeiro usuário
    const [firstName, setFirstName] = useState('');
    const [firstEmail, setFirstEmail] = useState('');
    const [firstPassword, setFirstPassword] = useState('');
    const [firstPassword2, setFirstPassword2] = useState('');
    const [creatingFirst, setCreatingFirst] = useState(false);
    const [createError, setCreateError] = useState<string | null>(null);
    const [showFirstPass, setShowFirstPass] = useState(false);

    useEffect(() => {
        let aborted = false;
        async function checkIncludes() {
            try {
                setCheckingIncludes(true);
                const res = await fetch('/api/includes_user', { cache: 'no-store' });
                if(!res.ok) throw new Error('Falha ao verificar usuários');
                const data = await res.json();
                if(!aborted) {
                    setIncludesUser(!!data.includes);
                }
            } catch (e) {
                if(!aborted) {
                    // Em caso de erro assume que existe (para não bloquear login)
                    setIncludesUser(true);
                }
            } finally {
                if(!aborted) setCheckingIncludes(false);
            }
        }
        checkIncludes();
        return () => { aborted = true };
    }, []);

    // 3. Redireciona o usuário se ele já estiver logado
    useEffect(() => {
        if (status === 'authenticated') {
            router.replace('/');
        }
    }, [status, router]);

    // 4. Função de submit atualizada para usar o NextAuth
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const result = await signIn('credentials', {
                redirect: false, // Impede o redirecionamento automático da página inteira
                username: identifier,
                password: password,
            });

            // MUDANÇA: Lógica de erro mais robusta.
            // O redirect para /api/auth/error geralmente acontece se um erro
            // for lançado no backend. Esta verificação lida com a falha
            // retornada pelo `authorize` quando as credenciais estão erradas.
            if (!result || result.error) {
                setError('Credenciais inválidas. Verifique seus dados e senha.');
                setIsLoading(false);
                return; // Para a execução aqui
            }

            // Se chegamos aqui, o login foi bem-sucedido.
            // Usamos router.replace para não adicionar a página de login ao histórico.
            router.replace('/');

        } catch (err) {
            setError('Ocorreu um erro inesperado. Tente novamente.');
            setIsLoading(false);
        }
    };

    // Novo: criar primeiro usuário
    const handleCreateFirstUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreateError(null);
        if(firstPassword !== firstPassword2) {
            setCreateError('As senhas não coincidem.');
            return;
        }
        if(firstPassword.length < 6) {
            setCreateError('Senha precisa ter ao menos 6 caracteres.');
            return;
        }
        setCreatingFirst(true);
        try {
            const res = await fetch('/api/includes_user/create_first_user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: firstName, email: firstEmail, password: firstPassword })
            });
            const data = await res.json();
            if(data.status !== 'success') {
                setCreateError(data.error || 'Erro desconhecido.');
                setCreatingFirst(false);
                return;
            }
            // Login automático (pode usar email ou username)
            await signIn('credentials', { redirect: false, username: firstEmail, password: firstPassword });
            router.replace('/');
        } catch (err:any) {
            setCreateError('Falha ao criar usuário.');
            setCreatingFirst(false);
        }
    };

    // Ajustar tela de loading: também considerar verificação includes
    if (status === 'loading' || status === 'authenticated' || checkingIncludes) {
        return (
            <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
                <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            </div>
        );
    }

    // Render diferente se não existe usuário ainda
    if(includesUser === false) {
        return (
            <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans-serif] flex items-center justify-center p-4">
                <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
                <Background />
                <main className="w-full max-w-3xl mx-auto">
                    <div className="flex flex-col md:flex-row bg-zinc-900/40 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                        <div className="hidden md:flex w-full md:w-1/2 p-10 bg-zinc-950/30 flex-col items-center justify-center text-center">
                            <Icon name="dashboard" className="w-20 h-20 text-teal-400" />
                            <h1 className="text-3xl font-bold text-white mt-6">Primeiro Acesso</h1>
                            <p className="text-zinc-400 mt-2 max-w-xs">Crie o primeiro usuário administrador do painel.</p>
                        </div>
                        <div className="w-full md:w-1/2 p-8 md:p-10">
                            <h2 className="text-2xl font-bold text-white text-center md:text-left">Criar Primeiro Usuário</h2>
                            <p className="text-zinc-400 mt-2 mb-6 text-center md:text-left">Defina as credenciais iniciais.</p>
                            <form onSubmit={handleCreateFirstUser} className="space-y-5">
                                {createError && (
                                    <div className="p-3 bg-rose-500/20 text-rose-400 text-sm rounded-lg text-center">{createError}</div>
                                )}
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-zinc-300 mb-2">Nome de Usuário</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Icon name="user" className="h-5 w-5 text-zinc-500" /></div>
                                        <input id="firstName" type="text" required value={firstName} onChange={e=>setFirstName(e.target.value)} disabled={creatingFirst}
                                               className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 pl-10 pr-3 text-zinc-200 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm disabled:opacity-50" placeholder="admin" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="firstEmail" className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Icon name="mail" className="h-5 w-5 text-zinc-500" /></div>
                                        <input id="firstEmail" type="email" required value={firstEmail} onChange={e=>setFirstEmail(e.target.value)} disabled={creatingFirst}
                                               className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 pl-10 pr-3 text-zinc-200 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm disabled:opacity-50" placeholder="admin@exemplo.com" />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="firstPassword" className="block text-sm font-medium text-zinc-300 mb-2">Senha</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Icon name="lock" className="h-5 w-5 text-zinc-500" /></div>
                                        <input id="firstPassword" type={showFirstPass ? 'text':'password'} required value={firstPassword} onChange={e=>setFirstPassword(e.target.value)} disabled={creatingFirst}
                                               className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 pl-10 pr-10 text-zinc-200 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm disabled:opacity-50" placeholder="********" />
                                        <button type="button" onClick={()=>setShowFirstPass(p=>!p)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"><Icon name={showFirstPass? 'eyeOff':'eye'} className="h-5 w-5" /></button>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="firstPassword2" className="block text-sm font-medium text-zinc-300 mb-2">Confirmar Senha</label>
                                    <div className="relative">
                                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"><Icon name="lock" className="h-5 w-5 text-zinc-500" /></div>
                                        <input id="firstPassword2" type={showFirstPass ? 'text':'password'} required value={firstPassword2} onChange={e=>setFirstPassword2(e.target.value)} disabled={creatingFirst}
                                               className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 pl-10 pr-10 text-zinc-200 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm disabled:opacity-50" placeholder="********" />
                                    </div>
                                </div>
                                <button type="submit" disabled={creatingFirst} className="flex w-full justify-center items-center rounded-lg bg-teal-500 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-lg shadow-teal-500/10 hover:bg-teal-600 disabled:bg-teal-800 disabled:cursor-not-allowed">
                                    {creatingFirst ? (
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : 'Criar e Entrar'}
                                </button>
                                <p className="text-xs text-zinc-500 text-center">Esta conta será marcada como administrador automaticamente.</p>
                            </form>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-950 text-zinc-200 font-['Inter',_sans-serif] flex items-center justify-center p-4">
            <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');`}</style>
            <Background />

            <main className="w-full max-w-4xl mx-auto">
                <div className="flex flex-col md:flex-row bg-zinc-900/40 backdrop-blur-2xl rounded-2xl shadow-2xl shadow-black/40 overflow-hidden">
                    <div className="hidden md:flex w-full md:w-1/2 p-12 bg-zinc-950/30 flex-col items-center justify-center text-center">
                        <Icon name="dashboard" className="w-24 h-24 text-teal-400" />
                        <h1 className="text-4xl font-bold text-white mt-6">Painel</h1>
                        <p className="text-zinc-400 mt-2 max-w-xs">Gerencie todos os seus servidores com performance e facilidade.</p>
                    </div>

                    <div className="w-full md:w-1/2 p-8 md:p-12">
                        <div className="md:hidden text-center mb-8">
                            <Icon name="dashboard" className="w-12 h-12 text-teal-400 mx-auto" />
                        </div>
                        <h2 className="text-3xl font-bold text-white text-center md:text-left">Acesse sua Conta</h2>
                        <p className="text-zinc-400 mt-2 mb-8 text-center md:text-left">Bem-vindo de volta!</p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* 6. Exibição da mensagem de erro */}
                            {error && (
                                <div className="p-3 bg-rose-500/20 text-rose-400 text-sm rounded-lg text-center">
                                    {error}
                                </div>
                            )}
                            <div>
                                {/* MUDANÇA: Label atualizada */}
                                <label htmlFor="identifier" className="block text-sm font-medium text-zinc-300 mb-2">Email ou Nome de Usuário</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"> <Icon name="mail" className="h-5 w-5 text-zinc-500" /> </div>
                                    {/* MUDANÇA: Input atualizado */}
                                    <input id="identifier" type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)} disabled={isLoading}
                                           className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 pl-10 pr-3 text-zinc-200 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm transition-all disabled:opacity-50"
                                           placeholder="seu@email.com ou seunome" />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between">
                                    <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">Senha</label>
                                    <Link href="#" className="text-sm font-semibold text-teal-500 hover:text-teal-400">Esqueceu?</Link>
                                </div>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3"> <Icon name="lock" className="h-5 w-5 text-zinc-500" /> </div>
                                    <input id="password" type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} disabled={isLoading}
                                           className="block w-full rounded-lg border-0 bg-zinc-800/50 py-3 pl-10 pr-10 text-zinc-200 ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-teal-500 sm:text-sm transition-all disabled:opacity-50"
                                           placeholder="Tente '123456'" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300"> <Icon name={showPassword ? 'eyeOff' : 'eye'} className="h-5 w-5" /> </button>
                                </div>
                            </div>

                            <div>
                                {/* 7. Botão com estado de loading */}
                                <button type="submit" disabled={isLoading}
                                        className="flex w-full justify-center items-center rounded-lg bg-teal-500 px-3 py-3 text-sm font-semibold leading-6 text-white shadow-lg shadow-teal-500/10 hover:bg-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 transition-colors disabled:bg-teal-800 disabled:cursor-not-allowed">
                                    {isLoading ? (
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                    ) : 'Entrar'}
                                </button>
                            </div>
                        </form>

                        <p className="mt-8 text-center text-sm text-zinc-500">
                            Não tem uma conta?{' '} <Link href="#" className="font-semibold leading-6 text-teal-500 hover:text-teal-400"> Crie uma agora </Link>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};
