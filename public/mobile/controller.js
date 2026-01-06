const socket = io();

// 画面切り替え（自分とPCを連動）
function changeScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + screenId).classList.add('active');
    socket.emit('cmd', { type: 'changeScreen', screen: screenId });
}

// 各種ボタン
function moveSelection(direction) { socket.emit('cmd', { type: 'move', dir: direction }); }
function resetMix() { socket.emit('cmd', { type: 'reset' }); }

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
    changeScreen('shake'); // これでPC側も自動的にディスペンサーが隠れる
    socket.emit('cmd', { type: 'mixMode' }); // 蓋を閉める命令
    
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
pourBtn.addEventListener('touchstart', (e) => { e.preventDefault(); socket.emit('cmd', { type: 'startPour' }); });
pourBtn.addEventListener('touchend', () => { socket.emit('cmd', { type: 'stopPour' }); });

function showTitleInput() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-title').classList.add('active');
}

function finishWork() {
    const title = document.getElementById('work-title').value || "おいしいジュース";
    socket.emit('cmd', { type: 'complete', title: title });
    changeScreen('gallery');
}
