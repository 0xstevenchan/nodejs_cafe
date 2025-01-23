document.addEventListener('DOMContentLoaded', function() {
    const music = document.getElementById('bgMusic');
    
    // Set initial volume
    music.volume = 0.3;

    // Try to play music
    function tryPlayMusic() {
        if (music.paused) {
            music.play().catch(() => {});
        }
    }

    // Try to play on any interaction
    document.addEventListener('click', tryPlayMusic);
    document.addEventListener('touchstart', tryPlayMusic);
    document.addEventListener('keydown', tryPlayMusic);
    document.addEventListener('scroll', tryPlayMusic);
    document.addEventListener('mousemove', tryPlayMusic);

    // Try to play when tab becomes visible
    document.addEventListener('visibilitychange', function() {
        if (!document.hidden) {
            tryPlayMusic();
        }
    });

    // Try to play immediately
    tryPlayMusic();
});
