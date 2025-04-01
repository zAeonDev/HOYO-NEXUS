function redirecionar(url) {
    window.open(url, '_blank');
}

document.addEventListener('DOMContentLoaded', function() {
    const video = document.getElementById('bg-video');
    video.playbackRate = 0.85;
    
    video.addEventListener('timeupdate', function() {
        if (video.currentTime > video.duration - 2) {
            video.classList.add('fade-out');
            setTimeout(() => {
                video.currentTime = 0;
                video.classList.remove('fade-out');
            }, 1500);
        }
    });

    video.play().catch(e => {
        console.log("Autoplay não permitido, tentando play com mute");
        video.muted = true;
        video.play();
    });

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            window.location.href = this.href;
        });
    });
});