# HOYO-NEXUS
HOYO NEXUS tem a finalidade de facilitar o acesso a informações sobre os seguintes jogos: Genshin Impact, Honkai: Star Rail e Zenless Zone Zero.

### Índice
* [Download](https://github.com/zAeonDev/HOYO-NEXUS?tab=readme-ov-file#download)
* [Versão](https://github.com/zAeonDev/HOYO-NEXUS?tab=readme-ov-file#vers%C3%A3o)
* [Autores](https://github.com/zAeonDev/HOYO-NEXUS?tab=readme-ov-file#autores)
* [Licença](https://github.com/zAeonDev/HOYO-NEXUS?tab=readme-ov-file#licen%C3%A7a)
* [Área do Desenvolvedor](https://github.com/zAeonDev/HOYO-NEXUS?tab=readme-ov-file#%C3%A1rea-do-desenvolvedor)

## Download
**Baixe a versão mais recente [clicando aqui](https://github.com/zAeonDev/HOYO-NEXUS/releases/)!**
* Para baixar o instalador, baixe o arquivo com o final **.exe**

## Versão
Confira as tags [aqui](https://github.com/zAeonDev/HOYO-NEXUS/tags)!

## Autores
**Aeon** - *Trabalho Inicial*

Entre em contato [clicando aqui](https://discord.gg/AKX84d8x3q)!

## Licença
Este projeto está sob a licença (MIT) - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Área do Desenvolvedor

### Dependências
```
npm install electron --save-dev
```
```
npm install electron-builder --save-dev
```
```
npm install dotenv-cli --save-dev
```
```
npm install @ghostery/adblocker-electron
```
```
npm install cross-fetch
```
```
npm install electron-updater
```

### Configuração do Package.json
* **Cria o package.json**
```
npm init --y
```

```
{
  "name": "nome-do-app",
  "version": "1.0.0",
  "description": "Nome do APP",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "publish": "dotenv -e .env -- electron-builder --publish=always"
  },
  "author": "Seu nome",
  "license": "MIT",
  "devDependencies": {
    "dotenv-cli": "^8.0.0",
    "electron": "^35.0.3",
    "electron-builder": "^25.1.8"
  },
  "build": {
    "asar": true,
    "appId": "nome-do-app",
    "productName": "Nome do APP",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "package.json",
      "icon.ico",
      "settings.json",
      "src/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "build/icon.ico"
    },
    "publish": [
      {
        "provider": "github",
        "owner": "Seu nome de usuario do gihub",
        "repo": "Nome-do-Repositório"
      }
    ]
  },
  "dependencies": {
    "@ghostery/adblocker-electron": "^2.5.0",
    "cross-fetch": "^4.1.0",
    "electron-updater": "^6.3.9"
  }
}
```

### Comandos
* **Inicia a depuração**
```
npm start
```

* **Compila o programa**
```
npm run dist
```

* **Publica a atualização no GitHub**
```
npm rum publish
```
