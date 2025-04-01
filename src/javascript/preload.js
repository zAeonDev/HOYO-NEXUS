const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electron", {
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