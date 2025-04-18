const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  setAutoStart: (shouldStart) => ipcRenderer.invoke("set-auto-start", shouldStart),
  getAutoStart: () => ipcRenderer.invoke("get-auto-start"),
  setTrayState: (state) => ipcRenderer.invoke("set-tray-state", state),
  getTrayState: () => ipcRenderer.invoke("get-tray-state"),
  setStartMaximized: (state) => ipcRenderer.invoke("set-start-maximized", state),
  getStartMaximized: () => ipcRenderer.invoke("get-start-maximized"),
  setRichPresence: (state) => ipcRenderer.invoke("set-rich-presence", state),
  getRichPresence: () => ipcRenderer.invoke("get-rich-presence"),
  setAdBlock: (state) => ipcRenderer.invoke("set-adblock", state),
  getAdBlock: () => ipcRenderer.invoke("get-adblock"),
  clearCache: () => ipcRenderer.invoke("clear-cache"),
  restartApp: () => ipcRenderer.send("restart-app"),
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  verElectron: () => process.versions.electron,
});

window.addEventListener('DOMContentLoaded', () => {
  const links = document.querySelectorAll('a[href^="http"]');
  links.forEach(link => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      window.location.href = link.href;
    });
  });
});