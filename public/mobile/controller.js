const socket = io();

// window.をつけることで、HTMLのonclickから確実に見えるようになります
window.changeScreen = function(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screenId).classList.add('active');
    socket.emit('cmd', { type: 'changeScreen', screen: screenId });
};

window.moveSelection = function(direction) {
    socket.emit('cmd', { type: 'move', dir: direction });
};

window.resetMix = function() {
    socket.emit('cmd', { type: 'reset' });
};

// まぜるボタン
document.getElementById("startBtn").addEventListener("click", () => {
    if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") {
        DeviceMotionEvent.requestPermission().then(state => {
            if (state === "granted") startMixing();
        });
    } else {
        startMixing();
    }
});

function startMixing() {
    window.changeScreen('shake');
    socket.emit('cmd', { type: 'mixMode' });
    
    window.addEventListener("devicemotion", (e) => {
        const acc = e.acceleration;
        if (!acc) return;
        const speed = Math.abs(acc.x) + Math.abs(acc.y) + Math.abs(acc.z);
        if (speed > 15) socket.emit('cmd', { type: 'shake', value: speed });
    });
    
    window.addEventListener("deviceorientation", (e) => {
        socket.emit('cmd', { type: 'tilt', value: Math.round(e.gamma || 0) });
    });
}

// 注ぐボタン
const pourBtn = document.getElementById('btn-pour');
if (pourBtn) {
    pourBtn.addEventListener('touchstart', (e) => { e.preventDefault(); socket.emit('cmd', { type: 'startPour' }); });
    pourBtn.addEventListener('touchend', () => { socket.emit('cmd', { type: 'stopPour' }); });
}

window.showTitleInput = function() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-title').classList.add('active');
};

window.finishWork = function() {
    const title = document.getElementById('work-title').value || "おいしいジュース";
    socket.emit('cmd', { type: 'complete', title: title });
    window.changeScreen('gallery');
};
