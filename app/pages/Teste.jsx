'use client'
import React, { useState, useEffect, useMemo } from 'react';

// --- Ícones como Componentes ---
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
    </svg>
);
const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M6 .278a.768.768 0 0 1 .08.858 7.208 7.208 0 0 0-.878 3.46c0 4.021 3.278 7.277 7.318 7.277.527 0 1.04-.055 1.533-.16a.787.787 0 0 1 .81.316.733.733 0 0 1-.031.893A8.349 8.349 0 0 1 8.344 16C3.734 16 0 12.286 0 7.71 0 4.266 2.114 1.312 5.124.06A.752.752 0 0 1 6 .278zM4.858 1.311A7.269 7.269 0 0 0 1.025 7.71c0 4.021 3.278 7.277 7.318 7.277a7.316 7.316 0 0 0 5.205-2.162c-.337.042-.68.063-1.029.063-4.61 0-8.343-3.714-8.343-8.29 0-1.167.242-2.278.681-3.286z"/>
    </svg>
);
const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 11a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm0 1a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM8 0a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 0zm0 13a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-1 0v-2A.5.5 0 0 1 8 13zm-5-5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zm10 0a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 0 1h-2a.5.5 0 0 1-.5-.5zM3.536 3.536a.5.5 0 0 1 .707 0l1.414 1.414a.5.5 0 1 1-.707.707L3.536 4.243a.5.5 0 0 1 0-.707zm8.485 8.485a.5.5 0 0 1 .707 0l1.414 1.414a.5.5 0 0 1-.707.707l-1.414-1.414a.5.5 0 0 1 0-.707zm-8.485 0a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0zm11.314-8.485a.5.5 0 0 1 0 .707l-1.414 1.414a.5.5 0 1 1-.707-.707l1.414-1.414a.5.5 0 0 1 .707 0z"/>
    </svg>
);
const GitHubIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46. ৫৫.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/>
    </svg>
);
const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-green-500 dark:text-green-400">
        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
    </svg>
);
const InstallationIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600 dark:text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
    </svg>
);
const TerminologyIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600 dark:text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);
const PluginsIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600 dark:text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75l2.25-1.313M12 21.75V19.5m0 2.25l-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
    </svg>
);
const ApiRefIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-purple-600 dark:text-purple-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
);
const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
);


// --- Conteúdo das Páginas de Documentação ---
const pages = {
    installation: {
        title: 'Instalação',
        description: 'Guia detalhado para instalar o Ender Panel.',
        icon: <InstallationIcon />,
        toc: [
            { title: 'Dependências', id: 'dependencies' },
            { title: 'Configuração do Redis', id: 'redis-config' },
            { title: 'Download dos Arquivos', id: 'download-files' },
            { title: 'Instalação e Configuração', id: 'setup-panel' },
            { title: 'Inicialização', id: 'start-panel' }
        ],
        content: (
            <>
                <p className="font-semibold text-purple-600 dark:text-purple-400">Painel</p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mt-2">Instalação do Ender Panel</h1>
                <section id="dependencies" className="mt-12 scroll-mt-24">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Dependências</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Antes de iniciar a instalação do Ender Panel, é fundamental garantir que todas as dependências estejam presentes no seu sistema. O painel foi desenvolvido em Node.js, então você precisará do Node.js (recomendado v22 ou superior), npm, Redis para persistência dos dados, Git para baixar os arquivos do projeto, além de utilitários como unzip para descompactar arquivos.<br/><br/>
                        Abaixo estão os comandos para instalar todas as dependências em sistemas baseados em Debian/Ubuntu. Se estiver usando outro sistema operacional, consulte o gerenciador de pacotes correspondente para instalar os mesmos componentes.
                    </p>
                    <pre className="language-bash"><code>{`
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | sudo gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" | sudo tee /etc/apt/sources.list.d/nodesource.list

# Adicionando o repositório oficial do Redis
curl -fsSL https://packages.redis.io/gpg | sudo gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/redis.list

sudo apt update
sudo apt install -y nodejs git redis-server unzip
`}</code></pre>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Esses comandos vão preparar seu ambiente para receber o Ender Panel, garantindo que todas as ferramentas necessárias estejam disponíveis.
                    </p>
                </section>
                <section id="redis-config" className="mt-12 scroll-mt-24">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Configuração do Redis</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Após instalar o Redis, é importante configurar o serviço para garantir a persistência dos dados. Por padrão, o Redis pode não salvar os dados em disco, o que pode causar perda de informações em caso de reinicialização do servidor.<br/><br/>
                        Para isso, edite o arquivo <code>/etc/redis/redis.conf</code> e altere as seguintes opções:
                    </p>
                    <pre className="language-bash"><code>{`# Procure por appendonly e altere para yes
appendonly yes

# Procure por appendfsync e altere para everysec
appendfsync everysec
`}</code></pre>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        <b>appendonly</b> ativa o modo de persistência, garantindo que todas as operações sejam registradas em disco.<br/>
                        <b>appendfsync</b> define a frequência com que o Redis salva os dados em disco. O valor <b>everysec</b> faz com que o Redis grave as alterações a cada segundo, equilibrando desempenho e segurança.<br/><br/>
                        Após realizar essas alterações, reinicie o serviço do Redis para aplicar as configurações:
                    </p>
                    <pre className="language-bash"><code>{`sudo systemctl restart redis-server`}</code></pre>
                </section>
                <section id="download-files" className="mt-12 scroll-mt-24">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Download dos Arquivos do Painel</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Com as dependências instaladas e o Redis configurado, o próximo passo é criar o diretório onde o painel será instalado e baixar os arquivos do projeto. Recomenda-se utilizar o diretório <code>/var/www/enderpanel</code> para manter a organização do sistema.<br/><br/>
                        Execute os comandos abaixo para criar a pasta, acessar o diretório e baixar o pacote do painel:
                    </p>
                    <pre className="language-bash"><code>{`
mkdir -p /var/www/enderpanel
cd /var/www/enderpanel
curl -Lo panel.zip https://github.com/murillo-frazao-cunha/hightpanel/archive/refs/heads/master.zip
unzip panel.zip
`}</code></pre>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Após descompactar o arquivo, os arquivos do painel estarão disponíveis para configuração e instalação.
                    </p>
                </section>
                <section id="setup-panel" className="mt-12 scroll-mt-24">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Instalação e Configuração do Painel</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Agora que os arquivos do painel estão no diretório correto, é hora de configurar o ambiente. O Ender Panel utiliza variáveis de ambiente para definir parâmetros de funcionamento, como tokens de autenticação, URL do painel e credenciais do banco de dados.<br/><br/>
                        Siga os passos abaixo para preparar o ambiente. Cada comando está acompanhado de uma explicação para facilitar o entendimento.
                    </p>
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Antes de executar qualquer script, instale as dependências do projeto:</p>
                        <pre className="language-bash"><code>{`npm install`}</code></pre>
                    </div>
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Primeiro, copie o arquivo de exemplo de variáveis de ambiente para criar sua configuração personalizada:</p>
                        <pre className="language-bash"><code>{`cp .env.example .env`}</code></pre>
                    </div>
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Agora gere os tokens de criptografia e autenticação necessários para o funcionamento seguro do painel:</p>
                        <pre className="language-bash"><code>{`npm run script env:key:generate`}</code></pre>
                    </div>
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Em seguida, execute o comando abaixo para configurar a URL do painel e o token de comunicação com os nodes:</p>
                        <pre className="language-bash"><code>{`npm run env:setup`}</code></pre>
                    </div>
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Agora configure as credenciais do banco de dados que serão utilizadas pelo painel:</p>
                        <pre className="language-bash"><code>{`npm run script env:setup:db`}</code></pre>
                    </div>
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Execute o comando abaixo para realizar a migração do banco de dados, criando todas as tabelas necessárias:</p>
                        <pre className="language-bash"><code>{`npm run script migrate`}</code></pre>
                    </div>
                    <div className="mb-6">
                        <p className="text-gray-700 dark:text-gray-300 font-medium mb-2">Por fim, crie o usuário administrador inicial para acessar o painel:</p>
                        <pre className="language-bash"><code>{`npm run script user:make`}</code></pre>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Siga cada etapa atentamente, preenchendo as informações solicitadas durante os comandos interativos. Após finalizar, seu ambiente estará pronto para iniciar o painel.
                    </p>
                </section>
                <section id="start-panel" className="mt-12 scroll-mt-24">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Inicialização do Painel</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        Com tudo configurado, basta iniciar o painel para começar a utilizar a interface web e gerenciar seus servidores.<br/><br/>
                        Execute o comando abaixo para iniciar o Ender Panel:
                    </p>
                    <pre className="language-bash"><code>{`npm run start`}</code></pre>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">
                        O painel estará disponível na URL configurada durante o processo de setup. Acesse pelo navegador e faça login com o usuário criado.<br/><br/>
                        Caso encontre algum erro, revise as etapas anteriores e verifique se todas as dependências estão corretamente instaladas e configuradas.
                    </p>
                </section>
            </>
        )
    },
    terminology: {
        title: 'Terminologia',
        description: 'Aprenda como os componentes internos do Ender Panel funcionam.',
        icon: <TerminologyIcon />,
        toc: [ { title: 'Conceitos Chave', id: 'key-concepts' }, { title: 'Arquitetura', id: 'architecture' },],
        content: (
            <>
                <p className="font-semibold text-purple-600 dark:text-purple-400">Painel</p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mt-2">Terminologia</h1>
                <section id="key-concepts" className="mt-12 scroll-mt-24">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Conceitos Chave</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Entender os termos principais do Ender Panel irá ajudar você a navegar e utilizar o painel de forma mais eficiente.</p>
                </section>
                <section id="architecture" className="mt-12 scroll-mt-24">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Arquitetura</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">O Ender Panel é composto de dois componentes principais: o Painel (a interface web) e o Daemon (enderd) que roda em suas máquinas host.</p>
                </section>
            </>
        )
    },
    plugins: {
        title: 'Plugins',
        description: 'Expanda seu Painel com plugins de terceiros ou crie os seus.',
        icon: <PluginsIcon />,
        toc: [{ title: 'Introdução', id: 'plugins-intro' }, { title: 'Criando seu Plugin', id: 'creating-plugins' },],
        content: (
            <>
                <p className="font-semibold text-purple-600 dark:text-purple-400">Painel</p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mt-2">Plugins</h1>
                <section id="plugins-intro" className="mt-12 scroll-mt-24">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Introdução aos Plugins</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Expanda a funcionalidade do seu Ender Panel com nosso sistema robusto de plugins. Você pode instalar plugins da comunidade ou criar os seus.</p>
                </section>
            </>
        )
    },
    api: {
        title: 'Referência da API',
        description: 'Aprenda a automatizar ações facilmente com a nossa API.',
        icon: <ApiRefIcon />,
        toc: [ { title: 'Autenticação', id: 'api-auth' }, { title: 'Endpoints', id: 'api-endpoints' }, ],
        content: (
            <>
                <p className="font-semibold text-purple-600 dark:text-purple-400">Painel</p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mt-2">Referência da API</h1>
                <section id="api-auth" className="mt-12 scroll-mt-24">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Autenticação</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Para usar a API do Ender Panel, você precisará gerar uma chave de API a partir do seu painel de controle de usuário.</p>
                </section>
            </>
        )
    },
    'daemon-installation': {
        title: 'Instalação do Daemon',
        description: 'Configure o Daemon (enderd) em sua máquina host.',
        icon: <InstallationIcon />,
        toc: [ { title: 'Em breve', id: 'soon' } ],
        content: (
            <>
                <p className="font-semibold text-purple-600 dark:text-purple-400">Daemon (enderd)</p>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight mt-2">Instalação do Daemon</h1>
                <section id="soon" className="mt-12 scroll-mt-24">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Em Breve</h2>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">O conteúdo para esta seção está sendo preparado.</p>
                </section>
            </>
        )
    }
};

const navigation = [
    {
        title: 'Painel',
        links: [
            { title: 'Instalação', id: 'installation' },
            { title: 'Terminologia', id: 'terminology' },
            { title: 'Plugins', id: 'plugins' },
            { title: 'Referência da API', id: 'api' },
        ]
    },
    {
        title: 'Daemon (enderd)',
        links: [
            { title: 'Instalação', id: 'daemon-installation' }
        ]
    }
];

// Função para atualizar o hash da URL
function updateHash(pageId, sectionId = '') {
    const findCategory = () => {
        for (const category of navigation) {
            if (category.links.some(link => link.id === pageId)) {
                return category.title;
            }
        }
        return null;
    };
    const categoryTitle = findCategory();
    if (categoryTitle) {
        let hash = `#${categoryTitle}#${pageId}`;
        if (sectionId) {
            hash += `#${sectionId}`;
        }
        window.location.hash = hash;
    }
}

const SearchModal = ({ isOpen, onClose, onSelect }) => {
    const [query, setQuery] = useState('');
    const allPages = Object.entries(pages).map(([id, page]) => ({ id, ...page }));

    useEffect(() => {
        if (!isOpen) {
            setQuery('');
        }
    }, [isOpen]);

    const filteredPages = query
        ? allPages.filter(page =>
            page.title.toLowerCase().includes(query.toLowerCase()) ||
            page.description.toLowerCase().includes(query.toLowerCase())
        )
        : [];

    if (!isOpen) return null;

    const handleSelect = (id) => {
        onSelect(id);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div className="relative bg-neutral-100 dark:bg-neutral-900 ring-1 ring-black/10 dark:ring-white/10 w-full max-w-2xl rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center p-4 border-b border-black/10 dark:border-white/10">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Buscar na documentação..."
                        className="w-full bg-transparent text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none ml-3"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                    />
                </div>
                {query && (
                    <div className="p-2 max-h-96 overflow-y-auto">
                        {filteredPages.length > 0 ? (
                            <ul>
                                {filteredPages.map(page => (
                                    <li key={page.id} onClick={() => handleSelect(page.id)}
                                        className="p-3 text-gray-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5 rounded-md cursor-pointer">
                                        <p className="font-semibold text-gray-900 dark:text-white">{page.title}</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{page.description}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                Nenhum resultado encontrado.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};


export default function App() {
    const [theme, setTheme] = useState('dark');
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [activePageId, setActivePageId] = useState(null);
    const activePage = activePageId ? pages[activePageId] : null;

    const allLinksFlat = useMemo(() => navigation.flatMap(cat => cat.links), []);

    // Realça blocos de código Prism quando a página ativa ou o tema mudam
    useEffect(() => {
        if (!activePage) return;
        let cancelled = false;
        (async () => {
            try {
                const Prism = (await import('prismjs')).default;
                await Promise.all([
                    import('prismjs/components/prism-bash'),
                    import('prismjs/components/prism-json'),
                    import('prismjs/components/prism-jsx'),
                    import('prismjs/components/prism-typescript'),
                ]);
                if (!cancelled) {
                    Prism.highlightAll();
                }
            } catch (e) {
                // silencioso – evita quebrar a UI caso falhe
                console.warn('Prism highlight falhou:', e);
            }
        })();
        return () => { cancelled = true; };
    }, [activePageId, theme]);

    // sincroniza classe no <html> para o tema (para CSS :root.light funcionar)
    useEffect(() => {
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme === 'dark' ? 'dark' : 'light');
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
    };

    useEffect(() => {
        const handleHashChange = () => {
            const hashParts = window.location.hash.substring(1).split('#');
            const pageId = hashParts[1];
            const sectionId = hashParts[2];

            if (pageId && pages[pageId]) {
                setActivePageId(pageId);
                if (sectionId) {
                    setTimeout(() => {
                        const element = document.getElementById(sectionId);
                        if (element) {
                            element.scrollIntoView({ behavior: 'smooth' });
                        }
                    }, 100);
                }
            } else {
                setActivePageId(null);
            }
        };

        handleHashChange();
        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);


    return (
        <div className={`${theme}`}>
            <div className="bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
                {theme === 'dark' && <div className="absolute top-0 left-0 w-full h-full bg-grid-purple-500/[0.05]"></div>}

                <div className="relative z-10 w-full px-10">
                    <header className="sticky top-0 z-50 py-4">
                        <div className="bg-white/80 dark:bg-black/30 backdrop-blur-lg rounded-xl ring-1 ring-black/10 dark:ring-white/10 flex items-center justify-between p-4">
                            <a href="#" className="text-xl font-bold text-gray-900 dark:text-white">Ender Panel</a>
                            <div className="hidden md:flex flex-1 justify-center px-8">
                                <button onClick={() => setIsSearchOpen(true)} className="w-full max-w-sm text-left bg-gray-100 dark:bg-gray-900/50 border border-gray-300 dark:border-gray-700 rounded-md py-2 px-4 flex items-center justify-between text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center space-x-2"><SearchIcon /><span>Buscar na documentação</span></div>
                                    <span className="text-xs border border-gray-400 dark:border-gray-600 rounded px-1.5 py-0.5">Ctrl K</span>
                                </button>
                            </div>
                            <div className="flex items-center space-x-4">
                                <button onClick={toggleTheme} className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white">
                                    {theme === 'dark' ? <MoonIcon /> : <SunIcon />}
                                </button>
                                <a href="#" className="text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white"><GitHubIcon /></a>
                            </div>
                        </div>
                    </header>
                    {!activePage && (
                        <>
                            <main className="py-24 sm:py-32 text-center">
                                <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
                                    <div className="flex-col">
                                        <h1 className="text-center lg:text-left text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-tight bg-gradient-to-br from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-500 text-transparent bg-clip-text">
                                            Uma alternativa de verdade ao Pterodactyl.
                                        </h1>
                                        <p className="text-center lg:text-left mt-6 text-lg text-gray-700 dark:text-gray-300 max-w-2xl">
                                            Ender Panel é um painel de código aberto para gerenciar e operar servidores de jogos e aplicações, construído com Node.js, Express e Dockerode.
                                        </p>
                                        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                            <a href="#" className="relative inline-block text-lg font-semibold px-8 py-3 bg-gray-900 text-white dark:bg-white dark:text-black rounded-lg transition-transform hover:scale-105 shadow-lg shadow-purple-500/20">
                                                Começar Agora
                                            </a>
                                            <a href="#" className="relative inline-block text-lg font-semibold px-8 py-3 bg-white/50 dark:bg-white/5 backdrop-blur-sm ring-1 ring-black/10 dark:ring-white/10 text-gray-800 dark:text-white rounded-lg transition-transform hover:scale-105 hover:bg-white/80 dark:hover:bg-white/10">
                                                Ver no GitHub
                                            </a>
                                        </div>
                                    </div>

                                    <div className="relative rounded-2xl bg-gray-500/5 dark:bg-black/30 ring-1 ring-black/10 dark:ring-white/10 backdrop-blur-xl mt-12 lg:mt-0 w-full max-w-3xl">
                                        <div className="absolute -top-px left-20 right-11 h-px bg-gradient-to-r from-purple-400/0 via-purple-400/40 to-purple-400/0"></div>
                                        <div className="absolute -bottom-px left-11 right-20 h-px bg-gradient-to-r from-purple-400/0 via-purple-400/40 to-purple-400/0"></div>
                                        <div className="pl-4 pt-4">
                                            <svg aria-hidden="true" viewBox="0 0 42 10" fill="none" className="h-2.5 w-auto stroke-neutral-500/30"><circle cx="5" cy="5" r="4.5"></circle><circle cx="21"cy="5" r="4.5"></circle><circle cx="37" cy="5" r="4.5"></circle></svg>
                                            <div className="mt-4 flex space-x-2 text-xs">
                                                <div className="flex h-6 rounded-full bg-gradient-to-r from-purple-400/30 via-purple-500 to-purple-400/30 p-px font-medium text-purple-700 dark:text-purple-300"><div className="flex items-center rounded-full px-2.5 bg-white dark:bg-neutral-900">novoServidor.json</div></div>
                                                <div className="flex h-6 rounded-full text-neutral-600 dark:text-neutral-500"><div className="flex items-center rounded-full px-2.5">enderpanel.js</div></div>
                                            </div>
                                            <div className="mt-6 flex items-start px-1 text-sm"><div aria-hidden="true" className="select-none border-r border-black/10 dark:border-neutral-300/5 pr-4 font-mono text-neutral-600 dark:text-neutral-600">01<br/>02<br/>03<br/>04<br/>05<br/>06<br/>07</div><pre className="language-json flex overflow-x-auto pb-6"><code className="language-json px-4 font-mono text-gray-800 dark:text-gray-300"><span className="text-gray-500 dark:text-gray-400">{'{'}</span><br/><span>&nbsp;&nbsp;</span><span className="text-sky-600 dark:text-sky-300">"nome"</span>: <span className="text-lime-600 dark:text-lime-300">"Meu Servidor"</span>,<br/><span>&nbsp;&nbsp;</span><span className="text-sky-600 dark:text-sky-300">"memoria"</span>: <span className="text-fuchsia-600 dark:text-fuchsia-400">2048</span>,<br/><span>&nbsp;&nbsp;</span><span className="text-sky-600 dark:text-sky-300">"cpu"</span>: <span className="text-fuchsia-600 dark:text-fuchsia-400">1</span>,<br/><span>&nbsp;&nbsp;</span><span className="text-sky-600 dark:text-sky-300">"node"</span>: <span className="text-fuchsia-600 dark:text-fuchsia-400">2</span>,<br/><span>&nbsp;&nbsp;</span><span className="text-sky-600 dark:text-sky-300">"imagem"</span>: <span className="text-lime-600 dark:text-lime-300">"quay.io/ender-panel/java:21"</span><br/><span className="text-gray-500 dark:text-gray-400">{'}'}</span></code></pre></div>
                                        </div>
                                    </div>
                                </div>
                            </main>
                        </>
                    )}


                    <section id="docs" className="py-16">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <aside className="lg:col-span-3">
                                <nav className="sticky top-24 space-y-6">
                                    {navigation.map((category) => (
                                        <div key={category.title}>
                                            <h3 className="text-sm font-semibold text-purple-700 dark:text-purple-400 mb-2 mt-6 first:mt-0">{category.title}</h3>
                                            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                                                {category.links.map((link) => (
                                                    <li key={link.id}>
                                                        <a href={`#${category.title}#${link.id}`} onClick={(e) => {
                                                            e.preventDefault();
                                                            updateHash(link.id);
                                                        }} className={`block rounded-md px-3 py-2 transition ${activePageId === link.id ? 'text-gray-900 dark:text-white bg-black/5 dark:bg-white/5' : 'hover:bg-black/5 dark:hover:bg-white/5'}`}>
                                                            {link.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </nav>
                            </aside>

                            <div className="lg:col-span-6">
                                {activePage ? (
                                    <>
                                        {activePage.content}
                                        <div className="mt-12 pt-8 border-t border-black/10 dark:border-white/10 flex justify-end">
                                            {(() => {
                                                const currentIndex = allLinksFlat.findIndex(link => link.id === activePageId);
                                                const nextLink = allLinksFlat[currentIndex + 1];
                                                if (nextLink) {
                                                    const nextPage = pages[nextLink.id];
                                                    return (
                                                        <a href={`#next`} onClick={(e) => {
                                                            e.preventDefault();
                                                            updateHash(nextLink.id);
                                                        }} className="group inline-flex items-center text-gray-800 dark:text-white font-semibold">
                                                            Próximo
                                                            <span className="ml-4 text-purple-700 dark:text-purple-400">{nextPage.title}</span>
                                                            <ArrowRightIcon />
                                                        </a>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        {navigation.map(category => (
                                            <div key={category.title} className="mb-10">
                                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{category.title}</h2>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {category.links.map(link => {
                                                        const page = pages[link.id];
                                                        return (
                                                            <div key={link.id} onClick={() => {
                                                                updateHash(link.id);
                                                            }} className="group relative p-6 bg-white dark:bg-black/20 backdrop-blur-lg rounded-xl ring-1 ring-black/10 dark:ring-white/10 cursor-pointer transition-all hover:ring-purple-500 dark:hover:ring-purple-400/50 hover:bg-gray-50 dark:hover:bg-black/30">
                                                                <div className="mb-4">{page.icon}</div>
                                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{page.title}</h3>
                                                                <p className="mt-2 text-gray-600 dark:text-gray-400">{page.description}</p>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <aside className="hidden lg:block lg:col-span-3">
                                <div className="sticky top-24">
                                    {activePage && (
                                        <>
                                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Nesta Página</h3>
                                            <ul className="space-y-2 text-sm">
                                                {activePage.toc.map(item => (
                                                    <li key={item.id}>
                                                        <a href={`#${item.id}`} onClick={(e) => {
                                                            e.preventDefault();
                                                            const element = document.getElementById(item.id);
                                                            if (element) {
                                                                element.scrollIntoView({ behavior: 'smooth' });
                                                            }
                                                            updateHash(activePageId, item.id);
                                                        }} className="block text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition">
                                                            {item.title}
                                                        </a>
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            </aside>
                        </div>
                    </section>
                </div>
                <SearchModal
                    isOpen={isSearchOpen}
                    onClose={() => setIsSearchOpen(false)}
                    onSelect={(id) => updateHash(id)}
                />
            </div>
        </div>
    );
}

