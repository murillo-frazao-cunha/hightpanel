let DefaultCores = [
    {
        "version": 2,
        "exportedAt": "2025-09-20T13:08:12.483Z",
        "core": {
            "originalId": "c6b8a7c0-d89f-406b-ada7-cb8bd1e0f4ed",
            "variables": [
                {
                    "name": "Jar do servidor",
                    "description": "Define qual será a JAR do servidor",
                    "envVariable": "SERVER_JAR",
                    "rules": "required|regex:/^([\\w\\d._-]+)(\\.jar)$/|default:server.jar"
                },
                {
                    "name": "Minecraft Version",
                    "description": "Define a versão de instalação do servidor minecraft",
                    "envVariable": "MINECRAFT_VERSION",
                    "rules": "required|string|default:latest"
                }
            ],
            "stopCommand": "stop",
            "dockerImages": [
                {
                    "name": "Java 21",
                    "image": "ghcr.io/pterodactyl/yolks:java_21"
                },
                {
                    "name": "Java 17",
                    "image": "ghcr.io/pterodactyl/yolks:java_17"
                },
                {
                    "name": "Java 11",
                    "image": "ghcr.io/pterodactyl/yolks:java_11"
                },
                {
                    "name": "Java 8",
                    "image": "ghcr.io/pterodactyl/yolks:java_8"
                }
            ],
            "configSystem": {
                "server.properties": {
                    "server-ip": "0.0.0.0",
                    "server-port": "{{SERVER_PORT}}"
                }
            },
            "startupCommand": "java -Xms128M -XX:MaxRAMPercentage=95.0 -Dterminal.jline=false -Dterminal.ansi=true -jar {{SERVER_JAR}}",
            "name": "Minecraft (Paper)",
            "createdAt": 1758211246679,
            "creatorEmail": "admin@admin.com",
            "description": "Fork de alto desempenho do Spigot que visa corrigir inconsistências na jogabilidade e na mecânica.",
            "startupParser": {
                "done": ")! For help, type "
            },
            "installScript": "# 1. Defina as variáveis do servidor\nMINECRAFT_VERSION=\"{{MINECRAFT_VERSION}}\"\nJAR_FILE_NAME=\"{{SERVER_JAR}}\" # Defina o nome final do arquivo .jar aqui\n\n# 3. Verifica se o arquivo .jar de destino já existe\nif [ ! -f \"${JAR_FILE_NAME}\" ]; then\n    echo \"O arquivo ${JAR_FILE_NAME} não foi encontrado. Iniciando o download...\"\n\n    # Lógica para descobrir a última versão se \"latest\" for usado\n    if [ \"${MINECRAFT_VERSION}\" = \"latest\" ]; then\n        echo \"Procurando a versão mais recente do Paper...\"\n        LATEST_VERSION=$(curl -s https://api.papermc.io/v2/projects/paper | grep -o '\"1\\.[0-9.]*\"' | tail -n 1 | tr -d '\"')\n        MINECRAFT_VERSION=${LATEST_VERSION}\n        echo \"A versão mais recente encontrada é: ${MINECRAFT_VERSION}\"\n    fi\n\n    # Pega o número da build mais recente para a versão escolhida\n    LATEST_BUILD=$(curl -s https://api.papermc.io/v2/projects/paper/versions/${MINECRAFT_VERSION} | grep -o '[0-9]\\+' | tail -n 1)\n\n    # Verifica se a versão e a build foram encontradas com sucesso\n    if [ -z \"${MINECRAFT_VERSION}\" ] || [ -z \"${LATEST_BUILD}\" ]; then\n        echo \"ERRO: Não foi possível encontrar a versão ou a build do servidor. Verifique se a versão que você colocou é válida.\"\n    else\n        # Monta o nome do arquivo .jar original (como vem da API)\n        API_JAR_NAME=\"paper-${MINECRAFT_VERSION}-${LATEST_BUILD}.jar\"\n        DOWNLOAD_URL=\"https://api.papermc.io/v2/projects/paper/versions/${MINECRAFT_VERSION}/builds/${LATEST_BUILD}/downloads/${API_JAR_NAME}\"\n\n        echo \"Baixando a versão ${MINECRAFT_VERSION}, build ${LATEST_BUILD}...\"\n        echo \"URL: ${DOWNLOAD_URL}\"\n\n        # Baixa o arquivo e salva com o nome definido em JAR_FILE_NAME\n        curl -L -o \"${JAR_FILE_NAME}\" ${DOWNLOAD_URL}\n\n        echo \"Download concluído! O arquivo foi salvo como ${JAR_FILE_NAME}\"\n    fi\nfi"
        }
    },
    {
        "version": 2,
        "exportedAt": "2025-09-20T13:08:11.815Z",
        "core": {
            "originalId": "ce674d6c-9624-4b0e-8d7d-677401721c7a",
            "variables": [
                {
                    "name": "Comando de inicialização",
                    "description": "O comando a ser usado para ligar",
                    "envVariable": "COMMAND",
                    "rules": "required|string|default:node index.js"
                },
                {
                    "name": "Pacotes Node adicionais",
                    "description": "Instalar pacotes de nó adicionais. Use espaços para separar.",
                    "envVariable": "NODE_PACKAGES",
                    "rules": "nullable|string"
                },
                {
                    "name": "Desinstalar pacotes do Node",
                    "description": "Desinstale os pacotes do Node. Use espaços para separar.",
                    "envVariable": "UNNODE_PACKAGES",
                    "rules": "nullable|string"
                }
            ],
            "stopCommand": "^C",
            "dockerImages": [
                {
                    "name": "NodeJS 24",
                    "image": "nikolaik/python-nodejs:python3.13-nodejs24"
                },
                {
                    "name": "NodeJS 22",
                    "image": "nikolaik/python-nodejs:python3.13-nodejs22"
                },
                {
                    "name": "NodeJS 20",
                    "image": "nikolaik/python-nodejs:python3.13-nodejs20"
                }
            ],
            "configSystem": {},
            "startupCommand": "{{COMMAND}}",
            "name": "NodeJS",
            "createdAt": 1758211393352,
            "creatorEmail": "admin@admin.com",
            "description": "Ambiente de execução JavaScript assíncrono e de thread única, projetado para construir aplicações de rede escaláveis.",
            "startupParser": {
                "done": ""
            },
            "installScript": "#!/bin/sh\n\n# Garante que o script pare se algum comando falhar\nset -e\n\nmkdir -p ./npm\n\n# Cria um arquivo .npmrc local para definir as configurações APENAS para este projeto.\n# Isso evita tentar escrever em arquivos globais protegidos.\n# A linha abaixo diz ao npm: \"Use o diretório './npm' que acabamos de criar como seu cache\"\necho \"cache=./npm\" > .npmrc\n\n# --- Instalação de pacotes ---\nNODE_PACKAGES=\"{{NODE_PACKAGES}}\"\n\nif [ -n \"${NODE_PACKAGES}\" ]; then\n    echo \"Instalando pacotes Node.js: ${NODE_PACKAGES}\"\n    # O npm lerá automaticamente o arquivo .npmrc no diretório atual\n    npm install ${NODE_PACKAGES}\n    echo \"Instalação dos pacotes concluída.\"\nfi\n\n# --- Desinstalação de pacotes ---\nUNNODE_PACKAGES=\"{{UNNODE_PACKAGES}}\"\n\nif [ -n \"${UNNODE_PACKAGES}\" ]; then\n    echo \"Desinstalando pacotes Node.js: ${UNNODE_PACKAGES}\"\n    npm uninstall ${UNNODE_PACKAGES}\n    echo \"Desinstalação dos pacotes concluída.\"\nfi\n\n# Limpeza opcional: remove o diretório de cache e o arquivo de configuração se não forem mais necessários\n# echo \"Limpando arquivos de configuração e cache...\"\n# rm -rf ./npm ./.npmrc\nnpm install"
        }
    }
];
export default DefaultCores