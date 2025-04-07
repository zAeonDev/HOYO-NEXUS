const { ipcRenderer } = require("electron");

let lastUpdateTime = 0;
let lastPercent = 0;
let downloadSpeed = 0;
let remainingTime = "--";

document.addEventListener("DOMContentLoaded", () => {
    const updateStatus = document.getElementById("update-status");
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");
    const speedIndicator = document.getElementById("speed-indicator");
    const timeRemaining = document.getElementById("time-remaining");

    function formatTime(seconds) {
        if (isNaN(seconds) || seconds === Infinity) return "--";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    function animateProgress(targetPercent) {
        let currentPercent = parseFloat(progressFill.style.width) || 0;
        const increment = Math.max(0.5, (targetPercent - currentPercent) / 10);

        const interval = setInterval(() => {
            if (currentPercent >= targetPercent) {
                clearInterval(interval);
                return;
            }
            currentPercent = Math.min(currentPercent + increment, targetPercent);
            progressFill.style.width = `${currentPercent}%`;
            progressText.innerText = `${Math.round(currentPercent)}%`;
            
            if (downloadSpeed > 0) {
                const remaining = (100 - currentPercent) / downloadSpeed;
                timeRemaining.textContent = formatTime(remaining);
            }
        }, 20);
    }

    ipcRenderer.on("update-progress", (_, percent, bytesPerSecond) => {
        const now = Date.now();
        const roundedPercent = Math.round(percent);
        
        if (lastUpdateTime > 0) {
            const timeDiff = (now - lastUpdateTime) / 1000;
            const percentDiff = roundedPercent - lastPercent;
            downloadSpeed = percentDiff / timeDiff;
            
            const speedMB = (bytesPerSecond / (1024 * 1024)).toFixed(1);
            speedIndicator.textContent = `${speedMB} MB/s`;
            
            if (downloadSpeed > 0) {
                remainingTime = (100 - roundedPercent) / downloadSpeed;
                timeRemaining.textContent = formatTime(remainingTime);
            }
        }

        lastUpdateTime = now;
        lastPercent = roundedPercent;
        animateProgress(roundedPercent);
    });

    ipcRenderer.on("update-complete", () => {
        updateStatus.innerHTML = "Download concluído!<br>Preparando para instalar...";
        speedIndicator.textContent = "";
        timeRemaining.textContent = "";
        animateProgress(100);
    });
});