const { app, BrowserWindow, BrowserView, ipcMain, session, Tray, Menu, globalShortcut } = require("electron");
const path = require("node:path");
const { ElectronBlocker } = require("@ghostery/adblocker-electron");
const fetch = require("cross-fetch");
const { autoUpdater } = require("electron-updater");
const fs = require("fs");
const { Client } = require('discord-rpc');

const settingsPath = path.join(app.getPath("userData"), "settings.json");

const loadSettings = () => {
    try {
        if (fs.existsSync(settingsPath)) {
            const data = fs.readFileSync(settingsPath, "utf-8");
            return JSON.parse(data);
        } else {
            const defaultSettings = { 
                minimizeToTray: true, 
                autoStart: false, 
                startMaximized: true, 
                enableRichPresence: true,
                enableAdBlock: true
            };
            saveSettings(defaultSettings);
            return defaultSettings;
        }
    } catch (error) {
        console.error("Erro ao carregar configurações:", error);
        return { 
            minimizeToTray: true, 
            autoStart: false, 
            startMaximized: true, 
            enableRichPresence: true,
            enableAdBlock: true
        };
    }
};

const saveSettings = (settings) => {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 4), "utf-8");
    } catch (error) {
        console.error("Erro ao salvar configurações:", error);
    }
};

const settings = loadSettings();
console.log("Configurações carregadas ao iniciar:", settings);

let minimizeToTray = settings.minimizeToTray;
let startMaximized = settings.startMaximized || false;

app.setLoginItemSettings({
    openAtLogin: settings.autoStart,
    path: app.getPath("exe"),
});

let mainWindow;
let view = null;
let updateWindow;
let tray = null;
let mainWindowCreated = false; 

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on("second-instance", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
        }
    });
}

const adjustViewBounds = () => {
    if (mainWindow && !mainWindow.isDestroyed() && view) {
        const { width, height } = mainWindow.getBounds();
        view.setBounds({ x: 0, y: 50, width: width, height: height - 50 });
        view.setAutoResize({ width: true, height: true, horizontal: false, vertical: false });
    }
};

const createMainWindow = () => {
    if (mainWindowCreated) return; 
    mainWindowCreated = true;

    mainWindow = new BrowserWindow({
        width: 1050,
        height: 650,
        zoomFactor: 1.0,
        icon: path.join(__dirname, "icon.ico"),
        frame: false,
        titleBarStyle: "hidden",
        backgroundColor: "#1E1E1E",
        resizable: false,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, "src", "javascript", "preload.js"),
            contextIsolation: false,
            nodeIntegration: true,
        },
    });

    mainWindow.loadFile(path.join(__dirname, "src", "html", "UI.html")).then(() => {
        view = new BrowserView({
            webPreferences: {
                preload: path.join(__dirname, "src", "javascript", "preload.js"),
                contextIsolation: true,
                nodeIntegration: false,
                enableRemoteModule: false,
                sandbox: true,
            },
        });
        mainWindow.setBrowserView(view);
        adjustViewBounds();
        view.webContents.setWindowOpenHandler(({ url }) => {
            view.webContents.loadURL(url);
            return { action: 'deny' };
        });
        view.webContents.loadURL(`file://${path.join(__dirname, "src", "html", "genshin-impact.html")}`);

        if (startMaximized) {
            mainWindow.maximize();
        }

        mainWindow.show();
    }).catch(err => {
        console.error("Falha ao carregar conteúdo:", err);
    });

    setupTray();
    setupIpcHandlers();
};

const setupTray = () => {
    tray = new Tray(path.join(__dirname, "icon.ico"));

    const contextMenu = Menu.buildFromTemplate([
        {
            label: "Abrir",
            click: () => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    if (mainWindow.isMinimized()) mainWindow.restore();
                    mainWindow.show();
                }
            },
        },
        {
            label: "Sair",
            click: () => {
                app.isQuiting = true;
                app.quit();
            },
        },
    ]);

    tray.setToolTip("HOYO NEXUS");
    tray.setContextMenu(contextMenu);

    mainWindow.on("close", (event) => {
        if (minimizeToTray && !app.isQuiting) {
            event.preventDefault();
            mainWindow.hide();
        } else {
            app.isQuiting = true;
            app.quit();
        }
    });

    tray.on("click", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.show();
        }
    });
};

const setupIpcHandlers = () => {
    ipcMain.on("minimize-app", () => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
    });

    ipcMain.on("maximize-app", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (mainWindow.isMaximized()) {
                mainWindow.unmaximize();
            } else {
                mainWindow.maximize();
            }
        }
    });

    ipcMain.on("close-app", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            if (minimizeToTray) {
                mainWindow.hide();
            } else {
                app.isQuiting = true;
                app.quit();
            }
        }
    });

    ipcMain.on("reload-app", () => {
        if (view) {
            view.webContents.reload();
        }
    });

    ipcMain.on("settings", () => {
        if (view) {
            view.webContents.loadURL(`file://${path.join(__dirname, "src", "html", "settings.html")}`);
        }
    });

    ipcMain.on("patch-note", () => {
        if (view) {
            view.webContents.loadURL(`file://${path.join(__dirname, "src", "html", "patch-note.html")}`);
        }
    });

    ipcMain.on("go-home", () => {
        if (view) {
            view.webContents.loadURL(`file://${path.join(__dirname, "src", "html", "genshin-impact.html")}`);
        }
    });

    ipcMain.on("go-back", () => {
        if (view && view.webContents.navigationHistory.canGoBack()) {
            view.webContents.navigationHistory.goBack();
        }
    });

    ipcMain.on("go-forward", () => {
        if (view && view.webContents.navigationHistory.canGoForward()) {
            view.webContents.navigationHistory.goForward();
        }
    });

    ipcMain.handle("set-auto-start", (event, shouldStart) => {
        app.setLoginItemSettings({
            openAtLogin: shouldStart,
            path: app.getPath("exe"),
        });
        settings.autoStart = shouldStart;
        saveSettings(settings);
        return app.getLoginItemSettings().openAtLogin;
    });
    
    ipcMain.handle("get-auto-start", () => {
        return app.getLoginItemSettings().openAtLogin;
    });

    ipcMain.handle("set-tray-state", (event, state) => {
        minimizeToTray = state;
        settings.minimizeToTray = state;
        saveSettings(settings);
        return minimizeToTray;
    });

    ipcMain.handle("get-tray-state", () => {
        return minimizeToTray;
    });

    ipcMain.handle("set-start-maximized", (event, state) => {
        startMaximized = state;
        settings.startMaximized = state;
        saveSettings(settings);
        return startMaximized;
    });

    ipcMain.handle("get-start-maximized", () => {
        return startMaximized;
    });

    ipcMain.handle("check-for-updates", async () => {
        try {
            await autoUpdater.checkForUpdates();
            return true;
        } catch (error) {
            console.error("Erro ao verificar atualizações:", error);
            return false;
        }
    });

    ipcMain.handle("set-rich-presence", (event, state) => {
        settings.enableRichPresence = state;
        saveSettings(settings);

        if (state) {
            startRichPresence();
        } else {
            stopRichPresence();
        }

        return settings.enableRichPresence;
    });

    ipcMain.handle("get-rich-presence", () => {
        return settings.enableRichPresence;
    });

    ipcMain.handle("set-adblock", async (event, state) => {
        settings.enableAdBlock = state;
        saveSettings(settings);
        await setupAdBlocker();
        return settings.enableAdBlock;
    });

    ipcMain.handle("get-adblock", () => {
        return settings.enableAdBlock;
    });

    ipcMain.handle("clear-cache", async () => {
        try {
            await session.defaultSession.clearCache();

            await session.defaultSession.clearStorageData({
                storages: [
                    "appcache",
                    "cookies",
                    "filesystem",
                    "indexdb",
                    "localstorage",
                    "shadercache",
                    "websql",
                    "serviceworkers",
                ],
            });

            console.log("Cache e dados de armazenamento limpos com sucesso!");
            return true;
        } catch (error) {
            console.error("Erro ao limpar o cache e dados de armazenamento:", error);
            return false;
        }
    });

    ipcMain.on("restart-app", () => {
        console.log("Reiniciando o aplicativo...");
        app.relaunch();
        app.exit(0);
    });

    mainWindow.on("maximize", adjustViewBounds);
    mainWindow.on("unmaximize", adjustViewBounds);
    mainWindow.on("resize", adjustViewBounds);
};

const createUpdateWindow = () => {
    updateWindow = new BrowserWindow({
        width: 500,
        height: 350,
        frame: false,
        alwaysOnTop: true,
        resizable: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    updateWindow.loadFile(path.join(__dirname, "src", "html", "update.html"));
};

const checkForUpdates = () => {
    if (!app.isPackaged) {
        createMainWindow();
        return;
    }

    console.log("🔍 Verificando atualizações...");
    autoUpdater.checkForUpdates().catch(err => {
        console.error("Erro ao verificar atualizações:", err);
        if (!mainWindowCreated) createMainWindow();
    });
};

autoUpdater.autoDownload = true;
autoUpdater.allowPrerelease = true;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.fullChangelog = true;
autoUpdater.allowDowngrade = false;

app.commandLine.appendSwitch("enable-parallel-downloading");
app.commandLine.appendSwitch("disable-http-cache");
app.commandLine.appendSwitch("enable-tcp-fast-open");

autoUpdater.on("update-available", () => {
    console.log("Nova atualização detectada! Baixando...");
    if (!updateWindow || updateWindow.isDestroyed()) {
        createUpdateWindow();
    }
});

autoUpdater.on("download-progress", (progress) => {
    const speedMB = progress.bytesPerSecond / (1024 * 1024);
    console.log(`Progresso: ${progress.percent.toFixed(2)}% | Velocidade: ${speedMB.toFixed(2)} MB/s`);
    
    if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.webContents.send("update-progress", progress.percent, progress.bytesPerSecond);
    }
});

autoUpdater.on("update-downloaded", () => {
    console.log("Download concluído! Preparando para instalar...");
    if (updateWindow && !updateWindow.isDestroyed()) {
        updateWindow.webContents.send("update-complete");
    }
    setTimeout(() => {
        autoUpdater.quitAndInstall(true, true);
    }, 2000);
});

autoUpdater.on("update-not-available", () => {
    console.log("Nenhuma atualização disponível.");
    if (!mainWindowCreated) createMainWindow();
});

autoUpdater.on("error", (error) => {
    console.error("Erro no auto updater:", error);
    if (!mainWindowCreated) createMainWindow();
});

let adBlocker = null;

const setupAdBlocker = async () => {
    if (settings.enableAdBlock) {
        adBlocker = await ElectronBlocker.fromPrebuiltAdsAndTracking(fetch);
        adBlocker.enableBlockingInSession(session.defaultSession);
        console.log("AdBlock ativado.");
    } else if (adBlocker) {
        adBlocker.disableBlockingInSession(session.defaultSession);
        adBlocker = null;
        console.log("AdBlock desativado.");
    }
};

app.whenReady().then(async () => {
    await setupAdBlocker();
    checkForUpdates();

    globalShortcut.register("Control+G", () => {
        if (view && !view.webContents.isDestroyed()) {
            view.webContents.loadURL("https://www.google.com");
            console.log("Atalho Ctrl + G acionado: carregando Google.");
        }
    });
});

app.commandLine.appendSwitch("ignore-certificate-errors", "true");

const clientId = 'id do seu cliente'; // Substitua pelo seu Client ID do Discord

let rpc = null;

const startRichPresence = () => {
    if (rpc) return;

    rpc = new Client({ transport: 'ipc' });

    rpc.on('ready', () => {
        console.log('Rich Presence conectado ao Discord!');
        rpc.setActivity({
            details: 'Tenha acesso rápido e fácil a informações sobre os seguintes jogos: Genshin Impact, Honkai: Star Rail e Zenless Zone Zero.',
            startTimestamp: Date.now(),
            largeImageKey: 'icone_grande',
            largeImageText: 'HoYo Nexus',
            smallImageKey: 'icone_pequeno',
            smallImageText: 'Atualizando...',
            instance: false,
            buttons: [
                {
                    label: 'Download',
                    url: 'https://github.com/zAeonDev/HOYO-NEXUS?tab=readme-ov-file#download'
                }
            ]
        }).then(() => {
            console.log('Rich Presence configurado com sucesso!');
        }).catch(console.error);
    });

    rpc.login({ clientId }).catch(console.error);
};

const stopRichPresence = () => {
    if (rpc) {
        rpc.destroy();
        rpc = null;
        console.log('Rich Presence desconectado.');
    }
};

if (settings.enableRichPresence) {
    startRichPresence();
}

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
    console.log("Todos os atalhos globais foram desregistrados.");
});